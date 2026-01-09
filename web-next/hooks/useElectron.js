import { useState, useEffect } from 'react';

/**
 * Hook to detect if app is running in Electron and access Electron APIs
 */
export default function useElectron() {
    const [isElectron, setIsElectron] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // Check if running in Electron
        const electronCheck = typeof window !== 'undefined' &&
            window.electronAPI &&
            window.electronAPI.isElectron;

        setIsElectron(electronCheck);

        if (electronCheck) {
            // Get initial offline state
            window.electronAPI.storeGet('offlineMode').then((offline) => {
                console.log('Initial offline mode:', offline);
                setIsOffline(offline || false);
            });

            // Listen to offline mode changes
            const handleOfflineChange = (offline) => {
                console.log('Offline mode changed to:', offline);
                setIsOffline(offline);
            };

            window.electronAPI.onOfflineModeChanged(handleOfflineChange);
        }
    }, []);

    return {
        isElectron,
        isOffline,
        electronAPI: isElectron ? window.electronAPI : null
    };
}
