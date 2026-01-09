import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useThemeStore = create(
    persist(
        (set) => ({
            mode: 'light',
            toggleTheme: () => set((state) => ({
                mode: state.mode === 'light' ? 'dark' : 'light'
            })),
            setTheme: (mode) => set({ mode }),
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => {
                // SSR-safe: only use localStorage on client
                if (typeof window !== 'undefined') {
                    return localStorage;
                }
                // Fallback for SSR
                return {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                };
            }),
        }
    )
);
