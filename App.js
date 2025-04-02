import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomePage from './components/homepage';
import CameraZoom from './components/camerazoom';
import DigitalSlate from './components/digislate';

const Stack = createStackNavigator(); // Create a stack navigator for the app

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomePage} 
          options={{ headerShown: false }} // Hide the header for the home screen
        />
        <Stack.Screen 
          name="CameraZoom" 
          component={CameraZoom} 
          options={{ headerShown: false }} // Hide the header for the CameraZoom screen
        />
        <Stack.Screen 
          name="DigitalSlate" 
          component={DigitalSlate} 
          options={{ headerShown: false }} // Hide the header for the CameraZoom screen
        />
      </Stack.Navigator>
      <StatusBar hidden />  {/* ✅ Hide status bar to prevent layout issues */}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',  // ✅ Avoid white background
  },
});