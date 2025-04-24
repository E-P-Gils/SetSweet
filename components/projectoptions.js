// ProjectOptions.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function ProjectOptions({ navigation, route }) {
  const { project } = route.params;   // project object passed from ProjectScreen

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{project.title}</Text>

      <OptionBtn
        icon="list-ul"
        label="Scenes"
        onPress={() => navigation.navigate('Scenes', { project })}
      />

      <OptionBtn
        icon="photo"
        label="Slates"
        onPress={() => navigation.navigate('SlatesScreen', { project })}
      />

      <OptionBtn
        icon="file-text-o"
        label="Script"
        onPress={() => navigation.navigate('ScriptScreen', { project })}
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
function OptionBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Icon name={icon} size={20} color="#fff" style={styles.icon} />
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00B5B8',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8A8B8',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  icon: { marginRight: 12 },
  btnText: { color: '#fff', fontSize: 18 },
});