'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    LinearProgress
} from '@mui/material';
import {
    FolderOpen as FolderIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    InsertDriveFile as FileIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    VideoLibrary as VideoIcon,
    AudioFile as AudioIcon
} from '@mui/icons-material';
import useElectron from '@/hooks/useElectron';

export default function DownloadsPage() {
    const { isElectron, electronAPI } = useElectron();
    const [downloadHistory, setDownloadHistory] = useState([]);
    const [activeDownloads, setActiveDownloads] = useState([]);

    // Get file icon by type
    const getFileIcon = (type) => {
        if (!type) return <FileIcon />;

        const ext = type.toLowerCase();
        if (ext === '.pdf') return <PdfIcon color="error" />;
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return <ImageIcon color="primary" />;
        if (['.mp4', '.avi', '.mkv', '.mov'].includes(ext)) return <VideoIcon color="secondary" />;
        if (['.mp3', '.wav', '.ogg'].includes(ext)) return <AudioIcon color="success" />;

        return <FileIcon />;
    };

    // Format file size
    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Format speed
    const formatSpeed = (bytesPerSec) => {
        return formatSize(bytesPerSec) + '/s';
    };

    // Load download history
    const loadHistory = async () => {
        if (isElectron) {
            const history = await electronAPI.getDownloadHistory();
            setDownloadHistory(history || []);
        }
    };

    // Open file location
    const handleOpenFolder = async (filePath) => {
        if (isElectron) {
            await electronAPI.showItemInFolder(filePath);
        }
    };

    // Clear history
    const handleClearHistory = async () => {
        if (isElectron) {
            await electronAPI.clearDownloadHistory();
            setDownloadHistory([]);
        }
    };

    // Listen to download progress
    useEffect(() => {
        if (isElectron) {
            loadHistory();

            // Listen to download progress
            electronAPI.onDownloadProgress((progress) => {
                setActiveDownloads(prev => {
                    const index = prev.findIndex(d => d.id === progress.id);
                    if (index >= 0) {
                        const updated = [...prev];
                        updated[index] = progress;
                        return updated;
                    } else {
                        return [...prev, progress];
                    }
                });
            });

            // Listen to download completion
            electronAPI.onDownloadComplete((result) => {
                // Remove from active downloads
                setActiveDownloads(prev => prev.filter(d => d.id !== result.id));

                // Reload history
                loadHistory();
            });
        }
    }, [isElectron]);

    if (!isElectron) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="info">
                    İndirme geçmişi sadece Desktop uygulamasında kullanılabilir.
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    📥 İndirmeler
                </Typography>
                {downloadHistory.length > 0 && (
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleClearHistory}
                    >
                        Geçmişi Temizle
                    </Button>
                )}
            </Box>

            {/* Active Downloads */}
            {activeDownloads.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Aktif İndirmeler
                    </Typography>
                    {activeDownloads.map((download) => (
                        <Box key={download.id} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">
                                    {download.filename}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {download.progress.toFixed(1)}% • {formatSpeed(download.speed)}
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={download.progress}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                {formatSize(download.receivedBytes)} / {formatSize(download.totalBytes)}
                            </Typography>
                        </Box>
                    ))}
                </Paper>
            )}

            {/* Download History */}
            {downloadHistory.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <DownloadIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        Henüz indirme yok
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                        Desktop uygulamasında dosya indirdiğinizde buradan takip edebilirsiniz
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Dosya</TableCell>
                                <TableCell>Boyut</TableCell>
                                <TableCell>Tarih</TableCell>
                                <TableCell>Süre</TableCell>
                                <TableCell align="right">İşlemler</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {downloadHistory.map((item, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getFileIcon(item.type)}
                                            <Box>
                                                <Typography variant="body2">{item.filename}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.path}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{formatSize(item.size)}</TableCell>
                                    <TableCell>
                                        {new Date(item.date).toLocaleString('tr-TR')}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${item.duration.toFixed(1)}s`}
                                            size="small"
                                            color="success"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenFolder(item.path)}
                                            title="Klasörde göster"
                                        >
                                            <FolderIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Container>
    );
}
