import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

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
  const [notes, setNotes] = useState('');
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
    setIsRecording(!isRecording);
  };

  const handleClear = () => {
    setTimer(0);
    setIsRecording(false);
  };

  return (
    <View style={styles.container}>

      <View style={styles.formContainer}>

        {/* Film Information */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Film Title</Text>
          <TextInput
            style={styles.input}
            value={filmTitle}
            onChangeText={setFilmTitle}
            placeholder="Film Title"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Director</Text>
          <TextInput
            style={styles.input}
            value={filmDirector}
            onChangeText={setFilmDirector}
            placeholder="Film Director"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Director of Photography</Text>
          <TextInput
            style={styles.input}
            value={dop}
            onChangeText={setDop}
            placeholder="Director of Photography"
          />
        </View>

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

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Slate</Text>
          <TextInput
            style={styles.input}
            value={slate}
            onChangeText={setSlate}
            placeholder="Slate"
          />
        </View>

        {/* Scene and Take */}
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

        {/* Notes */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes"
          />
        </View>

        {/* INT/EXT, DAY/NIGHT, MOS/SYNC */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>INT/EXT</Text>
          <Picker
            selectedValue={intExt}
            style={styles.picker}
            onValueChange={setIntExt}>
            <Picker.Item label="INT" value="INT" />
            <Picker.Item label="EXT" value="EXT" />
          </Picker>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>DAY/NIGHT</Text>
          <Picker
            selectedValue={dayNight}
            style={styles.picker}
            onValueChange={setDayNight}>
            <Picker.Item label="DAY" value="DAY" />
            <Picker.Item label="NIGHT" value="NIGHT" />
          </Picker>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>MOS/SYNC</Text>
          <Picker
            selectedValue={mosSync}
            style={styles.picker}
            onValueChange={setMosSync}>
            <Picker.Item label="MOS" value="MOS" />
            <Picker.Item label="SYNC" value="SYNC" />
          </Picker>
        </View>

      </View>

      {/* Timer */}
      <Text style={styles.timer}>{formatTime(timer)}</Text>

      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        <Button title={isRecording ? 'Stop' : 'Start'} onPress={handleStartStop} />
        <Button title="Clear" onPress={handleClear} />
      </View>

      {/* Back to Home Button */}
      <Button title="Back to Home" onPress={() => navigation.navigate('Home')} />
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
  formContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    marginBottom: 20,
    transform: [{ rotate: '90deg' }],
  },
  fieldContainer: {
    alignItems: 'center',
    marginVertical: 5,
    width: '45%', // Adjust width to fit horizontally
  },
  fieldLabel: {
    color: 'white',
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
    backgroundColor: 'white',
    color: 'black',
    fontSize: 16,
    padding: 10,
    width: '100%',
    borderRadius: 5,
    textAlign: 'center',
  },
  picker: {
    height: 40,
    width: '100%',
    backgroundColor: 'white',
  },
  timer: {
    fontSize: 40,
    color: '#ffcc00',
    marginBottom: 20,
    textAlign: 'center',
    transform: [{ rotate: '90deg' }],
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
  },
});

export default DigitalSlate;