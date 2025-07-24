
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, StatusBar } from 'react-native';
import { supabase } from '../../supabaseClient';
import NetInfo from '@react-native-community/netinfo';
import { storePendingIncident } from '../../services/OfflineSyncService';
import { theme } from '../../theme';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

const ReportIncidentScreen = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('Low');
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri) => {
        setUploading(true);
        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                resolve(xhr.response);
            };
            xhr.onerror = function () {
                reject(new TypeError('Network request failed'));
            };
            xhr.responseType = 'blob';
            xhr.open('GET', uri, true);
            xhr.send(null);
        });

        const fileName = `public/${Date.now()}.jpg`;
        const { data, error } = await supabase.storage.from('incident-photos').upload(fileName, blob);

        if (error) {
            Alert.alert('Error uploading image', error.message);
            setUploading(false);
            return null;
        }

        const { data: publicUrlData } = supabase.storage.from('incident-photos').getPublicUrl(fileName);
        setUploading(false);
        return publicUrlData.publicUrl;
    };

    const handleSubmit = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            Alert.alert('Error', 'You must be logged in to report an incident.');
            return;
        }

        let photoUrl = null;
        if (image) {
            photoUrl = await uploadImage(image);
            if (!photoUrl) return;
        }

        // For now, we'll hardcode job_id and client_id. In a real scenario, these would come from context (e.g., the active job).
        // You'll need to implement logic to determine the current job and its client.
        const dummyJobId = 1; // Replace with actual job ID
        const dummyClientId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Replace with actual client ID

        const incidentData = {
            job_id: dummyJobId,
            guard_id: user.id,
            client_id: dummyClientId,
            title: title,
            description: description,
            severity: severity,
            photo_url: photoUrl,
            created_at: new Date().toISOString(),
        };

        const state = await NetInfo.fetch();

        if (state.isConnected) {
            const { error } = await supabase.from('incidents').insert([incidentData]);
            if (error) {
                Alert.alert('Error', error.message);
            } else {
                Alert.alert('Success', 'Incident reported successfully.');
                navigation.goBack();
            }
        } else {
            await storePendingIncident(incidentData);
            Alert.alert('Offline', 'Incident stored offline and will be synced when online.');
            navigation.goBack();
        }
    };

    return (
        <>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Report New Incident</Text>

                <Text style={styles.label}>Incident Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., Unauthorized Entry, Medical Emergency"
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Provide details about the incident..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                />

                <Text style={styles.label}>Severity</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={severity}
                        onValueChange={(itemValue) => setSeverity(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Low" value="Low" />
                        <Picker.Item label="Medium" value="Medium" />
                        <Picker.Item label="High" value="High" />
                    </Picker>
                </View>

                <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                    <Text style={styles.imagePickerButtonText}>Pick an image</Text>
                </TouchableOpacity>
                {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={uploading}>
                    <Text style={styles.submitButtonText}>{uploading ? 'Uploading...' : 'Submit Incident Report'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#222',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#64748b',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        color: '#222',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#64748b',
        borderRadius: 5,
        marginBottom: 10,
    },
    picker: {
        height: 50,
        width: '100%',
    },
    imagePickerButton: {
        backgroundColor: '#f59e42',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    imagePickerButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 5,
        marginTop: 15,
        resizeMode: 'cover',
    },
    submitButton: {
        backgroundColor: '#2563eb',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 50,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ReportIncidentScreen;
