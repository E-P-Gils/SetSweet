import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const OngoingCallScreen = () => {
  const [callerName, setCallerName] = useState('Test 99');

  return (
    <ImageBackground
      source={require('./assets/z33hpy7gz6pb1.jpg')} // Your background image here
      style={styles.background}
    >
      <View style={styles.topSection}>
        <Text style={styles.statusText}>calling mobile...</Text>
        <TextInput
          style={styles.nameText}
          value={callerName}
          onChangeText={setCallerName}
          placeholder="Caller Name"
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.controlsGrid}>
        <CallButton icon="volume-up" label="Speaker" />
        <CallButton icon="videocam-off" label="FaceTime" disabled />
        <CallButton icon="mic-off" label="Mute" />
        <CallButton icon="person-add" label="Add" disabled />
        <CallButton icon="call-end" label="End" red />
        <CallButton icon="dialpad" label="Keypad" />
      </View>
    </ImageBackground>
  );
};

const CallButton = ({ icon, label, red = false, disabled = false }) => (
  <TouchableOpacity style={styles.buttonWrapper} disabled={disabled}>
    <View style={[
      styles.circleButton,
      red ? styles.redCircle : styles.grayCircle,
      disabled && styles.disabledCircle
    ]}>
      <MaterialIcons name={icon} size={28} color={disabled ? '#aaa' : '#fff'} />
    </View>
    <Text style={[styles.buttonLabel, disabled && styles.disabledLabel]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    paddingTop: 100,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
  },
  statusText: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 4,
  },
  nameText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '600',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderColor: '#444',
    paddingBottom: 4,
    width: '80%',
  },
  controlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingBottom: 50,
  },
  buttonWrapper: {
    alignItems: 'center',
    width: '30%',
    marginVertical: 20,
  },
  circleButton: {
    width: 65,
    height: 65,
    borderRadius: 65 / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  redCircle: {
    backgroundColor: 'red',
  },
  grayCircle: {
    backgroundColor: '#444',
  },
  disabledCircle: {
    backgroundColor: '#2a2a2a',
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  disabledLabel: {
    color: '#777',
  },
});

export default OngoingCallScreen;