// ProjectScreen.js
import React, { useState } from 'react';
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

export default function ProjectScreen({ navigation }) {
  const [projects, setProjects] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [showCreateButton, setShowCreateButton] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // ---------- helpers ----------
  const addProject = () => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      Alert.alert('Please enter a project title');
      return;
    }

    // Create new project with current title
    const newProject = {
      id: Date.now().toString(),
      title: trimmedTitle
    };

    // Update projects list
    setProjects(prev => [...prev, newProject]);
    
    // Reset input and close modal
    setNewTitle('');
    setShowInput(false);
  };

  // Reset input when modal is closed
  const handleModalClose = () => {
    setNewTitle('');
    setShowInput(false);
  };

  const deleteProject = (id) => {
    Alert.alert('Delete Project', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          setProjects((prev) => prev.filter((proj) => proj.id !== id)),
      },
    ]);
  };

  // ---------- render ----------
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Projects</Text>

      {!showInput && (
        <Text style={styles.emptyText}>Press + to Create a New Project!</Text>
      )}

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardLeft}
              onPress={() =>
                navigation.navigate('ProjectDashboard', { project: item })
              }>
              <Icon name="film" size={18} color="#fff" style={styles.cardIcon} />
              <Text style={styles.cardText}>{item.title}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteProject(item.id)}>
              <Icon name="trash" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* floating input */}
      {showInput && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Project title"
            value={newTitle}
            onChangeText={setNewTitle}
            autoFocus={true}
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
        <TouchableOpacity
          style={styles.fab}
          onPress={() => showInput ? handleModalClose() : setShowInput(true)}>
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
  card: {
    flexDirection: 'row',
    backgroundColor: '#F8A8B8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    bottom: -90,
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