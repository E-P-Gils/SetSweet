// Script.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { WebView } from 'react-native-webview';
import { API_BASE_URL } from '../config';

// Helper function for safe JSON parsing
const safeJsonParse = (data, context) => {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error(`JSON parse error in ${context}:`, error);
    console.error('Raw data:', data);
    throw new Error(`Invalid JSON in ${context}: ${error.message}`);
  }
};

// Helper function for logging
const logError = (context, error, additionalInfo = {}) => {
  console.error(`Error in ${context}:`, error);
  console.error('Additional info:', additionalInfo);
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response headers:', error.response.headers);
  }
};

export default function Script({ navigation, route }) {
  const { project } = route.params;
  const [scriptUrl, setScriptUrl] = useState(null);
  const [localPdfUri, setLocalPdfUri] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  // Memoize the token to avoid unnecessary re-renders
  const token = project.userData?.token;

  const getFullUrl = useCallback((path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${path}`;
  }, []);

  const downloadAndLoadPdf = useCallback(async (url) => {
    try {
      console.log('Starting PDF download from:', url);
      
      // Create a unique filename for this download
      const timestamp = new Date().getTime();
      const localUri = `${FileSystem.cacheDirectory}script_${timestamp}.pdf`;
      console.log('Local URI for download:', localUri);
      
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localUri,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Starting download...');
      const { uri } = await downloadResumable.downloadAsync();
      console.log('Download completed to:', uri);

      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Downloaded file not found');
      }

      // Read the file as base64
      console.log('Reading file as base64...');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });
      console.log('Base64 length:', base64.length);

      // Create a data URI for the PDF
      const dataUri = `data:application/pdf;base64,${base64}`;
      setLocalPdfUri(dataUri);
      return dataUri;
    } catch (e) {
      logError('downloadAndLoadPdf', e, { url });
      setError('Failed to download script');
      throw e;
    }
  }, [token]);

  const fetchScriptUrl = useCallback(async () => {
    try {
      if (!token) {
        Alert.alert('Error', 'Please log in again');
        navigation.navigate('LoginForm');
        return;
      }

      console.log('Fetching script URL for project:', project._id);
      const response = await fetch(
        `${API_BASE_URL}/projects/${project._id}/script`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      console.log('Script URL response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch script: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      const data = safeJsonParse(responseText, 'fetchScriptUrl');
      console.log('Parsed response:', data);
      
      if (data.scriptUrl) {
        const fullUrl = getFullUrl(data.scriptUrl);
        console.log('Full script URL:', fullUrl);
        setScriptUrl(fullUrl);
        await downloadAndLoadPdf(fullUrl);
      }
    } catch (error) {
      logError('fetchScriptUrl', error, { projectId: project._id });
      setError('Failed to fetch script URL');
      if (error.message.includes('401')) {
        Alert.alert('Session Expired', 'Please log in again');
        navigation.navigate('LoginForm');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, project._id, getFullUrl, downloadAndLoadPdf, navigation]);

  useEffect(() => {
    fetchScriptUrl();
  }, [fetchScriptUrl]);

  const uploadScript = useCallback(async (file) => {
    try {
      setIsUploading(true);
      setError(null);

      if (!token) {
        Alert.alert('Error', 'Please log in again');
        navigation.navigate('LoginForm');
        return;
      }

      console.log('Starting file upload:', file);
      
      // Create FormData
      const formData = new FormData();
      formData.append('script', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        type: 'application/pdf',
        name: file.name
      });

      console.log('Making upload request...');
      const response = await fetch(
        `${API_BASE_URL}/projects/${project._id}/script`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: formData
        }
      );

      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(errorText || `Upload failed with status ${response.status}`);
      }

      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      const responseData = safeJsonParse(responseText, 'uploadScript');
      console.log('Parsed response:', responseData);

      if (responseData.scriptUrl) {
        const fullUrl = getFullUrl(responseData.scriptUrl);
        console.log('Full script URL:', fullUrl);
        setScriptUrl(fullUrl);
        await downloadAndLoadPdf(fullUrl);
        Alert.alert('Success', 'Script uploaded successfully');
      } else {
        throw new Error('No script URL in response');
      }
    } catch (error) {
      logError('uploadScript', error, { fileName: file.name });
      let errorMessage = error.message;
      if (error.message.includes('413')) {
        errorMessage = 'File is too large. Maximum size is 10MB.';
      } else if (error.message.includes('415')) {
        errorMessage = 'Only PDF files are allowed.';
      }
      
      setError(`Upload failed: ${errorMessage}`);
      Alert.alert('Upload Error', `Failed to upload script: ${errorMessage}`);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [token, project._id, getFullUrl, downloadAndLoadPdf, navigation]);

  const handleUpload = useCallback(async () => {
    try {
      console.log('Starting document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
        multiple: false
      });
      
      console.log('DocumentPicker result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        console.log('Document selected:', selectedFile);
        
        if (!selectedFile.uri || !selectedFile.name) {
          throw new Error('Invalid file selected');
        }
        
        const fileInfo = await FileSystem.getInfoAsync(selectedFile.uri);
        console.log('File info:', fileInfo);
        
        if (fileInfo.size > 10 * 1024 * 1024) {
          throw new Error('File is too large. Maximum size is 10MB.');
        }
        
        await uploadScript(selectedFile);
      }
    } catch (error) {
      logError('handleUpload', error);
      Alert.alert('Error', error.message || 'Failed to pick document');
    }
  }, [uploadScript]);

  const handleDelete = useCallback(async () => {
    try {
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
                console.log('Deleting script for project:', project._id);
                const response = await fetch(
                  `${API_BASE_URL}/projects/${project._id}/script`,
                  {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Accept': 'application/json'
                    }
                  }
                );

                console.log('Delete response status:', response.status);
                
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('Error response:', errorText);
                  throw new Error(errorText || 'Failed to delete script');
                }

                setScriptUrl(null);
                setLocalPdfUri(null);
                setError(null);
                Alert.alert('Success', 'Script deleted successfully');
              } catch (error) {
                logError('handleDelete', error, { projectId: project._id });
                Alert.alert('Error', `Failed to delete script: ${error.message}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      logError('handleDelete', error);
      Alert.alert('Error', 'Failed to delete script');
    }
  }, [token, project._id, navigation]);

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
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Script</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!scriptUrl ? (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No script uploaded.</Text>
          <TouchableOpacity
            style={[styles.button, styles.uploadButton]}
            onPress={handleUpload}
            disabled={isUploading}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>
              {isUploading ? 'Uploading...' : 'Upload Script'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pdfContainer}>
          {localPdfUri ? (
            <WebView
              source={{ uri: localPdfUri }}
              style={styles.pdfViewer}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                setError(`Failed to load PDF: ${nativeEvent.description}`);
              }}
              onLoad={() => {
                console.log('PDF loaded successfully');
                setError(null);
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              originWhitelist={['*']}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#F8A8B8" />
                </View>
              )}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F8A8B8" />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Delete Script</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.uploadButton]}
              onPress={handleUpload}
              disabled={isUploading}
            >
              <Ionicons name="refresh" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>
                {isUploading ? 'Uploading...' : 'Replace Script'}
              </Text>
            </TouchableOpacity>
          </View>
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
  },
  pdfViewer: {
    flex: 1,
    width: Dimensions.get('window').width - 40,
    backgroundColor: '#fff',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
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
  uploadButton: {
    backgroundColor: '#F8A8B8',
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
  loadingText: {
    color: '#F8A8B8',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
}); 