import React, { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { View, Text, TextInput, StyleSheet, Animated, TouchableWithoutFeedback, TouchableOpacity, Image, Modal, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const colorBars = ['#000', '#4a4a4a', '#a0a0a0', '#ffffff', '#e30613', '#0072ce', '#00a94f', '#f7ec13'];
const topClapperColors = ['#f7ec13', '#00a94f', '#0072ce', '#e30613', '#ffffff', '#a0a0a0', '#4a4a4a', '#000'];

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
  const soundRef = useRef(null);
  
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

      const parsedUserData = JSON.parse(userData);
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${parsedUserData.token}`
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
      <TouchableWithoutFeedback onPress={handleClap}>
        <View style={styles.clapperContainer}>
          {/* Top clapper arm (animated) */}
          <Animated.View 
            style={[
              styles.clapperArm, 
              styles.topClapper,
              {
                transform: [{
                  translateY: clapAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 29.5]
                  })
                }]
              }
            ]}>
            {topClapperColors.map((color, index) => (
              <View key={index} style={[styles.colorBar, { backgroundColor: color }]} />
            ))}
          </Animated.View>
          
          {/* Bottom clapper arm (stationary) */}
          <View style={[styles.clapperArm, styles.bottomClapper]}>
            {colorBars.map((color, index) => (
              <View key={index} style={[styles.colorBar, { backgroundColor: color }]} />
            ))}
          </View>
        </View>
      </TouchableWithoutFeedback>

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
    marginTop: 20,
    transform: [{ rotate: '90deg' }],
  },
  clapperContainer: {
    position: 'relative',
    width: 850,
    height: 40,
    marginBottom: 5,
    left: 205,
    top: -20,
  },
  clapperArm: {
    flexDirection: 'row',
    width: 850,
    height: 30,
    justifyContent: 'space-between',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    overflow: 'hidden',
    elevation: 3,
  },
  topClapper: {
    position: 'absolute',
    top: -30,
  },
  bottomClapper: {
    position: 'absolute',
    top: 30,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  colorBar: {
    flex: 1,
    height: '100%',
  },
  slateContainer: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    padding: 10,
    width: 750,
    alignSelf: 'center',
    left: 205,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  labeledInput: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 10,
  },
  topTriplet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    position: 'relative',
    left: 205, 
    width: 750, 
  },
  tripletBox: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  bigInputField: {
    width: 150,
    height: 50,
    fontSize: 20,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  verticalText: {
    transform: [{ rotate: '360deg' }],
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 6,
    width: 100,
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  smallField: {
    width: 60,
    marginLeft: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingRight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  saveButton: {
    marginLeft: 10,
  },
  toggleButton: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  toggleButtonText: {
    color: '#000',
    fontSize: 16,
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
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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