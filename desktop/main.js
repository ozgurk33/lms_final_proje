const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');
const path = require('path');
const url = require('url');
const fs = require('fs');

// Initialize electron-store for persistent data
const store = new Store();

let mainWindow;
let tray = null;
let isQuitting = false;

// Auto-updater configuration
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createTray() {
    const iconPath = path.join(__dirname, 'assets', 'icon.png'); // Force PNG for now if ICO is missing

    // Create tray icon
    try {
        tray = new Tray(iconPath);

        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show App',
                click: () => {
                    if (mainWindow) {
                        mainWindow.show();
                        if (mainWindow.isMinimized()) mainWindow.restore();
                        mainWindow.focus();
                    }
                }
            },
            {
                label: 'Check for Updates',
                click: () => {
                    autoUpdater.checkForUpdatesAndNotify();
                }
            },
            { type: 'separator' },
            {
                label: 'Offline Mode',
                type: 'checkbox',
                checked: store.get('offlineMode', false),
                click: (menuItem) => {
                    store.set('offlineMode', menuItem.checked);
                    if (mainWindow) {
                        mainWindow.webContents.send('offline-mode-changed', menuItem.checked);
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => {
                    isQuitting = true;
                    app.quit();
                }
            }
        ]);

        tray.setToolTip('LMS Desktop Application');
        tray.setContextMenu(contextMenu);

        // Tray click event (show/hide window)
        tray.on('click', () => {
            if (mainWindow) {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        });
    } catch (error) {
        console.error('Failed to create tray:', error);
    }
}

function createApplicationMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Export Data',
                    click: async () => {
                        const { filePath } = await dialog.showSaveDialog(mainWindow, {
                            title: 'Export Data',
                            defaultPath: `lms-data-${Date.now()}.json`,
                            filters: [
                                { name: 'JSON Files', extensions: ['json'] },
                                { name: 'All Files', extensions: ['*'] }
                            ]
                        });

                        if (filePath && mainWindow) {
                            mainWindow.webContents.send('export-data-request', filePath);
                        }
                    }
                },
                {
                    label: 'Import Data',
                    click: async () => {
                        const { filePaths } = await dialog.showOpenDialog(mainWindow, {
                            title: 'Import Data',
                            filters: [
                                { name: 'JSON Files', extensions: ['json'] },
                                { name: 'All Files', extensions: ['*'] }
                            ],
                            properties: ['openFile']
                        });

                        if (filePaths && filePaths.length > 0 && mainWindow) {
                            try {
                                const data = fs.readFileSync(filePaths[0], 'utf-8');
                                mainWindow.webContents.send('import-data', JSON.parse(data));
                            } catch (error) {
                                dialog.showErrorBox('Import Error', error.message);
                            }
                        }
                    }
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { type: 'separator' },
                {
                    label: 'Hide to Tray',
                    click: () => {
                        if (mainWindow) mainWindow.hide();
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Documentation',
                    click: async () => {
                        await shell.openExternal('https://github.com/yourusername/lms-docs');
                    }
                },
                {
                    label: 'Check for Updates',
                    click: () => {
                        autoUpdater.checkForUpdatesAndNotify();
                    }
                },
                { type: 'separator' },
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About LMS Desktop',
                            message: `LMS Desktop v${app.getVersion()}`,
                            detail: 'A comprehensive Learning Management System for desktop.'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    // Get window state from store
    const windowState = store.get('windowState', {
        width: 1200,
        height: 800,
        x: undefined,
        y: undefined
    });

    const iconPath = path.join(__dirname, 'assets', 'icon.png'); // Force PNG

    mainWindow = new BrowserWindow({
        width: windowState.width,
        height: windowState.height,
        x: windowState.x,
        y: windowState.y,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            // Disable webSecurity for local development to avoid CORS issues if any
            webSecurity: false,
            allowRunningInsecureContent: true
        },
        icon: fs.existsSync(iconPath) ? iconPath : undefined,
        show: false // Don't show until ready
    });

    // Handle media permissions (webcam/microphone) for live classes and proctoring
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = ['media', 'mediaKeySystem', 'geolocation', 'notifications'];

        if (allowedPermissions.includes(permission)) {
            console.log(`Granting permission: ${permission}`);
            callback(true);
        } else {
            console.log(`Denying permission: ${permission}`);
            callback(false);
        }
    });

    // ==================== ADVANCED DOWNLOAD MANAGER ====================
    // Download session handler with progress tracking, notifications, and history
    mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
        // Ask user where to save the file
        const filePath = dialog.showSaveDialogSync(mainWindow, {
            title: 'Dosyayı Kaydet',
            defaultPath: path.join(app.getPath('downloads'), item.getFilename()),
            buttonLabel: 'Kaydet',
            filters: [
                { name: 'Tüm Dosyalar', extensions: ['*'] }
            ]
        });

        if (!filePath) {
            item.cancel();
            return;
        }

        item.setSavePath(filePath);

        const downloadId = Date.now().toString();
        let startTime = Date.now();
        let lastUpdate = Date.now();
        let lastBytes = 0;

        console.log(`İndirme başlatıldı: ${item.getFilename()}`);

        // Track download progress
        item.on('updated', (event, state) => {
            if (state === 'progressing') {
                const now = Date.now();
                const timeDiff = (now - lastUpdate) / 1000; // seconds
                const bytesDiff = item.getReceivedBytes() - lastBytes;
                const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0; // bytes/second

                const progress = {
                    id: downloadId,
                    filename: item.getFilename(),
                    receivedBytes: item.getReceivedBytes(),
                    totalBytes: item.getTotalBytes(),
                    progress: item.getTotalBytes() > 0
                        ? (item.getReceivedBytes() / item.getTotalBytes()) * 100
                        : 0,
                    speed: speed,
                    state: state
                };

                // Send progress to renderer
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('download-progress', progress);
                }

                lastUpdate = now;
                lastBytes = item.getReceivedBytes();
            }
        });

        // Handle download completion
        item.once('done', (event, state) => {
            const duration = (Date.now() - startTime) / 1000; // seconds

            if (state === 'completed') {
                console.log(`İndirme tamamlandı: ${item.getFilename()} (${duration.toFixed(1)}s)`);

                // Save to download history
                const history = store.get('downloadHistory', []);
                history.unshift({
                    filename: item.getFilename(),
                    path: filePath,
                    size: item.getTotalBytes(),
                    date: new Date().toISOString(),
                    type: path.extname(item.getFilename()),
                    duration: duration
                });
                // Keep last 50 downloads
                store.set('downloadHistory', history.slice(0, 50));

                // Show Windows notification
                const { Notification } = require('electron');
                const notification = new Notification({
                    title: 'İndirme Tamamlandı',
                    body: `${item.getFilename()} başarıyla indirildi`,
                    icon: path.join(__dirname, 'assets', 'icon.png')
                });

                notification.show();

                // Open file location when notification is clicked
                notification.on('click', () => {
                    shell.showItemInFolder(filePath);
                });

                // Notify renderer
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('download-complete', {
                        id: downloadId,
                        state: 'completed',
                        filename: item.getFilename(),
                        path: filePath
                    });
                }

            } else if (state === 'interrupted') {
                console.error(`İndirme kesildi: ${item.getFilename()}`);
                dialog.showErrorBox(
                    'İndirme Hatası',
                    `${item.getFilename()} dosyası indirilemedi.\n\nBağlantı sorunları veya yetersiz disk alanı nedeniyle indirme başarısız oldu.`
                );

                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('download-complete', {
                        id: downloadId,
                        state: 'interrupted',
                        filename: item.getFilename()
                    });
                }

            } else if (state === 'cancelled') {
                console.log(`İndirme iptal edildi: ${item.getFilename()}`);

                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('download-complete', {
                        id: downloadId,
                        state: 'cancelled',
                        filename: item.getFilename()
                    });
                }
            }
        });
    });


    // Save window state on resize/move
    mainWindow.on('resize', () => {
        if (!mainWindow.isMaximized() && !mainWindow.isMinimized()) {
            const bounds = mainWindow.getBounds();
            store.set('windowState', bounds);
        }
    });

    mainWindow.on('move', () => {
        if (!mainWindow.isMaximized() && !mainWindow.isMinimized()) {
            const bounds = mainWindow.getBounds();
            store.set('windowState', bounds);
        }
    });

    // Load from localhost in development, from URL/file in production
    // Web-next uses port 5173
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';

    mainWindow.loadURL(startUrl);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        // Check for updates after window is shown
        if (!process.env.ELECTRON_START_URL) {
            setTimeout(() => {
                autoUpdater.checkForUpdatesAndNotify();
            }, 3000);
        }
    });

    // Open DevTools functionality for debugging
    // Force open devtools if arguments contain --debug or in dev
    // For this debugging session, we will force open it
    mainWindow.webContents.openDevTools();

    // Handle close event (minimize to tray instead of quit)
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();

            // Show notification on first minimize
            if (!store.get('trayNotificationShown')) {
                tray.displayBalloon({
                    title: 'LMS Desktop',
                    content: 'Application is running in the background. Right-click the tray icon for options.'
                });
                store.set('trayNotificationShown', true);
            }
        }
        return false;
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Create application menu
    createApplicationMenu();
}

// IPC Handlers

// File system operations
ipcMain.handle('save-file', async (event, data) => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save File',
        defaultPath: data.defaultName || 'file.txt',
        filters: data.filters || [{ name: 'All Files', extensions: ['*'] }]
    });

    if (filePath) {
        try {
            fs.writeFileSync(filePath, data.content);
            return { success: true, filePath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    return { success: false, error: 'Cancelled' };
});

ipcMain.handle('read-file', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'All Files', extensions: ['*'] }]
    });

    if (filePaths && filePaths.length > 0) {
        try {
            const content = fs.readFileSync(filePaths[0], 'utf-8');
            return { success: true, content, filePath: filePaths[0] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    return { success: false, error: 'Cancelled' };
});

// Store operations
ipcMain.handle('store-get', (event, key) => {
    return store.get(key);
});

ipcMain.handle('store-set', (event, key, value) => {
    store.set(key, value);
    return true;
});

ipcMain.handle('store-delete', (event, key) => {
    store.delete(key);
    return true;
});


// Get download history
ipcMain.handle('get-download-history', () => {
    return store.get('downloadHistory', []);
});

// Clear download history
ipcMain.handle('clear-download-history', () => {
    store.set('downloadHistory', []);
    return { success: true };
});

// Open file in system file manager
ipcMain.handle('show-item-in-folder', (event, filePath) => {
    if (fs.existsSync(filePath)) {
        shell.showItemInFolder(filePath);
        return { success: true };
    } else {
        return { success: false, error: 'Dosya bulunamadı' };
    }
});

// ==================== MEDIA DEVICE MANAGEMENT ====================
// Get list of media devices (cameras, microphones)
ipcMain.handle('get-media-devices', async () => {
    try {
        if (mainWindow && !mainWindow.isDestroyed()) {
            const devices = await mainWindow.webContents.executeJavaScript(`
                navigator.mediaDevices.enumerateDevices()
                    .then(devices => devices.map(d => ({
                        deviceId: d.deviceId,
                        kind: d.kind,
                        label: d.label || 'Default Device',
                        groupId: d.groupId
                    })))
            `);
            return { success: true, devices };
        }
        return { success: false, error: 'Window not available' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `A new version ${info.version} is available. Do you want to download it now?`,
        buttons: ['Download', 'Later']
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.downloadUpdate();
        }
    });
});

autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
});

autoUpdater.on('download-progress', (progressObj) => {
    let message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`;
    mainWindow.setProgressBar(progressObj.percent / 100);
    if (mainWindow) {
        mainWindow.webContents.send('download-progress', progressObj);
    }
});

autoUpdater.on('update-downloaded', (info) => {
    mainWindow.setProgressBar(-1); // Remove progress bar
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded. Restart the application to apply the update.`,
        buttons: ['Restart Now', 'Restart Later']
    }).then((result) => {
        if (result.response === 0) {
            isQuitting = true;
            autoUpdater.quitAndInstall();
        }
    });
});

// App events
app.on('ready', () => {
    createWindow();
    createTray();
});

app.on('window-all-closed', () => {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    } else {
        mainWindow.show();
    }
});

app.on('before-quit', () => {
    isQuitting = true;
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}
