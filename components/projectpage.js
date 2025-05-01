// ProjectScreen.js
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

export default function ProjectScreen({ navigation, isLoggedIn, userData }) {
  const [projects, setProjects] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef(null);

  // Fetch user's projects when component mounts or userData changes
  useEffect(() => {
    if (isLoggedIn && userData) {
      fetchProjects();
    }
  }, [isLoggedIn, userData]);

  // Focus input when modal is shown
  useEffect(() => {
    if (showInput && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [showInput]);

  const fetchProjects = async () => {
    try {
      if (!userData?.token) {
        console.log('No token available');
        setProjects([]);
        return;
      }

      console.log('Fetching projects with token:', userData.token);
      const response = await axios.get(`${API_BASE_URL}/projects`, {
        headers: {
          Authorization: `Bearer ${userData.token}`
        }
      });

      console.log('Projects response:', response.data);
      if (Array.isArray(response.data)) {
        setProjects(response.data);
      } else {
        console.log('Response data is not an array:', response.data);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        // Token is invalid or expired
        Alert.alert('Session Expired', 'Please log in again');
        navigation.navigate('LoginForm');
      } else if (error.response?.status === 404) {
        // No projects found
        setProjects([]);
      } else {
        Alert.alert('Error', 'Failed to load projects');
        setProjects([]);
      }
    }
  };

  const addProject = async () => {
    if (!isLoggedIn) {
      Alert.alert('Login Required', 'You must be logged in to create a project');
      setShowInput(false);
      return;
    }

    const title = newTitle.trim();
    if (!title) {
      Alert.alert('Please enter a project title');
      return;
    }

    try {
      console.log('Creating project with data:', { title, user: userData._id });
      console.log('Auth token:', userData.token);
      
      const response = await axios.post(
        `${API_BASE_URL}/projects`,
        { 
          title,
          user: userData._id // Make sure to send the user ID
        },
        {
          headers: {
            Authorization: `Bearer ${userData.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Project creation response:', response.data);

      if (response.data) {
        setProjects(prev => [...prev, response.data]);
        setNewTitle('');
        setShowInput(false);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to create project. Please try again.'
      );
    }
  };

  const deleteProject = async (id) => {
    Alert.alert('Delete Project', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/projects/${id}`, {
              headers: {
                Authorization: `Bearer ${userData.token}`
              }
            });
            setProjects(prev => prev.filter(proj => proj._id !== id));
          } catch (error) {
            console.error('Error deleting project:', error);
            Alert.alert('Error', 'Failed to delete project');
          }
        },
      },
    ]);
  };

  const handleInputToggle = () => {
    if (!isLoggedIn) {
      Alert.alert('Login Required', 'You must be logged in to create a project');
      return;
    }
    setShowInput(s => !s);
  };

  // ---------- render ----------
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Projects</Text>

      {!showInput && projects.length === 0 && (
        <Text style={styles.emptyText}>Press + to Create a New Project!</Text>
      )}

      <View style={styles.listContainer}>
        <FlatList
          data={projects}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardLeft}
                onPress={() =>
                  navigation.navigate('ProjectOptions', { project: item, userData })
                }>
                <Icon name="film" size={18} color="#fff" style={styles.cardIcon} />
                <Text style={styles.cardText}>{item.title}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => deleteProject(item._id)}>
                <Icon name="trash" size={20} color="#fff" />
              </TouchableOpacity>
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
            placeholder="Project title"
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TouchableOpacity style={styles.createBtn} onPress={addProject}>
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FABs */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.homeFab]}
          onPress={() => navigation.navigate('Home')}>
          <Icon name="home" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.fab} onPress={handleInputToggle}>
          <Icon name={showInput ? 'close' : 'plus'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------- styles ----------
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
    alignSelf: 'center',
  },
  emptyText: {
    color: '#fff',
    alignSelf: 'center',
    marginTop: 20,
  },
  listContainer: {
    flex: 1,
    width: '100%',
    marginTop: 100,
    paddingBottom: 200, // Add padding to prevent overlap with input/FABs
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
  homeFab: {
    backgroundColor: '#F8A8B8',
  },
});