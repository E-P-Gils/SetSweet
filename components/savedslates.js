import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export default function SavedSlates({ navigation, route }) {
  const { project } = route.params;
  const [slates, setSlates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSlates();
  }, []);

  const fetchSlates = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userData');
      if (!token) {
        Alert.alert('Error', 'Please log in to view slates');
        navigation.navigate('LoginForm');
        return;
      }

      const parsedToken = JSON.parse(token);
      const response = await fetch(`${API_BASE_URL}/projects/${project._id}/slates`, {
        headers: {
          'Authorization': `Bearer ${parsedToken.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch slates');
      }

      const slatesData = await response.json();
      setSlates(slatesData);
    } catch (error) {
      console.error('Error fetching slates:', error);
      Alert.alert('Error', 'Failed to load slates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlate = async (slateId) => {
    try {
      const token = await AsyncStorage.getItem('userData');
      if (!token) {
        Alert.alert('Error', 'Please log in to delete slates');
        return;
      }

      const parsedToken = JSON.parse(token);
      const response = await fetch(`${API_BASE_URL}/projects/${project._id}/slates/${slateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${parsedToken.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete slate');
      }

      setSlates(slates.filter(slate => slate._id !== slateId));
      Alert.alert('Success', 'Slate deleted successfully');
    } catch (error) {
      console.error('Error deleting slate:', error);
      Alert.alert('Error', 'Failed to delete slate');
    }
  };

  const renderSlateItem = ({ item }) => (
    <View style={styles.slateItem}>
      <View style={styles.slateHeader}>
        <Text style={styles.slateTitle}>
          {item.roll} - Scene {item.scene} - Take {item.take}
        </Text>
        <TouchableOpacity
          onPress={() => handleDeleteSlate(item._id)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={24} color="#ff4444" />
        </TouchableOpacity>
      </View>
      <View style={styles.slateDetails}>
        <Text style={styles.slateText}>
          {item.toggles.INT_EXT} / {item.toggles.DAY_NITE} / {item.toggles.SYNC_MOS}
        </Text>
        <Text style={styles.slateText}>
          Prod: {item.prod} | Dir: {item.dir} | Cam: {item.cam}
        </Text>
        <Text style={styles.slateText}>
          FPS: {item.fps} | Date: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Slates</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F8A8B8" />
        </View>
      ) : (
        <FlatList
          data={slates}
          renderItem={renderSlateItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No saved slates found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00B5B8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  slateItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  slateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButton: {
    padding: 5,
  },
  slateDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  slateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});
