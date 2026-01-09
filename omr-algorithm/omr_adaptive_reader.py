"""
OMR Adaptive Reader - Real-time Video Frame Processing
Herhangi bir optik formu okuyabilir, calibration gerektirmez.
Canlı video stream için optimize edilmiştir.
"""

import cv2
import numpy as np
import json
import sys
from pathlib import Path

# Config
TARGET_WIDTH = 800
TARGET_HEIGHT = 1100

# ROI - Cevap alanı (formun alt kısmı)
ROI_Y_START = 0.50  # Üstten %50
ROI_Y_END = 0.95    # Alta kadar
ROI_X_START = 0.05  # Soldan %5
ROI_X_END = 0.95    # Sağdan %5

# Bubble tespit parametreleri (küçük bubble'lar için optimize)
BUBBLE_MIN_RADIUS = 5
BUBBLE_MAX_RADIUS = 15
FILL_THRESHOLD = 0.35  # %35 doluluk = işaretli
CIRCULARITY_THRESHOLD = 0.60  # Dairesellik eşiği (biraz daha esnek)


def order_points(pts):
    """Dört köşe noktasını sırala: sol-üst, sağ-üst, sağ-alt, sol-alt"""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # Sol-üst
    rect[2] = pts[np.argmax(s)]  # Sağ-alt
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # Sağ-üst
    rect[3] = pts[np.argmax(diff)]  # Sol-alt
    return rect


def find_paper_contour(image):
    """
    Görüntüde kağıt sınırlarını bul (perspective.py'den alındı)
    Returns: 4 köşe noktası veya None
    """
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


def correct_perspective(image, corners):
    """Perspektif dönüşümü uygula"""
    rect = order_points(corners.astype("float32"))
    
    dst = np.array([
        [0, 0],
        [TARGET_WIDTH - 1, 0],
        [TARGET_WIDTH - 1, TARGET_HEIGHT - 1],
        [0, TARGET_HEIGHT - 1]
    ], dtype="float32")
    
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (TARGET_WIDTH, TARGET_HEIGHT))
    
    return warped


def detect_bubbles_adaptive(image):
    """
    Calibration olmadan bubble tespit et
    Contour analizi kullanarak bubble'ları bul
    
    Returns: [(x, y, radius), ...] listesi
    """
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
    
    # Otsu threshold ile bubble kenarlarını bul
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Morfolojik temizleme
    kernel = np.ones((2, 2), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
    
    # Contour bul
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    bubbles = []
    height, width = gray.shape
    
    for contour in contours:
        area = cv2.contourArea(contour)
        
        # Alan filtresi
        min_area = 3.14 * BUBBLE_MIN_RADIUS * BUBBLE_MIN_RADIUS
        max_area = 3.14 * BUBBLE_MAX_RADIUS * BUBBLE_MAX_RADIUS
        
        if area < min_area or area > max_area:
            continue
        
        # Dairesellik kontrolü
        perimeter = cv2.arcLength(contour, True)
        if perimeter == 0:
            continue
        
        circularity = 4 * 3.14159 * area / (perimeter * perimeter)
        
        if circularity < CIRCULARITY_THRESHOLD:
            continue
        
        # Daire merkezi ve yarıçapı
        (cx, cy), radius = cv2.minEnclosingCircle(contour)
        cx, cy, radius = int(cx), int(cy), int(radius)
        
        if radius < BUBBLE_MIN_RADIUS or radius > BUBBLE_MAX_RADIUS:
            continue
        
        bubbles.append((cx, cy, radius))
    
    return bubbles


def organize_bubbles_to_grid(bubbles, image_shape):
    """
    Bubble'ları grid sistemine yerleştir
    Otomatik olarak sütun ve satırları tespit et
    
    Returns: {question_num: [(x, y, r, option), ...]}
    """
    if not bubbles:
        return {}
    
    height, width = image_shape[:2]
    
    # Bubble'ları y koordinatına göre satırlara grupla
    bubbles_sorted_y = sorted(bubbles, key=lambda b: b[1])
    
    # Satırları bul (y ekseninde yakın olan bubble'lar aynı satır)
    rows = []
    current_row = [bubbles_sorted_y[0]]
    
    for i in range(1, len(bubbles_sorted_y)):
        prev_bubble = bubbles_sorted_y[i-1]
        curr_bubble = bubbles_sorted_y[i]
        
        # Y farkı küçükse aynı satır
        y_diff = abs(curr_bubble[1] - prev_bubble[1])
        threshold = height * 0.03  # %3 tolerans
        
        if y_diff < threshold:
            current_row.append(curr_bubble)
        else:
            if len(current_row) >= 4:  # En az 4 bubble varsa geçerli satır
                rows.append(current_row)
            current_row = [curr_bubble]
    
    # Son satırı ekle
    if len(current_row) >= 4:
        rows.append(current_row)
    
    # Her satırdaki bubble'ları x'e göre sırala ve A,B,C,D ata
    organized = {}
    
    for row_idx, row_bubbles in enumerate(rows):
        # X'e göre sırala
        row_bubbles_sorted = sorted(row_bubbles, key=lambda b: b[0])
        
        # Her 4 bubble bir soru
        num_questions_in_row = len(row_bubbles_sorted) // 4
        
        for q_offset in range(num_questions_in_row):
            question_bubbles = row_bubbles_sorted[q_offset*4:(q_offset+1)*4]
            
            if len(question_bubbles) == 4:
                question_num = row_idx * num_questions_in_row + q_offset + 1
                organized[question_num] = {
                    "A": question_bubbles[0],
                    "B": question_bubbles[1],
                    "C": question_bubbles[2],
                    "D": question_bubbles[3]
                }
    
    return organized


def analyze_bubble_fill(image, bubbles_grid):
    """
    Her bubble'ın dolu olup olmadığını kontrol et
    
    Returns: {question_num: {option: is_filled, ...}}
    """
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
    
    # Adaptive threshold
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        15, 3
    )
    
    fill_data = {}
    
    for q_num, options in bubbles_grid.items():
        fill_data[q_num] = {}
        
        for option, (cx, cy, r) in options.items():
            # Daire içindeki pikselleri analiz et
            mask = np.zeros(thresh.shape, dtype=np.uint8)
            cv2.circle(mask, (cx, cy), max(1, r - 2), 255, -1)
            
            circle_pixels = cv2.bitwise_and(thresh, mask)
            total_pixels = np.sum(mask == 255)
            white_pixels = np.sum(circle_pixels == 255)
            
            fill_ratio = white_pixels / total_pixels if total_pixels > 0 else 0.0
            fill_data[q_num][option] = fill_ratio
    
    return fill_data


def extract_answers(fill_data):
    """
    Doluluk verilerinden cevapları çıkar
    """
    answers = {}
    confidence = {}
    
    for q_num, options in fill_data.items():
        if not options:
            answers[q_num] = None
            confidence[q_num] = 0.0
            continue
        
        # En yüksek doluluk oranına sahip şık
        max_option = max(options, key=options.get)
        max_fill = options[max_option]
        
        # Eşik kontrolü
        if max_fill < FILL_THRESHOLD:
            answers[q_num] = None
            confidence[q_num] = 0.0
            continue
        
        answers[q_num] = max_option
        confidence[q_num] = min(1.0, max_fill * 1.5)
    
    return answers, confidence


def draw_overlay(frame, corners, bubbles_grid, answers):
    """
    Video frame üzerine overlay çiz
    - Kağıt kenarları (yeşil)
    - Tespit edilen bubble'lar
    - Cevaplar
    
    Returns: Overlay çizilmiş frame
    """
    overlay = frame.copy()
    
    # Kağıt kenarlarını çiz
    if corners is not None:
        corners_int = corners.astype(int)
        cv2.polylines(overlay, [corners_int], True, (0, 255, 0), 3)
        
        # Köşe noktalarını işaretle
        for i, corner in enumerate(corners_int):
            cv2.circle(overlay, tuple(corner), 8, (0, 0, 255), -1)
    
    return overlay


def process_frame(frame_path, output_path=None, debug=False):
    """
    Ana fonksiyon: Video frame'i işle
    
    Args:
        frame_path: Frame görüntüsü yolu
        output_path: Çıkış görüntüsü (overlay ile)
        debug: Debug modu
    
    Returns:
        {
            "success": bool,
            "paper_detected": bool,
            "corners": [[x,y], ...],
            "bubbles_count": int,
            "answers": {q_num: answer, ...},
            "confidence": {q_num: conf, ...},
            "summary": {...}
        }
    """
    # Görüntüyü yükle
    frame = cv2.imread(str(frame_path))
    if frame is None:
        return {
            "success": False,
            "error": "Frame yüklenemedi",
            "paper_detected": False
        }
    
    # Kağıt tespiti
    corners = find_paper_contour(frame)
    
    if corners is None:
        return {
            "success": False,
            "error": "Kağıt tespit edilemedi",
            "paper_detected": False
        }
    
    # Perspektif düzeltme
    corrected = correct_perspective(frame, corners)
    
    # ROI'yi çıkar (cevap bölgesi)
    h, w = corrected.shape[:2]
    roi_y1 = int(h * ROI_Y_START)
    roi_y2 = int(h * ROI_Y_END)
    roi_x1 = int(w * ROI_X_START)
    roi_x2 = int(w * ROI_X_END)
    
    roi = corrected[roi_y1:roi_y2, roi_x1:roi_x2]
    
    if debug:
        cv2.imwrite("debug_roi.jpg", roi)
        print(f"DEBUG: ROI boyutu: {roi.shape}")
    
    # Bubble tespit (ROI üzerinde)
    bubbles = detect_bubbles_adaptive(roi)
    
    if debug:
        print(f"DEBUG: Tespit edilen bubble sayısı: {len(bubbles)}")
    
    if len(bubbles) < 4:
        return {
            "success": False,
            "error": f"Yeterli bubble bulunamadı ({len(bubbles)} bulunan, minimum 4 gerekli)",
            "paper_detected": True,
            "corners": corners.tolist(),
            "bubbles_count": len(bubbles)
        }
    
    # Grid organizasyonu
    bubbles_grid = organize_bubbles_to_grid(bubbles, roi.shape)
    
    if debug:
        print(f"DEBUG: Organize edilen soru sayısı: {len(bubbles_grid)}")
    
    # Doluluk analizi
    fill_data = analyze_bubble_fill(roi, bubbles_grid)
    
    # Cevap çıkarma
    answers, confidence = extract_answers(fill_data)
    
    # Overlay çiz
    if output_path:
        overlay = draw_overlay(frame, corners, bubbles_grid, answers)
        cv2.imwrite(str(output_path), overlay)
    
    # Özet
    answered_count = sum(1 for ans in answers.values() if ans is not None)
    total_questions = len(bubbles_grid)
    
    # Perspektif düzeltilmiş görüntüyü base64'e çevir
    import base64
    _, buffer = cv2.imencode('.jpg', corrected, [cv2.IMWRITE_JPEG_QUALITY, 85])
    corrected_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return {
        "success": True,
        "paper_detected": True,
        "corners": corners.tolist(),
        "corrected_image_base64": corrected_base64,  # Yeni!
        "bubbles_count": len(bubbles),
        "questions_detected": total_questions,
        "answers": answers,
        "confidence": confidence,
        "summary": {
            "total": total_questions,
            "answered": answered_count,
            "blank": total_questions - answered_count
        }
    }


def main():
    if len(sys.argv) < 2:
        print("Kullanım: python omr_adaptive_reader.py <frame_path> [output_path]")
        print("\nÖrnek:")
        print("  python omr_adaptive_reader.py test_form.png output_overlay.jpg")
        sys.exit(1)
    
    frame_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "adaptive_output.jpg"
    
    print("=" * 60)
    print("OMR ADAPTIVE READER - Real-time Processing")
    print("=" * 60)
    print(f"📸 Frame: {frame_path}")
    print()
    
    result = process_frame(frame_path, output_path, debug=True)
    
    # Sonucu ekrana yazdır
    if not result["success"]:
        print(f"❌ HATA: {result.get('error', 'Bilinmeyen hata')}")
        if result.get("paper_detected"):
            print(f"   Kağıt tespit edildi ama bubble tespit başarısız")
            print(f"   Bulunan bubble sayısı: {result.get('bubbles_count', 0)}")
        sys.exit(1)
    
    print("✅ Frame işleme başarılı!")
    print(f"📄 Kağıt tespit edildi (4 köşe)")
    print(f"🎯 Bulunan bubble: {result['bubbles_count']}")
    print(f"❓ Tespit edilen soru: {result['questions_detected']}")
    print()
    
    # Cevapları göster
    print("CEVAPLAR:")
    print("-" * 60)
    for q_num in sorted(result['answers'].keys()):
        ans = result['answers'][q_num]
        conf = result['confidence'][q_num]
        
        if ans:
            print(f"  ✓ Soru {q_num:2d}: {ans} (güven: {conf:.0%})")
        else:
            print(f"  ○ Soru {q_num:2d}: BOŞ")
    
    print("-" * 60)
    print(f"\nToplam: {result['summary']['total']} | "
          f"Cevaplanan: {result['summary']['answered']} | "
          f"Boş: {result['summary']['blank']}")
    
    # JSON kaydet
    json_output = frame_path.replace('.png', '_result.json').replace('.jpg', '_result.json')
    with open(json_output, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\n📁 Sonuçlar kaydedildi:")
    print(f"   - {output_path} (overlay)")
    print(f"   - {json_output} (JSON)")
    print()
    print("✅ İşlem tamamlandı!")


if __name__ == "__main__":
    main()
