import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/styles';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('GreenScreen')}
      >
        <Text style={styles.buttonText}>GreenScreen</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen; 