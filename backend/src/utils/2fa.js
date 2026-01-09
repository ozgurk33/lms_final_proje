import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Generate 2FA secret for user
 */
export const generateSecret = (username) => {
    const secret = speakeasy.generateSecret({
        name: `LMS (${username})`,
        length: 32
    });

    return {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url
    };
};

/**
 * Generate QR code from otpauth URL
 */
export const generateQRCode = async (otpauthUrl) => {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
        return qrCodeDataUrl;
    } catch (error) {
        throw new Error('Failed to generate QR code');
    }
};

/**
 * Verify TOTP token
 */
export const verifyToken = (token, secret) => {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps before/after
    });
};
