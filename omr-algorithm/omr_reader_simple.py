"""
Simple OMR Reader with Darkness-Based Fill Detection
Assumes corrected_output.jpg from perspective.py
Only focuses on detecting which bubble is darkest (= filled)
"""

import cv2
import numpy as np
import json
import sys

# 15 questions, 5 columns x 10 rows per column (first 3 columns = 10 questions each)
NUM_QUESTIONS = 15
GRID_COLS = 5
GRID_ROWS = 10
OPTIONS = ["A", "B", "C", "D"]

# ROI (answer region) - from working omr_reader
ROI_Y_START_RATIO = 0.38
ROI_Y_END_RATIO = 0.92
ROI_X_START_RATIO = 0.04
ROI_X_END_RATIO = 0.96


def detect_filled_bubbles(image_path):
    """
    Detect filled bubbles using DARKNESS comparison
    """
    # Load corrected image
    img = cv2.imread(image_path)
    if img is None:
        return {"success": False, "error": "Failed to load image"}
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    
    # Extract ROI (answer region)
    roi_y1 = int(h * ROI_Y_START_RATIO)
    roi_y2 = int(h * ROI_Y_END_RATIO)
    roi_x1 = int(w * ROI_X_START_RATIO)
    roi_x2 = int(w * ROI_X_END_RATIO)
    
    roi = gray[roi_y1:roi_y2, roi_x1:roi_x2]
    roi_h, roi_w = roi.shape
    
    # Calculate grid parameters
    col_width = roi_w / GRID_COLS
    row_height = roi_h / GRID_ROWS
    
    answers = {}
    confidence = {}
    
    # Process each question
    for q_num in range(1, NUM_QUESTIONS + 1):
        # Calculate grid position (5 columns x 10 rows)
        col = (q_num - 1) // GRID_ROWS
        row = (q_num - 1) % GRID_ROWS
        
        # Calculate row center Y position
        y_center = int((row + 0.5) * row_height)
        
        # Calculate column start X position
        x_start = int(col * col_width)
        
        # Measure DARKNESS for each option (A, B, C, D)
        option_darkness = {}
        
        for opt_idx, option in enumerate(OPTIONS):
            # Calculate bubble X position within the column
            # Options are spread evenly across the column width
            bubble_x = int(x_start + (opt_idx + 0.5) * (col_width / len(OPTIONS)))
            
            # Define bubble sampling region
            # Use a reasonable bubble size (30% of option width, 30% of row height)
            bubble_w = int((col_width / len(OPTIONS)) * 0.3)
            bubble_h = int(row_height * 0.3)
            
            # Extract bubble region
            bx1 = max(0, bubble_x - bubble_w)
            bx2 = min(roi_w, bubble_x + bubble_w)
            by1 = max(0, y_center - bubble_h)
            by2 = min(roi_h, y_center + bubble_h)
            
            bubble_region = roi[by1:by2, bx1:bx2]
            
            if bubble_region.size > 0:
                # Calculate MEAN INTENSITY
                # Lower value = DARKER = More likely to be filled
                # 0 = pure black, 255 = pure white
                mean_intensity = np.mean(bubble_region)
                option_darkness[option] = mean_intensity
            else:
                option_darkness[option] = 255  # White (empty)
        
        # Find the DARKEST option (minimum intensity)
        darkest_option = min(option_darkness, key=option_darkness.get)
        darkest_value = option_darkness[darkest_option]
        
        # Find the LIGHTEST option (maximum intensity)
        lightest_value = max(option_darkness.values())
        
        # Calculate CONTRAST (difference between darkest and lightest)
        contrast = lightest_value - darkest_value
        
        # Decision logic:
        # 1. Darkest bubble must be sufficiently DARK (below 180)
        # 2. Must have good CONTRAST between dark and light (at least 25)
        if darkest_value < 180 and contrast >= 25:
            answers[q_num] = darkest_option
            # Confidence based on contrast (higher = more confident)
            confidence[q_num] = min(float(contrast / 80.0), 1.0)
        else:
            # No clear mark
            answers[q_num] = None
            confidence[q_num] = 0.0
    
    # Calculate summary
    answered = sum(1 for ans in answers.values() if ans is not None)
    avg_conf = sum(confidence.values()) / len(confidence) if confidence else 0
    
    return {
        "success": True,
        "answers": answers,
        "confidence": confidence,
        "answer_string": "".join([answers.get(i, '-') or '-' for i in range(1, NUM_QUESTIONS + 1)]),
        "summary": {
            "total": NUM_QUESTIONS,
            "answered": answered,
            "blank": NUM_QUESTIONS - answered,
            "average_confidence": round(avg_conf, 2)
        }
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No image path provided"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = detect_filled_bubbles(image_path)
    
    # Save to JSON file
    with open("omr_result.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    # Print to stdout
    print(json.dumps(result, indent=2))
    
    # Print summary
    if result["success"]:
        print(f"\n{'='*50}")
        print(f"Detected: {result['answer_string']}")
        print(f"Answered: {result['summary']['answered']}/{result['summary']['total']}")
        print(f"Confidence: {result['summary']['average_confidence']:.0%}")
        print(f"{'='*50}")
