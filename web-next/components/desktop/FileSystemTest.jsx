'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Paper,
    Alert,
    Grid,
    Divider
} from '@mui/material';
import {
    Save,
    FolderOpen,
    Storage,
    Delete
} from '@mui/icons-material';

export default function FileSystemTest() {
    const [testData, setTestData] = useState('Test data for storage');
    const [storedData, setStoredData] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [alert, setAlert] = useState(null);

    const showAlert = (severity, message) => {
        setAlert({ severity, message });
        setTimeout(() => setAlert(null), 5000);
    };

    // File Save
    const handleSaveFile = async () => {
        try {
            const result = await window.electronAPI.saveFile({
                defaultName: 'test-file.txt',
                content: 'This is a test file created from Desktop App!\\n\\nTimestamp: ' + new Date().toISOString(),
                filters: [
                    { name: 'Text Files', extensions: ['txt'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (result.success) {
                showAlert('success', `File saved: ${result.filePath}`);
            } else {
                showAlert('error', result.error);
            }
        } catch (error) {
            showAlert('error', error.message);
        }
    };

    // File Read
    const handleReadFile = async () => {
        try {
            const result = await window.electronAPI.readFile();

            if (result.success) {
                setFileContent(result.content);
                showAlert('success', `File loaded: ${result.filePath}`);
            } else {
                showAlert('error', result.error);
            }
        } catch (error) {
            showAlert('error', error.message);
        }
    };

    // Storage Save
    const handleSaveToStore = async () => {
        try {
            await window.electronAPI.storeSet('testData', testData);
            showAlert('success', 'Data saved to persistent storage');
        } catch (error) {
            showAlert('error', error.message);
        }
    };

    // Storage Load
    const handleLoadFromStore = async () => {
        try {
            const data = await window.electronAPI.storeGet('testData');
            setStoredData(data || 'No data found');
            showAlert('success', 'Data loaded from storage');
        } catch (error) {
            showAlert('error', error.message);
        }
    };

    // Storage Clear
    const handleClearStore = async () => {
        try {
            await window.electronAPI.storeDelete('testData');
            setStoredData('');
            showAlert('success', 'Storage cleared');
        } catch (error) {
            showAlert('error', error.message);
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                File System & Storage Tests
            </Typography>

            {alert && (
                <Alert severity={alert.severity} sx={{ mb: 2 }} onClose={() => setAlert(null)}>
                    {alert.message}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* File Operations */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            📁 File System Operations
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Test native file save and read dialogs
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<Save />}
                                onClick={handleSaveFile}
                                fullWidth
                            >
                                Save File
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<FolderOpen />}
                                onClick={handleReadFile}
                                fullWidth
                            >
                                Read File
                            </Button>
                        </Box>

                        {fileContent && (
                            <Paper sx={{ p: 2, bgcolor: 'grey.100', maxHeight: 200, overflow: 'auto' }}>
                                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {fileContent}
                                </Typography>
                            </Paper>
                        )}
                    </Paper>
                </Grid>

                {/* Persistent Storage */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            💾 Persistent Storage (electron-store)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Data persists across app restarts
                        </Typography>

                        <TextField
                            fullWidth
                            size="small"
                            value={testData}
                            onChange={(e) => setTestData(e.target.value)}
                            placeholder="Enter data to save"
                            sx={{ mb: 1 }}
                        />

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<Save />}
                                onClick={handleSaveToStore}
                                size="small"
                            >
                                Save
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Storage />}
                                onClick={handleLoadFromStore}
                                size="small"
                            >
                                Load
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Delete />}
                                onClick={handleClearStore}
                                size="small"
                            >
                                Clear
                            </Button>
                        </Box>

                        {storedData && (
                            <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
                                <Typography variant="body2">
                                    Loaded: {storedData}
                                </Typography>
                            </Paper>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Alert severity="info">
                <Typography variant="subtitle2">ℹ️ How it works</Typography>
                <Typography variant="caption">
                    • <b>Save File</b>: Opens native dialog, saves file to disk<br />
                    • <b>Read File</b>: Opens native dialog, reads file content<br />
                    • <b>Persistent Storage</b>: Uses electron-store, data survives app restarts
                </Typography>
            </Alert>
        </Box>
    );
}
