// Script.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import { API_BASE_URL } from '../config';

export default function Script({ navigation, route }) {
  const { project } = route.params;
  const [scriptUrl, setScriptUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  console.log('Script component mounted with params:', route.params);

  useEffect(() => {
    console.log('Script component useEffect triggered');
    fetchScriptUrl();
  }, []);

  const fetchScriptUrl = async () => {
    try {
      console.log('Fetching script URL for project:', project._id);
      const token = project.userData?.token;
      if (!token) {
        console.log('No token found, redirecting to login');
        Alert.alert('Error', 'Please log in again');
        navigation.navigate('LoginForm');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/projects/${project._id}/script`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Script URL response:', response.data);
      if (response.data.scriptUrl) {
        // Construct full URL for the script
        const fullUrl = `${API_BASE_URL.replace('/api', '')}${response.data.scriptUrl}`;
        console.log('Full script URL:', fullUrl);
        setScriptUrl(fullUrl);
      }
    } catch (error) {
      console.error('Error fetching script:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again');
        navigation.navigate('LoginForm');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      console.log('Starting document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });

      console.log('DocumentPicker result:', result);
      
      if (result.type === 'success') {
        console.log('Document selected:', result);
        await uploadScript(result.uri);
      } else if (result.type === 'cancel') {
        console.log('Document picker cancelled');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadScript = async (uri) => {
    try {
      setIsUploading(true);
      console.log('Starting upload process with URI:', uri);
      
      const token = project.userData?.token;
      if (!token) {
        console.error('No token found');
        Alert.alert('Error', 'Please log in again');
        navigation.navigate('LoginForm');
        return;
      }

      const formData = new FormData();
      formData.append('script', {
        uri,
        type: 'application/pdf',
        name: 'script.pdf'
      });

      console.log('FormData contents:', formData._parts);
      console.log('Project ID:', project._id);
      console.log('API Base URL:', API_BASE_URL);
      
      const response = await axios.post(
        `${API_BASE_URL}/projects/${project._id}/script`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Upload response:', response.data);

      if (response.data.scriptUrl) {
        const fullUrl = `${API_BASE_URL.replace('/api', '')}${response.data.scriptUrl}?t=${Date.now()}`;
        console.log('Final full URL used for WebView:', fullUrl);

        // Verify the URL is accessible
        try {
          const verifyResponse = await axios.get(fullUrl, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          });
          console.log('URL verification successful:', verifyResponse.status === 200);
          setScriptUrl(fullUrl);
          Alert.alert('Success', 'Script uploaded successfully');
        } catch (verifyError) {
          console.error('URL verification failed:', verifyError);
          Alert.alert('Error', 'Uploaded file is not accessible');
        }
      } else {
        console.error('No scriptUrl in response:', response.data);
        Alert.alert('Error', 'Failed to get script URL from server');
      }
    } catch (error) {
      console.error('Error uploading script:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again');
        navigation.navigate('LoginForm');
      } else {
        Alert.alert('Error', 'Failed to upload script');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = project.userData?.token;
      if (!token) {
        Alert.alert('Error', 'Please log in again');
        navigation.navigate('LoginForm');
        return;
      }

      Alert.alert(
        'Delete Script',
        'Are you sure you want to delete this script?',
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
                const response = await axios.delete(
                  `${API_BASE_URL}/projects/${project._id}/script`,
                  {
                    headers: { Authorization: `Bearer ${token}` }
                  }
                );
                
                if (response.status === 200) {
                  setScriptUrl(null);
                  Alert.alert('Success', 'Script deleted successfully');
                }
              } catch (error) {
                console.error('Error deleting script:', error);
                Alert.alert('Error', 'Failed to delete script');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in delete handler:', error);
      Alert.alert('Error', 'Failed to delete script');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F8A8B8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Script</Text>
      </View>

      {/* Debug Info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          Script URL: {scriptUrl ? 'Set' : 'Not Set'}
        </Text>
        <Text style={styles.debugText}>
          Upload Status: {isUploading ? 'Uploading...' : 'Ready'}
        </Text>
      </View>

      {scriptUrl ? (
        <View style={styles.pdfContainer}>
          <WebView
            key={scriptUrl}
            source={{ uri: scriptUrl }}
            style={styles.pdfViewer}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              Alert.alert('Error', `Failed to load PDF: ${nativeEvent.description}`);
            }}
            onLoad={() => console.log('PDF loaded successfully')}
            onLoadStart={() => console.log('PDF loading started')}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView HTTP error:', nativeEvent);
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F8A8B8" />
              </View>
            )}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Icon name="trash" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Delete Script</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.uploadButton]}
              onPress={handleUpload}
              disabled={isUploading}
            >
              <Icon name="refresh" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>
                {isUploading ? 'Uploading...' : 'Replace Script'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.uploadContainer}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
            disabled={isUploading}
          >
            <Icon name="upload" size={24} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>
              {isUploading ? 'Uploading...' : 'Upload Script'}
            </Text>
          </TouchableOpacity>
        </View>
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
  pdfContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  pdfViewer: {
    flex: 1,
    height: '100%',
    backgroundColor: '#fff',
  },
  uploadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8A8B8',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  debugContainer: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    margin: 10,
    borderRadius: 5,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 5,
  },
}); 