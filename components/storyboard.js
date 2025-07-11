import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Dimensions,
  Modal,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const { width, height } = Dimensions.get('window');

// Create base URL for static assets (remove /api suffix)
const STATIC_BASE_URL = API_BASE_URL.replace('/api', '');

export default function StoryboardScreen({ navigation, route }) {
  const { scene, project } = route.params;
  const [frames, setFrames] = useState([]);
  const [frameCount, setFrameCount] = useState(6);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  useEffect(() => {
    fetchFrames();
  }, []);

  // Refresh frames when component comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFrames();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchFrames = async () => {
    try {
      setIsLoading(true);
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Scene ID:', scene._id);
      console.log('Token:', project.userData.token ? 'Present' : 'Missing');
      console.log('Fetching frames from:', `${API_BASE_URL}/scenes/${scene._id}/storyboard`);
      
      const response = await axios.get(`${API_BASE_URL}/scenes/${scene._id}/storyboard`, {
        headers: {
          Authorization: `Bearer ${project.userData.token}`
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Frames response:', response.data);
      if (response.data && response.data.frames && Array.isArray(response.data.frames)) {
        // Ensure we never have more than 30 frames
        const validFrames = response.data.frames.slice(0, 30);
        
        if (validFrames.length !== response.data.frames.length) {
          console.warn(`Truncated frames from ${response.data.frames.length} to ${validFrames.length}`);
          // Update the database to reflect the correct number of frames
          await axios.put(
            `${API_BASE_URL}/scenes/${scene._id}`,
            { storyboard: validFrames },
            {
              headers: {
                Authorization: `Bearer ${project.userData.token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
        
        // Ensure frame numbers are consistent
        const reorderedFrames = validFrames.map((frame, index) => ({
          ...frame,
          frameNumber: index + 1,
          title: `Frame ${index + 1}`
        }));
        
        // Update the database with reordered frames if they were different
        if (JSON.stringify(reorderedFrames) !== JSON.stringify(validFrames)) {
          await axios.put(
            `${API_BASE_URL}/scenes/${scene._id}`,
            { storyboard: reorderedFrames },
            {
              headers: {
                Authorization: `Bearer ${project.userData.token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
        
        setFrames(reorderedFrames);
        setFrameCount(reorderedFrames.length);
      } else {
        setFrames([]);
        setFrameCount(0);
      }
    } catch (error) {
      console.error('Error fetching storyboard frames:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      setFrames([]);
      setFrameCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const createSingleFrame = async () => {
    try {
      console.log('Creating single frame');
      
      // Calculate the next frame number based on existing frames
      const nextFrameNumber = frames.length > 0 
        ? Math.max(...frames.map(f => f.frameNumber || 0)) + 1 
        : 1;
      
      const newFrameData = {
        title: `Frame ${nextFrameNumber}`,
        description: '',
        shotType: 'WIDE',
        cameraMovement: 'STATIC',
        frameNumber: nextFrameNumber
      };

      const response = await axios.post(
        `${API_BASE_URL}/scenes/${scene._id}/storyboard`,
        newFrameData,
        {
          headers: {
            Authorization: `Bearer ${project.userData.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('New frame created:', response.data);
      
      // Add the new frame to the local state
      setFrames(prev => [...prev, response.data]);
      setFrameCount(prev => prev + 1);
      
      Alert.alert('Success', 'Frame created successfully!');
    } catch (error) {
      console.error('Error creating frame:', error);
      Alert.alert('Error', 'Failed to create frame. Please try again.');
    }
  };

  const updateFrameCount = async (newCount) => {
    // Ensure newCount is within valid range
    if (newCount < 0 || newCount > 30) {
      Alert.alert('Invalid Selection', 'Frame count must be between 0 and 30');
      return;
    }

    if (newCount === frameCount) {
      setShowDropdown(false);
      return;
    }

    try {
      console.log(`Updating frame count from ${frameCount} to ${newCount}`);
      
      // Clear all existing frames first
      await axios.put(
        `${API_BASE_URL}/scenes/${scene._id}`,
        { storyboard: [] },
        {
          headers: {
            Authorization: `Bearer ${project.userData.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (newCount === 0) {
        setFrames([]);
        setFrameCount(0);
        setShowDropdown(false);
        return;
      }

      // Create new frames using batch creation - ensure exactly newCount frames
      const newFramesData = Array.from({ length: newCount }, (_, i) => ({
        title: `Frame ${i + 1}`,
        description: '',
        shotType: 'WIDE',
        cameraMovement: 'STATIC',
        frameNumber: i + 1
      }));

      const response = await axios.post(
        `${API_BASE_URL}/scenes/${scene._id}/storyboard/batch`,
        { frames: newFramesData },
        {
          headers: {
            Authorization: `Bearer ${project.userData.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('New frames created:', response.data);
      
      // Verify we got exactly the number of frames requested
      if (response.data && response.data.length === newCount) {
        setFrames(response.data);
        setFrameCount(newCount);
        setShowDropdown(false);
      } else {
        throw new Error(`Expected ${newCount} frames but got ${response.data?.length || 0}`);
      }
    } catch (error) {
      console.error('Error updating frame count:', error);
      Alert.alert('Error', 'Failed to update frame count. Please try again.');
    }
  };

  const pickImage = async (frameId) => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(frameId, result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (frameId, imageUri) => {
    try {
      console.log('Starting image upload for frame:', frameId);
      console.log('Image URI:', imageUri);
      console.log('API URL:', `${API_BASE_URL}/scenes/${scene._id}/storyboard/${frameId}/image`);
      
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'storyboard-image.jpg',
      });

      console.log('FormData created, sending request...');

      const response = await axios.post(
        `${API_BASE_URL}/scenes/${scene._id}/storyboard/${frameId}/image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${project.userData.token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout for image uploads
        }
      );

      console.log('Upload response:', response.data);

      if (response.data) {
        // Update the entire storyboard array with the new image URL
        const updatedFrames = frames.map(frame => 
          frame._id === frameId 
            ? { ...frame, imageUrl: response.data.imageUrl }
            : frame
        );

        // Update the scene with the new storyboard array
        await axios.put(
          `${API_BASE_URL}/scenes/${scene._id}`,
          { storyboard: updatedFrames },
          {
            headers: {
              Authorization: `Bearer ${project.userData.token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setFrames(updatedFrames);
        console.log('Frame updated with new image URL');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const openImageModal = (frame) => {
    console.log('Opening image modal for frame:', frame);
    console.log('Frame data:', frame);
    console.log('Frame imageUrl:', frame.imageUrl);
    console.log('Full image URL:', `${STATIC_BASE_URL}${frame.imageUrl}`);
    
    // Find the index of the current frame
    const frameIndex = frames.findIndex(f => f._id === frame._id);
    setCurrentFrameIndex(frameIndex >= 0 ? frameIndex : 0);
    setSelectedFrame(frame);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedFrame(null);
    setCurrentFrameIndex(0);
  };

  const navigateToPreviousFrame = () => {
    if (framesWithImages.length > 1 && currentImageIndex > 0) {
      const newImageIndex = currentImageIndex - 1;
      const newFrame = framesWithImages[newImageIndex];
      const newFrameIndex = frames.findIndex(f => f._id === newFrame._id);
      setCurrentFrameIndex(newFrameIndex);
      setSelectedFrame(newFrame);
    }
  };

  const navigateToNextFrame = () => {
    if (framesWithImages.length > 1 && currentImageIndex < framesWithImages.length - 1) {
      const newImageIndex = currentImageIndex + 1;
      const newFrame = framesWithImages[newImageIndex];
      const newFrameIndex = frames.findIndex(f => f._id === newFrame._id);
      setCurrentFrameIndex(newFrameIndex);
      setSelectedFrame(newFrame);
    }
  };

  // Get frames with images for navigation
  const framesWithImages = frames.filter(frame => frame.imageUrl);
  const currentImageIndex = framesWithImages.findIndex(frame => frame._id === selectedFrame?._id);

  const deletePhoto = async () => {
    if (!selectedFrame) return;

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update the entire storyboard array with the image removed
              const updatedFrames = frames.map(frame => 
                frame._id === selectedFrame._id 
                  ? { ...frame, imageUrl: null }
                  : frame
              );

              const response = await axios.put(
                `${API_BASE_URL}/scenes/${scene._id}`,
                { storyboard: updatedFrames },
                {
                  headers: {
                    Authorization: `Bearer ${project.userData.token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              if (response.data) {
                setFrames(updatedFrames);
              }
              closeImageModal();
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', 'Failed to delete photo');
            }
          }
        }
      ]
    );
  };

  const deleteFrame = async (frameId) => {
    Alert.alert(
      'Delete Frame',
      'Are you sure you want to delete this frame?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${API_BASE_URL}/scenes/${scene._id}/storyboard/${frameId}`,
                {
                  headers: {
                    Authorization: `Bearer ${project.userData.token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              // Remove frame from local state and reorder frame numbers
              const updatedFrames = frames
                .filter(frame => frame._id !== frameId)
                .map((frame, index) => ({
                  ...frame,
                  frameNumber: index + 1,
                  title: `Frame ${index + 1}`
                }));

              // Update the scene with reordered frames
              await axios.put(
                `${API_BASE_URL}/scenes/${scene._id}`,
                { storyboard: updatedFrames },
                {
                  headers: {
                    Authorization: `Bearer ${project.userData.token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              setFrames(updatedFrames);
              setFrameCount(updatedFrames.length);
              
              Alert.alert('Success', 'Frame deleted successfully!');
            } catch (error) {
              console.error('Error deleting frame:', error);
              Alert.alert('Error', 'Failed to delete frame');
            }
          }
        }
      ]
    );
  };

  const renderFrame = (frame, index) => (
    <View key={frame._id} style={styles.frameContainer}>
      <View style={styles.frameHeader}>
        <Text style={styles.frameNumber}>
          Frame {frame.frameNumber || index + 1}
          {frame.focalLength && ` (${frame.focalLength}mm)`}
        </Text>
        <TouchableOpacity 
          style={styles.deleteFrameButton}
          onPress={() => deleteFrame(frame._id)}
        >
          <Icon name="trash" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.imageContainer}>
        {frame.imageUrl ? (
          <TouchableOpacity 
            style={styles.imageTouchable}
            onPress={() => {
              console.log('Image tapped for frame:', frame._id);
              openImageModal(frame);
            }}
            activeOpacity={0.8}
          >
            <Image 
              source={{ uri: `${STATIC_BASE_URL}${frame.imageUrl}` }} 
              style={styles.frameImage} 
              resizeMode="cover"
              onLoad={() => console.log('Image loaded for frame:', frame._id)}
              onError={(error) => console.log('Image error for frame:', frame._id, error)}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyImageContainer}>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => pickImage(frame._id)}
            >
              <Icon name="plus" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.uploadText}>Add Image</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {scene.title} – Storyboard
        </Text>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.addFrameButton}
            onPress={createSingleFrame}
          >
            <Icon name="plus" size={16} color="#fff" />
            <Text style={styles.addFrameButtonText}>Add Frame</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(true)}
          >
            <Text style={styles.dropdownText}>{frameCount} Frames</Text>
            <Icon name="chevron-down" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.framesScrollView}
        contentContainerStyle={styles.framesContainer}
      >
        {frames.map((frame, index) => renderFrame(frame, index))}
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Number of Frames</Text>
            <ScrollView style={styles.dropdownOptions}>
              {Array.from({ length: 31 }, (_, i) => i).map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.dropdownOption,
                    frameCount === count && styles.dropdownOptionSelected
                  ]}
                  onPress={() => {
                    const newCount = parseInt(count);
                    if (newCount >= 1 && newCount <= 30) {
                      updateFrameCount(newCount);
                    } else {
                      Alert.alert('Invalid Selection', 'Please select between 1 and 30 frames');
                    }
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    frameCount === count && styles.dropdownOptionTextSelected
                  ]}>
                    {count} Frames
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowDropdown(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalContainer}>
            <View style={styles.imageModalHeader}>
              <Text style={styles.imageModalTitle}>
                Frame {selectedFrame?.frameNumber} 
                {framesWithImages.length > 1 && ` (${currentImageIndex + 1} of ${framesWithImages.length} images)`}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeImageModal}
              >
                <Icon name="times" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.imageModalContent}>
              {selectedFrame?.imageUrl ? (
                <View style={styles.imageNavigationContainer}>
                  {/* Left Arrow */}
                  {framesWithImages.length > 1 && currentImageIndex > 0 && (
                    <TouchableOpacity 
                      style={[styles.navigationArrow, styles.leftArrow]}
                      onPress={navigateToPreviousFrame}
                    >
                      <Icon name="chevron-left" size={30} color="#fff" />
                    </TouchableOpacity>
                  )}
                  
                  {/* Image */}
                  <Image 
                    source={{ uri: `${STATIC_BASE_URL}${selectedFrame.imageUrl}` }} 
                    style={styles.fullScreenImage} 
                    resizeMode="contain"
                    onLoad={() => console.log('Modal image loaded successfully for:', selectedFrame.imageUrl)}
                    onError={(error) => {
                      console.log('Modal image error for:', selectedFrame.imageUrl);
                      console.log('Full URL was:', `${STATIC_BASE_URL}${selectedFrame.imageUrl}`);
                      console.log('Error details:', error);
                    }}
                  />
                  
                  {/* Right Arrow */}
                  {framesWithImages.length > 1 && currentImageIndex < framesWithImages.length - 1 && (
                    <TouchableOpacity 
                      style={[styles.navigationArrow, styles.rightArrow]}
                      onPress={navigateToNextFrame}
                    >
                      <Icon name="chevron-right" size={30} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <Text style={styles.noImageText}>No image available</Text>
              )}
            </View>
            
            <View style={styles.imageModalActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.backActionButton]}
                onPress={closeImageModal}
              >
                <Icon name="arrow-left" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Back</Text>
              </TouchableOpacity>
              {!project.isShared && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={deletePhoto}
                >
                  <Icon name="trash" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('SceneOptions', { scene, project })}>
        <Icon name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#00B5B8',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    flex: 1,
  },
  addFrameButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addFrameButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dropdownButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    justifyContent: 'space-between',
  },
  dropdownText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  framesScrollView: {
    flex: 1,
    width: '100%',
  },
  framesContainer: {
    padding: 10,
    alignItems: 'center',
  },
  frameContainer: {
    backgroundColor: '#F8A8B8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    width: '90%',
    height: 120,
    position: 'relative',
  },
  frameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  frameNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteFrameButton: {
    backgroundColor: '#FF3B30',
    padding: 6,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  dropdownOptions: {
    maxHeight: 200,
  },
  dropdownOption: {
    padding: 10,
  },
  dropdownOptionSelected: {
    backgroundColor: '#00B5B8',
  },
  dropdownOptionText: {
    color: '#666',
    fontSize: 16,
  },
  dropdownOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#666',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 20,
    backgroundColor: '#666',
    padding: 12,
    borderRadius: 8,
  },
  imageContainer: {
    flex: 1,
    marginTop: 30,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  frameImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emptyImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  uploadButton: {
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  uploadText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageTouchable: {
    flex: 1,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    height: '80%',
    maxHeight: 600,
  },
  imageModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  imageModalTitle: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageModalContent: {
    flex: 1,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    minHeight: 300,
  },
  imageModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#00B5B8',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
  },
  backActionButton: {
    backgroundColor: '#666',
  },
  imageNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  navigationArrow: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  leftArrow: {
    left: 10,
  },
  rightArrow: {
    right: 10,
  },
  closeButton: {
    padding: 10,
  },
  noImageText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
