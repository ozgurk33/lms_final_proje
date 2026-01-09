#!/usr/bin/env python3
"""
PROPER Bubble Detection and Template Creation
Analyze the actual warped image and extract REAL bubble positions
"""
import cv2
import numpy as np
import json

# Load blank warped form
img = cv2.imread('debug_omr_test_omr_sheet_warped.jpg')

if img is None:
    print("ERROR: Could not load image")
    exit(1)

h, w = img.shape[:2]
print(f"Image size: {w}x{h}")

# Enhanced bubble detection
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Apply CLAHE
clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
enhanced = clahe.apply(gray)

# Adaptive threshold
thresh = cv2.adaptiveThreshold(enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 3)

# Morphological operations
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)

# Save threshold for debugging
cv2.imwrite('debug_calibration_threshold.jpg', thresh)

# Find contours
contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

print(f"Total contours found: {len(contours)}")

# Filter bubbles VERY CAREFULLY
all_bubbles = []
for contour in contours:
    (x, y, bw, bh) = cv2.boundingRect(contour)
    area = cv2.contourArea(contour)
    
    # Size filter - RELAXED
    if area < 100 or area > 1000:
        continue
    
    # Aspect ratio - RELAXED
    ar = bw / float(bh)
    if ar < 0.6 or ar > 1.4:
        continue
    
    # Circularity - RELAXED
    perimeter = cv2.arcLength(contour, True)
    if perimeter == 0:
        continue
    circularity = 4 * np.pi * area / (perimeter ** 2)
    if circularity < 0.55:  # Very relaxed
        continue
    
    all_bubbles.append({
        'x': x, 'y': y, 'w': bw, 'h': bh,
        'cx': x + bw//2, 'cy': y + bh//2,
        'area': area, 'circ': circularity
    })

print(f"Filtered bubbles: {len(all_bubbles)}")

# Filter to answer zone ONLY
# "A B C D" headers are around y=335-345
# Last row ends around y=780-800
# Extend range to be sure we get everything
answer_zone_start_y = 330  # Just below "A B C D" headers
answer_zone_end_y = 850    # Well below last row

answer_bubbles = [b for b in all_bubbles if answer_zone_start_y <= b['cy'] <= answer_zone_end_y]

print(f"Answer zone bubbles: {len(answer_bubbles)}")

if len(answer_bubbles) < 100:
    print(f"WARNING: Only {len(answer_bubbles)} bubbles found, expected ~200")
    print("Retrying with even more relaxed filters...")
    
    # Super relaxed retry
    answer_bubbles = []
    for contour in contours:
        (x, y, bw, bh) = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        
        if area < 80 or area > 1200:
            continue
        
        ar = bw / float(bh)
        if ar < 0.5 or ar > 1.5:
            continue
        
        if answer_zone_start_y <= y + bh//2 <= answer_zone_end_y:
            answer_bubbles.append({
                'x': x, 'y': y, 'w': bw, 'h': bh,
                'cx': x + bw//2, 'cy': y + bh//2
            })
    
    print(f"Retry result: {len(answer_bubbles)} bubbles")

# Sort by Y then X
answer_bubbles.sort(key=lambda b: (b['cy'], b['cx']))

# Visual debug - draw all detected bubbles
debug_img = img.copy()
for b in answer_bubbles:
    cv2.rectangle(debug_img, (b['x'], b['y']), (b['x'] + b['w'], b['y'] + b['h']), (0, 255, 0), 1)
    cv2.circle(debug_img, (b['cx'], b['cy']), 2, (0, 0, 255), -1)

cv2.imwrite('debug_all_detected_bubbles.jpg', debug_img)
print("✓ Saved: debug_all_detected_bubbles.jpg")

# Group into rows by Y coordinate clustering
print("\n=== GROUPING INTO ROWS ===")

if len(answer_bubbles) == 0:
    print("ERROR: No bubbles found!")
    exit(1)

rows = []
current_row = [answer_bubbles[0]]
ROW_TOLERANCE = 20  # pixels

for b in answer_bubbles[1:]:
    # Check if same row (similar Y coordinate)
    if abs(b['cy'] - current_row[0]['cy']) <= ROW_TOLERANCE:
        current_row.append(b)
    else:
        # New row - save previous if valid
        if len(current_row) >= 10:  # At least 10 bubbles per row
            rows.append(sorted(current_row, key=lambda x: x['cx']))  # Sort by X within row
        current_row = [b]

# Don't forget last row
if len(current_row) >= 10:
    rows.append(sorted(current_row, key=lambda x: x['cx']))

print(f"Detected {len(rows)} rows")

for i, row in enumerate(rows[:5]):  # Show first 5 rows
    print(f"  Row {i+1}: {len(row)} bubbles, Y≈{row[0]['cy']}")

# Build template from detected rows
template = {}

for row_idx in range(min(10, len(rows))):
    row_bubbles = rows[row_idx]
    num_bubbles = len(row_bubbles)
    
    # Each row should have ~20 bubbles (5 questions × 4 options)
    # Divide into 5 equal groups
    bubbles_per_q = num_bubbles / 5
    
    for col_idx in range(5):
        q_num = (col_idx * 10) + row_idx + 1
        if q_num > 50:
            break
        
        # Get bubbles for this question
        start_idx = int(col_idx * bubbles_per_q)
        end_idx = int((col_idx + 1) * bubbles_per_q) if col_idx < 4 else num_bubbles
        
        q_bubbles = row_bubbles[start_idx:end_idx]
        
        # Take LAST 4 bubbles (skip question number bubble)
        option_bubbles = q_bubbles[-4:]
        
        if len(option_bubbles) == 4:
            template[str(q_num)] = [
                {'x': b['x'], 'y': b['y'], 'w': b['w'], 'h': b['h']}
                for b in option_bubbles
            ]

print(f"\n✓ Template created: {len(template)} questions")

# Save template
with open('omr_template.json', 'w') as f:
    json.dump(template, f, indent=2)

print(f"✓ Saved: omr_template.json")

# Visual verification
verify_img = img.copy()
for q_num, positions in list(template.items())[:20]:  # First 20 questions
    for idx, pos in enumerate(positions):
        x, y, w, h = pos['x'], pos['y'], pos['w'], pos['h']
        color = (0, 255, 0) if idx == 0 else (255, 0, 0)  # Green for 'A', red for others
        cv2.rectangle(verify_img, (x, y), (x + w, y + h), color, 2)
        cv2.putText(verify_img, f"Q{q_num}", (x - 15, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.3, (255, 255, 255), 1)

cv2.imwrite('debug_template_verification.jpg', verify_img)
print("✓ Saved: debug_template_verification.jpg")

print("\n✅ DONE! Test with: py omr_template.py filled_form_test.png")
