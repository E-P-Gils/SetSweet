import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';

const LoginForm = ({
  setIsLoggedIn = () => {},
  setUserData = () => {},
  navigation,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
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
        ? 'http://localhost:3001/api/register'
        : 'http://localhost:3001/api/login';
  
      const response = await axios.post(url, formData);
  
      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', isRegister ? 'Registration successful!' : 'Login successful!');
        if (typeof setUserData === 'function') setUserData(response.data);
        if (typeof setIsLoggedIn === 'function') setIsLoggedIn(true);
  
        if (isRegister) {
          setIsRegister(false); // Switch to login mode
        } else {
          navigation.navigate('Home'); // ✅ Navigate to Home on successful login
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setErrors({ general: err.response?.data?.error || err.message || 'Something went wrong.' });
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

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={formData.password}
        onChangeText={(text) => handleInputChange('password', text)}
        secureTextEntry
      />
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{isRegister ? 'Register' : 'Login'}</Text>
      </TouchableOpacity>

      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      <TouchableOpacity style={styles.button} onPress={() => setIsRegister(!isRegister)}>
        <Text style={styles.buttonText}>
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
});

export default LoginForm;