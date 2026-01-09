const { spawn } = require('child_process');
const path = require('path');

/**
 * Process OMR image using calibrated answer reader
 * Uses omr_answer_reader.py with calibration.json for precise bubble detection
 * @param {string} imagePath - Path to the OMR image file
 * @returns {Promise<Object>} Processing result with answers and confidence scores
 */
async function processOMRImage(imagePath) {
    return new Promise((resolve, reject) => {
        const pythonPath = 'python';

        // Determine environment (Docker vs local)
        const isDocker = process.env.NODE_ENV === 'production' || require('fs').existsSync('/app/omr-algorithm');

        const omrAlgorithmPath = isDocker
            ? '/app/omr-algorithm'
            : path.join('C:', 'SE_FINAL', 'SE_FINAL_ODEV_SON', 'omr-algorithm');

        const omrAnswerReaderScript = path.join(omrAlgorithmPath, 'omr_answer_reader.py');
        const calibrationPath = path.join(omrAlgorithmPath, 'calibration.json');

        console.log('🔍 Processing OMR image with calibrated reader...');
        console.log(' - Environment:', isDocker ? 'Docker' : 'Local');
        console.log(' - Image:', imagePath);
        console.log(' - Algorithm:', omrAnswerReaderScript);
        console.log(' - Calibration:', calibrationPath);

        // Verify calibration file exists
        const fs = require('fs');
        if (!fs.existsSync(calibrationPath)) {
            console.error('❌ Calibration file not found at:', calibrationPath);
            return reject(new Error('calibration.json not found! Please run calibration first.'));
        }

        // Set timeout for entire operation (30 seconds)
        const timeoutId = setTimeout(() => {
            console.error('❌ OMR processing timeout');
            reject(new Error('OMR processing timeout after 30 seconds'));
        }, 30000);

        // Run omr_answer_reader.py
        const omrProcess = spawn(pythonPath, [omrAnswerReaderScript, imagePath], {
            cwd: omrAlgorithmPath
        });

        let stdoutData = '';
        let stderrData = '';

        // Capture stdout
        omrProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
            console.log('  📝 Python stdout:', data.toString().trim());
        });

        // Capture stderr
        omrProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
            console.error('  ⚠️ Python stderr:', data.toString().trim());
        });

        omrProcess.on('close', (code) => {
            clearTimeout(timeoutId);

            if (code !== 0) {
                console.error('❌ OMR answer reader failed:', stderrData);
                return reject(new Error(`OMR answer reader failed with code ${code}: ${stderrData}`));
            }

            // omr_answer_reader.py creates omr_answers.json in the omr-algorithm folder
            const isDocker = process.env.NODE_ENV === 'production' || fs.existsSync('/app/omr-algorithm');
            const omrAlgorithmPath = isDocker
                ? '/app/omr-algorithm'
                : path.join('C:', 'SE_FINAL', 'SE_FINAL_ODEV_SON', 'omr-algorithm');

            const resultPath = path.join(omrAlgorithmPath, 'omr_answers.json');

            try {
                const resultData = fs.readFileSync(resultPath, 'utf8');
                const result = JSON.parse(resultData);

                if (!result.success) {
                    return reject(new Error('OMR processing failed: ' + (result.error || 'Unknown error')));
                }

                console.log('✅ OMR processing complete');
                console.log(' - Answers detected:', Object.keys(result.answers).length);
                console.log(' - Average confidence:', result.summary.average_confidence);
                console.log(' - Answered:', result.summary.answered);
                console.log(' - Blank:', result.summary.blank);

                // Format for our system
                const formattedAnswers = {};
                const formattedConfidence = {};

                for (let i = 1; i <= 10; i++) {
                    const questionKey = i.toString();
                    formattedAnswers[questionKey] = result.answers[i] || null;
                    formattedConfidence[questionKey] = result.confidence[i] || 0.0;
                }

                resolve({
                    answers: formattedAnswers,
                    confidence: formattedConfidence,
                    testId: null,
                    rollNo: null
                });

            } catch (parseError) {
                console.error('❌ Failed to read result file:', parseError);
                reject(new Error(`Failed to read result: ${parseError.message}`));
            }
        });

        omrProcess.on('error', (error) => {
            clearTimeout(timeoutId);
            console.error('❌ Failed to start OMR answer reader:', error);
            reject(new Error(`Failed to start OMR answer reader: ${error.message}`));
        });
    });
}

/**
 * Process OMR image with full pipeline visualization
 * Runs both pipeline visualizer and answer reader, returns images as base64
 * @param {string} imagePath - Path to the OMR image file
 * @returns {Promise<Object>} Processing result with answers, confidence, and pipeline images
 */
async function processWithVisualization(imagePath) {
    const fs = require('fs');

    // Determine environment
    const isDocker = process.env.NODE_ENV === 'production' || fs.existsSync('/app/omr-algorithm');
    const omrAlgorithmPath = isDocker
        ? '/app/omr-algorithm'
        : path.join('C:', 'SE_FINAL', 'SE_FINAL_ODEV_SON', 'omr-algorithm');

    const outputDir = path.join(omrAlgorithmPath, 'mobile_pipeline_output');

    console.log('🎨 Processing OMR with visualization...');
    console.log(' - Image:', imagePath);
    console.log(' - Output dir:', outputDir);

    // Step 1: Run pipeline visualizer
    await new Promise((resolve, reject) => {
        const pythonPath = 'python';
        const visualizerScript = path.join(omrAlgorithmPath, 'omr_pipeline_visualizer.py');

        const visualizerProcess = spawn(pythonPath, [visualizerScript, imagePath, outputDir], {
            cwd: omrAlgorithmPath,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        });

        let stderr = '';
        visualizerProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        visualizerProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('❌ Pipeline visualizer failed:', stderr);
                reject(new Error(`Pipeline visualizer failed: ${stderr}`));
            } else {
                console.log('✅ Pipeline visualization complete');
                resolve();
            }
        });

        visualizerProcess.on('error', (err) => {
            reject(new Error(`Failed to start visualizer: ${err.message}`));
        });
    });

    // Step 2: Read pipeline images and convert to base64
    const pipelineImages = {};
    const imageFiles = [
        { key: 'a4_detection', file: '1_a4_detection.jpg', label: 'A4 Köşe Algılama' },
        { key: 'a4_corrected', file: '1_a4_corrected.jpg', label: 'Perspektif Düzeltme' },
        { key: 'answer_region_marked', file: '2_answer_region_marked.jpg', label: 'Cevap Bölgesi' },
        { key: 'answer_region_zoomed', file: '2_answer_region_zoomed.jpg', label: 'Cevap Yakınlaştırma' },
        { key: 'bubble_detection', file: '3_bubble_detection.jpg', label: 'Bubble Algılama' }
    ];

    for (const img of imageFiles) {
        const imgPath = path.join(outputDir, img.file);
        try {
            if (fs.existsSync(imgPath)) {
                const imageBuffer = fs.readFileSync(imgPath);
                pipelineImages[img.key] = {
                    base64: imageBuffer.toString('base64'),
                    label: img.label
                };
                console.log(`  ✅ Loaded ${img.key}: ${imageBuffer.length} bytes`);
            } else {
                console.log(`  ⚠️ Missing ${img.file}`);
            }
        } catch (err) {
            console.error(`  ❌ Error loading ${img.file}:`, err.message);
        }
    }

    // Step 3: Get answers using existing function
    const answerResult = await processOMRImage(imagePath);

    return {
        ...answerResult,
        pipelineImages
    };
}

module.exports = {
    processOMRImage,
    processWithVisualization
};
