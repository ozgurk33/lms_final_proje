"""
Simple Perspective Correction - Sadece kağıt düzeltme
Bubble detection YOK, sadece perspective.py çalıştır
"""

import cv2
import numpy as np
import json
import sys
import base64
from pathlib import Path

def order_points(pts):
    """Dört köşe noktasını sırala"""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def find_paper_contour(image):
    """Kağıt sınırlarını bul"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    
    kernel = np.ones((3, 3), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=2)
    
    contours, _ = cv2.findContours(edges.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return None
    
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    approx_factors = [0.02, 0.03, 0.04, 0.05, 0.01]
    
    for contour in contours[:5]:
        area = cv2.contourArea(contour)
        image_area = image.shape[0] * image.shape[1]
        
        if area < image_area * 0.1:
            continue
        
        for factor in approx_factors:
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, factor * peri, True)
            
            if len(approx) == 4:
                return approx.reshape(4, 2)
    
    return None

def correct_perspective(image, corners, target_width=800, target_height=1100):
    """Perspektif düzeltme"""
    rect = order_points(corners.astype("float32"))
    
    dst = np.array([
        [0, 0],
        [target_width - 1, 0],
        [target_width - 1, target_height - 1],
        [0, target_height - 1]
    ], dtype="float32")
    
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (target_width, target_height))
    
    return warped

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No image path provided"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # Görüntüyü yükle
    image = cv2.imread(image_path)
    if image is None:
        print(json.dumps({"success": False, "error": "Cannot load image"}))
        sys.exit(1)
    
    # Kağıt tespiti
    corners = find_paper_contour(image)
    
    if corners is None:
        # Kağıt bulunamadı - orijinal görüntüyü KÜÇÜLT ve dön
        # Resize to thumbnail size to avoid buffer overflow
        small = cv2.resize(image, (400, 550))
        _, buffer = cv2.imencode('.jpg', small, [cv2.IMWRITE_JPEG_QUALITY, 70])
        original_base64 = base64.b64encode(buffer).decode('utf-8')
        
        print(json.dumps({
            "success": True,
            "error": "Paper not detected",
            "paper_detected": False,
            "corrected_image_base64": original_base64
        }))
        sys.exit(0)
    
    # Perspektif düzeltme
    corrected = correct_perspective(image, corners, target_width=400, target_height=550)
    
    # Base64'e çevir (küçük boyut)
    _, buffer = cv2.imencode('.jpg', corrected, [cv2.IMWRITE_JPEG_QUALITY, 70])
    corrected_base64 = base64.b64encode(buffer).decode('utf-8')
    
    # Sonuç
    result = {
        "success": True,
        "paper_detected": True,
        "corners": corners.tolist(),
        "corrected_image_base64": corrected_base64
    }
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()
