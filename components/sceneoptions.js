// SceneOptions.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function SceneOptions({ navigation, route }) {
  const { scene, project } = route.params; // scene object passed from SceneScreen

  const handleFloorplanNavigation = () => {
    // Ensure we pass the complete scene data including floorplan
    navigation.navigate('FloorPlanScreen', { 
      scene: {
        ...scene,
        floorplan: scene.floorplan || { shapes: [], paths: [] },
        token: project.userData?.token
      }, 
      project 
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{scene.title}</Text>

      <OptionBtn
        icon="picture-o"
        label="StoryBoard"
        onPress={() =>
          navigation.navigate('StoryBoardScreen', { scene, project })
        }
      />

      <OptionBtn
        icon="th-large"
        label="FloorPlan"
        onPress={handleFloorplanNavigation}
      />

      <OptionBtn
        icon="sticky-note-o"
        label="Notes"
        onPress={() => navigation.navigate('Notes', { scene, project })}
      />

      <OptionBtn
        icon="arrow-left"
        label="Back to Scenes"
        onPress={() => navigation.goBack()}
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