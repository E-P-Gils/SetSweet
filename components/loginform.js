import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';

// Use the same IP address as in router.js
const LOCAL_IP = "192.168.1.3";

const API_BASE_URL = __DEV__ 
  ? `http://${LOCAL_IP}:3001/api`
  : 'http://localhost:3001/api';

// Add axios default configuration
axios.defaults.timeout = 10000; // 10 second timeout
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add error interceptor for better error handling
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    if (error.code === 'ERR_NETWORK') {
      Alert.alert(
        'Connection Error',
        'Could not connect to the server. Please check your network connection and try again.'
      );
    }
    return Promise.reject(error);
  }
);

const LoginForm = ({
  setIsLoggedIn = () => {},
  setUserData = () => {},
  navigation,
  onLogin,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required.';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) newErrors.password = 'Password is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
  
    try {
      const url = isRegister
        ? `${API_BASE_URL}/register`
        : `${API_BASE_URL}/login`;
  
      const response = await axios.post(url, formData);
  
      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', isRegister ? 'Registration successful!' : 'Login successful!');
        
        if (isRegister) {
          // After successful registration, switch to login mode and clear form
          await Promise.all([
            new Promise(resolve => {
              setIsRegister(false);
              resolve();
            }),
            new Promise(resolve => {
              setFormData({ email: '', password: '', confirmEmail: '', confirmPassword: '' });
              resolve();
            })
          ]);
        } else {
          // After successful login, update state and navigate to Home
          if (typeof setUserData === 'function') setUserData(response.data);
          if (typeof setIsLoggedIn === 'function') setIsLoggedIn(true);
          
          if (navigation && typeof navigation.navigate === 'function') {
            setTimeout(() => {
              navigation.navigate('Home');
            }, 100);
          }
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setErrors({ general: err.response?.data?.error || err.message || 'Something went wrong.' });
    }
  };

  const handleRegister = async () => {
    // Clear any previous errors
    setErrors({});

    // Validate all fields are filled
    if (!formData.email || !formData.confirmEmail || !formData.password || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate email format
    if (!validateEmail(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    // Validate emails match
    if (formData.email !== formData.confirmEmail) {
      setErrors({ confirmEmail: 'Email addresses do not match' });
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/register`, {
        email: formData.email,
        password: formData.password,
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Registration successful!');
        if (typeof setUserData === 'function') setUserData(response.data);
        if (typeof setIsLoggedIn === 'function') setIsLoggedIn(true);
        
        // Clear the form
        setFormData({ email: '', confirmEmail: '', password: '', confirmPassword: '' });
        
        // Navigate to Home
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    }
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, formData);

      if (response.data && response.data.token) {
        // Call onLogin with the response data
        onLogin(response.data);
        navigation.navigate('Home');
      } else {
        setErrorMessage('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegister ? 'Register' : 'Login'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={formData.email}
        onChangeText={(text) => handleInputChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      {isRegister && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Confirm Email"
            value={formData.confirmEmail}
            onChangeText={(text) => handleInputChange('confirmEmail', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.confirmEmail && <Text style={styles.errorText}>{errors.confirmEmail}</Text>}
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={formData.password}
        onChangeText={(text) => handleInputChange('password', text)}
        secureTextEntry
      />
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      {isRegister && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => handleInputChange('confirmPassword', text)}
            secureTextEntry
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={isRegister ? handleRegister : handleLogin}>
        <Text style={styles.buttonText}>{isRegister ? 'Register' : 'Login'}</Text>
      </TouchableOpacity>

      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      <TouchableOpacity 
        style={styles.switchButton} 
        onPress={() => {
          setIsRegister(!isRegister);
          setFormData({ email: '', confirmEmail: '', password: '', confirmPassword: '' });
          setErrors({});
        }}
      >
        <Text style={styles.switchButtonText}>
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#00B5B8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#F8A8B8',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  errorText: {
    color: 'white',
    marginTop: 5,
  },
  homeButton: {
    backgroundColor: '#F8A8B8',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  switchButton: {
    backgroundColor: '#F8A8B8',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  switchButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default LoginForm;