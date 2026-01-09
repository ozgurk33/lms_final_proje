'use client';

import { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    TextField,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider
} from '@mui/material';
import {
    Save as SaveIcon,
    FolderOpen as OpenIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import useElectron from '@/hooks/useElectron';

export default function FileSystemPage() {
    const { isElectron, isOffline, electronAPI } = useElectron();
    const [username, setUsername] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [recentFiles, setRecentFiles] = useState([]);

    // Save file
    const handleSaveFile = async () => {
        if (!isElectron) {
            setMessage({ type: 'error', text: 'Bu özellik sadece Desktop uygulamasında çalışır!' });
            return;
        }

        if (isOffline) {
            setMessage({ type: 'error', text: 'Offline modda dosya kaydedemezsiniz!' });
            return;
        }

        if (!username.trim()) {
            setMessage({ type: 'error', text: 'Lütfen kullanıcı adı girin!' });
            return;
        }

        try {
            const result = await electronAPI.saveFile({
                defaultName: `${username}.txt`,
                content: `Kullanıcı Adı: ${username}\nTarih: ${new Date().toLocaleString('tr-TR')}`,
                filters: [
                    { name: 'Text Dosyaları', extensions: ['txt'] },
                    { name: 'Tüm Dosyalar', extensions: ['*'] }
                ]
            });

            if (result.success) {
                setMessage({ type: 'success', text: `Dosya kaydedildi: ${result.filePath}` });

                // Add to recent files
                const recent = await electronAPI.storeGet('recentFiles') || [];
                recent.unshift({
                    path: result.filePath,
                    name: `${username}.txt`,
                    date: new Date().toISOString()
                });
                await electronAPI.storeSet('recentFiles', recent.slice(0, 10));
                loadRecentFiles();
            } else {
                setMessage({ type: 'error', text: result.error || 'Dosya kaydedilemedi' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    // Open file
    const handleOpenFile = async () => {
        if (!isElectron) {
            setMessage({ type: 'error', text: 'Bu özellik sadece Desktop uygulamasında çalışır!' });
            return;
        }

        if (isOffline) {
            setMessage({ type: 'error', text: 'Offline modda dosya açamazsınız!' });
            return;
        }

        try {
            const result = await electronAPI.readFile();

            if (result.success) {
                setFileContent(result.content);
                setMessage({ type: 'success', text: `Dosya açıldı: ${result.filePath}` });
            } else {
                setMessage({ type: 'error', text: result.error || 'Dosya açılamadı' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    // Load recent files
    const loadRecentFiles = async () => {
        if (isElectron) {
            const recent = await electronAPI.storeGet('recentFiles') || [];
            setRecentFiles(recent);
        }
    };

    // Delete recent file record
    const handleDeleteRecent = async (index) => {
        const recent = [...recentFiles];
        recent.splice(index, 1);
        await electronAPI.storeSet('recentFiles', recent);
        setRecentFiles(recent);
    };

    // Load recent files on mount
    useState(() => {
        loadRecentFiles();
    }, [isElectron]);

    if (!isElectron) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="info">
                    Bu sayfa sadece Desktop uygulamasında çalışır. Desktop uygulamasını indirin ve deneyin!
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                📁 Dosya Sistemi Demo
            </Typography>

            {message.text && (
                <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
                    {message.text}
                </Alert>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Dosya Kaydet
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Kullanıcı adınızı girin ve .txt dosyası olarak kaydedin
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <TextField
                        fullWidth
                        label="Kullanıcı Adı"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Örn: AhmetYilmaz"
                        disabled={isOffline}
                    />
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveFile}
                        disabled={isOffline}
                    >
                        Kaydet
                    </Button>
                </Box>

                {isOffline && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        ⚠️ Offline modda dosya işlemleri yapılamaz!
                    </Alert>
                )}
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Dosya Aç
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Bilgisayarınızdan bir .txt dosyası seçin ve içeriğini görüntüleyin
                </Typography>

                <Button
                    variant="outlined"
                    startIcon={<OpenIcon />}
                    onClick={handleOpenFile}
                    sx={{ mt: 2 }}
                    disabled={isOffline}
                >
                    Dosya Aç
                </Button>

                {fileContent && (
                    <Paper
                        sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: 'grey.100',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            Dosya İçeriği:
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            {fileContent}
                        </Typography>
                    </Paper>
                )}
            </Paper>

            {recentFiles.length > 0 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Son Kaydedilen Dosyalar
                    </Typography>
                    <List>
                        {recentFiles.map((file, index) => (
                            <div key={index}>
                                <ListItem>
                                    <ListItemText
                                        primary={file.name}
                                        secondary={`${file.path} • ${new Date(file.date).toLocaleString('tr-TR')}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton edge="end" onClick={() => handleDeleteRecent(index)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < recentFiles.length - 1 && <Divider />}
                            </div>
                        ))}
                    </List>
                </Paper>
            )}
        </Container>
    );
}
