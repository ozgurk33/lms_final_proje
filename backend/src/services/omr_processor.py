#!/usr/bin/env python3
"""
OMR Processor - Grid-based approach for 50 questions
Focuses ONLY on the question grid area (1-50, A-D options)
"""

import cv2
import numpy as np
import json
import sys
from pathlib import Path


class OMRProcessor:
    """Processes OMR answer sheets - 50 questions, 4 options each"""
    
    def __init__(self, debug=False):
        self.debug = debug
        # Configuration for 10-question sheet (2 columns x 5 rows)
        self.config = {
            "num_questions": 10,
            "options": ["A", "B", "C", "D"],
            "bubble_threshold": 0.20,  # 20% filled = marked (improved)
            "min_separation": 0.10,    # Minimum 10% difference between marked and unmarked
            "confidence_threshold": 0.5,
            "target_width": 700,
            "target_height": 1000,
            "grid_cols": 2,  # 2 columns
            "grid_rows": 5,  # 5 rows
        }
        
    def process_image(self, image_path):
        """Main processing function"""
        try:
            # Load image
            image = cv2.imread(str(image_path))
            if image is None:
                raise ValueError(f"Failed to load image: {image_path}")
            
            if self.debug:
                cv2.imwrite("debug_01_original.jpg", image)
            
            # Preprocess
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            warped = self._warp_perspective(gray)
            
            # Improved adaptive thresholding
            thresh = cv2.adaptiveThreshold(
                warped, 255, 
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY_INV, 
                15, 3  # Better contrast
            )
            
            # Morphological operations - reduce noise and strengthen marks
            kernel = np.ones((2, 2), np.uint8)
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
            
            if self.debug:
                cv2.imwrite("debug_02_warped.jpg", warped)
                cv2.imwrite("debug_03_threshold.jpg", thresh)
            
            # Define question grid ROI (Region of Interest)
            # Based on template: questions start around 35% from top, go to 90%
            roi_y_start = int(warped.shape[0] * 0.35)
            roi_y_end = int(warped.shape[0] * 0.90)
            roi_x_start = int(warped.shape[1] * 0.05)
            roi_x_end = int(warped.shape[1] * 0.95)
            
            # Extract ROI
            roi = thresh[roi_y_start:roi_y_end, roi_x_start:roi_x_end]
            roi_gray = warped[roi_y_start:roi_y_end, roi_x_start:roi_x_end]
            
            if self.debug:
                cv2.imwrite("debug_04_roi.jpg", roi)
            
            # Detect bubbles in ROI using grid approach
            answers, confidence = self._extract_answers_grid(roi, roi_gray)
            
            return {
                "success": True,
                "answers": answers,
                "confidence": confidence,
                "requires_validation": any(c < self.config["confidence_threshold"] 
                                         for c in confidence.values() if c > 0),
                "question_count": self.config["num_questions"]
            }
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e),
                "answers": {},
                "confidence": {}
            }
    
    def _warp_perspective(self, gray_image):
        """Warp perspective to fix skew"""
        blurred = cv2.GaussianBlur(gray_image, (5, 5), 0)
        edged = cv2.Canny(blurred, 50, 150)
        
        contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            sheet_contour = max(contours, key=cv2.contourArea)
            peri = cv2.arcLength(sheet_contour, True)
            approx = cv2.approxPolyDP(sheet_contour, 0.02 * peri, True)
            
            if len(approx) == 4:
                pts = approx.reshape(4, 2)
                rect = self._order_points(pts)
                
                dst = np.array([
                    [0, 0],
                    [self.config["target_width"] - 1, 0],
                    [self.config["target_width"] - 1, self.config["target_height"] - 1],
                    [0, self.config["target_height"] - 1]
                ], dtype="float32")
                
                M = cv2.getPerspectiveTransform(rect, dst)
                warped = cv2.warpPerspective(gray_image, M, 
                                            (self.config["target_width"], 
                                             self.config["target_height"]))
                return warped
        
        return cv2.resize(gray_image, (self.config["target_width"], 
                                       self.config["target_height"]))
    
    def _order_points(self, pts):
        """Order points: top-left, top-right, bottom-right, bottom-left"""
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        return rect
    
    def _extract_answers_grid(self, thresh_roi, gray_roi):
        """
        Extract answers using grid-based approach
        Questions are arranged in 5 columns × 10 rows
        """
        answers = {}
        confidence = {}
        
        height, width = thresh_roi.shape
        
        # Grid structure: 2 columns x 5 rows (Questions 1-10)
        num_cols = self.config["grid_cols"]
        num_rows = self.config["grid_rows"]
        num_options = 4  # A, B, C, D
        
        # Calculate grid dimensions
        col_width = width / num_cols
        row_height = height / num_rows
        
        # For each bubble
        bubble_width = col_width / (num_options + 1)  # +1 for spacing
        bubble_height = row_height * 0.6  # Bubbles take ~60% of row height
        
        if self.debug:
            debug_img = cv2.cvtColor(gray_roi, cv2.COLOR_GRAY2BGR)
        
        question_num = 1
        
        # Iterate through grid
        for col in range(num_cols):
            for row in range(num_rows):
                if question_num > self.config["num_questions"]:
                    break
                
                option_fills = {}
                
                # Base position for this question
                base_x = int(col * col_width)
                base_y = int(row * row_height + row_height * 0.2)  # Start 20% down in row
                
                # Check each option (A, B, C, D)
                for opt_idx, option in enumerate(self.config["options"]):
                    # Calculate bubble position
                    bubble_x = int(base_x + (opt_idx + 0.5) * bubble_width)
                    bubble_y = base_y
                    bubble_w = int(bubble_width * 0.6)
                    bubble_h = int(bubble_height)
                    
                    # Extract bubble region
                    x1 = max(0, bubble_x - bubble_w // 2)
                    x2 = min(width, bubble_x + bubble_w // 2)
                    y1 = max(0, bubble_y)
                    y2 = min(height, bubble_y + bubble_h)
                    
                    if x2 <= x1 or y2 <= y1:
                        option_fills[option] = 0.0
                        continue
                    
                    bubble_region = thresh_roi[y1:y2, x1:x2]
                    
                    if bubble_region.size == 0:
                        option_fills[option] = 0.0
                        continue
                    
                    # Calculate fill percentage
                    fill_pct = np.sum(bubble_region == 255) / bubble_region.size
                    option_fills[option] = fill_pct
                    
                    # Debug visualization
                    if self.debug:
                        color = (0, 255, 0) if fill_pct > self.config["bubble_threshold"] else (0, 0, 255)
                        cv2.rectangle(debug_img, (x1, y1), (x2, y2), color, 1)
                        cv2.putText(debug_img, f"{option}", (x1, y1-2), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.3, color, 1)
                
                # Determine answer with improved confidence
                if option_fills:
                    max_fill = max(option_fills.values())
                    
                    # Calculate separation between top two marks
                    fills_sorted = sorted(option_fills.values(), reverse=True)
                    separation = fills_sorted[0] - fills_sorted[1] if len(fills_sorted) > 1 else fills_sorted[0]
                    
                    # Strict detection criteria
                    if max_fill > self.config["bubble_threshold"] and separation > self.config["min_separation"]:
                        marked_option = max(option_fills, key=option_fills.get)
                        answers[question_num] = marked_option
                        
                        # Enhanced confidence calculation
                        base_confidence = min(1.0, max_fill / self.config["bubble_threshold"])
                        separation_boost = 1.0 + (separation * 2)
                        conf = min(1.0, base_confidence * separation_boost * 0.6)
                        confidence[question_num] = conf
                    elif max_fill > self.config["bubble_threshold"]:
                        # Threshold passed but low separation
                        marked_option = max(option_fills, key=option_fills.get)
                        answers[question_num] = marked_option
                        confidence[question_num] = 0.5
                    else:
                        answers[question_num] = None
                        confidence[question_num] = 1.0 - max_fill
                else:
                    answers[question_num] = None
                    confidence[question_num] = 0.0
                
                # Add question number to debug image
                if self.debug:
                    cv2.putText(debug_img, f"Q{question_num}", 
                              (base_x, base_y - 5),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 0), 1)
                
                question_num += 1
        
        if self.debug:
            cv2.imwrite("debug_05_grid_annotated.jpg", debug_img)
        
        return answers, confidence


def main():
    if len(sys.argv) < 2:
        print("Usage: python omr_processor.py <image_path> [--debug]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    debug = "--debug" in sys.argv
    
    processor = OMRProcessor(debug=debug)
    result = processor.process_image(image_path)
    
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
