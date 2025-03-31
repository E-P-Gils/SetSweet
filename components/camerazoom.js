import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, ScrollView } from 'react-native'; // Import ScrollView
import { PinchGestureHandler } from 'react-native-gesture-handler'; // Import pinch gesture handler
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Import GestureHandlerRootView

export default function CameraZoom() {
  const [permission, requestPermission] = useCameraPermissions();
  const [zoom, setZoom] = useState(0); // Zoom value from 0 (wide) to 1 (telephoto)
  const [scale, setScale] = useState(1); // Scale for pinch-to-zoom
  const [showDropdown, setShowDropdown] = useState(false); // State for showing the dropdown
  const [selectedFocalLength, setSelectedFocalLength] = useState(18); // Default focal length

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  // Convert the selected focal length to a zoom value (18mm -> 0, 200mm -> 1)
  const calculateZoom = (focalLength) => {
    return (focalLength - 18) / (200 - 18); // Scale from 18mm to 200mm
  };

  // Convert zoom value back to focal length (0 -> 18mm, 1 -> 200mm)
  const calculateFocalLength = (zoom) => {
    return Math.round(18 + zoom * (200 - 18));
  };

  // Set the zoom level based on selected focal length
  const handleFocalLengthSelect = (value) => {
    setSelectedFocalLength(value);
    setZoom(calculateZoom(value)); // Update the zoom level
    setShowDropdown(false); // Close the dropdown after selection
  };

  return (
    // Wrap the camera view in GestureHandlerRootView
    <GestureHandlerRootView style={styles.container}>
      <PinchGestureHandler onGestureEvent={(event) => {
        let newZoom = zoom + (event.nativeEvent.scale - 1) * 0.1; // Adjust zoom based on pinch scale
        newZoom = Math.max(0, Math.min(newZoom, 1)); // Clamp zoom between 0 and 1
        setZoom(newZoom);
        setScale(event.nativeEvent.scale); // Update scale for display
        setSelectedFocalLength(calculateFocalLength(newZoom)); // Update focal length display based on zoom
      }}>
        <View style={styles.cameraContainer}>
          <CameraView 
            style={styles.camera} 
            zoom={zoom} // Apply the zoom value here
          >

            {/* Focal Length Icon (top left corner) */}
            <TouchableOpacity style={styles.focalLengthButton} onPress={() => setShowDropdown(!showDropdown)}>
              <Text style={styles.focalLengthButtonText}>{selectedFocalLength}mm</Text>
            </TouchableOpacity>

            {/* Dropdown for selecting focal length */}
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
          </CameraView>
        </View>
      </PinchGestureHandler>
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
    left: 350,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
    transform: [{ rotate: '90deg'}],
  },
  focalLengthButtonText: {
    fontSize: 16,
    color: 'white',
  },
  dropdown: {
    position: 'absolute',
    top: -139,
    left: 110,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 5,
    padding: 10,
    zIndex: 1,
    transform: [{ rotate: '90deg'}], // Keep the rotation for the dropdown
    height: 400, 
    width: 90,
  },
  dropdownContent: {
    paddingVertical: 0, 
  },
  dropdownItem: {
    padding: 10,
  },
  dropdownItemText: {
    fontSize: 16,
    color: 'white',
  },
});