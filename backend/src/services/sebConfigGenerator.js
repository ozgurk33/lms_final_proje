import crypto from 'crypto';
import plist from 'plist';
import zlib from 'zlib';

/**
 * Safe Exam Browser Config Generator
 * Generates .seb configuration files for quizzes
 * 
 * SEB Config Format:
 * - Uses Apple plist XML format
 * - Can be plain XML, gzip compressed, or encrypted
 * - Windows SEB 3.x requires proper format with magic bytes
 */

// SEB file magic bytes for different formats
const SEB_FORMAT = {
    PLAIN_XML: 0, // <?xml or <plist
    GZIP: 1,      // gzip compressed plist
    ENCRYPTED: 2  // encrypted with password
};

/**
 * Generate unique browser exam key for a quiz
 * @param {string} quizId - Quiz UUID
 * @returns {string} - Browser exam key
 */
export const generateBrowserExamKey = (quizId) => {
    const secret = process.env.SEB_CONFIG_KEY || 'default-seb-secret-key';
    return crypto
        .createHash('sha256')
        .update(`${quizId}-${secret}`)
        .digest('hex');
};

/**
 * Generate SEB configuration for a quiz
 * @param {Object} quiz - Quiz object with id, title, duration
 * @param {string} baseUrl - Application base URL
 * @param {string} userToken - User's access token for auto-login
 * @returns {Object} - SEB config object
 */
export const generateSEBConfig = (quiz, baseUrl = process.env.FRONTEND_URL || 'http://192.168.1.5:5173', userToken = null) => {
    const browserExamKey = generateBrowserExamKey(quiz.id);

    // Build start URL with token for auto-login
    // IMPORTANT: Frontend uses Next.js routing (no hash router), so URL must use standard routing
    // Use seb_token parameter name to match ProtectedRoute
    let startUrl = `${baseUrl}/quizzes/${quiz.id}/take`;
    if (userToken) {
        startUrl += `?seb_token=${encodeURIComponent(userToken)}`;
    }
    const quitUrl = `${baseUrl}/seb-quit`;

    return {
        // Required fields for SEB
        startURL: startUrl,
        startURLAllowDeepLink: false,


        // Exit settings - MANUAL QUIT ENABLED FOR TESTING
        // TODO: Set allowQuit to false before production/demo
        quitURL: quitUrl,
        quitURLConfirm: false,  // Don't ask for confirmation when quitting
        allowQuit: true,        // KEEP TRUE FOR TESTING - disable before demo
        ignoreExitKeys: false,  // Allow Ctrl+Q for testing
        hashedQuitPassword: '',
        restartExamUseStartURL: false,  // Don't allow restart

        // Link-based quit - SEB should close when navigating to quitURL
        restartExamPasswordProtected: false,
        restartExamText: '',
        restartExamURL: '',

        // Browser Identity / Browser Key (1.2p)
        browserExamKey: browserExamKey,
        sendBrowserExamKey: true,
        examSessionClearCookiesOnEnd: true,
        examSessionClearCookiesOnStart: true,

        // Window settings - Kiosk Mode (1.5p) - TAM KİLİT
        mainBrowserWindowWidth: '100%',
        mainBrowserWindowHeight: '100%',
        mainBrowserWindowPositioning: 1,  // 1 = centered
        enableBrowserWindowToolbar: false, // Toolbar gizle
        hideBrowserWindowToolbar: true,
        showMenuBar: false,           // Menü gizle
        showTaskBar: false,           // Taskbar gizle - TAM KİLİT
        showReloadButton: false,      // Refresh butonu yok
        showReloadWarning: true,      // F5 uyarısı
        showTime: true,               // Saat göster
        showInputLanguage: false,

        // Reload control - prevent page refresh
        browserWindowAllowReload: false,
        showReloadWarning: true,

        // Navigation
        allowBrowsingBackForward: false,
        newBrowserWindowByLinkPolicy: 0,
        newBrowserWindowByScriptPolicy: 0,
        newBrowserWindowByLinkBlockForeign: false,

        // Security - Screenshot Block (1.0p)
        enablePrintScreen: false,
        blockScreenShots: true,
        allowScreenSharing: false,

        // Clipboard Block (1.0p)
        enableClipboard: false,

        // Developer Tools Block (0.8p)
        allowDeveloperConsole: false,
        enableJavaScript: true,
        allowFlashFullscreen: false,

        // Spell check
        allowSpellCheck: false,
        allowDictation: false,

        // Kiosk mode - FULL LOCKDOWN ENABLED
        // Manuel çıkış hala çalışır (Ctrl+Q veya quit URL)
        createNewDesktop: true,       // Yeni masaüstü oluştur - TAM KİLİT
        killExplorerShell: true,      // Windows shell'i kapat - TAM KİLİT

        // URL Filter - Allow only our domain (1.0p)
        urlFilterEnable: true,
        urlFilterEnableContentFilter: true,
        URLFilterRulesAsRegex: false,

        // URL Filter Rules - Whitelist approach
        urlFilterRules: [
            {
                active: true,
                regex: false,
                expression: '*',
                action: 0  // 0 = block
            },
            {
                active: true,
                regex: false,
                expression: `${baseUrl}/*`,
                action: 1  // 1 = allow
            },
            {
                active: true,
                regex: false,
                expression: 'localhost:*/*',
                action: 1
            },
            {
                active: true,
                regex: false,
                expression: '192.168.*.*:*/*',
                action: 1
            }
        ],

        // Prohibited Applications (1.2p) - Block cheating apps
        prohibitedProcesses: [
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'Discord.exe', identifier: '', description: 'Discord' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'Telegram.exe', identifier: '', description: 'Telegram' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'WhatsApp.exe', identifier: '', description: 'WhatsApp' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'Slack.exe', identifier: '', description: 'Slack' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'Teams.exe', identifier: '', description: 'MS Teams' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'Zoom.exe', identifier: '', description: 'Zoom' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'Skype.exe', identifier: '', description: 'Skype' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'chrome.exe', identifier: '', description: 'Chrome' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'firefox.exe', identifier: '', description: 'Firefox' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'msedge.exe', identifier: '', description: 'Edge' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'notepad.exe', identifier: '', description: 'Notepad' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'SnippingTool.exe', identifier: '', description: 'Snipping Tool' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'ScreenClippingHost.exe', identifier: '', description: 'Screen Clip' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'mstsc.exe', identifier: '', description: 'Remote Desktop' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'TeamViewer.exe', identifier: '', description: 'TeamViewer' },
            { active: true, currentUser: true, strongKill: false, os: 1, executable: 'AnyDesk.exe', identifier: '', description: 'AnyDesk' }
        ],

        // Additional security
        allowPreferencesWindow: false,

        // Logging
        enableLogging: true,

        // Config metadata
        sebConfigPurpose: 0, // 0 = starting exam
        allowReconfiguration: false,

        // Version info
        originatorVersion: 'SEB_Win_3.5.0'
    };
};

/**
 * Convert config object to plist XML string
 * @param {Object} config - SEB config object
 * @returns {string} - XML plist string
 */
export const sebConfigToPlist = (config) => {
    return plist.build(config);
};

/**
 * Generate complete .seb file content (plain XML - compatible with SEB)
 * SEB 3.x on Windows accepts plain XML plist files
 * @param {Object} quiz - Quiz object
 * @param {string} baseUrl - Application base URL
 * @param {string} userToken - User's access token for auto-login
 * @returns {Buffer} - .seb file content as Buffer
 */
export const generateSEBFile = (quiz, baseUrl, userToken = null) => {
    const config = generateSEBConfig(quiz, baseUrl, userToken);
    const xmlContent = sebConfigToPlist(config);

    // SEB Windows 3.x accepts plain XML plist
    // The XML must start with proper plist declaration
    return Buffer.from(xmlContent, 'utf8');
};

/**
 * Generate gzip compressed SEB file (alternative format)
 * Some SEB versions prefer gzip compressed configs
 * @param {Object} quiz - Quiz object
 * @param {string} baseUrl - Application base URL
 * @returns {Buffer} - Gzip compressed .seb file content
 */
export const generateSEBFileGzip = (quiz, baseUrl) => {
    const config = generateSEBConfig(quiz, baseUrl);
    const xmlContent = sebConfigToPlist(config);

    // Gzip compress the plist XML
    return zlib.gzipSync(Buffer.from(xmlContent, 'utf8'));
};

export default {
    generateBrowserExamKey,
    generateSEBConfig,
    sebConfigToPlist,
    generateSEBFile,
    generateSEBFileGzip,
};

