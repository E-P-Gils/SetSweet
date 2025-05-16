// ProjectOptions.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function ProjectOptions({ navigation, route }) {
  const { project, userData } = route.params;

  const handleSceneNavigation = () => {
    console.log('Navigating to Scenes with:', { project, userData });
    navigation.navigate('Scenes', { 
      project: { 
        ...project, 
        userData: userData || project.userData 
      } 
    });
  };

  const handleScriptNavigation = () => {
    console.log('Starting Script navigation...');
    console.log('Current navigation state:', navigation.getState());
    console.log('Navigating to Script with:', { project, userData });
    try {
      navigation.push('Script', { 
        project: {
          ...project,
          userData: userData || project.userData
        }
      });
      console.log('Navigation command executed');
    } catch (error) {
      console.error('Navigation error:', error);
      try {
        navigation.navigate('Script', { 
          project: {
            ...project,
            userData: userData || project.userData
          }
        });
      } catch (fallbackError) {
        console.error('Fallback navigation error:', fallbackError);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{project.title}</Text>

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

      <OptionBtn
        icon="file-text-o"
        label="Script"
        onPress={handleScriptNavigation}
      />

      <OptionBtn
        icon="arrow-left"
        label="Back to Projects"
        onPress={() => navigation.navigate('ProjectScreen')}
      />
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
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#00B5B8',
    alignItems: 'center',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
});