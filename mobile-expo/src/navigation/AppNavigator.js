import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthService from '../services/AuthService';
import { authEvents, AUTH_EVENTS } from '../utils/authEvents';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';

// Student Screens
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import StudentDashboard from '../screens/student/StudentDashboard';
import StudentCourseDetails from '../screens/student/StudentCourseDetails';
import QuizHistory from '../screens/student/QuizHistory';
import ProfileScreen from '../screens/student/ProfileScreen';
import VideoPlayerScreen from '../screens/student/VideoPlayerScreen';
import PDFViewerScreen from '../screens/student/PDFViewerScreen';
import ModuleDetailScreen from '../screens/student/ModuleDetailScreen';
import NotesScreen from '../screens/student/NotesScreen';
import DownloadsScreen from '../screens/student/DownloadsScreen';

// Instructor Screens
import InstructorHomeScreen from '../screens/instructor/InstructorHomeScreen';
import InstructorDashboard from '../screens/instructor/InstructorDashboard';
import EditCourse from '../screens/instructor/EditCourse';
import OMRScannerScreen from '../screens/instructor/OMRScannerScreen';
import OMRLiveScanScreen from '../screens/instructor/OMRLiveScanScreen';
import OMRValidationScreen from '../screens/instructor/OMRValidationScreen';
import OMRResultsScreen from '../screens/instructor/OMRResultsScreen';
import CreateOMRQuizScreen from '../screens/instructor/CreateOMRQuizScreen';
import InstructorOMRQuizzesScreen from '../screens/instructor/InstructorOMRQuizzesScreen';
import InstructorQuizDetailScreen from '../screens/instructor/InstructorQuizDetailScreen';
import StandaloneOMRScreen from '../screens/instructor/StandaloneOMRScreen';

// Admin Screens
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminUsers from '../screens/admin/AdminUsers';
import AdminCourses from '../screens/admin/AdminCourses';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();

        // Listen for auth events
        const handleLogin = (user) => {
            setIsAuthenticated(true);
            setUserRole(user.role);
        };

        const handleLogout = () => {
            setIsAuthenticated(false);
            setUserRole(null);
        };

        authEvents.on(AUTH_EVENTS.LOGIN, handleLogin);
        authEvents.on(AUTH_EVENTS.LOGOUT, handleLogout);

        return () => {
            authEvents.off(AUTH_EVENTS.LOGIN, handleLogin);
            authEvents.off(AUTH_EVENTS.LOGOUT, handleLogout);
        };
    }, []);

    const checkAuth = async () => {
        const authenticated = await AuthService.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
            const user = await AuthService.getCurrentUser();
            console.log('User role detected:', user?.role); // Debug
            setUserRole(user?.role);
        }

        setLoading(false);
    };

    if (loading) {
        return null; // Or a splash screen
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: { backgroundColor: '#007AFF' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}>
                {!isAuthenticated ? (
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                        listeners={{
                            focus: () => checkAuth(),
                        }}
                    />
                ) : userRole === 'STUDENT' ? (
                    <>
                        <Stack.Screen
                            name="StudentHome"
                            component={StudentHomeScreen}
                            options={{ title: 'Ana Sayfa' }}
                        />
                        <Stack.Screen
                            name="StudentDashboard"
                            component={StudentDashboard}
                            options={{ title: 'Kurslarım' }}
                        />
                        <Stack.Screen
                            name="StudentCourseDetails"
                            component={StudentCourseDetails}
                            options={{ title: 'Kurs Detayı' }}
                        />
                        <Stack.Screen
                            name="ModuleDetail"
                            component={ModuleDetailScreen}
                            options={{ title: 'Modül Detayı', headerShown: false }}
                        />
                        <Stack.Screen
                            name="VideoPlayer"
                            component={VideoPlayerScreen}
                            options={{ title: 'Video', headerShown: false }}
                        />
                        <Stack.Screen
                            name="PDFViewer"
                            component={PDFViewerScreen}
                            options={{ title: 'PDF', headerShown: false }}
                        />
                        <Stack.Screen
                            name="Notes"
                            component={NotesScreen}
                            options={{ title: 'Notlarım', headerShown: false }}
                        />
                        <Stack.Screen
                            name="Downloads"
                            component={DownloadsScreen}
                            options={{ title: 'İndirilenler', headerShown: false }}
                        />
                        <Stack.Screen
                            name="QuizHistory"
                            component={QuizHistory}
                            options={{ title: 'Sınav Geçmişi' }}
                        />
                        <Stack.Screen
                            name="Profile"
                            component={ProfileScreen}
                            options={{ title: 'Profil' }}
                        />
                    </>
                ) : userRole === 'INSTRUCTOR' ? (
                    <>
                        <Stack.Screen
                            name="InstructorHome"
                            component={InstructorHomeScreen}
                            options={{ title: 'Ana Sayfa' }}
                        />
                        <Stack.Screen
                            name="InstructorDashboard"
                            component={InstructorDashboard}
                            options={{ title: 'Kurslarım' }}
                        />
                        <Stack.Screen
                            name="EditCourse"
                            component={EditCourse}
                            options={{ title: 'Kurs Düzenle' }}
                        />
                        <Stack.Screen
                            name="InstructorQuizDetail"
                            component={InstructorQuizDetailScreen}
                            options={{ title: 'Quiz Detayı' }}
                        />
                        <Stack.Screen
                            name="CreateOMRQuiz"
                            component={CreateOMRQuizScreen}
                            options={{ title: 'OMR Sınavı Oluştur' }}
                        />
                        <Stack.Screen
                            name="InstructorOMRQuizzes"
                            component={InstructorOMRQuizzesScreen}
                            options={{ title: 'OMR Sınavları' }}
                        />
                        <Stack.Screen
                            name="OMRScanner"
                            component={OMRScannerScreen}
                            options={{ title: 'Scan OMR Sheet' }}
                        />
                        <Stack.Screen
                            name="StandaloneOMR"
                            component={StandaloneOMRScreen}
                            options={{ title: 'Offline OMR Okuyucu', headerShown: false }}
                        />
                        <Stack.Screen
                            name="OMRLiveScan"
                            component={OMRLiveScanScreen}
                            options={{ title: 'Canlı OMR Tarama', headerShown: false }}
                        />
                        <Stack.Screen
                            name="OMRValidation"
                            component={OMRValidationScreen}
                            options={{ title: 'Validate Answers' }}
                        />
                        <Stack.Screen
                            name="OMRResults"
                            component={OMRResultsScreen}
                            options={{ title: 'OMR Sonuçları' }}
                        />
                        <Stack.Screen
                            name="Profile"
                            component={ProfileScreen}
                            options={{ title: 'Profil' }}
                        />
                    </>
                ) : (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') ? (
                    <>
                        <Stack.Screen
                            name="AdminHome"
                            component={AdminHomeScreen}
                            options={{ title: 'Ana Sayfa' }}
                        />
                        <Stack.Screen
                            name="AdminDashboard"
                            component={AdminDashboard}
                            options={{ title: 'İstatistikler' }}
                        />
                        <Stack.Screen
                            name="AdminUsers"
                            component={AdminUsers}
                            options={{ title: 'Kullanıcı Yönetimi' }}
                        />
                        <Stack.Screen
                            name="AdminCourses"
                            component={AdminCourses}
                            options={{ title: 'Kurs Yönetimi' }}
                        />
                        <Stack.Screen
                            name="Profile"
                            component={ProfileScreen}
                            options={{ title: 'Profil' }}
                        />
                    </>
                ) : null}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
