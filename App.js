import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomePage from './components/homepage';
import CameraZoom from './components/camerazoom';
import DigitalSlate from './components/digislate';
import LoginForm from './components/loginform';
import ProjectScreen from './components/projectpage';
import ProjectOptions from './components/projectoptions';
import Scenes from './components/scenes';
import SceneOptions from './components/sceneoptions';
import Notes from './components/notes';
import Floorplan from './components/floorplan';
import Script from './components/script';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  // Load user data from AsyncStorage on app start
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setUserData(parsedData);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  // Handle login
  const handleLogin = async (data) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(data));
      setUserData(data);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      setUserData(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          options={{ headerShown: false }}
        >
          {props => (
            <HomePage 
              {...props} 
              isLoggedIn={isLoggedIn} 
              onLogout={handleLogout}
            />
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="CameraZoom" 
          component={CameraZoom} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="DigitalSlate" 
          component={DigitalSlate} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="LoginForm" 
          options={{ headerShown: false }}
        >
          {props => (
            <LoginForm 
              {...props} 
              onLogin={handleLogin}
            />
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="ProjectScreen" 
          options={{ headerShown: false }}
        >
          {props => (
            <ProjectScreen 
              {...props} 
              isLoggedIn={isLoggedIn} 
              userData={userData}
            />
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="ProjectOptions" 
          options={{ headerShown: false }}
        >
          {props => (
            <ProjectOptions 
              {...props} 
              isLoggedIn={isLoggedIn} 
              userData={userData}
            />
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="Scenes" 
          component={Scenes}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SceneOptions" 
          component={SceneOptions}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Notes" 
          component={Notes}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="FloorPlanScreen" 
          component={Floorplan}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Script" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right'
          }}
        >
          {props => (
            <Script 
              {...props} 
              isLoggedIn={isLoggedIn} 
              userData={userData}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
      <StatusBar hidden />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});