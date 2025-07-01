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
  const [viewfinderRatio, setViewfinderRatio] = useState('3:4'); // New state for viewfinder aspect ratio

  const { width, height } = Dimensions.get('window');
  
  // Calculate aspect ratio based height
  const aspectRatioWidth = width;
  const aspectRatioHeight = height * (3 / 4); // For 4:3 aspect ratio
  
  const cameraHeight = aspectRatio === '16:9' ? height : aspectRatioHeight;

  // Calculate viewfinder overlay dimensions for film camera look
  const viewfinderAspectRatio = viewfinderRatio === '3:4' ? 3 / 4 : 9 / 16; // 3:4 horizontal, 16:9 vertical
  const viewfinderWidth = width * 0.85; // 85% of screen width
  const viewfinderHeight = viewfinderWidth / viewfinderAspectRatio;
  
  // Calculate overlay dimensions to center the viewfinder
  const overlayTop = (height - viewfinderHeight) / 2;
  const overlayLeft = (width - viewfinderWidth) / 2;

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
    // Use logarithmic scale for proper zoom calculation
    // 18mm = 1x zoom (wide angle), 200mm = ~11x zoom (telephoto)
    const minFocalLength = 18;
    const maxFocalLength = 200;
    
    // Calculate zoom factor using logarithmic scale
    const zoomFactor = Math.log(focalLength / minFocalLength) / Math.log(maxFocalLength / minFocalLength);
    
    // Clamp zoom between 0 and 1
    return Math.max(0, Math.min(1, zoomFactor));
  };

  const calculateFocalLength = (zoom) => {
    // Reverse the logarithmic calculation
    const minFocalLength = 18;
    const maxFocalLength = 200;
    
    // Calculate focal length from zoom factor
    const focalLength = minFocalLength * Math.pow(maxFocalLength / minFocalLength, zoom);
    
    return Math.round(focalLength);
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

  const toggleViewfinderRatio = () => {
    setViewfinderRatio(viewfinderRatio === '3:4' ? '16:9' : '3:4');
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <PinchGestureHandler onGestureEvent={(event) => {
        // Use a more responsive scaling factor for pinch gestures
        let newZoom = zoom + (event.nativeEvent.scale - 1) * 0.1; 
        newZoom = Math.max(0, Math.min(newZoom, 1)); 
        setZoom(newZoom);
        setScale(event.nativeEvent.scale); 
        setSelectedFocalLength(calculateFocalLength(newZoom)); 
      }} >
        <View style={styles.cameraContainer}>
          <CameraView 
            style={[styles.camera, { width, height: cameraHeight }]} 
            zoom={zoom}
            focusable={false}
            enableAutoFocus={false}
            enableAutoZoom={false}
            autoFocus={false}
            focusDistance={1.0}
            enablePinchToZoom={false}
          >
            {/* Film Camera Viewfinder Overlay */}
            <View style={styles.viewfinderOverlay}>
              {/* Top overlay */}
              <View style={[styles.overlayBar, { 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: overlayTop 
              }]} />
              
              {/* Left overlay */}
              <View style={[styles.overlayBar, { 
                top: overlayTop, 
                left: 0, 
                width: overlayLeft, 
                height: viewfinderHeight 
              }]} />
              
              {/* Right overlay */}
              <View style={[styles.overlayBar, { 
                top: overlayTop, 
                left: overlayLeft + viewfinderWidth, 
                width: overlayLeft, 
                height: viewfinderHeight 
              }]} />
              
              {/* Bottom overlay */}
              <View style={[styles.overlayBar, { 
                top: overlayTop + viewfinderHeight, 
                left: 0, 
                width: '100%', 
                height: height + 100 
              }]} />
            </View>

            {/* Border with Aspect Ratio Text when activated */}
            {showBorder && (
              <View style={[styles.aspectRatioBorder]} />
            )}
          </CameraView>
        </View>
      </PinchGestureHandler>

      {/* Control Buttons - Positioned outside CameraView for visibility */}
      <TouchableOpacity style={[styles.focalLengthButton, { left: width * 0.75, top: 67 }]}  onPress={() => setShowDropdown(!showDropdown)}>
        <Text style={styles.focalLengthButtonText}>{selectedFocalLength}mm</Text>
      </TouchableOpacity>

      {/* Viewfinder Toggle Button */}
      <TouchableOpacity style={[styles.viewfinderButton, { left: width * 0.835 }, { top: height * 0.83 }]} onPress={toggleViewfinderRatio}>
        <Text style={styles.viewfinderButtonText}>{viewfinderRatio}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.gridButton, { left: width * 0.85 }, { top: height * 0.92 }]} onPress={() => setShowGrid(!showGrid)}>
        <Text style={styles.gridButtonText}>3x3</Text>
      </TouchableOpacity>

      {showDropdown && (
        <View style={[styles.dropdown, { left: width * 0.18, top: -110 }]} >
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

      {/* 3x3 Grid Overlay */}
      {showGrid && (
        <View style={[styles.gridOverlay, { 
          pointerEvents: 'none',
          top: overlayTop,
          left: overlayLeft,
          width: viewfinderWidth,
          height: viewfinderHeight,
        }]} >
          {/* Horizontal Lines */}
          <View style={[styles.horizontalLine, { top: '33%' }]} />
          <View style={[styles.horizontalLine, { top: '66%' }]} />

          {/* Vertical Lines */}
          <View style={[styles.verticalLine, { left: '33%' }]} />
          <View style={[styles.verticalLine, { left: '66%' }]} />
        </View>
      )}

      {/* Home Icon Button */}
      <TouchableOpacity style={[styles.homeButton, { left: width * 0.1 }, { top: height * 0.9 }]} onPress={() => navigation.navigate('Home')}>
        <Icon name="home" size={30} color="black" />
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
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    transform: [{ rotate: '90deg' }],
    justifyContent: 'center',
    alignItems: 'center', 
    width: 100,
    height: 40,
    zIndex: 10,
  },
  focalLengthButtonText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center', 
    lineHeight: 20, 
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
    zIndex: 11,
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
    color: 'black',
    textAlign: 'center', 
  },
  gridButton: {
    position: 'absolute',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    transform: [{ rotate: '90deg' }],
    zIndex: 10,
  },
  gridButtonText: {
    fontSize: 16,
    color: 'black',
  },
  gridOverlay: {
    position: 'absolute',
    zIndex: 3,
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
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '90deg' }],
  },
  aspectRatioButtons: {
    position: 'absolute',
    backgroundColor: 'white',
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
  viewfinderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  overlayBar: {
    position: 'absolute',
    backgroundColor: 'black',
  },
  viewfinderButton: {
    position: 'absolute',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    transform: [{ rotate: '90deg' }],
    zIndex: 10,
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderButtonText: {
    fontSize: 16,
    color: 'black',
  },
});