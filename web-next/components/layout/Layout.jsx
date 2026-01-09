import { Outlet, useSearchParams, useLocation } from 'react-router-dom';
import { Box, IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import Navbar from './Navbar';
import OfflineModeIndicator from './OfflineModeIndicator';
import { isSEBBrowser } from '../../utils/sebDetector';
import { useThemeStore } from '../../store/themeStore';

export default function Layout() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const mode = useThemeStore((state) => state.mode);
    const toggleTheme = useThemeStore((state) => state.toggleTheme);

    // Check if in SEB exam mode:
    // 1. Has seb_token in URL
    // 2. Is detected as SEB browser
    // 3. Is on quiz take page or seb-quit page
    const hasSEBToken = searchParams.get('seb_token') !== null;
    const isInSEB = isSEBBrowser();
    const isQuizTakePage = location.pathname.includes('/quizzes/') && location.pathname.includes('/take');
    const isSEBQuitPage = location.pathname.includes('/seb-quit');

    // Enter SEB exam mode if any of these conditions are true
    const isSEBExamMode = (hasSEBToken || isInSEB) && (isQuizTakePage || isSEBQuitPage);

    // In SEB exam mode: show ONLY the content with dark mode toggle, no navbar
    if (isSEBExamMode) {
        return (
            <Box sx={{
                minHeight: '100vh',
                // Prevent any text selection in exam mode
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                position: 'relative'
            }}>
                {/* Dark Mode Toggle - Fixed in top right corner */}
                <Box sx={{
                    position: 'fixed',
                    top: 16,
                    right: 16,
                    zIndex: 1000
                }}>
                    <Tooltip title={mode === 'dark' ? 'AÃ§Ä±k Mod' : 'Koyu Mod'}>
                        <IconButton
                            onClick={toggleTheme}
                            sx={{
                                bgcolor: 'background.paper',
                                boxShadow: 2,
                                '&:hover': {
                                    bgcolor: 'background.paper',
                                    transform: 'scale(1.1)'
                                }
                            }}
                        >
                            {mode === 'dark' ? <LightMode /> : <DarkMode />}
                        </IconButton>
                    </Tooltip>
                </Box>
                <Outlet />
            </Box>
        );
    }

    // Normal mode: show full layout with navbar
    return (
        <Box>
            <Navbar />
            <OfflineModeIndicator />
            <Box component="main">
                <Outlet />
            </Box>
        </Box>
    );
}
