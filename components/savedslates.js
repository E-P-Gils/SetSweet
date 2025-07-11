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
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        Alert.alert('Error', 'Please log in to view slates');
        navigation.navigate('LoginForm');
        return;
      }

      const parsedUserData = JSON.parse(userData);
      console.log('Fetching slates for project:', project._id);

      const response = await fetch(
        `${API_BASE_URL}/projects/${project._id}/slates`,
        {
          headers: {
            'Authorization': `Bearer ${parsedUserData.token}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch slates');
      }

      const slatesData = await response.json();
      console.log('Fetched slates:', slatesData);
      setSlates(slatesData);
    } catch (error) {
      console.error('Error fetching slates:', error);
      // Don't show alert for fetch errors as they might be temporary
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlate = async (slateId) => {
    Alert.alert(
      'Delete Slate',
      'Are you sure you want to delete this slate? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userData = await AsyncStorage.getItem('userData');
              if (!userData) {
                Alert.alert('Error', 'Please log in to delete slates');
                navigation.navigate('LoginForm');
                return;
              }

              const parsedUserData = JSON.parse(userData);
              const response = await fetch(
                `${API_BASE_URL}/projects/${project._id}/slates/${slateId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${parsedUserData.token}`,
                    'Accept': 'application/json'
                  }
                }
              );

              if (!response.ok) {
                throw new Error('Failed to delete slate');
              }

              // Remove the deleted slate from the state
              setSlates(prevSlates => prevSlates.filter(slate => slate._id !== slateId));
              Alert.alert('Success', 'Slate deleted successfully');
            } catch (error) {
              console.error('Error deleting slate:', error);
              Alert.alert('Error', 'Failed to delete slate');
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const renderSlateItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.slateItem}
      onPress={() => navigation.navigate('DigitalSlate', { 
        slateData: {
          roll: item.roll,
          scene: item.scene,
          take: item.take,
          prod: item.prod,
          dir: item.dir,
          cam: item.cam,
          fps: item.fps,
          date: item.date,
          toggles: item.toggles
        },
        isViewMode: true
      })}
    >
      <View style={styles.slateHeader}>
        <Text style={styles.slateTitle}>
          Roll: {item.roll} | Scene: {item.scene} | Take: {item.take}
        </Text>
        {!project.isShared && (
          <TouchableOpacity
            onPress={() => handleDeleteSlate(item._id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={24} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.slateDetails}>
        <Text style={styles.detailText}>Production: {item.prod}</Text>
        <Text style={styles.detailText}>Director: {item.dir}</Text>
        <Text style={styles.detailText}>Camera: {item.cam}</Text>
        <Text style={styles.detailText}>FPS: {item.fps}</Text>
        <Text style={styles.detailText}>Date: {new Date(item.date).toLocaleDateString()}</Text>
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>INT/EXT: {item.toggles.INT_EXT}</Text>
        <Text style={styles.toggleText}>DAY/NIGHT: {item.toggles.DAY_NITE}</Text>
        <Text style={styles.toggleText}>SYNC/MOS: {item.toggles.SYNC_MOS}</Text>
      </View>
    </TouchableOpacity>
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
              <Text style={styles.emptyText}>No slates saved yet</Text>
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
  },
  toggleText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
});
