import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, ScrollView, Image, Modal, Dimensions } from 'react-native'; 
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
  const [aspectRatio, setAspectRatio] = useState('16:9');  
  const [showBorder, setShowBorder] = useState(false); 

  const { width, height } = Dimensions.get('window');
  
  // Dynamically calculate the zoom based on the screen width
  const screenWidthRatio = width / 375; // 375 is a baseline for smaller devices (like iPhone SE)

  // Calculate aspect ratio based height
  const aspectRatioWidth = width;
  const aspectRatioHeight = height * (3 / 4); // For 4:3 aspect ratio
  
  const cameraHeight = aspectRatio === '16:9' ? height : aspectRatioHeight;

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={true}
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon name="camera" size={50} color="#007AFF" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Camera Access Required</Text>
            <Text style={styles.modalText}>
              We need access to your camera to provide the camera zoom functionality.
              Your privacy is important to us - we only use the camera when you're actively using this feature.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const calculateZoom = (focalLength) => {
    // Adjust zoom based on screen size for consistency across devices
    const baseZoom = (focalLength - 18) / (200 - 18); 
    return baseZoom * screenWidthRatio;  // Scale the zoom for different devices
  };

  const calculateFocalLength = (zoom) => {
    const focalLength = Math.round(18 + zoom * (200 - 18));
    return focalLength;
  };

  const handleFocalLengthSelect = (value) => {
    setSelectedFocalLength(value);
    setZoom(calculateZoom(value)); 
    setShowDropdown(false); 
  };

  const toggleAspectRatio = () => {
    if (aspectRatio === '16:9') {
      setAspectRatio('4:3');
      setShowBorder(true);
    } else {
      setAspectRatio('16:9');
      setShowBorder(false);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <PinchGestureHandler onGestureEvent={(event) => {
        let newZoom = zoom + (event.nativeEvent.scale - 1) * 0.015; 
        newZoom = Math.max(0, Math.min(newZoom, 1)); 
        setZoom(newZoom);
        setScale(event.nativeEvent.scale); 
        setSelectedFocalLength(calculateFocalLength(newZoom)); 
      }} >
        <View style={styles.cameraContainer}>
          <CameraView 
            style={[styles.camera, { width, height: cameraHeight }]} 
            zoom={zoom} 
          >
            <TouchableOpacity style={[styles.focalLengthButton, { left: width * 0.796 }, { top: width * 0.12 }]}  onPress={() => setShowDropdown(!showDropdown)}>
              <Text style={styles.focalLengthButtonText}>{selectedFocalLength}mm</Text>
            </TouchableOpacity>

            {showDropdown && (
              <View style={[styles.dropdown, { left: width * 0.2, top: width * -0.315 }]} >
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

            <TouchableOpacity style={[styles.gridButton, { left: width * 0.86 }, { top: width * 0.33 }]} onPress={() => setShowGrid(!showGrid)}>
              <Text style={styles.gridButtonText}>3x3</Text>
            </TouchableOpacity>

            {/* 3x3 Grid Overlay */}
            {showGrid && (
              <View style={[styles.gridOverlay, { pointerEvents: 'none' }]} >
                {/* Horizontal Lines */}
                <View style={[styles.horizontalLine, { top: '33%' }]} />
                <View style={[styles.horizontalLine, { top: '66%' }]} />

                {/* Vertical Lines */}
                <View style={[styles.verticalLine, { left: '33%' }]} />
                <View style={[styles.verticalLine, { left: '66%' }]} />
              </View>
            )}

            {/* Border with Aspect Ratio Text when activated */}
            {showBorder && (
              <View style={[styles.aspectRatioBorder]} />
            )}
          </CameraView>
        </View>
      </PinchGestureHandler>

      {/* Home Icon Button */}
      <TouchableOpacity style={[styles.homeButton, { left: width * 0.87 }, { top: width * 0.615 }]} onPress={() => navigation.navigate('Home')}>
        <Icon name="home" size={30} color="white" />
      </TouchableOpacity>

      {/* Aspect Ratio Switch Buttons */}
      <TouchableOpacity style={[styles.aspectRatioButtons, { left: width * 0.86 }, { top: width * 0.47}]} onPress={toggleAspectRatio}>
        <Icon name="arrows-h" size={30} color="white" style={styles.icon} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  homeButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '90deg' }],
  },
  aspectRatioButtons: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '0deg' }],
  },
  aspectRatioBorder: {
    position: 'absolute',
    borderColor: 'grey',
    borderWidth: 2,
    top: 0,
    left: 0,
    width: '75%',
    height: '100%',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});