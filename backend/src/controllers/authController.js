import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/database.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import { validatePassword } from '../utils/passwordPolicy.js';
import { generateSecret, generateQRCode, verifyToken } from '../utils/2fa.js';
import { isValidEmail } from '../utils/validators.js';
import { createAuditLog } from '../middleware/auditLogger.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Register new user
 */
export const register = async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate password policy
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                error: 'Password does not meet requirements',
                details: passwordValidation.errors
            });
        }

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                error: existingUser.username === username ? 'Username already exists' : 'Email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                fullName,
                role: username.startsWith('inst_') ? 'INSTRUCTOR' : 'STUDENT' // Default role
            },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                createdAt: true
            }
        });

        // Audit log
        await createAuditLog(req.auditInfo, user.id, { action: 'USER_REGISTERED' });

        res.status(201).json({
            message: 'User registered successfully',
            user
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

/**
 * Login with username/email and password
 */
export const login = async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;

        if (!usernameOrEmail || !password) {
            console.log('Login attempt failed: Missing credentials');
            return res.status(400).json({ error: 'Username/email and password are required' });
        }

        console.log(`Login attempt for: ${usernameOrEmail}`);

        // Find user
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: usernameOrEmail },
                    { email: usernameOrEmail }
                ]
            }
        });

        if (!user) {
            console.log(`Login failed: User not found for ${usernameOrEmail}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log(`Login failed: Invalid password for user ${user.username}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log(`Login successful for user: ${user.username}`);

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            // Return temporary token for 2FA verification
            const tempToken = generateAccessToken(user.id);
            return res.json({
                requiresTwoFactor: true,
                tempToken,
                message: 'Please provide 2FA code'
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        // Audit log
        await createAuditLog(req.auditInfo, user.id, { action: 'USER_LOGIN' });

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

/**
 * Google OAuth login
 */
export const googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }

        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { googleId }
        });

        if (!user) {
            // Check if email already exists
            user = await prisma.user.findUnique({
                where: { email }
            });

            if (user) {
                // Link Google account to existing user
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId }
                });
            } else {
                // Create new user
                const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(7);
                user = await prisma.user.create({
                    data: {
                        googleId,
                        email,
                        username,
                        fullName: name,
                        password: await bcrypt.hash(Math.random().toString(36), 12), // Random password
                        emailVerified: true,
                        role: 'STUDENT'
                    }
                });
            }
        }

        // Generate tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        // Audit log
        await createAuditLog({ ...req.auditInfo, userId: user.id }, user.id, {
            action: 'GOOGLE_LOGIN'
        });

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Google authentication failed' });
    }
};

/**
 * Setup 2FA for user
 */
export const setup2FA = async (req, res) => {
    try {
        const userId = req.user.id;

        // Generate secret
        const { secret, otpauthUrl } = generateSecret(req.user.username);

        // Generate QR code
        const qrCode = await generateQRCode(otpauthUrl);

        // Store secret temporarily (not enabled yet)
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret }
        });

        res.json({
            secret,
            qrCode,
            message: 'Scan QR code with your authenticator app and verify with a code to enable 2FA'
        });

    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ error: '2FA setup failed' });
    }
};

/**
 * Verify and enable 2FA
 */
export const verify2FA = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.id;

        if (!token) {
            return res.status(400).json({ error: '2FA token is required' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user.twoFactorSecret) {
            return res.status(400).json({ error: '2FA not set up. Please setup 2FA first' });
        }

        // Verify token
        const isValid = verifyToken(token, user.twoFactorSecret);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid 2FA token' });
        }

        // Enable 2FA
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true }
        });

        // Audit log
        await createAuditLog(req.auditInfo, userId, { action: '2FA_ENABLED' });

        res.json({ message: '2FA enabled successfully' });

    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({ error: '2FA verification failed' });
    }
};

/**
 * Login with 2FA
 */
export const login2FA = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.id;

        if (!token) {
            return res.status(400).json({ error: '2FA token is required' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        // Verify token
        const isValid = verifyToken(token, user.twoFactorSecret);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid 2FA token' });
        }

        // Generate new tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });

    } catch (error) {
        console.error('2FA login error:', error);
        res.status(500).json({ error: '2FA login failed' });
    }
};

/**
 * Refresh access token
 */
export const refreshTokenHandler = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Check if token exists in database
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken }
        });

        if (!storedToken || storedToken.expiresAt < new Date()) {
            return res.status(401).json({ error: 'Refresh token expired or invalid' });
        }

        // Generate new access token
        const accessToken = generateAccessToken(decoded.userId);

        res.json({ accessToken });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
};

/**
 * Logout
 */
export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            // Delete refresh token
            await prisma.refreshToken.deleteMany({
                where: { token: refreshToken }
            });
        }

        // Audit log
        await createAuditLog(req.auditInfo, req.user?.id, { action: 'USER_LOGOUT' });

        res.json({ message: 'Logged out successfully' });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};
