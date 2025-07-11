// SceneScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import Constants from 'expo-constants';

// Use the same IP address as in router.js
const LOCAL_IP = "192.168.1.3";

const API_BASE_URL = __DEV__ 
  ? `http://${LOCAL_IP}:3001/api`
  : 'http://localhost:3001/api';

export default function SceneScreen({ navigation, route }) {
  const { project } = route.params ?? {};
  const [scenes, setScenes] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  // Fetch scenes when component mounts or project changes
  useEffect(() => {
    console.log('SceneScreen mounted/updated with project:', project);
    if (project?._id && project?.userData?.token) {
      fetchScenes();
    } else {
      console.log('Missing required data:', {
        hasProjectId: !!project?._id,
        hasToken: !!project?.userData?.token
      });
    }
  }, [project?._id, project?.userData?.token]);

  const fetchScenes = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching scenes for project:', project._id);
      console.log('Using token:', project.userData.token);
      
      const response = await axios.get(`${API_BASE_URL}/scenes/${project._id}`, {
        headers: {
          Authorization: `Bearer ${project.userData.token}`
        }
      });
      
      console.log('Scenes response:', response.data);
      if (Array.isArray(response.data)) {
        setScenes(response.data);
      } else {
        console.log('Invalid scenes data received:', response.data);
        setScenes([]);
      }
    } catch (error) {
      console.error('Error fetching scenes:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again');
        navigation.navigate('LoginForm');
      } else {
        Alert.alert('Error', 'Failed to load scenes');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addScene = async () => {
    const title = newTitle.trim();
    if (!title) {
      Alert.alert('Please enter a scene title / slug');
      return;
    }

    if (!project.userData?.token) {
      Alert.alert('Error', 'Authentication token not found');
      return;
    }

    try {
      console.log('Creating scene with data:', { title, projectId: project._id });
      console.log('Using token:', project.userData.token);
      
      const response = await axios.post(
        `${API_BASE_URL}/scenes`,
        { 
          title,
          projectId: project._id
        },
        {
          headers: {
            Authorization: `Bearer ${project.userData.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Scene creation response:', response.data);
      
      if (response.data) {
        setScenes(prev => [...prev, response.data]);
        setNewTitle('');
        setShowInput(false);
      }
    } catch (error) {
      console.error('Error creating scene:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again');
        navigation.navigate('LoginForm');
      } else {
        Alert.alert(
          'Error', 
          error.response?.data?.message || 'Failed to create scene. Please try again.'
        );
      }
    }
  };

  const deleteScene = async (sceneId) => {
    Alert.alert('Delete Scene', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/scenes/${sceneId}`, {
              headers: {
                Authorization: `Bearer ${project.userData?.token}`
              }
            });
            setScenes(prev => prev.filter(s => s._id !== sceneId));
          } catch (error) {
            console.error('Error deleting scene:', error);
            Alert.alert('Error', 'Failed to delete scene');
          }
        },
      },
    ]);
  };

  const handleInputToggle = () => setShowInput(s => !s);

  /* -------- render -------- */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {project ? `${project.title} – Scenes` : 'Scenes'}
      </Text>

      {!showInput && scenes.length === 0 && !isLoading && (
        <Text style={styles.emptyText}>Press + to create a new scene</Text>
      )}

      <View style={styles.listContainer}>
        <FlatList
          data={scenes}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardLeft}
                onPress={() => navigation.navigate('SceneOptions', { scene: item, project })}>
                <Icon name="bookmark" size={18} color="#fff" style={styles.cardIcon} />
                <Text style={styles.cardText}>{item.title}</Text>
              </TouchableOpacity>

              {!project.isShared && (
                <TouchableOpacity onPress={() => deleteScene(item._id)}>
                  <Icon name="trash" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </View>

      {/* Input row */}
      {showInput && (
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Scene title"
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TouchableOpacity style={styles.createBtn} onPress={addScene}>
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FABs */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.backFab]}
          onPress={() => navigation.navigate('ProjectOptions', { project })}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.fab} onPress={handleInputToggle}>
          <Icon name={showInput ? 'close' : 'plus'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#00B5B8',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyText: {
    color: '#fff',
    marginTop: 20,
  },
  listContainer: {
    flex: 1,
    width: '100%',
    marginTop: 100,
    paddingBottom: 200,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#F8A8B8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { marginRight: 10 },
  cardText: { color: '#fff', fontSize: 18 },
  /* input row */
  inputContainer: {
    position: 'absolute',
    bottom: 700,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    elevation: 4,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
  },
  createBtn: {
    backgroundColor: '#F8A8B8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  /* FABs */
  fabContainer: {
    position: 'absolute',
    right: 25,
    bottom: 70,
    flexDirection: 'row',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8A8B8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    marginLeft: 10,
  },
  backFab: {
    backgroundColor: '#F8A8B8',
  },
});