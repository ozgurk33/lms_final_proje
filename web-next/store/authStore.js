import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,

    setAuth: (user, token, refreshToken) => {
        set({
            user,
            token,
            refreshToken,
            isAuthenticated: true
        });
        // Manually persist to localStorage
        localStorage.setItem('auth', JSON.stringify({ user, token, refreshToken }));
    },

    setUser: (user) => set({ user }),

    logout: () => {
        set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false
        });
        localStorage.removeItem('auth');
    },

    // Initialize from localStorage
    init: () => {
        const stored = localStorage.getItem('auth');
        if (stored) {
            try {
                const { user, token, refreshToken } = JSON.parse(stored);
                set({ user, token, refreshToken, isAuthenticated: true });
            } catch (e) {
                console.error('Failed to parse stored auth:', e);
            }
        }
    }
}));

