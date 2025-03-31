import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, ScrollView } from 'react-native'; 
import { PinchGestureHandler } from 'react-native-gesture-handler'; 
import { GestureHandlerRootView } from 'react-native-gesture-handler'; 
import Icon from 'react-native-vector-icons/FontAwesome'; 

export default function CameraZoom({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [zoom, setZoom] = useState(0); 
  const [scale, setScale] = useState(1); 
  const [showDropdown, setShowDropdown] = useState(false); 
  const [selectedFocalLength, setSelectedFocalLength] = useState(18); 
  const [showGrid, setShowGrid] = useState(false); 

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const calculateZoom = (focalLength) => {
    return (focalLength - 18) / (200 - 18); 
  };

  const calculateFocalLength = (zoom) => {
    return Math.round(18 + zoom * (200 - 18));
  };

  const handleFocalLengthSelect = (value) => {
    setSelectedFocalLength(value);
    setZoom(calculateZoom(value)); 
    setShowDropdown(false); 
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <PinchGestureHandler onGestureEvent={(event) => {
        let newZoom = zoom + (event.nativeEvent.scale - 1) * 0.1; 
        newZoom = Math.max(0, Math.min(newZoom, 1)); 
        setZoom(newZoom);
        setScale(event.nativeEvent.scale); 
        setSelectedFocalLength(calculateFocalLength(newZoom)); 
      }} >
        <View style={styles.cameraContainer}>
          <CameraView 
            style={styles.camera} 
            zoom={zoom} 
          >
            <TouchableOpacity style={styles.focalLengthButton} onPress={() => setShowDropdown(!showDropdown)}>
              <Text style={styles.focalLengthButtonText}>{selectedFocalLength}mm</Text>
            </TouchableOpacity>

            {showDropdown && (
              <View style={styles.dropdown}>
                <ScrollView contentContainerStyle={styles.dropdownContent}>
                  {Array.from({ length: 183 }, (_, i) => i + 18).map((value) => (
                    <TouchableOpacity 
                      key={value} 
                      style={styles.dropdownItem} 
                      onPress={() => handleFocalLengthSelect(value)}
                    >
                      <Text style={styles.dropdownItemText}>{value}mm</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity style={styles.gridButton} onPress={() => setShowGrid(!showGrid)}>
              <Text style={styles.gridButtonText}>3x3</Text>
            </TouchableOpacity>

            {/* 3x3 Grid Overlay */}
            {showGrid && (
              <View style={[styles.gridOverlay, { pointerEvents: 'none' }]}>
                {/* Horizontal Lines */}
                <View style={[styles.horizontalLine, { top: '33%' }]} />
                <View style={[styles.horizontalLine, { top: '66%' }]} />

                {/* Vertical Lines */}
                <View style={[styles.verticalLine, { left: '33%' }]} />
                <View style={[styles.verticalLine, { left: '66%' }]} />
              </View>
            )}
          </CameraView>
        </View>
      </PinchGestureHandler>

      {/* Home Icon Button */}
      <TouchableOpacity 
        style={styles.homeButton} 
        onPress={() => navigation.navigate('Home')} // Add your home screen navigation logic here
      >
        <Icon name="home" size={30} color="white" />
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  focalLengthButton: {
    position: 'absolute',
    top: 40,
    left: 333,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    transform: [{ rotate: '90deg' }],
    justifyContent: 'center',
    alignItems: 'center', 
    width: 100,
    height: 40, 
  },
  
  focalLengthButtonText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center', 
    lineHeight: 20, 
  },
  dropdown: {
    position: 'absolute',
    top: -139,
    left: 100, 
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 5,
    padding: 10,
    zIndex: 1,
    transform: [{ rotate: '90deg' }],
    height: 400,
    width: 110, 
  },
  dropdownContent: {
    paddingVertical: 0,
    alignItems: 'center', 
  },
  dropdownItem: {
    paddingVertical: 10, 
    width: '100%', 
    textAlign: 'center', 
  },
  dropdownItemText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center', 
  },

  gridButton: {
    position: 'absolute',
    top: 120,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
    transform: [{ rotate: '90deg' }],
  },

  gridButtonText: {
    fontSize: 16,
    color: 'white',
  },

  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'white',
  },
  verticalLine: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'white',
  },

  // Home button style
  homeButton: {
    position: 'absolute',
    top: 170,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '90deg' }],
  },
});