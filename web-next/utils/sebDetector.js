/**
 * Safe Exam Browser Detection Utility
 * Detects if the application is running inside Safe Exam Browser
 */

/**
 * Check if current browser is Safe Exam Browser
 * @returns {boolean} - True if running in SEB
 */
export const isSEBBrowser = () => {
    // SSR-safe: check if we're in browser
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return false;
    }

    // Check user agent
    const userAgent = navigator.userAgent || '';
    if (userAgent.includes('SEB/')) {
        return true;
    }

    // Check for SEB-specific properties
    if (window.SafeExamBrowser || window.seb) {
        return true;
    }

    // Check for SEB navigator properties
    if (navigator.userAgent && navigator.userAgent.match(/SEB [\d.]+/)) {
        return true;
    }

    return false;
};

/**
 * Get SEB version if available
 * @returns {string|null} - SEB version or null
 */
export const getSEBVersion = () => {
    const userAgent = navigator.userAgent || '';
    const match = userAgent.match(/SEB\/([\d.]+)/);
    return match ? match[1] : null;
};

/**
 * Download SEB config file for a quiz
 * @param {string} quizId - Quiz UUID
 * @param {string} quizTitle - Quiz title for filename
 */
export const downloadSEBConfig = async (quizId, quizTitle = 'Quiz') => {
    try {
        // Get API URL and token
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

        // Get token from auth store (stored in localStorage as 'auth')
        let token = null;
        try {
            const authStorage = localStorage.getItem('auth');
            if (authStorage) {
                const parsed = JSON.parse(authStorage);
                token = parsed?.token;
            }
        } catch (e) {
            console.error('Failed to parse auth storage:', e);
        }

        if (!token) {
            throw new Error('Not authenticated. Please log in first.');
        }

        const response = await fetch(`${API_URL}/quizzes/${quizId}/seb-config`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to download SEB config');
        }

        // Get the file content
        const blob = await response.blob();

        // --- SIMPLIFIED: Backend now generates correct Next.js URLs ---
        // No need to fix /#/ syntax anymore, but we still update the origin
        // and verify/inject token if needed
        const textContent = await blob.text();

        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(textContent, "text/xml");

            // Navigate the PList structure
            const keys = xmlDoc.getElementsByTagName('key');
            let found = false;

            for (let i = 0; i < keys.length; i++) {
                if (keys[i].textContent === 'startURL') {
                    // The next sibling should be the <string> tag containing the URL
                    let nextNode = keys[i].nextElementSibling;

                    // Skip text nodes (whitespace) if any
                    while (nextNode && nextNode.nodeType !== 1) { // 1 is ELEMENT_NODE
                        nextNode = nextNode.nextSibling;
                    }

                    if (nextNode && nextNode.tagName === 'string') {
                        let originalUrl = nextNode.textContent;
                        let fixedUrl = originalUrl;

                        console.log('Original SEB URL:', originalUrl);

                        // FIX HOST: Replace any IP/localhost with current window origin
                        // This ensures the URL works on different machines/networks
                        try {
                            // Simple replacement logic: replace everything before /quizzes/
                            const pathIndex = fixedUrl.indexOf('/quizzes/');
                            if (pathIndex !== -1) {
                                const newOrigin = window.location.origin; // http://localhost:5173
                                const pathAndQuery = fixedUrl.substring(pathIndex);
                                fixedUrl = `${newOrigin}${pathAndQuery}`;
                                console.log('🔧 SEB Config: Updated origin to', newOrigin);
                            }
                        } catch (e) {
                            console.warn('Failed to parse/fix URL origin', e);
                        }

                        // VERIFY TOKEN: Ensure token is present (backend should have added it)
                        if (!fixedUrl.includes('seb_token=')) {
                            console.warn('⚠️ SEB Config: Token not found in URL, adding it now');
                            const separator = fixedUrl.includes('?') ? '&' : '?';
                            fixedUrl = `${fixedUrl}${separator}seb_token=${token}`;
                        } else {
                            console.log('✅ SEB Config: Token already present in URL');
                        }

                        // Update the DOM
                        nextNode.textContent = fixedUrl;
                        found = true;

                        console.log('✅ SEB Config: Final Start URL:', fixedUrl);
                    }
                }
            }

            if (found) {
                // Serialize back to string
                const serializer = new XMLSerializer();
                const modifiedContent = serializer.serializeToString(xmlDoc);
                const newBlob = new Blob([modifiedContent], { type: 'application/seb' });
                const url = window.URL.createObjectURL(newBlob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `${quizTitle.replace(/[^a-z0-9]/gi, '_')}_SEB.seb`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                return { success: true };
            } else {
                console.warn('⚠️ SEB Config: StartURL key not found in XML');
                throw new Error('StartURL key not found');
            }

        } catch (parseError) {
            console.error('XML Parsing/Modification Error:', parseError);
            // Fallback: download as-is
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${quizTitle.replace(/[^a-z0-9]/gi, '_')}_SEB.seb`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            return { success: true };
        }

    } catch (error) {
        console.error('SEB config download error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Show SEB warning message
 * @returns {string} - Warning message
 */
export const getSEBWarningMessage = () => {
    return 'This quiz requires Safe Exam Browser. Please download the SEB configuration file and open it to start the quiz.';
};

/**
 * Check if SEB is required in environment
 * @returns {boolean} - True if SEB is required
 */
export const isSEBRequired = () => {
    // In development, SEB might not be required
    return process.env.NEXT_PUBLIC_REQUIRE_SEB === 'true';
};

export default {
    isSEBBrowser,
    getSEBVersion,
    downloadSEBConfig,
    getSEBWarningMessage,
    isSEBRequired,
};
