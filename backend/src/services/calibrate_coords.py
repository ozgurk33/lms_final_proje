#!/usr/bin/env python3
"""
Coordinate Calibrator - Görseldeeki bubbles'ları analiz et ve gerçek koordinatları bul
"""
import cv2
import numpy as np
import json

# Load warped BLANK form (not filled)
img = cv2.imread('debug_omr_test_omr_sheet_warped.jpg')

if img is None:
    print("ERROR: Could not load warped image")
    exit(1)

h, w = img.shape[:2]
print(f"Image size: {w}x{h}")

# Find bubbles with relaxed filters
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
enhanced = clahe.apply(gray)
thresh = cv2.adaptiveThreshold(enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)

kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Filter bubbles in answer zone (y > 350, y < 750)
answer_bubbles = []
for contour in contours:
    (x, y, w, h) = cv2.boundingRect(contour)
    area = cv2.contourArea(contour)
    
    # Answer zone filter (relaxed - bottom 60% of image)
    answer_zone_start = int(h * 0.40)
    if y < answer_zone_start or y > h - 50:
        continue
    
    # Size filter
    if area < 150 or area > 800:
        continue
    
    # Aspect ratio
    ar = w / float(h)
    if ar < 0.7 or ar > 1.3:
        continue
    
    # Circularity
    perimeter = cv2.arcLength(contour, True)
    if perimeter == 0:
        continue
    circularity = 4 * np.pi * area / (perimeter ** 2)
    if circularity < 0.60:
        continue
    
    answer_bubbles.append({
        'x': x,
        'y': y,
        'w': w,
        'h': h,
        'cx': x + w//2,
        'cy': y + h//2
    })

# Sort by Y then X
answer_bubbles.sort(key=lambda b: (b['cy'], b['cx']))

print(f"Found {len(answer_bubbles)} answer bubbles")

# Group into rows
rows = []
if len(answer_bubbles) > 0:
    current_row = [answer_bubbles[0]]
    for b in answer_bubbles[1:]:
        if abs(b['cy'] - current_row[0]['cy']) <= 25:
            current_row.append(b)
        else:
            if len(current_row) >= 16:
                rows.append(current_row)
            current_row = [b]
    if len(current_row) >= 16:
        rows.append(current_row)

# Sort each row by X
for row in rows:
    row.sort(key=lambda b: b['cx'])

print(f"\nDetected {len(rows)} rows")

# Build template
template = {}
for row_idx in range(min(10, len(rows))):
    row_bubbles = rows[row_idx]
    num_bubbles = len(row_bubbles)
    bubbles_per_q = num_bubbles // 5
    
    print(f"\nRow {row_idx+1}: {num_bubbles} bubbles, ~{bubbles_per_q} per question")
    
    for col_idx in range(5):
        question_num = (col_idx * 10) + row_idx + 1
        if question_num > 50:
            break
        
        start_idx = col_idx * bubbles_per_q
        end_idx = start_idx + bubbles_per_q if col_idx < 4 else num_bubbles
        q_bubbles = row_bubbles[start_idx:end_idx]
        
        # Take last 4 bubbles
        option_bubbles = q_bubbles[-4:]
        
        if len(option_bubbles) == 4:
            template[str(question_num)] = [
                {'x': b['x'], 'y': b['y'], 'w': b['w'], 'h': b['h']}
                for b in option_bubbles
            ]
            
            # Print first question of each column for verification
            if row_idx == 0:
                print(f"  Q{question_num}: x={option_bubbles[0]['x']}, y={option_bubbles[0]['y']}")

# Save
with open('omr_template_calibrated.json', 'w') as f:
    json.dump(template, f, indent=2)

print(f"\n✅ Calibrated template saved with {len(template)} questions")
print("✅ File: omr_template_calibrated.json")
