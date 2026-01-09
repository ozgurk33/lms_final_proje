import React, { useState, useEffect } from 'react';
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

const EditCourse = ({ route, navigation }) => {
    const { courseId } = route.params;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCourse();
    }, []);

    const loadCourse = async () => {
        setLoading(true);
        const result = await CourseService.getCourseDetails(courseId);
        setLoading(false);

        if (result.success) {
            const course = result.data;
            setTitle(course.title);
            setDescription(course.description || '');
            setCategory(course.category || '');
        } else {
            Alert.alert('Hata', result.error);
        }
    };

    const handleSubmit = async () => {
        if (!title || !description) {
            Alert.alert('Hata', 'Lütfen başlık ve açıklama alanlarını doldurun.');
            return;
        }

        setSaving(true);
        const result = await CourseService.updateCourse(courseId, {
            title,
            description,
            category: category || 'Genel',
        });
        setSaving(false);

        if (result.success) {
            Alert.alert('Başarılı', 'Kurs başarıyla güncellendi.', [
                {
                    text: 'Tamam',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } else {
            Alert.alert('Hata', result.error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

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
                        editable={!saving}
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
                        editable={!saving}
                    />

                    <Text style={styles.label}>Kategori</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Örn: Programlama, Tasarım"
                        value={category}
                        onChangeText={setCategory}
                        editable={!saving}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, saving && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={saving}>
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Değişiklikleri Kaydet</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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

export default EditCourse;
