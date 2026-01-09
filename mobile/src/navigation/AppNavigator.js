import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthService from '../services/AuthService';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';

// Student Screens
import StudentDashboard from '../screens/student/StudentDashboard';
import StudentCourseDetails from '../screens/student/StudentCourseDetails';
import QuizHistory from '../screens/student/QuizHistory';

// Instructor Screens
import InstructorDashboard from '../screens/instructor/InstructorDashboard';
import CreateCourse from '../screens/instructor/CreateCourse';
import EditCourse from '../screens/instructor/EditCourse';

// Admin Screens
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
    }, []);

    const checkAuth = async () => {
        const authenticated = await AuthService.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
            const user = await AuthService.getCurrentUser();
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
                            name="QuizHistory"
                            component={QuizHistory}
                            options={{ title: 'Sınav Geçmişi' }}
                        />
                    </>
                ) : userRole === 'INSTRUCTOR' ? (
                    <>
                        <Stack.Screen
                            name="InstructorDashboard"
                            component={InstructorDashboard}
                            options={{ title: 'Eğitmen Paneli' }}
                        />
                        <Stack.Screen
                            name="CreateCourse"
                            component={CreateCourse}
                            options={{ title: 'Yeni Kurs Oluştur' }}
                        />
                        <Stack.Screen
                            name="EditCourse"
                            component={EditCourse}
                            options={{ title: 'Kurs Düzenle' }}
                        />
                    </>
                ) : userRole === 'ADMIN' ? (
                    <>
                        <Stack.Screen
                            name="AdminDashboard"
                            component={AdminDashboard}
                            options={{ title: 'Admin Paneli' }}
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
                    </>
                ) : null}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
