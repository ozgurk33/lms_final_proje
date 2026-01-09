const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // File system operations
    saveFile: (data) => ipcRenderer.invoke('save-file', data),
    readFile: () => ipcRenderer.invoke('read-file'),

    // Store operations (persistent data)
    storeGet: (key) => ipcRenderer.invoke('store-get', key),
    storeSet: (key, value) => ipcRenderer.invoke('store-set', key, value),
    storeDelete: (key) => ipcRenderer.invoke('store-delete', key),

    // Download Manager APIs
    getDownloadHistory: () => ipcRenderer.invoke('get-download-history'),
    clearDownloadHistory: () => ipcRenderer.invoke('clear-download-history'),
    showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),

    // Media Device APIs (for live classes and proctoring)
    getMediaDevices: () => ipcRenderer.invoke('get-media-devices'),

    // Event Listeners
    onOfflineModeChanged: (callback) => ipcRenderer.on('offline-mode-changed', (event, isOffline) => callback(isOffline)),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, progress) => callback(progress)),
    onDownloadComplete: (callback) => ipcRenderer.on('download-complete', (event, result) => callback(result)),
    onExportDataRequest: (callback) => ipcRenderer.on('export-data-request', (event, filePath) => callback(filePath)),
    onImportData: (callback) => ipcRenderer.on('import-data', (event, data) => callback(data)),

    // Platform info
    platform: process.platform,
    isElectron: true
});

// Expose Node.js process information (safe subset)
contextBridge.exposeInMainWorld('processInfo', {
    platform: process.platform,
    arch: process.arch,
    versions: process.versions
});
