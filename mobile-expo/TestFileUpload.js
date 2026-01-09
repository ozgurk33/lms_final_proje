import React, { useState } from 'react';
import { View, Button, Text, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function TestFileUpload() {
    const [image, setImage] = useState(null);
    const [result, setResult] = useState('');

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            console.log('Image picked:', result.assets[0].uri);
        }
    };

    const testUpload = async () => {
        if (!image) {
            Alert.alert('Error', 'Please select an image first');
            return;
        }

        console.log('🧪 TESTING FILE UPLOAD');
        console.log('Image URI:', image);

        try {
            const formData = new FormData();

            // Method 1: Standard way
            formData.append('frame', {
                uri: image,
                type: 'image/jpeg',
                name: 'test.jpg'
            });

            console.log('Sending to: http://192.168.1.5:3000/api/omr/process-frame-live');

            const response = await axios.post(
                'http://192.168.1.5:3000/api/omr/process-frame-live',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 30000,
                }
            );

            console.log('✅ SUCCESS:', response.data);
            setResult(JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.error('❌ ERROR:', error);
            console.error('Error message:', error.message);
            console.error('Error response:', error.response?.data);
            setResult(`ERROR: ${error.message}`);
        }
    };

    return (
        <View style={{ padding: 20, marginTop: 50 }}>
            <Text style={{ fontSize: 20, marginBottom: 20 }}>File Upload Test</Text>

            <Button title="Pick Image" onPress={pickImage} />

            {image && (
                <Image
                    source={{ uri: image }}
                    style={{ width: 200, height: 200, marginVertical: 20 }}
                />
            )}

            <Button title="Test Upload" onPress={testUpload} />

            <Text style={{ marginTop: 20, fontSize: 12 }}>{result}</Text>
        </View>
    );
}
