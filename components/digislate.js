import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';

const colorBars = ['#000', '#4a4a4a', '#a0a0a0', '#ffffff', '#e30613', '#0072ce', '#00a94f', '#f7ec13'];

const VerticalLabel = ({ label }) => (
  <View style={styles.verticalBox}>
    <Text style={styles.verticalText}>{label}</Text>
  </View>
);

const SlateInput = ({ placeholder, style }) => (
  <TextInput style={[styles.inputField, style]} placeholder={placeholder} placeholderTextColor="#888" />
);

export default function DigitalSlate() {
  const clapAnim = useRef(new Animated.Value(0)).current;
  const [selectedToggles, setSelectedToggles] = useState([]);

  const handleClap = () => {
    Animated.sequence([
      Animated.timing(clapAnim, { toValue: -25, duration: 100, useNativeDriver: true }),
      Animated.timing(clapAnim, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const toggleSelection = (label) => {
    setSelectedToggles((prevSelectedToggles) => {
      if (prevSelectedToggles.includes(label)) {
        return prevSelectedToggles.filter((item) => item !== label);
      } else {
        return [...prevSelectedToggles, label];
      }
    });
  };

  return (
    <View style={styles.wrapper}>
      {/* Tap area for the clapper */}
      <TouchableWithoutFeedback onPress={handleClap}>
        <Animated.View style={[styles.clapperArm, { transform: [{ rotate: clapAnim.interpolate({
          inputRange: [-25, 0],
          outputRange: ['-25deg', '0deg']
        }) }] }]}>
          {colorBars.map((color, index) => (
            <View key={index} style={[styles.colorBar, { backgroundColor: color }]} />
          ))}
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* ROLL / SCENE / TAKE Container */}
      <View style={styles.topTriplet}>
        <View style={styles.labeledInput}>
          <VerticalLabel label="ROLL" />
          <SlateInput placeholder="123" />
        </View>
        <View style={styles.labeledInput}>
          <VerticalLabel label="SCENE" />
          <SlateInput placeholder="45A" />
        </View>
        <View style={styles.labeledInput}>
          <VerticalLabel label="TAKE" />
          <SlateInput placeholder="7" />
        </View>
      </View>

      {/* Slate Body */}
      <View style={styles.slateContainer}>
        {/* Full Width Fields */}
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

        {/* INT / EXT / DAY / NITE / SYNC / MOS checkboxes */}
        <View style={styles.toggleRow}>
          {['INT', 'EXT', 'DAY', 'NITE', 'SYNC', 'MOS'].map((label) => {
            const isSelected = selectedToggles.includes(label);
            return (
              <TouchableOpacity
                key={label}
                onPress={() => toggleSelection(label)}
                style={[styles.toggleBox, isSelected && styles.toggleBoxSelected]}
              >
                <Text style={[styles.toggleText, isSelected && styles.toggleTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
  clapperArm: {
    flexDirection: 'row',
    width: 900,
    height: 20,
    justifyContent: 'space-between',
    marginBottom: 5,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    overflow: 'hidden',
    elevation: 3,
    left: 190,
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
    width: 800,
    alignSelf: 'center',
    left: 210,
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
  verticalBox: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTriplet: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
    left: 210,
  },
  verticalText: {
    transform: [{ rotate: '90deg' }],
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
    transform: [{ rotate: '360deg' }],
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
  toggleBoxSelected: {
    backgroundColor: '#000',
  },
  toggleTextSelected: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  toggleBox: {
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  toggleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});