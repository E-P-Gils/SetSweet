import React, { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { View, Text, TextInput, StyleSheet, Animated, TouchableWithoutFeedback, TouchableOpacity, Image, Modal, FlatList, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Calculate responsive scaling factors
const getResponsiveScale = () => {
  // Base dimensions for a standard phone screen (e.g., iPhone 12)
  const baseWidth = 390;
  const baseHeight = 844;
  
  // Calculate scale factors
  const widthScale = screenWidth / baseWidth;
  const heightScale = screenHeight / baseHeight;
  
  // Use the smaller scale to ensure everything fits
  return Math.min(widthScale, heightScale, 1.2); // Cap at 1.2 to prevent oversized elements
};

const scale = getResponsiveScale();

// Helper function to scale dimensions
const scaledSize = (size) => size * scale;

const colorBars = ['#FF0000', '#FFFF00', '#00FF00', '#0000FF', '#FF0000', '#FFFF00', '#00FF00', '#0000FF'];
const topClapperColors = ['#0000FF', '#00FF00', '#FFFF00', '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF0000'];

const VerticalLabel = ({ label }) => (
  <View style={styles.verticalBox}>
    <Text style={styles.verticalText}>{label}</Text>
  </View>
);

const SlateInput = ({ placeholder, big, style, value, onChangeText, ...props }) => (
  <TextInput
    style={[styles.inputField, big && styles.bigInputField, style]}
    placeholder={placeholder}
    placeholderTextColor="#888"
    value={value}
    onChangeText={onChangeText}
    {...props}
  />
);

export default function DigitalSlate({ navigation, route }) {
  const clapAnim = useRef(new Animated.Value(0)).current;
  const topClapperAnim = useRef(new Animated.Value(-screenHeight)).current;
  const bottomClapperAnim = useRef(new Animated.Value(screenHeight)).current;
  const soundRef = useRef(null);
  
  // State for responsive scaling
  const [currentScale, setCurrentScale] = useState(scale);
  
  // State for toggle selections
  const [selectedToggles, setSelectedToggles] = useState({
    INT_EXT: 'INT',
    DAY_NITE: 'DAY',
    SYNC_MOS: 'SYNC',
  });

  // State for slate data fields
  const [slateData, setSlateData] = useState({
    roll: '',
    scene: '',
    take: '',
    prod: '',
    dir: '',
    cam: '',
    fps: '',
    date: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
  });

  // Check if we're in view mode and load slate data if provided
  useEffect(() => {
    if (route.params?.isViewMode && route.params?.slateData) {
      setSlateData(route.params.slateData);
      setSelectedToggles(route.params.slateData.toggles);
    }
  }, [route.params]);

  // State for project selection
  const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // State for success modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Handle screen dimension changes
  useEffect(() => {
    const updateScale = () => {
      const newScale = getResponsiveScale();
      setCurrentScale(newScale);
    };

    const subscription = Dimensions.addEventListener('change', updateScale);
    return () => subscription?.remove();
  }, []);

  // Load saved data when component mounts (only if not in view mode)
  useEffect(() => {
    if (!route.params?.isViewMode) {
      loadSavedData();
    }
  }, []);

  const loadSavedData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('slateData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setSlateData(parsedData.slateData || {});
        setSelectedToggles(parsedData.selectedToggles || {
          INT_EXT: 'INT',
          DAY_NITE: 'DAY',
          SYNC_MOS: 'SYNC',
        });
      }
    } catch (error) {
      console.error('Error loading saved slate data:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setSlateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClap = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/slateclapper.mp3')
      );
      await sound.playAsync();
      
      // Set up a listener to unload the sound after it finishes playing
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error playing clap sound:', error);
    }
  
    Animated.sequence([
      Animated.timing(clapAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(clapAnim, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const handleSlateButton = async () => {
    // Reset clappers to off-screen positions
    topClapperAnim.setValue(-screenHeight);
    bottomClapperAnim.setValue(screenHeight);

    // Use device-specific offset based on screen size
    const isLargeScreen = screenHeight > 800; // Detect larger screens (Android tablets, etc.)
    const animationOffset = isLargeScreen ? 40 : 15; // Larger offset for big screens, smaller for phones
    
    // Animate clappers coming from top and bottom
    Animated.parallel([
      Animated.timing(topClapperAnim, {
        toValue: animationOffset,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(bottomClapperAnim, {
        toValue: -animationOffset,
        duration: 500,
        useNativeDriver: true
      })
    ]).start(async () => {
      // After clappers meet, retreat back off-screen
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(topClapperAnim, {
            toValue: -screenHeight,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(bottomClapperAnim, {
            toValue: screenHeight,
            duration: 500,
            useNativeDriver: true
          })
        ]).start();
      }, 300); // Hold for 300ms before retreating
    });

    // Play sound just before clappers meet
    setTimeout(async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/slateclapper.mp3')
        );
        await sound.playAsync();
        
        // Set up a listener to unload the sound after it finishes playing
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.didJustFinish) {
            await sound.unloadAsync();
          }
        });
      } catch (error) {
        console.error('Error playing clap sound:', error);
      }
    }, 315); // Play sound 185ms before clappers meet (at 315ms instead of 500ms)
  };
  
  
  const toggleSelection = (toggleCategory) => {
    setSelectedToggles((prevSelectedToggles) => {
      const newSelection = { ...prevSelectedToggles };
      if (newSelection[toggleCategory] === 'INT' || newSelection[toggleCategory] === 'DAY' || newSelection[toggleCategory] === 'SYNC') {
        newSelection[toggleCategory] = toggleCategory === 'INT_EXT' ? 'EXT' : toggleCategory === 'DAY_NITE' ? 'NIGHT' : 'MOS';
      } else {
        newSelection[toggleCategory] = toggleCategory === 'INT_EXT' ? 'INT' : toggleCategory === 'DAY_NITE' ? 'DAY' : 'SYNC';
      }
      return newSelection;
    });
  };

  const handleSavePress = async () => {
    try {
      setIsLoading(true);
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        Alert.alert('Error', 'Please log in to save slates');
        navigation.navigate('LoginForm');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(userData).token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const projectsData = await response.json();
      setProjects(projectsData);
      setIsProjectModalVisible(true);
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Don't show alert for fetch errors as they might be temporary
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = async (project) => {
    try {
      setIsLoading(true);
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        Alert.alert('Error', 'Please log in to save slates');
        navigation.navigate('LoginForm');
        return;
      }

      const parsedUserData = JSON.parse(userData);
      console.log('User data:', parsedUserData);

      const slateToSave = {
        roll: slateData.roll,
        scene: slateData.scene,
        take: slateData.take,
        prod: slateData.prod,
        dir: slateData.dir,
        cam: slateData.cam,
        fps: slateData.fps,
        date: slateData.date,
        toggles: {
          INT_EXT: selectedToggles.INT_EXT,
          DAY_NITE: selectedToggles.DAY_NITE,
          SYNC_MOS: selectedToggles.SYNC_MOS
        }
      };

      console.log('Saving slate data:', slateToSave);
      console.log('To project:', project._id);

      const response = await fetch(
        `${API_BASE_URL}/projects/${project._id}/slates`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${parsedUserData.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(slateToSave)
        }
      );

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!response.ok) {
        throw new Error(`Failed to save slate: ${responseText}`);
      }

      const savedSlate = JSON.parse(responseText);
      console.log('Saved slate:', savedSlate);

      // Create a custom success modal instead of using Alert
      const successModal = (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setSelectedProject(null);
            setIsProjectModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.successModal, { transform: [{ rotate: '90deg' }] }]}>
              <Text style={styles.successText}>Slate saved successfully!</Text>
              <TouchableOpacity
                style={styles.successButton}
                onPress={() => {
                  setSelectedProject(null);
                  setIsProjectModalVisible(false);
                }}
              >
                <Text style={styles.successButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );

      // Show the success modal
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Error saving slate:', error);
      Alert.alert('Error', error.message || 'Failed to save slate');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProjectItem = ({ item }) => (
    <TouchableOpacity
      style={styles.projectItem}
      onPress={() => handleProjectSelect(item)}
    >
      <Text style={styles.projectTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      {/* Full screen clappers for slate animation */}
      <Animated.View 
        style={[
          styles.fullScreenTopClapper,
          {
            transform: [{
              translateY: topClapperAnim
            }]
          }
        ]}>
        {topClapperColors.map((color, index) => (
          <View key={index} style={[styles.fullScreenColorBar, { backgroundColor: color }]} />
        ))}
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.fullScreenBottomClapper,
          {
            transform: [{
              translateY: bottomClapperAnim
            }]
          }
        ]}>
        {colorBars.map((color, index) => (
          <View key={index} style={[styles.fullScreenColorBar, { backgroundColor: color }]} />
        ))}
      </Animated.View>



      <View style={styles.topTriplet}>
        <View style={styles.tripletBox}>
          <Text style={styles.verticalText}>ROLL</Text>
          <SlateInput 
            placeholder="123" 
            big 
            style={{ width: '100%' }} 
            value={slateData.roll}
            onChangeText={(value) => handleInputChange('roll', value)}
            editable={!route.params?.isViewMode}
          />
        </View>
        <View style={styles.tripletBox}>
          <Text style={styles.verticalText}>SCENE</Text>
          <SlateInput 
            placeholder="45A" 
            big 
            style={{ width: '100%' }} 
            value={slateData.scene}
            onChangeText={(value) => handleInputChange('scene', value)}
            editable={!route.params?.isViewMode}
          />
        </View>
        <View style={styles.tripletBox}>
          <Text style={styles.verticalText}>TAKE</Text>
          <SlateInput 
            placeholder="7" 
            big 
            style={{ width: '100%' }} 
            value={slateData.take}
            onChangeText={(value) => handleInputChange('take', value)}
            editable={!route.params?.isViewMode}
          />
        </View>
      </View>

      <View style={styles.slateContainer}>
        <View style={styles.row}>
          <SlateInput 
            placeholder="PROD" 
            style={{ flex: 1 }} 
            value={slateData.prod}
            onChangeText={(value) => handleInputChange('prod', value)}
            editable={!route.params?.isViewMode}
          />
        </View>
        <View style={styles.row}>
          <SlateInput 
            placeholder="DIR" 
            style={{ flex: 1 }} 
            value={slateData.dir}
            onChangeText={(value) => handleInputChange('dir', value)}
            editable={!route.params?.isViewMode}
          />
        </View>
        <View style={styles.row}>
          <SlateInput 
            placeholder="CAM" 
            style={{ flex: 1 }} 
            value={slateData.cam}
            onChangeText={(value) => handleInputChange('cam', value)}
            editable={!route.params?.isViewMode}
          />
          <SlateInput 
            placeholder="FPS" 
            style={styles.smallField} 
            value={slateData.fps}
            onChangeText={(value) => handleInputChange('fps', value)}
            editable={!route.params?.isViewMode}
          />
        </View>
        <View style={styles.row}>
          <SlateInput 
            placeholder="DATE" 
            style={{ flex: 1 }} 
            value={slateData.date}
            onChangeText={(value) => handleInputChange('date', value)}
            editable={!route.params?.isViewMode}
          />
        </View>

        <View style={styles.toggleContainer}>
          <View style={styles.toggleRow}>
            {['INT_EXT', 'DAY_NITE', 'SYNC_MOS'].map((toggleCategory) => (
              <TouchableOpacity
                key={toggleCategory}
                onPress={() => !route.params?.isViewMode && toggleSelection(toggleCategory)}
                style={[
                  styles.toggleButton,
                  route.params?.isViewMode && styles.toggleButtonDisabled
                ]}
              >
                <Text style={styles.toggleButtonText}>
                  {selectedToggles[toggleCategory]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
              <Ionicons name="home" size={24} color="#000" />
            </TouchableOpacity>
            {!route.params?.isViewMode && (
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleSavePress}
                disabled={isLoading}
              >
                <Ionicons name="save" size={24} color="#000" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.slateButton} onPress={handleSlateButton}>
              <Text style={styles.slateButtonText}>SLATE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        visible={isProjectModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsProjectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { transform: [{ rotate: '90deg' }] }]}>
            <Text style={styles.modalTitle}>Select Project to Save to</Text>
            <View style={styles.modalBody}>
              <View style={styles.dropdownContainer}>
                <FlatList
                  data={projects}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.projectItem,
                        selectedProject?._id === item._id && styles.selectedProject
                      ]}
                      onPress={() => setSelectedProject(item)}
                    >
                      <Text style={[
                        styles.projectTitle,
                        selectedProject?._id === item._id && styles.selectedProjectText
                      ]}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={item => item._id}
                  style={styles.projectList}
                />
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveModalButton]}
                  onPress={() => {
                    if (selectedProject) {
                      handleProjectSelect(selectedProject);
                    } else {
                      Alert.alert('Error', 'Please select a project');
                    }
                  }}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => {
                    setIsProjectModalVisible(false);
                    setSelectedProject(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {successModalVisible && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setSuccessModalVisible(false);
            setSelectedProject(null);
            setIsProjectModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.successModal, { transform: [{ rotate: '90deg' }] }]}>
              <Text style={styles.successText}>Slate saved successfully!</Text>
              <TouchableOpacity
                style={styles.successButton}
                onPress={() => {
                  setSuccessModalVisible(false);
                  setSelectedProject(null);
                  setIsProjectModalVisible(false);
                }}
              >
                <Text style={styles.successButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    transform: [{ rotate: '90deg' }],
  },
  fullScreenTopClapper: {
    position: 'absolute',
    top: 0,
    left: -screenWidth * 2,
    right: -screenWidth * 2,
    height: screenHeight / 2,
    flexDirection: 'row',
    zIndex: 1000,
    width: screenWidth * 5,
    alignSelf: 'center',
  },
  fullScreenBottomClapper: {
    position: 'absolute',
    bottom: 0,
    left: -screenWidth * 2,
    right: -screenWidth * 2,
    height: screenHeight / 2,
    flexDirection: 'row',
    zIndex: 1000,
    width: screenWidth * 5,
    alignSelf: 'center',
  },
  fullScreenColorBar: {
    flex: 1,
    height: '100%',
  },
  slateContainer: {
    backgroundColor: '#fff',
    borderWidth: scaledSize(2),
    borderColor: '#000',
    padding: scaledSize(10),
    width: scaledSize(750),
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    marginBottom: scaledSize(8),
  },
  labeledInput: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: scaledSize(10),
  },
  topTriplet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaledSize(10),
    width: scaledSize(750), 
  },
  tripletBox: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: scaledSize(5),
  },
  bigInputField: {
    width: scaledSize(150),
    height: scaledSize(50),
    fontSize: scaledSize(20),
    paddingVertical: scaledSize(8),
    paddingHorizontal: scaledSize(10),
  },
  verticalText: {
    transform: [{ rotate: '360deg' }],
    fontWeight: 'bold',
    fontSize: scaledSize(12),
    letterSpacing: 1,
  },
  inputField: {
    borderWidth: scaledSize(1),
    borderColor: '#000',
    padding: scaledSize(6),
    width: scaledSize(100),
    marginTop: scaledSize(4),
    fontSize: scaledSize(12),
    textAlign: 'center',
  },
  smallField: {
    width: scaledSize(60),
    marginLeft: scaledSize(8),
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scaledSize(12),
    paddingRight: scaledSize(20),
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: scaledSize(2),
    padding: scaledSize(10),
    borderRadius: scaledSize(5),
    marginHorizontal: scaledSize(5),
  },
  saveButton: {
    marginLeft: scaledSize(10),
  },
  slateButton: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: scaledSize(2),
    paddingVertical: scaledSize(12),
    paddingHorizontal: scaledSize(20),
    borderRadius: scaledSize(5),
    marginHorizontal: scaledSize(10),
  },
  slateButtonText: {
    color: '#000',
    fontSize: scaledSize(16),
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  toggleButton: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: scaledSize(2),
    paddingVertical: scaledSize(10),
    paddingHorizontal: scaledSize(20),
    borderRadius: scaledSize(5),
    marginHorizontal: scaledSize(5),
  },
  toggleButtonText: {
    color: '#000',
    fontSize: scaledSize(16),
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: scaledSize(20),
    borderRadius: scaledSize(10),
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: scaledSize(24),
    fontWeight: 'bold',
    marginBottom: scaledSize(20),
    textAlign: 'center',
    color: '#333',
  },
  modalBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    flex: 1,
    marginRight: 20,
  },
  projectList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  projectItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedProject: {
    backgroundColor: '#F8A8B8',
  },
  projectTitle: {
    fontSize: 16,
    color: '#333',
  },
  selectedProjectText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 10,
  },
  modalButton: {
    padding: 12,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  saveModalButton: {
    backgroundColor: '#F8A8B8',
  },
  cancelModalButton: {
    backgroundColor: '#F8A8B8',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  successModal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 300,
    height: 200,
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: '#F8A8B8',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  toggleButtonDisabled: {
    opacity: 0.7,
  },
});