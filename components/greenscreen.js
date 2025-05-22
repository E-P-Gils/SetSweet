import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const TrackingMarker = ({ style, type }) => {
  if (type === 'none') return null;
  
  return (
    <View style={[styles.marker, style]}>
      {type === 'cross' ? (
        <>
          <View style={styles.crossHorizontal} />
          <View style={styles.crossVertical} />
        </>
      ) : (
        <View style={styles.circleOuter}>
          <View style={[styles.circleQuarter, { backgroundColor: 'black' }]} />
          <View style={[styles.circleQuarter, styles.circleQuarterRight]} />
          <View style={[styles.circleQuarter, styles.circleQuarterBottom]} />
          <View style={[styles.circleQuarter, styles.circleQuarterBottomRight]} />
        </View>
      )}
    </View>
  );
};

const GreenScreen = ({ navigation }) => {
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [screenColor, setScreenColor] = useState('#00FF00'); // Green
  const [markerType, setMarkerType] = useState('cross');

  const toggleControls = () => {
    setIsControlsVisible(!isControlsVisible);
  };

  const toggleScreenColor = () => {
    setScreenColor(screenColor === '#00FF00' ? '#0000FF' : '#00FF00');
  };

  const cycleMarkerType = () => {
    setMarkerType(current => {
      if (current === 'cross') return 'circle';
      if (current === 'circle') return 'none';
      return 'cross';
    });
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: screenColor }]} 
      onPress={toggleControls}
      activeOpacity={1}
    >
      {/* Top Left Marker */}
      <TrackingMarker style={styles.topLeftMarker} type={markerType} />
      
      {/* Top Right Marker */}
      <TrackingMarker style={styles.topRightMarker} type={markerType} />
      
      {/* Bottom Left Marker */}
      <TrackingMarker style={styles.bottomLeftMarker} type={markerType} />
      
      {/* Bottom Right Marker */}
      <TrackingMarker style={styles.bottomRightMarker} type={markerType} />
      
      {/* Center Marker */}
      <TrackingMarker style={styles.centerMarker} type={markerType} />

      {isControlsVisible && (
        <View style={styles.controlsContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.controlButton, { backgroundColor: '#F8A8B8' }]}
              onPress={toggleScreenColor}
            >
              <Text style={styles.buttonText}>{screenColor === '#00FF00' ? 'Green' : 'Blue'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.controlButton, { backgroundColor: '#F8A8B8' }]}
              onPress={cycleMarkerType}
            >
              <Text style={styles.buttonText}>
                {markerType === 'cross' ? 'Cross' : markerType === 'circle' ? 'Circle' : 'None'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.backButtonContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-up" size={24} color="#fff" style={{ transform: [{ rotate: '-90deg' }] }} />
            </TouchableOpacity>
            <Text style={styles.instructionText}>Tap to Appear/Disappear</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
    justifyContent: 'center',
  },
  controlButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8A8B8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginRight: 10,
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  marker: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossHorizontal: {
    position: 'absolute',
    width: 40,
    height: 4,
    backgroundColor: 'black',
  },
  crossVertical: {
    position: 'absolute',
    width: 4,
    height: 40,
    backgroundColor: 'black',
  },
  circleOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'black',
    overflow: 'hidden',
  },
  circleQuarter: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: 'white',
  },
  circleQuarterRight: {
    left: 20,
  },
  circleQuarterBottom: {
    top: 20,
  },
  circleQuarterBottomRight: {
    left: 20,
    top: 20,
    backgroundColor: 'black',
  },
  topLeftMarker: {
    top: 50,
    left: 20,
  },
  topRightMarker: {
    top: 50,
    right: 20,
  },
  bottomLeftMarker: {
    bottom: 80,
    left: 20,
  },
  bottomRightMarker: {
    bottom: 80,
    right: 20,
  },
  centerMarker: {
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
});

export default GreenScreen;