import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, ScrollView, Image, Modal, Dimensions, Alert, Platform } from 'react-native'; 
import { PinchGestureHandler } from 'react-native-gesture-handler'; 
import { GestureHandlerRootView } from 'react-native-gesture-handler'; 
import Icon from 'react-native-vector-icons/FontAwesome'; 
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CameraZoom({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [zoom, setZoom] = useState(-1); // Start with a very small positive zoom to get wider view (18mm equivalent)
  const [scale, setScale] = useState(1); 
  const [showDropdown, setShowDropdown] = useState(false); 
  const [selectedFocalLength, setSelectedFocalLength] = useState(30); 
  const [showGrid, setShowGrid] = useState(false); 
  const [aspectRatio, setAspectRatio] = useState('16:9');  
  const [showBorder, setShowBorder] = useState(false); 
  const [viewfinderRatio, setViewfinderRatio] = useState('3:4'); // New state for viewfinder aspect ratio
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showStoryboardMenu, setShowStoryboardMenu] = useState(false);
  const [projects, setProjects] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [frames, setFrames] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedScene, setSelectedScene] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [currentMenuLayer, setCurrentMenuLayer] = useState('project'); // 'project', 'scene', 'frame'
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  const cameraRef = useRef(null);

  // iOS-specific camera error handling
  useEffect(() => {
    if (Platform.OS === 'ios') {
      // Add iOS-specific camera initialization
      console.log('iOS camera component initialized');
      // Set a timeout to mark camera as ready after initialization
      const timer = setTimeout(() => {
        console.log('Camera timeout reached, marking as ready');
        setCameraReady(true);
        console.log('Camera marked as ready');
      }, 2000); // Increased to 2 seconds for iOS camera initialization
      
      return () => clearTimeout(timer);
    } else {
      console.log('Android camera component initialized');
      setCameraReady(true);
    }
  }, []);

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

  // Handle camera errors
  const handleCameraError = (error) => {
    console.error('Camera error:', error);
    setCameraError(error.message || 'Camera error occurred');
    Alert.alert('Camera Error', 'There was an issue with the camera. Please try again.');
  };

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

  // Show error state if camera fails
  if (cameraError) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="exclamation-triangle" size={50} color="#FF3B30" />       <Text style={styles.errorText}>Camera Error</Text>
        <Text style={styles.errorSubtext}>{cameraError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setCameraError(null)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
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
    try {
      console.log('Toggling viewfinder ratio. Current:', viewfinderRatio);
      setViewfinderRatio(viewfinderRatio === '3:4' ? '16:9' : '3:4');
    } catch (error) {
      console.error('Error toggling viewfinder ratio:', error);
      handleCameraError(error);
    }
  };

  const takePicture = async () => {
    console.log('Camera button pressed!');
    if (isTakingPicture) return;

    try {
      setIsTakingPicture(true);
      console.log('Starting camera capture...');
      
      if (!cameraRef.current) {
        throw new Error('Camera ref not available');
      }
      
      // Take a photo using the camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        format: 'jpeg',
      });
      
      console.log('Photo captured successfully:', photo);
      console.log('Photo URI:', photo.uri);
      
      // Store the captured photo and show save menu
      setCapturedPhoto({ uri: photo.uri });
      setShowSaveMenu(true);
    } catch (error) {
      console.error('Error taking photo - Full error object:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', `Failed to take photo: ${error.message || 'Unknown error'}`);
    } finally {
      setIsTakingPicture(false);
    }
  };

  const saveToCameraRoll = async () => {
    if (!capturedPhoto) return;

    try {
      console.log('Starting save to camera roll process...');
      console.log('Captured photo URI:', capturedPhoto.uri);
      console.log('Selected focal length:', selectedFocalLength);
      
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      console.log('Media library permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save photos to your camera roll');
        return;
      }

      // Save the photo to camera roll
      await MediaLibrary.saveToLibraryAsync(capturedPhoto.uri);
      
      console.log('Photo saved to camera roll successfully');
      setShowSaveMenu(false);
      setCapturedPhoto(null);
    } catch (error) {
      console.error('Error saving photo to camera roll - Full error object:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', `Failed to save photo to camera roll: ${error.message || 'Unknown error'}`);
    }
  };

  const closeSaveMenu = () => {
    setShowSaveMenu(false);
    setCapturedPhoto(null);
  };

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects...');
      
      // Get user authentication token
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        console.error('No user data found');
        setProjects([]);
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token;

      if (!token) {
        console.error('No authentication token found');
        setProjects([]);
        return;
      }

      const response = await fetch('http://192.168.1.3:3001/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch projects:', response.status, response.statusText);
        setProjects([]);
        return;
      }
      
      const data = await response.json();
      console.log('Projects fetched successfully:', data);
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
      Alert.alert('Error', 'Failed to fetch projects. Please try again.');
    }
  };

  const fetchScenes = async (projectId) => {
    try {
      console.log('Fetching scenes for project:', projectId);
      
      // Get user authentication token
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        console.error('No user data found');
        setScenes([]);
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token;

      if (!token) {
        console.error('No authentication token found');
        setScenes([]);
        return;
      }

      const response = await fetch(`http://192.168.1.3:3001/api/scenes/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Scenes response status:', response.status);
      console.log('Scenes response headers:', response.headers);
      
      if (!response.ok) {
        console.error('Failed to fetch scenes:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        setScenes([]);
        return;
      }
      
      const data = await response.json();
      console.log('Scenes fetched successfully:', data);
      setScenes(data || []);
    } catch (error) {
      console.error('Error fetching scenes:', error);
      console.error('Error details:', error.message);
      setScenes([]);
      Alert.alert('Error', 'Failed to fetch scenes. Please try again.');
    }
  };

  const fetchFrames = async (sceneId) => {
    try {
      console.log('Fetching frames for scene:', sceneId);
      
      // Get user authentication token
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        console.error('No user data found');
        setFrames([]);
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token;

      if (!token) {
        console.error('No authentication token found');
        setFrames([]);
        return;
      }

      const response = await fetch(`http://192.168.1.3:3001/api/scenes/${sceneId}/storyboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Frames response status:', response.status);
      
      if (!response.ok) {
        console.error('Failed to fetch frames:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        setFrames([]);
        return;
      }
      
      const data = await response.json();
      console.log('Frames fetched successfully:', data);
      setFrames(data.frames || data || []);
    } catch (error) {
      console.error('Error fetching frames:', error);
      console.error('Error details:', error.message);
      setFrames([]);
      Alert.alert('Error', 'Failed to fetch frames. Please try again.');
    }
  };

  const openStoryboardMenu = async () => {
    console.log('Opening storyboard menu...');
    
    // Check if user is logged in by getting user data
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        Alert.alert(
          'Login Required', 
          'You must be logged in to save photos to storyboard. Please log in through the main app first.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token;

      if (!token) {
        Alert.alert(
          'Login Required', 
          'Authentication token not found. Please log in again.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Check if user has projects by trying to fetch projects
      const response = await fetch('http://192.168.1.3:3001/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        Alert.alert(
          'Login Required', 
          'You must be logged in to save photos to storyboard. Please log in through the main app first.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
      
      const projects = await response.json();
      if (!Array.isArray(projects) || projects.length === 0) {
        Alert.alert(
          'No Projects Available', 
          'You must create a project first to save photos to storyboard. Please log in and create a project through the main app.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
    } catch (error) {
      Alert.alert(
        'Connection Error', 
        'Unable to connect to the server. Please check your connection and try again.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    setShowSaveMenu(false);
    setShowStoryboardMenu(true);
    setSelectedProject(null);
    setSelectedScene(null);
    setSelectedFrame(null);
    setScenes([]);
    setFrames([]);
    setCurrentMenuLayer('project');
    console.log('Current menu layer set to:', 'project');
    await fetchProjects();
  };

  const closeStoryboardMenu = () => {
    setShowStoryboardMenu(false);
    setCapturedPhoto(null);
  };

  const goToSceneSelection = (project) => {
    console.log('Going to scene selection for project:', project.title);
    setSelectedProject(project);
    setCurrentMenuLayer('scene');
    console.log('Current menu layer set to:', 'scene');
    fetchScenes(project._id);
  };

  const goToFrameSelection = (scene) => {
    console.log('Going to frame selection for scene:', scene.title);
    setSelectedScene(scene);
    setCurrentMenuLayer('frame');
    console.log('Current menu layer set to:', 'frame');
    fetchFrames(scene._id);
  };

  const goBackToProjectSelection = () => {
    setCurrentMenuLayer('project');
    setSelectedProject(null);
    setSelectedScene(null);
    setSelectedFrame(null);
    setScenes([]);
    setFrames([]);
  };

  const goBackToSceneSelection = () => {
    setCurrentMenuLayer('scene');
    setSelectedScene(null);
    setSelectedFrame(null);
    setFrames([]);
  };

  const saveToStoryboard = async () => {
    if (!selectedFrame || !capturedPhoto) return;

    try {
      // Get user authentication token from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        Alert.alert('Error', 'Please log in to save photos to storyboard');
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token;

      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        return;
      }

      const formData = new FormData();
      formData.append('image', {
        uri: capturedPhoto.uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });
      formData.append('focalLength', selectedFocalLength.toString());

      const response = await fetch(`http://192.168.1.3:3001/api/scenes/${selectedScene._id}/storyboard/frames/${selectedFrame}/image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Photo saved to storyboard frame successfully:', result);
        closeStoryboardMenu();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save to storyboard');
      }
    } catch (error) {
      console.error('Error saving to storyboard:', error);
      Alert.alert('Error', `Failed to save photo to storyboard: ${error.message}`);
    }
  };

  // Add logging and error boundary around the overlay rendering
  let overlayContent = null;
  try {
    // Only render overlay if camera is ready
    if (cameraReady) {
      console.log('Camera is ready, rendering overlay');
      console.log('Overlay dimensions:', {
        viewfinderWidth,
        viewfinderHeight,
        overlayTop,
        overlayLeft,
        width,
        height,
      });
      
      // Validate dimensions before rendering
      if (viewfinderWidth > 0 && viewfinderHeight > 0 && overlayTop >= 0 && overlayLeft >= 0) {
        console.log('Dimensions valid, creating overlay content');
        overlayContent = (
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
        );
        console.log('Overlay content created successfully');
      } else {
        console.log('Invalid overlay dimensions, skipping overlay render');
      }
    } else {
      console.log('Camera not ready or iOS validation failed, skipping overlay render');
    }
  } catch (error) {
    console.error('Error rendering overlay:', error);
    // Don't call handleCameraError for overlay errors on iOS to prevent crashes
    if (Platform.OS !== 'ios') {
      handleCameraError(error);
    }
  }

  // Add camera ready handler
  const handleCameraReady = () => {
    console.log('Camera ready event fired');
    setCameraReady(true);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <PinchGestureHandler onGestureEvent={(event) => {
        try {
          // Use a more responsive scaling factor for pinch gestures
          let newZoom = zoom + (event.nativeEvent.scale - 1) * 0.1; 
          newZoom = Math.max(0, Math.min(newZoom, 1)); 
          setZoom(newZoom);
          setScale(event.nativeEvent.scale); 
          setSelectedFocalLength(calculateFocalLength(newZoom)); 
        } catch (error) {
          console.error('Pinch gesture error:', error);
          handleCameraError(error);
        }
      }} >
        <View style={styles.cameraContainer}>
          <CameraView 
            ref={cameraRef}
            style={[styles.camera, { width, height: cameraHeight }]} 
            zoom={zoom}
            focusable={false}
            enableAutoFocus={false}
            enableAutoZoom={false}
            autoFocus={false}
            focusDistance={1.0}
            enablePinchToZoom={false}
            onCameraError={handleCameraError}
            onCameraReady={handleCameraReady}
            // iOS-specific props to prevent crashes
            {...(Platform.OS === 'ios' && {
              videoStabilizationMode: 'off',
              preset: 'photo',
              whiteBalance: 'auto',
              exposure: 0,
              iso: 0,
              enableAutoFocus: false,
              enableAutoZoom: false,
              enablePinchToZoom: false,
            })}
          >
            {/* Film Camera Viewfinder Overlay */}
            {cameraReady && overlayContent}

            {/* Border with Aspect Ratio Text when activated */}
            {showBorder && cameraReady && (
              <View style={[styles.aspectRatioBorder]} />
            )}

            {/* Focal Length Overlay - Removed, will be added to saved photo instead */}
          </CameraView>
        </View>
      </PinchGestureHandler>

      {/* Control Buttons - Positioned outside CameraView for visibility */}
      <TouchableOpacity style={[styles.focalLengthButton, { left: width * 0.75, top: 67 }]}  onPress={() => setShowDropdown(!showDropdown)}>
        <Text style={styles.focalLengthButtonText}>{selectedFocalLength}mm</Text>
      </TouchableOpacity>

      {/* Take Picture Button */}
      <TouchableOpacity 
        style={[styles.takePictureButton, { left: width * 0.45 }, { top: height * 0.9 }]} 
        onPress={takePicture}
        disabled={isTakingPicture}
      >
        <Icon name="camera" size={24} color="black" />
      </TouchableOpacity>

      {/* Viewfinder Toggle Button */}
      <TouchableOpacity 
        style={[styles.viewfinderButton, { left: width * 0.835, top: height * 0.83 }]} 
        onPress={() => {
          try {
            if (!cameraReady) {
              console.log('Camera not ready, ignoring viewfinder toggle');
              if (Platform.OS === 'ios') {
                // On iOS, just ignore the press instead of showing alert
                return;
              }
              Alert.alert('Camera Loading', 'Please wait for the camera to finish loading.');
              return;
            }
            console.log('Viewfinder toggle button pressed');
            console.log('Current viewfinderRatio:', viewfinderRatio);
            console.log('Current aspectRatio:', aspectRatio);
            console.log('Current showBorder:', showBorder);
            toggleViewfinderRatio();
            console.log('Viewfinder toggle completed');
          } catch (error) {
            console.error('Error in viewfinder toggle button press:', error);
            // Don't call handleCameraError on iOS to prevent crashes
            if (Platform.OS !== 'ios') {
              handleCameraError(error);
            }
          }
        }}
        disabled={!cameraReady}
      >
        <Text style={[styles.viewfinderButtonText, !cameraReady && styles.disabledText]}>{viewfinderRatio}</Text>
      </TouchableOpacity>

      {/* Camera Loading Indicator */}
      {!cameraReady && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Camera Loading...</Text>
        </View>
      )}

      <TouchableOpacity style={[styles.gridButton, { left: width * 0.85 }, { top: height * 0.92 }]} onPress={() => setShowGrid(!showGrid)}>
        <Text style={styles.gridButtonText}>3x3</Text>
      </TouchableOpacity>

      {showDropdown && (
        <View style={[styles.dropdown, { left: width * 0.18, top: -110 }]} >
          <ScrollView contentContainerStyle={styles.dropdownContent}>
            {Array.from({ length: 171 }, (_, i) => i + 30).map((value) => (
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
      <TouchableOpacity style={[styles.homeButton, { left: width * 0.1 }, { top: height * 0.91 }]} onPress={() => navigation.navigate('Home')}>
        <Icon name="home" size={30} color="black" />
      </TouchableOpacity>

      {/* Save Menu Modal */}
      <Modal
        visible={showSaveMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSaveMenu}
      >
        <View style={styles.saveMenuOverlay}>
          <View style={styles.saveMenuContainer}>
            <Text style={styles.saveMenuTitle}>Save Photo</Text>
            
            <View style={styles.saveMenuOptionsRow}>
              <TouchableOpacity 
                style={styles.saveMenuOption}
                onPress={saveToCameraRoll}
              >
                <Icon name="photo" size={24} color="#007AFF" />
                <Text style={styles.saveMenuOptionText}>Camera Roll</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveMenuOption}
                onPress={openStoryboardMenu}
              >
                <Icon name="image" size={24} color="#34C759" />
                <Text style={styles.saveMenuOptionText}>Story Board</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveMenuOption}
                onPress={closeSaveMenu}
              >
                <Icon name="times" size={24} color="#FF3B30" />
                <Text style={styles.saveMenuOptionText}>Don't Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Storyboard Selection Modal */}
      <Modal
        visible={showStoryboardMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={closeStoryboardMenu}
      >
        <View style={styles.saveMenuOverlay}>
          <View style={styles.storyboardMenuContainer}>
            <Text style={styles.saveMenuTitle}>Save to Storyboard</Text>
            
            {/* Debug Info */}
            <Text style={styles.debugText}>
              Layer: {currentMenuLayer} | Projects: {projects.length} | Scenes: {scenes.length} | Frames: {frames.length}
            </Text>
            
            {/* Project Selection Layer */}
            {currentMenuLayer === 'project' && (
              <View style={styles.menuLayer}>
                <Text style={styles.selectionLabel}>Select Project:</Text>
                <ScrollView style={styles.selectionList}>
                  {Array.isArray(projects) && projects.length > 0 ? (
                    projects.map((project) => (
                      <TouchableOpacity
                        key={project._id}
                        style={styles.selectionItem}
                        onPress={() => goToSceneSelection(project)}
                      >
                        <Text style={styles.selectionItemText}>{project.title}</Text>
                        <Icon name="chevron-right" size={16} color="#007AFF" />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No projects available</Text>
                  )}
                </ScrollView>
              </View>
            )}

            {/* Scene Selection Layer */}
            {currentMenuLayer === 'scene' && (
              <View style={styles.menuLayer}>
                <View style={styles.menuHeader}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={goBackToProjectSelection}
                  >
                    <Icon name="arrow-left" size={16} color="#007AFF" />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.currentSelection}>{selectedProject?.title}</Text>
                </View>
                
                <Text style={styles.selectionLabel}>Select Scene:</Text>
                <ScrollView style={styles.selectionList}>
                  {Array.isArray(scenes) && scenes.length > 0 ? (
                    scenes.map((scene) => (
                      <TouchableOpacity
                        key={scene._id}
                        style={styles.selectionItem}
                        onPress={() => goToFrameSelection(scene)}
                      >
                        <Text style={styles.selectionItemText}>{scene.title}</Text>
                        <Icon name="chevron-right" size={16} color="#007AFF" />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No scenes available</Text>
                  )}
                </ScrollView>
              </View>
            )}

            {/* Frame Selection Layer */}
            {currentMenuLayer === 'frame' && (
              <View style={styles.menuLayer}>
                <View style={styles.menuHeader}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={goBackToSceneSelection}
                  >
                    <Icon name="arrow-left" size={16} color="#007AFF" />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.currentSelection}>{selectedScene?.title}</Text>
                </View>
                
                <Text style={styles.selectionLabel}>Select Frame:</Text>
                <ScrollView style={styles.selectionList}>
                  {Array.isArray(frames) && frames.length > 0 ? (
                    frames.map((frame, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.selectionItem,
                          selectedFrame === index && styles.selectedItem,
                          frame.imageUrl ? styles.disabledSelectionItem : null
                        ]}
                        onPress={() => !frame.imageUrl ? setSelectedFrame(index) : null}
                        disabled={!!frame.imageUrl}
                      >
                        <Text style={[
                          styles.selectionItemText,
                          frame.imageUrl ? styles.occupiedFrameText : null
                        ]}>
                          Frame {index + 1} {frame.focalLength ? `(${frame.focalLength}mm)` : ''}
                          {frame.imageUrl ? ' (Occupied)' : ''}
                        </Text>
                        {selectedFrame === index && (
                          <Icon name="check" size={16} color="#34C759" />
                        )}
                        {frame.imageUrl ? (
                          <Icon name="image" size={16} color="#FF9500" />
                        ) : null}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No frames available</Text>
                  )}
                </ScrollView>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.storyboardActionButtons}>
              <TouchableOpacity 
                style={[styles.storyboardActionButton, styles.cancelButton]}
                onPress={closeStoryboardMenu}
              >
                <Text style={styles.storyboardActionButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.storyboardActionButton, 
                  styles.saveButton,
                  (selectedFrame === null || selectedFrame === undefined) && styles.disabledButton
                ]}
                onPress={saveToStoryboard}
                disabled={selectedFrame === null || selectedFrame === undefined}
              >
                <Text style={styles.storyboardActionButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  takePictureButton: {
    position: 'absolute',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 30,
    transform: [{ rotate: '90deg' }],
    zIndex: 20,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveMenuContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    alignItems: 'center',
    transform: [{ rotate: '90deg' }],
  },
  saveMenuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
    textAlign: 'center',
  },
  saveMenuOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  saveMenuOption: {
    padding: 15,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 10,
    width: '28%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  saveMenuOptionText: {
    fontSize: 14,
    color: 'black',
    marginTop: 8,
    textAlign: 'center',
  },
  storyboardMenuContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    alignItems: 'center',
    transform: [{ rotate: '90deg' }],
  },
  menuLayer: {
    width: '100%',
    marginBottom: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 5,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 5,
  },
  currentSelection: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    flex: 1,
  },
  selectionSection: {
    marginBottom: 15,
    width: '100%',
  },
  selectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'black',
  },
  selectionList: {
    maxHeight: 150,
    width: '100%',
  },
  selectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 5,
    marginBottom: 5,
    backgroundColor: 'white',
  },
  selectedItem: {
    backgroundColor: '#007AFF',
  },
  disabledSelectionItem: {
    backgroundColor: '#F0F0F0',
    opacity: 0.6,
  },
  selectionItemText: {
    fontSize: 14,
    color: 'black',
    flex: 1,
  },
  occupiedFrameText: {
    color: '#FF9500',
    fontStyle: 'italic',
  },
  storyboardActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 15,
  },
  storyboardActionButton: {
    padding: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  storyboardActionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  noDataText: {
    fontSize: 14,
    color: 'black',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  debugText: {
    fontSize: 14,
    color: 'black',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#CCCCCC',
  },
});