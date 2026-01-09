'use client';

import { useAuthStore } from '@/store/authStore';
import StudentDashboard from '../student/page';
import InstructorDashboard from '../instructor/page';
import AdminDashboard from '../admin/page';

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user);

    if (!user) return null;

    // Route to appropriate dashboard based on role
    switch (user.role) {
        case 'SUPER_ADMIN':
        case 'ADMIN':
            return <AdminDashboard />;
        case 'INSTRUCTOR':
        case 'ASSISTANT':
            return <InstructorDashboard />;
        case 'STUDENT':
        case 'GUEST':
        default:
            return <StudentDashboard />;
    }
}
