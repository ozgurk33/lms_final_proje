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
    Modal,
} from 'react-native';
import CourseService from '../../services/CourseService';
import api from '../../utils/api';

const EditCourse = ({ route, navigation }) => {
    const { courseId } = route.params;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [modules, setModules] = useState([]);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Module editing modal state
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [editField, setEditField] = useState(''); // 'title', 'content', 'videoUrl'
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        loadCourse();
    }, []);

    const loadCourse = async () => {
        setLoading(true);
        const result = await CourseService.getCourseDetails(courseId);
        setLoading(false);

        if (result.success) {
            const course = result.data.course || result.data;
            setTitle(course.title);
            setDescription(course.description || '');
            setCategory(course.category || '');
            setModules(course.modules || []);

            // Get enrolled students
            const students = (course.enrollments || []).map(enrollment => ({
                id: enrollment.id,
                name: enrollment.user?.fullName || enrollment.user?.username || 'Öğrenci',
                email: enrollment.user?.email || '',
                enrolledAt: enrollment.enrolledAt,
            }));
            setEnrolledStudents(students);
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
            Alert.alert('Başarılı', 'Kurs başarıyla güncellendi.');
        } else {
            Alert.alert('Hata', result.error);
        }
    };

    const handleEditModule = (module) => {
        Alert.alert(
            'Modül Düzenle',
            `${module.title}`,
            [
                {
                    text: 'Başlığı Değiştir',
                    onPress: () => openEditModal(module, 'title', module.title)
                },
                {
                    text: 'İçeriği Değiştir',
                    onPress: () => openEditModal(module, 'content', module.content?.replace(/<[^>]*>/g, '') || '')
                },
                {
                    text: 'Video URL Değiştir',
                    onPress: () => openEditModal(module, 'videoUrl', module.videoUrl || '')
                },
                { text: 'İptal', style: 'cancel' }
            ]
        );
    };

    const openEditModal = (module, field, currentValue) => {
        setEditingModule(module);
        setEditField(field);
        setEditValue(currentValue);
        setEditModalVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editingModule) return;

        const updates = {};
        if (editField === 'title' && editValue.trim()) {
            updates.title = editValue.trim();
        } else if (editField === 'content') {
            updates.content = editValue;
        } else if (editField === 'videoUrl') {
            updates.videoUrl = editValue || null;
        }

        setEditModalVisible(false);
        await updateModule(editingModule.id, updates);
    };

    const updateModule = async (moduleId, updates) => {
        try {
            const response = await api.put(`/api/courses/${courseId}/modules/${moduleId}`, updates);
            if (response.data) {
                Alert.alert('Başarılı', 'Modül güncellendi');
                loadCourse(); // Reload to show changes
            }
        } catch (error) {
            console.error('Update module error:', error);
            Alert.alert('Hata', 'Modül güncellenemedi');
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
                    <Text style={styles.sectionHeader}>📝 Kurs Bilgileri</Text>

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

                    {/* Modules Section */}
                    <Text style={[styles.sectionHeader, { marginTop: 32 }]}>📚 Modüller ({modules.length})</Text>
                    {modules.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>Henüz modül eklenmemiş</Text>
                            <Text style={styles.emptySubtext}>Web veya Desktop uygulamasından modül ekleyebilirsiniz</Text>
                        </View>
                    ) : (
                        modules.map((module, index) => (
                            <TouchableOpacity
                                key={module.id}
                                style={styles.moduleCard}
                                onPress={() => handleEditModule(module)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.moduleTitle}>
                                    {index + 1}. {module.title}
                                </Text>
                                {module.content && (
                                    <Text style={styles.moduleContent} numberOfLines={2}>
                                        {module.content.replace(/<[^>]*>/g, '')}
                                    </Text>
                                )}
                                {module.videoUrl && (
                                    <Text style={styles.moduleBadge}>📹 Video mevcut</Text>
                                )}
                                <Text style={styles.editHint}>✏️ Düzenlemek için dokunun</Text>
                            </TouchableOpacity>
                        ))
                    )}

                    {/* Enrolled Students Section */}
                    <Text style={[styles.sectionHeader, { marginTop: 32 }]}>👥 Kayıtlı Öğrenciler ({enrolledStudents.length})</Text>
                    {enrolledStudents.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>Henüz kayıtlı öğrenci yok</Text>
                        </View>
                    ) : (
                        enrolledStudents.map((student) => (
                            <View key={student.id} style={styles.studentCard}>
                                <View style={styles.studentAvatar}>
                                    <Text style={styles.studentAvatarText}>
                                        {student.name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName}>{student.name}</Text>
                                    {student.email && (
                                        <Text style={styles.studentEmail}>{student.email}</Text>
                                    )}
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Edit Module Modal */}
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editField === 'title' ? 'Modül Başlığı' :
                                editField === 'content' ? 'Modül İçeriği' : 'Video URL'}
                        </Text>
                        <TextInput
                            style={[styles.modalInput, editField === 'content' && styles.modalTextArea]}
                            value={editValue}
                            onChangeText={setEditValue}
                            placeholder={
                                editField === 'title' ? 'Yeni başlık girin' :
                                    editField === 'content' ? 'Yeni içerik girin' : 'YouTube veya video URL'
                            }
                            multiline={editField === 'content'}
                            numberOfLines={editField === 'content' ? 5 : 1}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSave]}
                                onPress={handleSaveEdit}
                            >
                                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    moduleCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    moduleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    moduleContent: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    moduleBadge: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '500',
    },
    editHint: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
        fontStyle: 'italic',
    },
    studentCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    studentAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    studentAvatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    studentEmail: {
        fontSize: 13,
        color: '#666',
    },
    emptyBox: {
        backgroundColor: '#f9f9f9',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 13,
        color: '#999',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    modalInput: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    modalTextArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#f0f0f0',
    },
    modalButtonSave: {
        backgroundColor: '#007AFF',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
});

export default EditCourse;
