"""
Region Detector Module
Cevap alanını (1-50 sorular) tespit etme
Alt dikdörtgeni bulma
"""

import cv2
import numpy as np
from pathlib import Path
import config


def find_answer_region(image, debug_dir=None):
    """
    Cevap alanını içeren dikdörtgeni bul
    
    Strateji:
    1. Yatay ve dikey çizgileri tespit et
    2. Çizgilerin kesişim noktalarını bul
    3. Alt bölgedeki en büyük dikdörtgeni seç
    
    Args:
        image: Perspektif düzeltilmiş görüntü (BGR)
        debug_dir: Debug klasörü
    
    Returns:
        (x, y, w, h) tuple veya None
    """
    # Gri tonlama
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
    
    height, width = gray.shape[:2]
    
    # Binary threshold
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    
    if debug_dir:
        cv2.imwrite(str(debug_dir / "20_thresh_for_region.jpg"), thresh)
    
    # Yatay çizgileri tespit et
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (width // 8, 1))
    horizontal_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=1)
    
    # Dikey çizgileri tespit et  
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, height // 8))
    vertical_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vertical_kernel, iterations=1)
    
    # Çizgileri birleştir ve dilate et
    lines_combined = cv2.add(horizontal_lines, vertical_lines)
    kernel = np.ones((3, 3), np.uint8)
    lines_combined = cv2.dilate(lines_combined, kernel, iterations=2)
    
    if debug_dir:
        cv2.imwrite(str(debug_dir / "21_horizontal_lines.jpg"), horizontal_lines)
        cv2.imwrite(str(debug_dir / "22_vertical_lines.jpg"), vertical_lines)
        cv2.imwrite(str(debug_dir / "23_lines_combined.jpg"), lines_combined)
    
    # Contour'ları bul - RETR_TREE ile iç contour'ları da al
    contours, hierarchy = cv2.findContours(
        lines_combined, 
        cv2.RETR_TREE, 
        cv2.CHAIN_APPROX_SIMPLE
    )
    
    if not contours:
        print("UYARI: Hiç contour bulunamadı")
        return None
    
    # Dikdörtgen adaylarını filtrele
    candidates = []
    min_area = (width * height) * 0.10  # En az %10 alan kaplamalı
    
    for i, contour in enumerate(contours):
        x, y, w, h = cv2.boundingRect(contour)
        area = w * h
        aspect_ratio = w / h if h > 0 else 0
        
        # Filtreler:
        # - Yeterince büyük
        # - Genişlik/yükseklik oranı makul
        # - Görüntünün alt yarısında
        if (area > min_area and 
            0.5 < aspect_ratio < 2.5 and 
            y > height * 0.20 and
            h > height * 0.3):  # Yüksekliği yeterli
            
            candidates.append({
                "contour": contour,
                "bbox": (x, y, w, h),
                "area": area,
                "y": y,
                "h": h
            })
    
    if debug_dir:
        debug_img = image.copy()
        for i, cand in enumerate(candidates):
            x, y, w, h = cand["bbox"]
            color = [(0, 255, 0), (255, 0, 0), (0, 0, 255), (255, 255, 0)][i % 4]
            cv2.rectangle(debug_img, (x, y), (x + w, y + h), color, 2)
            cv2.putText(debug_img, f"#{i} h={h}", (x + 10, y + 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        cv2.imwrite(str(debug_dir / "24_candidate_rectangles.jpg"), debug_img)
    
    if not candidates:
        print("UYARI: Contour ile bulunamadı, fallback ROI kullanılıyor")
        # Fallback: Sabit ROI kullan
        # Cevap alanı y=38% ile y=92% arasında (header'ı atla)
        roi_y_start = int(height * 0.38)
        roi_y_end = int(height * 0.92)
        roi_x_start = int(width * 0.04)
        roi_x_end = int(width * 0.96)
        return (roi_x_start, roi_y_start, roi_x_end - roi_x_start, roi_y_end - roi_y_start)
    
    # En büyük alanı ve en altta olanı seç
    candidates.sort(key=lambda c: (-c["h"], -c["area"]))
    
    best = candidates[0]
    x, y, w, h = best["bbox"]
    
    if debug_dir:
        debug_img = image.copy()
        cv2.rectangle(debug_img, (x, y), (x + w, y + h), (0, 255, 0), 3)
        cv2.putText(debug_img, "ANSWER REGION", (x + 10, y - 10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.imwrite(str(debug_dir / "25_selected_region.jpg"), debug_img)
    
    print(f"Cevap alanı tespit edildi: x={x}, y={y}, w={w}, h={h}")
    return (x, y, w, h)


def extract_answer_region(image, region_bbox, padding=5, debug_dir=None):
    """
    Tespit edilen cevap alanını kes
    
    Args:
        image: Orijinal görüntü
        region_bbox: (x, y, w, h) tuple
        padding: İç boşluk (piksel)
        debug_dir: Debug klasörü
    
    Returns:
        Kesilmiş cevap alanı görüntüsü
    """
    x, y, w, h = region_bbox
    
    # Padding uygula (içe doğru)
    x1 = x + padding
    y1 = y + padding
    x2 = x + w - padding
    y2 = y + h - padding
    
    # Sınırları kontrol et
    height, width = image.shape[:2]
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(width, x2)
    y2 = min(height, y2)
    
    region = image[y1:y2, x1:x2]
    
    if debug_dir:
        cv2.imwrite(str(debug_dir / "26_answer_region_cropped.jpg"), region)
    
    return region


# Test kodu
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Kullanım: python region_detector.py <görüntü_yolu>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    image = cv2.imread(image_path)
    
    if image is None:
        print(f"HATA: Görüntü yüklenemedi: {image_path}")
        sys.exit(1)
    
    debug_dir = Path(config.DEBUG_OUTPUT_DIR)
    debug_dir.mkdir(exist_ok=True)
    
    # Cevap alanını bul
    region_bbox = find_answer_region(image, debug_dir)
    
    if region_bbox:
        # Alanı kes
        answer_region = extract_answer_region(image, region_bbox, debug_dir=debug_dir)
        print(f"Cevap alanı boyutu: {answer_region.shape}")
        
        # Kaydet
        cv2.imwrite("answer_region.jpg", answer_region)
        print("Cevap alanı 'answer_region.jpg' olarak kaydedildi")
    else:
        print("Cevap alanı tespit edilemedi!")
