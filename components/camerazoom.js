import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { CameraButton, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CameraZoom(){
  const {facing, setFacing} = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <CameraButton onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        <View style={styles.container}>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container : {
    flex: 1,
    backgroundColor: 'transparent',
  },

  camera: {
    position: 'absolute',
    flex: 1,
    alignSelf: 'flex-end',
    width: '100%',
    height: '100%',
  },

});