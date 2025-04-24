import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

export default function HomePage({ navigation, isLoggedIn, setIsLoggedIn }) {
  return (
    <View style={styles.container}>
        
     <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CameraZoom')}>
        <Icon name="video" size={20} color="white" style={styles.icon} />
        <Text style={styles.buttonText}>ViewFinder</Text>
      </TouchableOpacity>
            
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('DigitalSlate')}>
        <Icon name="clipboard" size={20} color="white" style={styles.icon} />
        <Text style={styles.buttonText}>DigiSlate</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ProjectScreen')}>
        <Icon name="theater-masks" size={20} color="white" style={styles.icon} />
        <Text style={styles.buttonText}>Projects</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LoginForm')}>
        <Icon name="user" size={20} color="white" style={styles.icon} />
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00B5B8', 
  },
  button: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#F8A8B8', 
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    width: '80%', 
  },
  icon: {
    marginRight: 10, 
  },
  buttonText: {
    fontSize: 18,
    color: 'white', 
  },
});