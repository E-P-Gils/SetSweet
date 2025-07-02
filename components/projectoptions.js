// ProjectOptions.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function ProjectOptions({ navigation, route }) {
  const { project, userData } = route.params;
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const handleSceneNavigation = () => {
    console.log('Navigating to Scenes with:', { project, userData });
    navigation.navigate('Scenes', { 
      project: { 
        ...project, 
        userData: userData || project.userData 
      } 
    });
  };

  const handleShareProject = async () => {
    if (!shareEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsSharing(true);
    try {
      const response = await fetch(`http://192.168.1.3:3001/api/projects/${project._id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify({ email: shareEmail.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', `Project shared with ${shareEmail}!`);
        setShowShareModal(false);
        setShareEmail('');
      } else {
        Alert.alert('Error', data.message || 'Failed to share project');
      }
    } catch (error) {
      console.error('Error sharing project:', error);
      Alert.alert('Error', 'Failed to share project. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.header}>{project.title}</Text>

        <View style={styles.buttonContainer}>
          <OptionBtn
            icon="list-ul"
            label="Scenes"
            onPress={handleSceneNavigation}
          />

          <OptionBtn
            icon="photo"
            label="Slates"
            onPress={() => navigation.navigate('SavedSlates', { project })}
          />

          {!project.isShared && (
            <OptionBtn
              icon="share"
              label="Share Project"
              onPress={() => setShowShareModal(true)}
            />
          )}

          <OptionBtn
            icon="arrow-left"
            label="Back to Projects"
            onPress={() => navigation.navigate('ProjectScreen')}
          />
        </View>
      </View>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Share Project</Text>
            <Text style={styles.modalSubtitle}>
              Enter the email address of the person you want to share this project with.
            </Text>
            
            <TextInput
              style={styles.emailInput}
              placeholder="Enter email address"
              value={shareEmail}
              onChangeText={setShareEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowShareModal(false);
                  setShareEmail('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.shareButton]}
                onPress={handleShareProject}
                disabled={isSharing}
              >
                <Text style={styles.modalButtonText}>
                  {isSharing ? 'Sharing...' : 'Share'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- tiny sub‑component ---------- */
const OptionBtn = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.optionBtn} onPress={onPress}>
    <Icon name={icon} size={24} color="#fff" style={styles.optionIcon} />
    <Text style={styles.optionText}>{label}</Text>
  </TouchableOpacity>
);

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00B5B8',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -60,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    alignItems: 'center',
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8A8B8',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    marginBottom: 15,
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  emailInput: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  shareButton: {
    backgroundColor: '#00B5B8',
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});