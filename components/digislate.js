import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DigitalSlate = ({ navigation }) => {
  // States to handle inputs
  const [filmTitle, setFilmTitle] = useState('');
  const [filmDirector, setFilmDirector] = useState('');
  const [dop, setDop] = useState('');
  const [date, setDate] = useState('');
  const [fps, setFps] = useState('');
  const [camera, setCamera] = useState('');
  const [slate, setSlate] = useState('');
  const [scene, setScene] = useState('001');
  const [take, setTake] = useState('A');
  const [intExt, setIntExt] = useState('');
  const [dayNight, setDayNight] = useState('');
  const [mosSync, setMosSync] = useState('');
  const [timer, setTimer] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000); // Update every second
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartStop = () => {
    setIsRecording(prevState => {
      if (prevState) {
        setTimer(0); // Clear timer if stopping
      }
      return !prevState;
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainerWide}>
          {/* Wider Container for Film Info */}
          <View style={styles.wideRow}>
            <View style={styles.fieldContainerWide}>
              <Text style={styles.fieldLabel}>Film Title</Text>
              <TextInput
                style={styles.inputWide}
                value={filmTitle}
                onChangeText={setFilmTitle}
                placeholder="Film Title"
              />
            </View>

            <View style={styles.fieldContainerWide}>
              <Text style={styles.fieldLabel}>Director</Text>
              <TextInput
                style={styles.inputWide}
                value={filmDirector}
                onChangeText={setFilmDirector}
                placeholder="Film Director"
              />
            </View>
          </View>
        </View>

        <View style={styles.formContainer}>
          {/* Row 2 */}
          <View style={styles.row}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Date</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="Date"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>FPS</Text>
              <TextInput
                style={styles.input}
                value={fps}
                onChangeText={setFps}
                placeholder="FPS"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Camera</Text>
              <TextInput
                style={styles.input}
                value={camera}
                onChangeText={setCamera}
                placeholder="Camera"
              />
            </View>
          </View>

          {/* Row 3 */}
          <View style={styles.row}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Cam</Text>
              <TextInput
                style={styles.input}
                value={slate}
                onChangeText={setSlate}
                placeholder="Cam"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Scene</Text>
              <TextInput
                style={styles.input}
                value={scene}
                onChangeText={setScene}
                placeholder="Scene"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Take</Text>
              <TextInput
                style={styles.input}
                value={take}
                onChangeText={setTake}
                placeholder="Take"
              />
            </View>
          </View>

          {/* Row 4 */}
          <View style={styles.row}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>INT/EXT</Text>
              <TextInput
                style={styles.input}
                value={intExt}
                onChangeText={setIntExt}
                placeholder="INT or EXT"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>DAY/NIGHT</Text>
              <TextInput
                style={styles.input}
                value={dayNight}
                onChangeText={setDayNight}
                placeholder="DAY or NIGHT"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>MOS/SYNC</Text>
              <TextInput
                style={styles.input}
                value={mosSync}
                onChangeText={setMosSync}
                placeholder="MOS or SYNC"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Timer */}
      <Text style={styles.timer}>{formatTime(timer)}</Text>

      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        <Ionicons 
          name={isRecording ? 'stop-circle' : 'play-circle'} 
          size={64} 
          color="#ffcc00" 
          onPress={handleStartStop} 
        />
      </View>

      {/* Home Icon Button */}
      <View style={styles.buttonContainer}>
        <Ionicons 
          name="home" 
          size={40} 
          color="#ffcc00" 
          onPress={() => navigation.navigate('Home')} 
        />
      </View>
    </View>
  );
};

// Helper function to format the timer
const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-around',
    paddingVertical: 30,
  },
  formContainerWide: {
    marginBottom: 40, // Bigger space under the wider container
  },
  wideRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  formContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  fieldContainerWide: {
    alignItems: 'center',
    width: '45%', // Wider width for film title, director, and DOP
    marginVertical: 10,
    transform: [{ rotate: '90deg' }],
    right: 15,
  },
  fieldContainer: {
    alignItems: 'center',
    width: '45%', // Wider width for film title, director, and DOP
    marginVertical: 10,
    transform: [{ rotate: '90deg' }],
  },
  fieldLabel: {
    color: 'white',
    marginBottom: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    color: 'black',
    fontSize: 18,
    padding: 10,
    width: '100%',
    borderRadius: 8,
    textAlign: 'center',
  },
  inputWide: {
    backgroundColor: 'white',
    color: 'black',
    fontSize: 18,
    padding: 12,
    width: '100%',
    borderRadius: 8,
    textAlign: 'center',
  },
  timer: {
    fontSize: 48,
    color: '#ffcc00',
    marginBottom: 40,
    textAlign: 'center',
    transform: [{ rotate: '90deg' }],
    top: 79,
    right: -55,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '70%',
    alignSelf: 'center',
    marginTop: 30,
    transform: [{ rotate: '90deg' }],
    top: -100,
    left: -120,
  },
});

export default DigitalSlate;