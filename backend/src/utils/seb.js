import crypto from 'crypto';

/**
 * Safe Exam Browser (SEB) Utilities
 * Handles SEB detection, config generation, and browser key validation
 */

export const sebUtils = {
    /**
     * Check if request is from Safe Exam Browser
     */
    isSEBRequest(req) {
        const userAgent = req.headers['user-agent'] || '';
        return userAgent.includes('SEB');
    },

    /**
     * Generate SEB Config Key Hash
     * This is used to validate that the SEB client is using the correct config
     */
    generateConfigKeyHash(configKey = process.env.SEB_CONFIG_KEY || 'lms-seb-config-key') {
        return crypto
            .createHash('sha256')
            .update(configKey)
            .digest('hex');
    },

    /**
     * Generate SEB Browser Exam Key
     * This is a unique key per exam session
     */
    generateBrowserExamKey(url, configKey = process.env.SEB_CONFIG_KEY) {
        const combinedString = url + configKey;
        return crypto
            .createHash('sha256')
            .update(combinedString)
            .digest('hex');
    },

    /**
     * Validate SEB request headers
     */
    validateSEBHeaders(req, expectedConfigKey = process.env.SEB_CONFIG_KEY) {
        const configKeyHash = req.headers['x-safeexambrowser-configkeyhash'];
        const requestHash = req.headers['x-safeexambrowser-requesthash'];

        if (!configKeyHash || !requestHash) {
            return { valid: false, reason: 'Missing SEB headers' };
        }

        const expectedConfigKeyHash = this.generateConfigKeyHash(expectedConfigKey);

        if (configKeyHash.toLowerCase() !== expectedConfigKeyHash.toLowerCase()) {
            return { valid: false, reason: 'Invalid config key hash' };
        }

        return { valid: true };
    },

    /**
     * Generate SEB Config file content (XML/plist format)
     */
    generateSEBConfig(quizUrl, options = {}) {
        const {
            configKey = process.env.SEB_CONFIG_KEY || 'lms-seb-config-key',
            allowQuit = false,
            allowReload = false,
            showTaskBar = false,
            enablePrintScreen = false,
            allowedURLs = [],
            browserUserAgent = 'SEB'
        } = options;

        const configKeyHash = this.generateConfigKeyHash(configKey);
        const browserExamKey = this.generateBrowserExamKey(quizUrl, configKey);

        // Generate SEB config in plist format
        const config = {
            hashedQuitPassword: '',
            startURL: quizUrl,
            sendBrowserExamKey: true,
            examKeySalt: configKey,
            browserExamKey: browserExamKey,
            quitURL: '',
            hashedAdminPassword: '',
            allowQuit: allowQuit,
            ignoreExitKeys: !allowQuit,
            allowReload: allowReload,
            showReloadButton: allowReload,
            showTaskBar: showTaskBar,
            taskBarHeight: 40,
            enablePrintScreen: enablePrintScreen,
            enableEaseOfAccess: false,
            allowPreferencesWindow: false,
            enableLogging: true,
            logDirectoryOSX: '',
            logDirectoryWin: '',
            allowSpellCheck: false,
            browserMessagingSocket: 'ws://localhost:8706',
            allowDictation: false,
            detectStoppedProcess: true,
            allowSwitchToApplications: false,
            allowFlashFullscreen: false,
            allowVideoCapture: false,
            allowAudioCapture: false,
            URLFilterEnable: true,
            URLFilterEnableContentFilter: false,
            urlFilterBlacklist: [],
            urlFilterWhitelist: allowedURLs,
            browserUserAgent: browserUserAgent,
            browserUserAgentWinDesktopMode: 1,
            browserUserAgentWinTouchMode: 1,
            mainBrowserWindowWidth: '100%',
            mainBrowserWindowHeight: '100%',
            enableBrowserWindowToolbar: false,
            hideBrowserWindowToolbar: true,
            showMenuBar: false,
            showSideMenu: false,
            browserScreenKeyboard: false
        };

        return config;
    }
};
