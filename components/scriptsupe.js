import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Pdf from 'react-native-pdf';

const ScriptSupervisor = () => {
  const [pdfUri, setPdfUri] = useState(null);
  const [notes, setNotes] = useState('');

  const handlePdfUpload = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });
      setPdfUri(res.uri); // Set the uploaded PDF URI
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        Alert.alert('User canceled the picker');
      } else {
        Alert.alert('Error', 'Something went wrong while picking the file');
      }
    }
  };

  const handleSaveNotes = () => {
    // You can save the notes here, for example, send to backend or local storage
    Alert.alert('Notes Saved', notes);
    setNotes(''); // Clear the notes input after saving
  };

  return (
    <View style={styles.container}>
      {/* PDF Viewer on the left side */}
      <View style={styles.pdfContainer}>
        {pdfUri ? (
          <Pdf
            source={{ uri: pdfUri, cache: true }}
            style={{ flex: 1 }}
            renderActivityIndicator={() => <Text>Loading PDF...</Text>}
          />
        ) : (
          <Button title="Upload PDF" onPress={handlePdfUpload} />
        )}
      </View>

      {/* Notes Input on the right side */}
      <View style={styles.notesContainer}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={styles.textInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add your notes here..."
          multiline
          numberOfLines={10}
        />
        <Button title="Save Notes" onPress={handleSaveNotes} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', // Horizontally split screen
    flex: 1,
    padding: 10,
  },
  pdfContainer: {
    flex: 1, // Take up half of the screen
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'white',
  },
  notesContainer: {
    flex: 1, // Take up the other half of the screen
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'white',
    padding: 10,
  },
  label: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: 'white',
    color: 'black',
    fontSize: 16,
    height: 200,
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
});

export default ScriptSupervisor;