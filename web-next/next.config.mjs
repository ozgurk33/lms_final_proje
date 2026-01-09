/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Image optimization
    images: {
        unoptimized: true,
    },

    // Environment variables
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
        NEXT_PUBLIC_REQUIRE_SEB: process.env.NEXT_PUBLIC_REQUIRE_SEB || 'false',
    },

    // Improve build performance
    swcMinify: true,

    // Reduce bundle size
    experimental: {
        optimizePackageImports: ['@mui/material', '@mui/icons-material'],
    },
};

// Only add compiler options for production build (non-Turbopack)
if (process.env.NODE_ENV === 'production') {
    nextConfig.compiler = {
        removeConsole: true,
    };
}

export default withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
        {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'api-cache',
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 24 * 60 * 60, // 24 hours
                },
                networkTimeoutSeconds: 10,
            },
        },
    ],
})(nextConfig);
