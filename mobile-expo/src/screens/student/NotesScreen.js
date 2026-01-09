import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import notesService from '../../services/notesService';

const NotesScreen = ({ route, navigation }) => {
    const { moduleId, moduleTitle } = route.params;
    const { theme } = useTheme();

    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const result = await notesService.getNotes(moduleId);
            if (result.success) {
                setNotes(result.data.notes || []);
            }
        } catch (error) {
            console.error('Fetch notes error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = () => {
        setEditingNote(null);
        setNoteTitle('');
        setNoteContent('');
        setModalVisible(true);
    };

    const handleEditNote = (note) => {
        setEditingNote(note);
        setNoteTitle(note.title || '');
        setNoteContent(note.content);
        setModalVisible(true);
    };

    const handleSaveNote = async () => {
        if (!noteContent.trim()) {
            Alert.alert('Hata', 'Not içeriği boş olamaz');
            return;
        }

        try {
            let result;
            if (editingNote) {
                result = await notesService.updateNote(editingNote.id, noteTitle, noteContent);
            } else {
                result = await notesService.createNote(moduleId, noteTitle, noteContent);
            }

            if (result.success) {
                setModalVisible(false);
                fetchNotes();
            } else {
                Alert.alert('Hata', result.error);
            }
        } catch (error) {
            Alert.alert('Hata', 'Not kaydedilemedi');
        }
    };

    const handleDeleteNote = (note) => {
        Alert.alert(
            'Notu Sil',
            'Bu notu silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await notesService.deleteNote(note.id);
                        if (result.success) {
                            fetchNotes();
                        } else {
                            Alert.alert('Hata', result.error);
                        }
                    },
                },
            ]
        );
    };

    const renderNote = ({ item }) => (
        <View style={[styles.noteCard, { backgroundColor: theme.colors.card }]}>
            {item.title && (
                <Text style={[styles.noteTitle, { color: theme.colors.text }]}>
                    {item.title}
                </Text>
            )}
            <Text style={[styles.noteContent, { color: theme.colors.text }]}>
                {item.content}
            </Text>
            <Text style={styles.noteDate}>
                {new Date(item.createdAt).toLocaleDateString('tr-TR')}
            </Text>
            <View style={styles.noteActions}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditNote(item)}
                >
                    <Text style={styles.editButtonText}>✏️ Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteNote(item)}
                >
                    <Text style={styles.deleteButtonText}>🗑️ Sil</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={[styles.backText, { color: theme.colors.primary }]}>← Geri</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    Notlarım
                </Text>
            </View>

            {/* Module Title */}
            <View style={styles.moduleTitleContainer}>
                <Text style={[styles.moduleTitle, { color: theme.colors.text }]}>
                    {moduleTitle}
                </Text>
            </View>

            {/* Notes List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={notes}
                    renderItem={renderNote}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Henüz not eklenmemiş</Text>
                        </View>
                    }
                />
            )}

            {/* Add Note Button */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddNote}
            >
                <Text style={styles.fabText}>+ Yeni Not</Text>
            </TouchableOpacity>

            {/* Add/Edit Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                            {editingNote ? 'Notu Düzenle' : 'Yeni Not'}
                        </Text>

                        <TextInput
                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="Başlık (opsiyonel)"
                            placeholderTextColor="#999"
                            value={noteTitle}
                            onChangeText={setNoteTitle}
                        />

                        <TextInput
                            style={[styles.textarea, { color: theme.colors.text, borderColor: theme.colors.border }]}
                            placeholder="Not içeriği"
                            placeholderTextColor="#999"
                            value={noteContent}
                            onChangeText={setNoteContent}
                            multiline
                            numberOfLines={6}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.colors.primary }]}
                                onPress={handleSaveNote}
                            >
                                <Text style={styles.saveButtonText}>Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        marginRight: 12,
    },
    backText: {
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
    },
    moduleTitleContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    moduleTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    noteCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    noteTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    noteContent: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    noteDate: {
        fontSize: 12,
        color: '#999',
        marginBottom: 12,
    },
    noteActions: {
        flexDirection: 'row',
        gap: 12,
    },
    editButton: {
        flex: 1,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#E3F2FD',
        alignItems: 'center',
    },
    editButtonText: {
        color: '#1976D2',
        fontSize: 14,
        fontWeight: '600',
    },
    deleteButton: {
        flex: 1,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#FFEBEE',
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#D32F2F',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    fabText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '90%',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 14,
    },
    textarea: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 14,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        // backgroundColor from theme
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default NotesScreen;
