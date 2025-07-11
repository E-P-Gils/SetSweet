// Notes.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';

const LOCAL_IP = "192.168.1.3";
const API_BASE_URL = __DEV__ 
  ? `http://${LOCAL_IP}:3001/api`
  : 'http://localhost:3001/api';

export default function Notes({ navigation, route }) {
  const { scene, project } = route.params;
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentScene, setCurrentScene] = useState(scene);

  // Fetch latest scene data when component mounts
  const fetchSceneData = async () => {
    try {
      const token = scene.token || project?.userData?.token;
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Fetching latest scene data for:', scene._id);
      const response = await axios.get(`${API_BASE_URL}/scenes/${scene._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Received scene data:', JSON.stringify(response.data, null, 2));
      setCurrentScene(response.data);
    } catch (error) {
      console.error('Error fetching scene data:', error);
      // Don't show alert for fetch errors as they might be temporary
      // The component will still work with the initial scene data
    }
  };

  // Load saved notes when component mounts or scene data updates
  useEffect(() => {
    console.log('Loading notes from scene:', JSON.stringify(currentScene, null, 2));
    if (currentScene.notes) {
      console.log('Found notes:', currentScene.notes);
      setNote(currentScene.notes);
    } else {
      console.log('No notes found in scene');
      setNote('');
    }
  }, [currentScene]);

  // Fetch scene data when component mounts
  useEffect(() => {
    fetchSceneData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = scene.token || project?.userData?.token;
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Saving notes for scene:', scene._id);
      console.log('Notes data:', note);
      
      const response = await axios.put(`${API_BASE_URL}/scenes/${scene._id}/notes`, {
        notes: note
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        console.log('Save successful, received updated scene:', JSON.stringify(response.data, null, 2));
        // Update the local scene data with the response
        setCurrentScene(response.data);
        Alert.alert('Success', 'Notes saved successfully');
      } else {
        throw new Error('Failed to save notes');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to save notes. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{scene.title}</Text>
        <TextInput
          style={styles.input}
          placeholder="Start typing your notes..."
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Icon name="save" size={24} color="#fff" />
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.backButton]}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  buttonContainer: {
    position: 'absolute',
    right: 25,
    bottom: 80,
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8A8B8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    flexDirection: 'row',
    paddingHorizontal: 15,
  },
  saveButton: {
    width: 'auto',
  },
  backButton: {
    width: 56,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  savingOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
  },
  savingText: {
    color: '#fff',
    fontSize: 12,
  },
});