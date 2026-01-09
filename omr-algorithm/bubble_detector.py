"""
Bubble Detector Module - Circle Detection Approach
Gerçek daireleri tespit ederek bubble okuma
"""

import cv2
import numpy as np
from pathlib import Path
import config


# Grid yapılandırması
GRID_COLS = 5       # 5 sütun
GRID_ROWS = 10      # Her sütunda 10 soru
NUM_OPTIONS = 4     # A, B, C, D
OPTIONS = ["A", "B", "C", "D"]

# Bubble tespit parametreleri
FILL_THRESHOLD = 0.45       # %45 doluluk = işaretli


def detect_circles(image, debug_dir=None):
    """
    Contour tespiti ile tüm bubble dairelerini bul
    HoughCircles yerine contour analizi kullanıyoruz (daha güvenilir)
    
    Args:
        image: Cevap alanı görüntüsü (BGR)
        debug_dir: Debug klasörü
    
    Returns:
        circles: [(x, y, radius), ...] listesi
    """
    # Gri tonlama
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
    
    height, width = gray.shape
    
    if debug_dir:
        cv2.imwrite(str(debug_dir / "30_gray.jpg"), gray)
    
    # Binary threshold - bubble kenarlarını bulmak için
    # OTSU ile otomatik eşik belirleme
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    if debug_dir:
        cv2.imwrite(str(debug_dir / "31_thresh_otsu.jpg"), thresh)
    
    # Morfolojik işlemler - gürültü temizle
    kernel = np.ones((2, 2), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
    
    # Contour bul
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Tahmini bubble boyutu
    # 5 sütun x ~5 eleman per sütun = ~25 eleman genişlikte
    estimated_diameter = width / 30
    min_radius = max(5, int(estimated_diameter * 0.3))
    max_radius = min(25, int(estimated_diameter * 1.5))
    min_area = 3.14 * min_radius * min_radius
    max_area = 3.14 * max_radius * max_radius
    
    print(f"Bubble boyut aralığı: yarıçap {min_radius}-{max_radius}, alan {min_area:.0f}-{max_area:.0f}")
    
    circles = []
    
    for contour in contours:
        area = cv2.contourArea(contour)
        
        # Alan filtresi
        if area < min_area or area > max_area:
            continue
        
        # Dairesellik kontrolü (circularity = 4π × area / perimeter²)
        perimeter = cv2.arcLength(contour, True)
        if perimeter == 0:
            continue
        
        circularity = 4 * 3.14159 * area / (perimeter * perimeter)
        
        # Daire için circularity 0.7-1.0 arasında olmalı
        if circularity < 0.6:
            continue
        
        # Minimum enclosing circle
        (cx, cy), radius = cv2.minEnclosingCircle(contour)
        cx, cy, radius = int(cx), int(cy), int(radius)
        
        # Yarıçap kontrolü
        if radius < min_radius or radius > max_radius:
            continue
        
        circles.append((cx, cy, radius))
    
    print(f"Tespit edilen daire sayısı: {len(circles)}")
    
    if debug_dir:
        debug_img = image.copy()
        for (x, y, r) in circles:
            cv2.circle(debug_img, (x, y), r, (0, 255, 0), 2)
            cv2.circle(debug_img, (x, y), 2, (0, 0, 255), -1)
        cv2.imwrite(str(debug_dir / "32_detected_circles.jpg"), debug_img)
    
    return circles


def organize_circles_to_grid(circles, image_shape):
    """
    Tespit edilen daireleri 5x10 grid'e yerleştir
    Her sütunda 10 soru, her soruda 4 şık
    
    Args:
        circles: [(x, y, r), ...] listesi
        image_shape: (height, width) tuple
    
    Returns:
        grid: {soru_no: {"A": (x,y,r), "B": (x,y,r), ...}, ...}
    """
    if not circles:
        return {}
    
    height, width = image_shape[:2]
    
    # Sütun genişliği ve satır yüksekliği
    col_width = width / GRID_COLS
    row_height = height / GRID_ROWS
    
    # Daireleri sütun ve satıra göre grupla
    grid = {}
    
    # Her dairenin hangi hücreye ait olduğunu bul
    for (x, y, r) in circles:
        # Hangi sütun? (0-4)
        col = int(x / col_width)
        col = min(col, GRID_COLS - 1)
        
        # Hangi satır? (0-9)
        row = int(y / row_height)
        row = min(row, GRID_ROWS - 1)
        
        # Soru numarası (1-50)
        # Sütun bazlı: ilk sütun 1-10, ikinci 11-20...
        q_num = col * GRID_ROWS + row + 1
        
        if q_num > 50:
            continue
        
        if q_num not in grid:
            grid[q_num] = {"circles": []}
        
        grid[q_num]["circles"].append((x, y, r))
    
    # Her soru için daireleri x'e göre sırala ve A,B,C,D ata
    organized = {}
    
    for q_num, data in grid.items():
        circles_in_q = data["circles"]
        
        if len(circles_in_q) < 4:
            # 4'ten az daire varsa, bu soruyu atla veya eksik işaretle
            continue
        
        # X'e göre sırala (soldan sağa)
        circles_in_q.sort(key=lambda c: c[0])
        
        # İlk 4 daireyi A, B, C, D olarak ata
        organized[q_num] = {}
        for i, option in enumerate(OPTIONS):
            if i < len(circles_in_q):
                organized[q_num][option] = circles_in_q[i]
    
    return organized


def analyze_bubble_fill(image, circles_grid, debug_dir=None):
    """
    Her bubble'ın doluluk oranını hesapla
    
    Args:
        image: Orijinal görüntü
        circles_grid: Organize edilmiş grid
        debug_dir: Debug klasörü
    
    Returns:
        fill_ratios: {soru_no: {şık: doluluk, ...}, ...}
    """
    # Gri tonlama ve threshold
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
    
    # Adaptive threshold - dolu alanlar beyaz olsun
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        15, 3
    )
    
    if debug_dir:
        cv2.imwrite(str(debug_dir / "33_thresh.jpg"), thresh)
    
    fill_ratios = {}
    debug_img = image.copy() if debug_dir else None
    
    for q_num in sorted(circles_grid.keys()):
        fill_ratios[q_num] = {}
        
        for option, (cx, cy, r) in circles_grid[q_num].items():
            # Daire içindeki pikselleri analiz et
            # Mask oluştur
            mask = np.zeros(thresh.shape, dtype=np.uint8)
            cv2.circle(mask, (cx, cy), r - 2, 255, -1)  # İç kısım
            
            # Mask içindeki beyaz piksel oranı
            circle_pixels = cv2.bitwise_and(thresh, mask)
            total_pixels = np.sum(mask == 255)
            white_pixels = np.sum(circle_pixels == 255)
            
            if total_pixels > 0:
                fill_ratio = white_pixels / total_pixels
            else:
                fill_ratio = 0.0
            
            fill_ratios[q_num][option] = fill_ratio
            
            # Debug çizimi
            if debug_img is not None:
                is_filled = fill_ratio > FILL_THRESHOLD
                color = (0, 255, 0) if is_filled else (128, 128, 128)
                thickness = 3 if is_filled else 1
                cv2.circle(debug_img, (cx, cy), r, color, thickness)
                
                if is_filled:
                    cv2.putText(debug_img, option, 
                               (cx - 5, cy + 5),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 0), 2)
    
    if debug_img is not None and debug_dir:
        cv2.imwrite(str(debug_dir / "34_fill_analysis.jpg"), debug_img)
    
    return fill_ratios


def extract_answers(fill_ratios):
    """
    Doluluk oranlarından cevapları çıkar
    """
    answers = {}
    confidence = {}
    issues = []
    
    for q_num in range(1, 51):
        if q_num not in fill_ratios:
            answers[q_num] = None
            confidence[q_num] = 0.0
            issues.append({"question": q_num, "type": "missing", "message": "Bubble bulunamadı"})
            continue
        
        ratios = fill_ratios[q_num]
        
        if not ratios:
            answers[q_num] = None
            confidence[q_num] = 0.0
            continue
        
        # En yüksek doluluk
        max_option = max(ratios, key=ratios.get)
        max_fill = ratios[max_option]
        
        # Sıralı değerler
        sorted_fills = sorted(ratios.values(), reverse=True)
        
        # Eşik kontrolü
        if max_fill < FILL_THRESHOLD:
            answers[q_num] = None
            confidence[q_num] = 1.0 - max_fill
            continue
        
        # İkinci en yüksek ile karşılaştır
        if len(sorted_fills) > 1:
            second_fill = sorted_fills[1]
            separation = max_fill - second_fill
            
            # Çoklu işaretleme
            if second_fill > FILL_THRESHOLD:
                marked = [opt for opt, val in ratios.items() if val > FILL_THRESHOLD]
                issues.append({
                    "question": q_num,
                    "type": "multiple",
                    "message": f"Çoklu: {', '.join(marked)}"
                })
                answers[q_num] = max_option
                confidence[q_num] = 0.3
                continue
            
            conf = min(1.0, max_fill * (1 + separation))
        else:
            conf = max_fill
        
        answers[q_num] = max_option
        confidence[q_num] = conf
    
    return answers, confidence, issues


def detect_and_extract(answer_region_image, debug=False):
    """
    Ana fonksiyon: Daireleri tespit et ve cevapları çıkar
    """
    debug_dir = None
    if debug:
        debug_dir = Path(config.DEBUG_OUTPUT_DIR)
        debug_dir.mkdir(exist_ok=True)
    
    # 1. Daireleri tespit et
    circles = detect_circles(answer_region_image, debug_dir)
    
    if len(circles) < 50:  # En az 50 daire olmalı (50 soru x 4 şık eksik olabilir)
        print(f"UYARI: Beklenen 200 daire, bulunan {len(circles)}")
    
    # 2. Daireleri grid'e organize et
    circles_grid = organize_circles_to_grid(circles, answer_region_image.shape)
    
    print(f"Organize edilen soru sayısı: {len(circles_grid)}")
    
    # 3. Doluluk analizi
    fill_ratios = analyze_bubble_fill(answer_region_image, circles_grid, debug_dir)
    
    # 4. Cevap çıkarma
    answers, confidence, issues = extract_answers(fill_ratios)
    
    # Özet
    answered = sum(1 for a in answers.values() if a is not None)
    blank = 50 - answered
    valid_conf = [c for c in confidence.values() if c > 0]
    avg_conf = sum(valid_conf) / len(valid_conf) if valid_conf else 0
    
    # Cevap string
    answer_string = ""
    for i in range(1, 51):
        ans = answers.get(i)
        answer_string += ans if ans else "-"
    
    return {
        "success": True,
        "circles_found": len(circles),
        "questions_detected": len(circles_grid),
        "answers": answers,
        "confidence": confidence,
        "issues": issues,
        "answer_string": answer_string,
        "summary": {
            "total": 50,
            "answered": answered,
            "blank": blank,
            "average_confidence": round(avg_conf, 2)
        }
    }


# Test
if __name__ == "__main__":
    import sys
    import json
    
    if len(sys.argv) < 2:
        print("Kullanım: python bubble_detector.py <cevap_alanı_görüntüsü>")
        sys.exit(1)
    
    image = cv2.imread(sys.argv[1])
    if image is None:
        print(f"HATA: Görüntü yüklenemedi")
        sys.exit(1)
    
    result = detect_and_extract(image, debug=True)
    
    print("\n" + "=" * 50)
    print("OMR Circle Detection Sonuçları")
    print("=" * 50)
    print(f"Bulunan daire: {result['circles_found']}")
    print(f"Tespit edilen soru: {result['questions_detected']}")
    print(f"Cevaplanan: {result['summary']['answered']}/50")
    print(f"\nCevap Dizisi: {result['answer_string']}")
    
    print("\nİlk 10 soru:")
    for i in range(1, 11):
        ans = result['answers'].get(i, "-")
        conf = result['confidence'].get(i, 0)
        mark = "✓" if ans else " "
        print(f"  {mark} S{i:2d}: {ans if ans else '-':4s} ({conf:.0%})")
    
    with open("bubble_result.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print("\nDetaylı sonuç: bubble_result.json")
