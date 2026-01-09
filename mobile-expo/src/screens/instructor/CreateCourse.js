import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import CourseService from '../../services/CourseService';

const CreateCourse = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title || !description) {
            Alert.alert('Hata', 'Lütfen başlık ve açıklama alanlarını doldurun.');
            return;
        }

        setLoading(true);
        const result = await CourseService.createCourse({
            title,
            description,
            category: category || 'Genel',
        });
        setLoading(false);

        if (result.success) {
            Alert.alert('Başarılı', 'Kurs başarıyla oluşturuldu.', [
                {
                    text: 'Tamam',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } else {
            Alert.alert('Hata', result.error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.form}>
                    <Text style={styles.label}>Kurs Başlığı *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Örn: React Native Eğitimi"
                        value={title}
                        onChangeText={setTitle}
                        editable={!loading}
                        accessible={true}
                        accessibilityLabel="Kurs başlığı"
                        accessibilityHint="Kurs için bir başlık girin"
                    />

                    <Text style={styles.label}>Açıklama *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Kurs hakkında detaylı açıklama..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        editable={!loading}
                        accessible={true}
                        accessibilityLabel="Kurs açıklaması"
                        accessibilityHint="Kursun detaylı açıklamasını girin"
                    />

                    <Text style={styles.label}>Kategori</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Örn: Programlama, Tasarım"
                        value={category}
                        onChangeText={setCategory}
                        editable={!loading}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={"Kurs oluştur"}
                        accessibilityHint="Girdiğiniz bilgilerle yeni kurs oluşturur"
                        accessibilityState={{ disabled: loading }}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Kurs Oluştur</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
    },
    form: {
        padding: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 120,
        paddingTop: 12,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonDisabled: {
        backgroundColor: '#999',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CreateCourse;
