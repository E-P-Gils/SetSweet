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

export default function SceneScreen({ navigation, route }) {
  /* If you navigated here with   navigation.navigate('SceneScreen', { project })  
     you can pull the parent project like this ↓   */
  const { project } = route.params ?? {};

  const [scenes, setScenes] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef(null);

  /* -------- focus the text box when it appears -------- */
  useEffect(() => {
    if (showInput && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [showInput]);

  /* -------- helpers -------- */
  const addScene = () => {
    const title = newTitle.trim();
    if (!title) {
      Alert.alert('Please enter a scene title / slug');
      return;
    }

    setScenes(prev => [...prev, { id: Date.now().toString(), title }]);
    setNewTitle('');
    setShowInput(false);
  };

  const deleteScene = (id) => {
    Alert.alert('Delete Scene', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setScenes(prev => prev.filter(s => s.id !== id)),
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

      {!showInput && scenes.length === 0 && (
        <Text style={styles.emptyText}>Press + to create a new scene</Text>
      )}

      <View style={styles.listContainer}>
        <FlatList
          data={scenes}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardLeft}
                onPress={() => navigation.navigate('SceneOptions', { scene: item, project })}>
                <Icon name="bookmark" size={18} color="#fff" style={styles.cardIcon} />
                <Text style={styles.cardText}>{item.title}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => deleteScene(item.id)}>
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