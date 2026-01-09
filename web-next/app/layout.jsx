import Providers from '../components/Providers';
import MainLayout from '../components/layout/MainLayout';
import './globals.css';

export const metadata = {
    title: 'LMS - Learning Management System',
    description: 'A comprehensive learning management system',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
                />
            </head>
            <body>
                <Providers>
                    <MainLayout>
                        {children}
                    </MainLayout>
                </Providers>
            </body>
        </html>
    );
}
