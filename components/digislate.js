import React, { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { View, Text, TextInput, StyleSheet, Animated, TouchableWithoutFeedback, TouchableOpacity, Image } from 'react-native';

const colorBars = ['#000', '#4a4a4a', '#a0a0a0', '#ffffff', '#e30613', '#0072ce', '#00a94f', '#f7ec13'];
const topClapperColors = ['#f7ec13', '#00a94f', '#0072ce', '#e30613', '#ffffff', '#a0a0a0', '#4a4a4a', '#000'];

const VerticalLabel = ({ label }) => (
  <View style={styles.verticalBox}>
    <Text style={styles.verticalText}>{label}</Text>
  </View>
);

const SlateInput = ({ placeholder, big, style, ...props }) => (
  <TextInput
    style={[styles.inputField, big && styles.bigInputField, style]}
    placeholder={placeholder}
    placeholderTextColor="#888"
    {...props}
  />
);

export default function DigitalSlate({ navigation }) {
  const clapAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef(null);
  const [selectedToggles, setSelectedToggles] = useState({
    INT_EXT: 'INT',
    DAY_NITE: 'DAY',
    SYNC_MOS: 'SYNC',
  });


  const handleClap = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/slateclapper.mp3')
      );
      await sound.playAsync();
      
      // Set up a listener to unload the sound after it finishes playing
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error playing clap sound:', error);
    }
  
    Animated.sequence([
      Animated.timing(clapAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(clapAnim, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };
  
  
  const toggleSelection = (toggleCategory) => {
    setSelectedToggles((prevSelectedToggles) => {
      const newSelection = { ...prevSelectedToggles };
      if (newSelection[toggleCategory] === 'INT' || newSelection[toggleCategory] === 'DAY' || newSelection[toggleCategory] === 'SYNC') {
        newSelection[toggleCategory] = toggleCategory === 'INT_EXT' ? 'EXT' : toggleCategory === 'DAY_NITE' ? 'NIGHT' : 'MOS';
      } else {
        newSelection[toggleCategory] = toggleCategory === 'INT_EXT' ? 'INT' : toggleCategory === 'DAY_NITE' ? 'DAY' : 'SYNC';
      }
      return newSelection;
    });
  };

  return (
    <View style={styles.wrapper}>
      <TouchableWithoutFeedback onPress={handleClap}>
        <View style={styles.clapperContainer}>
          {/* Top clapper arm (animated) */}
          <Animated.View 
            style={[
              styles.clapperArm, 
              styles.topClapper,
              {
                transform: [{
                  translateY: clapAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 19.5]
                  })
                }]
              }
            ]}>
            {topClapperColors.map((color, index) => (
              <View key={index} style={[styles.colorBar, { backgroundColor: color }]} />
            ))}
          </Animated.View>
          
          {/* Bottom clapper arm (stationary) */}
          <View style={[styles.clapperArm, styles.bottomClapper]}>
            {colorBars.map((color, index) => (
              <View key={index} style={[styles.colorBar, { backgroundColor: color }]} />
            ))}
          </View>
        </View>
      </TouchableWithoutFeedback>

      <View style={styles.topTriplet}>
        <View style={styles.tripletBox}>
          <Text style={styles.verticalText}>ROLL</Text>
          <SlateInput placeholder="123" big style={{ width: '100%' }} />
        </View>
        <View style={styles.tripletBox}>
          <Text style={styles.verticalText}>SCENE</Text>
          <SlateInput placeholder="45A" big style={{ width: '100%' }} />
        </View>
        <View style={styles.tripletBox}>
          <Text style={styles.verticalText}>TAKE</Text>
          <SlateInput placeholder="7" big style={{ width: '100%' }} />
        </View>
      </View>

      <View style={styles.slateContainer}>
        <View style={styles.row}>
          <SlateInput placeholder="PROD" style={{ flex: 1 }} />
        </View>
        <View style={styles.row}>
          <SlateInput placeholder="DIR" style={{ flex: 1 }} />
        </View>
        <View style={styles.row}>
          <SlateInput placeholder="CAM" style={{ flex: 1 }} />
          <SlateInput placeholder="FPS" style={styles.smallField} />
        </View>
        <View style={styles.row}>
          <SlateInput placeholder="DATE" style={{ flex: 1 }} />
        </View>

        <View style={styles.toggleRow}>
          {['INT_EXT', 'DAY_NITE', 'SYNC_MOS'].map((toggleCategory) => (
            <TouchableOpacity
              key={toggleCategory}
              onPress={() => toggleSelection(toggleCategory)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleButtonText}>
                {selectedToggles[toggleCategory]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginTop: 50,
    transform: [{ rotate: '90deg' }],
  },
  clapperContainer: {
    position: 'relative',
    width: 850,
    height: 40,
    marginBottom: 5,
    left: 185,
  },
  clapperArm: {
    flexDirection: 'row',
    width: 850,
    height: 20,
    justifyContent: 'space-between',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    overflow: 'hidden',
    elevation: 3,
  },
  topClapper: {
    position: 'absolute',
    top: -20,
  },
  bottomClapper: {
    position: 'absolute',
    top: 20,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  colorBar: {
    flex: 1,
    height: '100%',
  },
  slateContainer: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    padding: 10,
    width: 750,
    alignSelf: 'center',
    left: 185,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  labeledInput: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 10,
  },
  topTriplet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    position: 'relative',
    left: 185, 
    width: 750, 
  },
  tripletBox: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  bigInputField: {
    width: 150,
    height: 50,
    fontSize: 20,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  verticalText: {
    transform: [{ rotate: '360deg' }],
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 6,
    width: 100,
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  smallField: {
    width: 60,
    marginLeft: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    right: 130,
  },
  toggleButton: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  toggleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
    padding: 10,
    borderRadius: 5,
    left: 500,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
  },
  icon: {
    width: 20,
    height: 20,
  },
});