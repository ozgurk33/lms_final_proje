"""
Two-Stage OMR Pipeline
1. Perspective correction 
2. Bubble detection using proven omr_reader.py logic
Returns only first 10 questions
"""

import cv2
import numpy as np
import json
import sys
from pathlib import Path

# Configuration - matching working omr_reader.py
NUM_QUESTIONS = 10  # We want 10 questions
GRID_COLS = 5  # 5 columns (matches omr_reader)
GRID_ROWS = 10  # 10 rows per column (matches omr_reader) 
OPTIONS = ["A", "B", "C", "D"]

# Detection thresholds from working omr_reader
FILL_THRESHOLD = 0.20
MIN_SEPARATION = 0.10

# Target dimensions
TARGET_WIDTH = 800
TARGET_HEIGHT = 1100

# ROI ratios from working omr_reader
ROI_Y_START = 0.38
ROI_Y_END = 0.92
ROI_X_START = 0.04
ROI_X_END = 0.96


def order_points(pts):
    """Order 4 corner points: top-left, top-right, bottom-right, bottom-left"""
    rect = np.zeros((4, 2), dtype="float32")
    
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # top-left
    rect[2] = pts[np.argmax(s)]  # bottom-right
    
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # top-right
    rect[3] = pts[np.argmax(diff)]  # bottom-left
    
    return rect


def find_paper_contour(image):
    """Find paper boundaries in image"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    
    # Dilate edges
    kernel = np.ones((5, 5), np.uint8)
    edges = cv2.dilate(edges, kernel,iterations=2)
    
    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return None
    
    # Get largest contour
    largest_contour = max(contours, key=cv2.contourArea)
    
    # Check if it's large enough
    image_area = image.shape[0] * image.shape[1]
    contour_area = cv2.contourArea(largest_contour)
    
    if contour_area < image_area * 0.1:  # At least 10% of image
        return None
    
    # Approximate to quadrilateral
    epsilon = 0.02 * cv2.arcLength(largest_contour, True)
    approx = cv2.approxPolyDP(largest_contour, epsilon, True)
    
    if len(approx) == 4:
        return approx.reshape(4, 2)
    
    return None


def correct_perspective(image):
    """Apply perspective correction to image"""
    # Find paper contour
    corners = find_paper_contour(image)
    
    if corners is None:
        # If no contour found, use entire image
        h, w = image.shape[:2]
        corners = np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype="float32")
    
    # Order corners
    rect = order_points(corners)
    
    # Calculate destination points
    dst = np.array([
        [0, 0],
        [TARGET_WIDTH - 1, 0],
        [TARGET_WIDTH - 1, TARGET_HEIGHT - 1],
        [0, TARGET_HEIGHT - 1]
    ], dtype="float32")
    
    # Get perspective transform matrix
    M = cv2.getPerspectiveTransform(rect, dst)
    
    # Apply perspective transformation
    warped = cv2.warpPerspective(image, M, (TARGET_WIDTH, TARGET_HEIGHT))
    
    return warped


def detect_bubbles(warped_image):
    """Detect filled bubbles in warped OMR sheet - using working omr_reader logic"""
    # Convert to grayscale
    gray = cv2.cvtColor(warped_image, cv2.COLOR_BGR2GRAY)
    
    # Apply adaptive thresholding (same as omr_reader)
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        15, 3
    )
    
    # Morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=1)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
    
    # Extract ROI
    h, w = thresh.shape
    roi_y1 = int(h * ROI_Y_START)
    roi_y2 = int(h * ROI_Y_END)
    roi_x1 = int(w * ROI_X_START)
    roi_x2 = int(w * ROI_X_END)
    
    roi = thresh[roi_y1:roi_y2, roi_x1:roi_x2]
    roi_h, roi_w = roi.shape
    
    # Calculate grid parameters (5 columns x 10 rows like omr_reader)
    col_width = roi_w / GRID_COLS
    row_height = roi_h / GRID_ROWS
    option_width = col_width / len(OPTIONS)
    
    all_answers = {}
    all_confidence = {}
    
    # Process all 50 questions but return only first 10
    total_questions = GRID_COLS * GRID_ROWS  # 50
    
    for q_num in range(1, total_questions + 1):
        # Calculate grid position (5 columns)
        col = (q_num - 1) // GRID_ROWS
        row = (q_num - 1) % GRID_ROWS
        
        # Calculate position in ROI
        x_start = int(col * col_width)
        y_center = int((row + 0.5) * row_height)
        
        # Measure fill ratio for each option
        fill_ratios = {}
        for opt_idx, option in enumerate(OPTIONS):
            opt_x = int(x_start + (opt_idx + 0.5) * option_width)
            
            # Define bubble region
            bubble_radius = min(int(option_width * 0.3), int(row_height * 0.25))
            
            y1 = max(0, y_center - bubble_radius)
            y2 = min(roi_h, y_center + bubble_radius)
            x1 = max(0, opt_x - bubble_radius)
            x2 = min(roi_w, opt_x + bubble_radius)
            
            bubble = roi[y1:y2, x1:x2]
            
            if bubble.size > 0:
                fill_ratios[option] = np.sum(bubble == 255) / bubble.size
            else:
                fill_ratios[option] = 0
        
        # Find marked answer
        max_fill = max(fill_ratios.values())
        sorted_fills = sorted(fill_ratios.values(), reverse=True)
        
        if max_fill >= FILL_THRESHOLD:
            if len(sorted_fills) > 1:
                separation = max_fill - sorted_fills[1]
                if separation >= MIN_SEPARATION:
                    marked_option = max(fill_ratios, key=fill_ratios.get)
                    all_answers[q_num] = marked_option
                    all_confidence[q_num] = float(max_fill)
                else:
                    all_answers[q_num] = None
                    all_confidence[q_num] = 0.5
            else:
                marked_option = max(fill_ratios, key=fill_ratios.get)
                all_answers[q_num] = marked_option
                all_confidence[q_num] = float(max_fill)
        else:
            all_answers[q_num] = None
            all_confidence[q_num] = 0.0
    
    # Return only first 10 questions
    answers = {i: all_answers.get(i) for i in range(1, NUM_QUESTIONS + 1)}
    confidence = {i: all_confidence.get(i, 0.0) for i in range(1, NUM_QUESTIONS + 1)}
    
    return answers, confidence


def process_omr_image(image_path):
    """Main pipeline: perspective correction + bubble detection"""
    try:
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            return {
                "success": False,
                "error": "Failed to load image"
            }
        
        # Stage 1: Perspective correction
        warped = correct_perspective(image)
        
        # Stage 2: Bubble detection
        answers, confidence = detect_bubbles(warped)
        
        # Calculate average confidence
        valid_confidences = [c for c in confidence.values() if c > 0]
        avg_confidence = sum(valid_confidences) / len(valid_confidences) if valid_confidences else 0
        
        # Check if validation needed
        requires_validation = avg_confidence < 0.6 or any(c < 0.5 for c in confidence.values() if c > 0)
        
        return {
            "success": True,
            "answers": answers,
            "confidence": confidence,
            "requires_validation": requires_validation,
            "question_count": NUM_QUESTIONS
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No image path provided"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = process_omr_image(image_path)
    print(json.dumps(result))
