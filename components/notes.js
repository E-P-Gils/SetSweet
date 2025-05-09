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
  const { scene } = route.params;
  const [note, setNote] = useState(scene.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  // Load saved notes when component mounts
  useEffect(() => {
    if (scene.notes) {
      setNote(scene.notes);
    }
  }, [scene]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/scenes/${scene._id}`, {
        notes: note
      });
      Alert.alert('Success', 'Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save notes');
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
});