'use client';

import React, { useState } from 'react';
import { Download, Lock, AlertCircle } from 'lucide-react';
import { downloadSEBConfig } from '../utils/sebDetector';

/**
 * SEB Download Button Component
 * Shows button to download Safe Exam Browser configuration
 */
export default function SEBDownloadButton({ quizId, quizTitle, className = '' }) {
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);

    const handleDownload = async () => {
        setDownloading(true);
        setError(null);

        const result = await downloadSEBConfig(quizId, quizTitle);

        if (result.success) {
            // Success - file downloaded
            setDownloading(false);
        } else {
            setError(result.error || 'Failed to download config');
            setDownloading(false);
        }
    };

    return (
        <div className={`seb-download-container ${className}`}>
            <button
                onClick={handleDownload}
                disabled={downloading}
                className="seb-download-btn bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {downloading ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Downloading...</span>
                    </>
                ) : (
                    <>
                        <Download className="w-5 h-5" />
                        <span>Download SEB Config</span>
                    </>
                )}
            </button>

            {error && (
                <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                    <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-blue-900 mb-2">How to take this quiz:</p>
                        <ol className="list-decimal list-inside space-y-1 text-blue-800">
                            <li>Click &quot;Download SEB Config&quot; above</li>
                            <li>Open the downloaded .seb file</li>
                            <li>Safe Exam Browser will open automatically</li>
                            <li>The quiz will start in secure mode</li>
                            <li>Complete the quiz and click &quot;Submit&quot;</li>
                            <li>Close SEB when finished</li>
                        </ol>
                        <p className="mt-3 text-xs text-blue-700">
                            <strong>Note:</strong> You must have Safe Exam Browser installed.
                            Download from <a href="https://safeexambrowser.org/download_en.html" target="_blank" rel="noopener noreferrer" className="underline">safeexambrowser.org</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
