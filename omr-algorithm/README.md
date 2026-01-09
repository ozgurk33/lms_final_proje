# OMR Algorithm

Python-based Optical Mark Recognition system using OpenCV for automated answer sheet grading.

## Features

- Automatic paper detection and perspective correction
- 10-question answer sheet processing
- Bubble detection with confidence scoring
- Support for various lighting conditions
- Adaptive thresholding
- Debug visualization pipeline

## Tech Stack

- **Language**: Python 3.8+
- **Computer Vision**: OpenCV
- **Image Processing**: NumPy
- **Configuration**: JSON

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run calibration (first time):
```bash
python calibrate_runner.py
```

This creates `calibration.json` with bubble positions.

3. Process an answer sheet:
```bash
python omr_answer_reader.py <image_path>
```

## How It Works

1. **Paper Detection**: Finds A4 sheet edges using contour detection
2. **Perspective Correction**: Warps image to flat perspective
3. **Answer Region Detection**: Locates the answer grid area
4. **Bubble Detection**: Identifies filled vs empty bubbles
5. **Confidence Scoring**: Returns certainty for each answer

## Output Format

```json
{
  "answers": [
    {"question": 1, "answer": "A", "confidence": 0.95},
    {"question": 2, "answer": "B", "confidence": 0.87},
    ...
  ]
}
```

## Visualization

Use `omr_pipeline_visualizer.py` to see each processing step:
```bash
python omr_pipeline_visualizer.py <image_path>
```

This saves intermediate images showing edge detection, corner detection, warping, and bubble detection.

## Troubleshooting

- **Paper not detected**: Ensure good lighting and contrast with background
- **Wrong answers**: Re-run calibration with a clean test form
- **Low confidence**: Check image quality and ensure bubbles are clearly filled
