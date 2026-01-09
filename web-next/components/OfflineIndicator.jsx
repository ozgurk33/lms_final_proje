'use client';

import { useEffect, useState } from 'react';
import useElectron from '@/hooks/useElectron';

export default function OfflineIndicator() {
    const { isElectron, isOffline } = useElectron();

    // Don't show in browser, only in Electron
    if (!isElectron) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
                backgroundColor: isOffline ? '#fee2e2' : '#dcfce7',
                border: `1px solid ${isOffline ? '#fca5a5' : '#86efac'}`
            }}>
            <div className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isOffline ? '#ef4444' : '#22c55e' }}></div>
            <span className="text-sm font-medium"
                style={{ color: isOffline ? '#dc2626' : '#16a34a' }}>
                {isOffline ? 'Offline' : 'Online'}
            </span>
        </div>
    );
}
