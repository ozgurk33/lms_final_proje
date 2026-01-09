import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOADS_KEY = '@downloads';
const DOWNLOADS_DIR = `${FileSystem.documentDirectory}downloads/`;

const downloadService = {
    /**
     * Initialize downloads directory
     */
    async init() {
        const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
        }
    },

    /**
     * Download a file (video or PDF)
     */
    async downloadFile(url, title, type) {
        try {
            await this.init();

            const filename = `${Date.now()}_${title.replace(/[^a-z0-9]/gi, '_')}.${type === 'video' ? 'mp4' : 'pdf'}`;
            const fileUri = `${DOWNLOADS_DIR}${filename}`;

            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                fileUri,
                {},
                (downloadProgress) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    console.log(`Download progress: ${(progress * 100).toFixed(0)}%`);
                }
            );

            const result = await downloadResumable.downloadAsync();

            if (result) {
                // Save download metadata
                await this.saveDownloadMetadata({
                    id: Date.now().toString(),
                    title,
                    type,
                    url,
                    fileUri: result.uri,
                    size: result.headers['Content-Length'] || 0,
                    downloadedAt: new Date().toISOString(),
                });

                return { success: true, fileUri: result.uri };
            }

            return { success: false, error: 'Download failed' };
        } catch (error) {
            console.error('Download error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Save download metadata to AsyncStorage
     */
    async saveDownloadMetadata(metadata) {
        try {
            const downloads = await this.getDownloads();
            downloads.push(metadata);
            await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
        } catch (error) {
            console.error('Save metadata error:', error);
        }
    },

    /**
     * Get all downloads
     */
    async getDownloads() {
        try {
            const downloadsJson = await AsyncStorage.getItem(DOWNLOADS_KEY);
            return downloadsJson ? JSON.parse(downloadsJson) : [];
        } catch (error) {
            console.error('Get downloads error:', error);
            return [];
        }
    },

    /**
     * Check if URL is already downloaded
     */
    async isDownloaded(url) {
        const downloads = await this.getDownloads();
        return downloads.find(d => d.url === url);
    },

    /**
     * Delete a download
     */
    async deleteDownload(downloadId) {
        try {
            const downloads = await this.getDownloads();
            const download = downloads.find(d => d.id === downloadId);

            if (download) {
                // Delete file
                await FileSystem.deleteAsync(download.fileUri, { idempotent: true });

                // Remove from metadata
                const updated = downloads.filter(d => d.id !== downloadId);
                await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));

                return { success: true };
            }

            return { success: false, error: 'Download not found' };
        } catch (error) {
            console.error('Delete download error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get total storage used
     */
    async getStorageUsed() {
        const downloads = await this.getDownloads();
        return downloads.reduce((total, d) => total + parseInt(d.size || 0), 0);
    },
};

export default downloadService;
