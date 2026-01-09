'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ children }) {
    const router = useRouter();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const setAuth = useAuthStore((state) => state.setAuth);
    const searchParams = useSearchParams();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Check for SEB token in URL
        const sebToken = searchParams.get('seb_token');
        if (sebToken && !isAuthenticated) {
            console.log('ProtectedRoute: SEB token found, auto-authenticating');
            // Store token and set authenticated
            localStorage.setItem('auth', JSON.stringify({ token: sebToken }));
            setAuth({ id: 'seb-user', role: 'STUDENT' }, sebToken, null);
        }
        setChecking(false);
    }, [searchParams, isAuthenticated, setAuth]);

    // Wait for SEB token check
    if (checking) {
        return null;
    }

    // Re-check authentication after token processing
    const currentAuth = useAuthStore.getState().isAuthenticated;

    if (!currentAuth) {
        router.push('/login');
        return null;
    }

    return children;
}
