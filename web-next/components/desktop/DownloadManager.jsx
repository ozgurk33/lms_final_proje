'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Chip,
    Button,
    Divider,
    Alert
} from '@mui/material';
import {
    Download,
    CheckCircle,
    Error,
    FolderOpen,
    Delete,
    Speed
} from '@mui/icons-material';

/**
 * DownloadManager Component
 * Displays download progress and history (Desktop only)
 */
export default function DownloadManager() {
    const [downloads, setDownloads] = useState([]);
    const [currentDownload, setCurrentDownload] = useState(null);
    const [history, setHistory] = useState([]);
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        // Check if running in Electron
        if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
            setIsElectron(true);
            loadDownloadHistory();
            setupDownloadListeners();
        }
    }, []);

    const loadDownloadHistory = async () => {
        if (window.electronAPI) {
            const downloadHistory = await window.electronAPI.getDownloadHistory();
            setHistory(downloadHistory || []);
        }
    };

    const setupDownloadListeners = () => {
        if (window.electronAPI) {
            // Listen to download progress
            window.electronAPI.onDownloadProgress((progress) => {
                setCurrentDownload(progress);
            });

            // Listen to download completion
            window.electronAPI.onDownloadComplete((result) => {
                setCurrentDownload(null);
                if (result.state === 'completed') {
                    loadDownloadHistory();
                }
            });
        }
    };

    const handleClearHistory = async () => {
        if (window.electronAPI) {
            await window.electronAPI.clearDownloadHistory();
            setHistory([]);
        }
    };

    const handleOpenFile = async (filePath) => {
        if (window.electronAPI) {
            await window.electronAPI.showItemInFolder(filePath);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatSpeed = (bytesPerSecond) => {
        return formatFileSize(bytesPerSecond) + '/s';
    };

    if (!isElectron) {
        return (
            <Alert severity="info">
                Download Manager is only available in the Desktop App.
            </Alert>
        );
    }

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Download Manager
            </Typography>

            {/* Current Download */}
            {currentDownload && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Download color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6">
                                {currentDownload.filename}
                            </Typography>
                        </Box>

                        <LinearProgress
                            variant="determinate"
                            value={currentDownload.progress}
                            sx={{ mb: 1, height: 8, borderRadius: 1 }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {currentDownload.progress.toFixed(1)}% - {formatFileSize(currentDownload.receivedBytes)} / {formatFileSize(currentDownload.totalBytes)}
                            </Typography>
                            <Chip
                                icon={<Speed />}
                                label={formatSpeed(currentDownload.speed)}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Download History */}
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Recent Downloads ({history.length})
                        </Typography>
                        {history.length > 0 && (
                            <Button
                                startIcon={<Delete />}
                                size="small"
                                onClick={handleClearHistory}
                            >
                                Clear History
                            </Button>
                        )}
                    </Box>

                    {history.length === 0 ? (
                        <Typography color="text.secondary" textAlign="center" py={3}>
                            No downloads yet
                        </Typography>
                    ) : (
                        <List>
                            {history.map((item, index) => (
                                <Box key={index}>
                                    <ListItem
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleOpenFile(item.path)}
                                                title="Open file location"
                                            >
                                                <FolderOpen />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemIcon>
                                            <CheckCircle color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.filename}
                                            secondary={
                                                <Box component="span">
                                                    <Typography variant="caption" component="span" display="block">
                                                        {formatFileSize(item.size)} • {new Date(item.date).toLocaleString()}
                                                    </Typography>
                                                    <Typography variant="caption" component="span" color="text.secondary">
                                                        Completed in {item.duration?.toFixed(1)}s
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < history.length - 1 && <Divider />}
                                </Box>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
