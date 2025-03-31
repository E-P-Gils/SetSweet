import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import CameraZoom from './components/camerazoom';

export default function App() {
  return (
    <View style={styles.container}>
      <CameraZoom />
      <StatusBar hidden />  {/* ✅ Hide status bar to prevent layout issues */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',  // ✅ Avoid white background
  },
});