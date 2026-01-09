import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Modal,
    TextInput,
} from 'react-native';
import AdminService from '../../services/AdminService';
import CourseService from '../../services/CourseService';

const AdminCourses = ({ navigation }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [assignModalVisible, setAssignModalVisible] = useState(false);
    const [newCourse, setNewCourse] = useState({ title: '', description: '', category: '' });
    const [createdCourseId, setCreatedCourseId] = useState(null);
    const [instructors, setInstructors] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCourses();
        loadInstructors();
    }, []);

    const loadCourses = async () => {
        setLoading(true);
        const result = await AdminService.getAllCourses();
        setLoading(false);

        if (result.success) {
            const coursesData = result.data.courses || result.data;
            setCourses(coursesData);
        } else {
            Alert.alert('Hata', result.error);
        }
    };

    const loadInstructors = async () => {
        const result = await AdminService.getAllUsers();
        if (result.success) {
            const usersData = result.data.users || result.data;
            const instructorList = usersData.filter(u => u.role === 'INSTRUCTOR');
            setInstructors(instructorList);
        }
    };

    const handleCreateCourse = async () => {
        if (!newCourse.title.trim()) {
            Alert.alert('Hata', 'Lütfen kurs başlığı girin');
            return;
        }

        setSaving(true);
        const result = await CourseService.createCourse({
            title: newCourse.title,
            description: newCourse.description,
            category: newCourse.category || 'Genel',
        });
        setSaving(false);

        if (result.success) {
            setCreatedCourseId(result.data.course?.id || result.data.id);
            setCreateModalVisible(false);
            setNewCourse({ title: '', description: '', category: '' });

            // Show assign instructor modal
            if (instructors.length > 0) {
                setAssignModalVisible(true);
            } else {
                Alert.alert('Başarılı', 'Kurs oluşturuldu');
                loadCourses();
            }
        } else {
            Alert.alert('Hata', result.error);
        }
    };

    const handleAssignInstructor = async (instructorId) => {
        if (!createdCourseId) return;

        setSaving(true);
        const result = await CourseService.updateCourse(createdCourseId, {
            instructorId: instructorId,
        });
        setSaving(false);

        setAssignModalVisible(false);
        setCreatedCourseId(null);

        if (result.success) {
            Alert.alert('Başarılı', 'Kurs oluşturuldu ve eğitmen atandı');
            loadCourses();
        } else {
            Alert.alert('Uyarı', 'Kurs oluşturuldu ama eğitmen atanamadı');
            loadCourses();
        }
    };

    const skipAssignment = () => {
        setAssignModalVisible(false);
        setCreatedCourseId(null);
        Alert.alert('Başarılı', 'Kurs oluşturuldu');
        loadCourses();
    };

    const renderCourse = ({ item }) => (
        <View style={styles.courseCard}>
            <Text style={styles.courseTitle}>{item.title}</Text>
            <Text style={styles.courseDescription} numberOfLines={2}>
                {item.description}
            </Text>
            <View style={styles.courseFooter}>
                <Text style={styles.instructorName}>
                    Eğitmen: {item.instructor?.fullName || item.instructor?.username || 'Belirtilmemiş'}
                </Text>
                <Text style={styles.enrollmentCount}>
                    👥 {item._count?.enrollments || 0}
                </Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={courses}
                renderItem={renderCourse}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Kurs bulunamadı.</Text>
                    </View>
                }
                refreshing={loading}
                onRefresh={loadCourses}
            />

            {/* Create Course FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setCreateModalVisible(true)}
                accessibilityLabel="Yeni kurs oluştur"
                accessibilityRole="button"
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Create Course Modal */}
            <Modal
                visible={createModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Yeni Kurs Oluştur</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Kurs Başlığı *"
                            value={newCourse.title}
                            onChangeText={(text) => setNewCourse({ ...newCourse, title: text })}
                        />

                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Açıklama"
                            value={newCourse.description}
                            onChangeText={(text) => setNewCourse({ ...newCourse, description: text })}
                            multiline
                            numberOfLines={4}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Kategori"
                            value={newCourse.category}
                            onChangeText={(text) => setNewCourse({ ...newCourse, category: text })}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setCreateModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleCreateCourse}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={[styles.buttonText, { color: '#fff' }]}>Oluştur</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Assign Instructor Modal */}
            <Modal
                visible={assignModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={skipAssignment}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Eğitmen Ata</Text>
                        <Text style={styles.modalSubtitle}>Bu kursu hangi eğitmene atamak istersiniz?</Text>

                        <FlatList
                            data={instructors}
                            keyExtractor={(item) => item.id}
                            style={styles.instructorList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.instructorItem}
                                    onPress={() => handleAssignInstructor(item.id)}
                                >
                                    <Text style={styles.instructorItemName}>
                                        {item.fullName || item.username}
                                    </Text>
                                    <Text style={styles.instructorItemEmail}>{item.email}</Text>
                                </TouchableOpacity>
                            )}
                        />

                        <TouchableOpacity
                            style={[styles.modalButton, styles.skipButton]}
                            onPress={skipAssignment}
                        >
                            <Text style={styles.buttonText}>Şimdi Atla</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
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
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    courseCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    courseTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    courseDescription: {
        fontSize: 13,
        color: '#666',
        marginBottom: 12,
    },
    courseFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    instructorName: {
        fontSize: 13,
        color: '#007AFF',
    },
    enrollmentCount: {
        fontSize: 13,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    fabText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: '300',
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
        width: '90%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 12,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    saveButton: {
        backgroundColor: '#007AFF',
    },
    skipButton: {
        backgroundColor: '#f0f0f0',
        marginTop: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    instructorList: {
        maxHeight: 300,
        marginBottom: 12,
    },
    instructorItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    instructorItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    instructorItemEmail: {
        fontSize: 13,
        color: '#666',
    },
});

export default AdminCourses;
