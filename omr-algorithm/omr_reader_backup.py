"""
OMR Reader - Basitleştirilmiş Versiyon
Grid tabanlı bubble okuma (ilk 15 soru için optimize edilmiş)
"""

import cv2
import numpy as np
from pathlib import Path
import json

# Hedef boyutlar (perspektif düzeltme sonrası)
TARGET_WIDTH = 800
TARGET_HEIGHT = 1100

# Grid yapısı
GRID_COLS = 5      # 5 sütun
GRID_ROWS = 10     # Her sütunda 10 soru
OPTIONS = ["A", "B", "C", "D"]

# ROI oranları (cevap alanı)
ROI_Y_START = 0.38
ROI_Y_END = 0.92
ROI_X_START = 0.04
ROI_X_END = 0.96

# Tespit parametreleri - İyileştirilmiş
FILL_THRESHOLD = 0.20  # %20 doluluk = işaretli (daha hassas)
MIN_SEPARATION = 0.10  # İşaretli ve işaretsiz arasında min %10 fark olmalı


def load_and_correct_perspective(image_path):
    """Görüntüyü yükle ve perspektif düzelt"""
    # Görüntüyü yükle
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError(f"Görüntü yüklenemedi: {image_path}")
    
    # Gri tonlama
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Blur ve kenar algılama
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    
    # Kenarları genişlet
    kernel = np.ones((3, 3), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=2)
    
    # Contour bul
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if contours:
        # En büyük contour
        largest = max(contours, key=cv2.contourArea)
        hull = cv2.convexHull(largest)
        
        # 4 köşeyi bul
        if len(hull) >= 4:
            points = hull.reshape(-1, 2)
            height, width = image.shape[:2]
            
            # Görüntü köşelerine en yakın noktaları bul
            target_corners = np.array([[0, 0], [width, 0], [width, height], [0, height]])
            corners = []
            for target in target_corners:
                distances = np.sqrt(np.sum((points - target) ** 2, axis=1))
                corners.append(points[np.argmin(distances)])
            
            src = np.array(corners, dtype="float32")
            dst = np.array([
                [0, 0],
                [TARGET_WIDTH - 1, 0],
                [TARGET_WIDTH - 1, TARGET_HEIGHT - 1],
                [0, TARGET_HEIGHT - 1]
            ], dtype="float32")
            
            M = cv2.getPerspectiveTransform(src, dst)
            warped = cv2.warpPerspective(image, M, (TARGET_WIDTH, TARGET_HEIGHT))
            return warped
    
    # Fallback: basit resize
    return cv2.resize(image, (TARGET_WIDTH, TARGET_HEIGHT))


def extract_answer_region(image):
    """Cevap alanını kes"""
    height, width = image.shape[:2]
    
    y1 = int(height * ROI_Y_START)
    y2 = int(height * ROI_Y_END)
    x1 = int(width * ROI_X_START)
    x2 = int(width * ROI_X_END)
    
    return image[y1:y2, x1:x2]


def analyze_bubbles(answer_region, num_questions=15, debug_dir=None):
    """
    Grid tabanlı bubble analizi - KALİBRE EDİLMİŞ DEĞERLERle
    """
    # Gri tonlama
    if len(answer_region.shape) == 3:
        gray = cv2.cvtColor(answer_region, cv2.COLOR_BGR2GRAY)
    else:
        gray = answer_region.copy()
    
    height, width = gray.shape
    
    # Adaptive threshold - İyileştirilmiş parametreler
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        15, 3  # Daha büyük kernel ve C değeri = daha iyi kontrast
    )
    
    # Morfolojik işlemler - Gürültü azalt ve işaretleri güçlendir
    kernel = np.ones((2, 2), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)  # Küçük delikleri kapat
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)   # Küçük gürültüyü temizle
    
    # === MANUEL KALİBRASYON SONUÇLARI (15 Soru Analizi) ===
    # Sütun 1 (Soru 1-10) X ortalaması: ~80px
    # Sütun 2 (Soru 11-15) X ortalaması: ~213px
    # Sütun ofseti (Col 1 -> Col 2): 131px
    # Satır yüksekliği ortalaması: 36.5px
    # Blok boşluğu (Soru 5->6): 71px (yaklaşık 2 satır yüksekliği)
    
    first_bubble_x = 81     # Q1-Q5 ortalaması
    first_bubble_y = 63     # Q1 Y pozisyonu
    bubble_spacing = 19     # A-B arası
    row_height = 36.5       # Hassas satır yüksekliği
    col_x_offset = 131      # Sütunlar arası mesafe
    bubble_radius = 9       # Kutu yarıçapı
    
    answers = {}
    confidence = {}
    debug_img = answer_region.copy() if debug_dir else None
    
    for q_num in range(1, num_questions + 1):
        # Grid pozisyonu (0-indexed)
        col_idx = (q_num - 1) // 10
        row_idx = (q_num - 1) % 10
        
        # X Başlangıcı: İlk sütun + (sütun indeksi * sütun ofseti)
        start_x = first_bubble_x + (col_idx * col_x_offset)
        
        # Y Başlangıcı
        # Her 5 soruda bir blok var.
        # İlk blok (row 0-4): normal sıralama
        # İkinci blok (row 5-9): araya 1 satır (header) boşluk giriyor
        
        current_y = first_bubble_y + row_idx * row_height
        
        if row_idx >= 5:
            # 5. sorudan sonra (6-10 arası) ekstra boşluk ekle
            # Analizden çıkan fark: 71px. Normal 5 satır farkı: 36.5 * 1 = 36.5
            # Eklenmesi gereken ofset: ~35px (neredeyse 1 satır)
            current_y += 35
            
        y_center = int(current_y)
        
        # Measure DARKNESS (inverse) for each option - lower value = darker = filled
        darkness_ratios = {}
        
        # Calculate option width based on bubble spacing
        option_width = bubble_spacing
        
        for opt_idx, option in enumerate(OPTIONS):
            # Calculate option position
            opt_x = int(x_start + (opt_idx + 0.5) * option_width)
            
            # Define bubble region
            bubble_radius = min(int(option_width * 0.35), int(row_height * 0.3))
            
            y1 = max(0, y_center - bubble_radius)
            y2 = min(roi_h, y_center + bubble_radius)
            x1 = max(0, opt_x - bubble_radius)
            x2 = min(roi_w, opt_x + bubble_radius)
            
            # Extract bubble region from GRAYSCALE (not thresholded)
            bubble = roi_gray[y1:y2, x1:x2]
            
            if bubble.size > 0:
                # Calculate MEAN INTENSITY (0=black, 255=white)
                # Lower intensity = darker = filled
                mean_intensity = np.mean(bubble)
                darkness_ratios[option] = mean_intensity
            else:
                darkness_ratios[option] = 255  # White (not filled)
        
            # Debug çizimi
            if debug_img is not None:
                # Use a simple threshold for drawing, not for actual detection
                is_filled_for_debug = darkness_ratios[option] < 200 # Arbitrary threshold for visual
                color = (0, 255, 0) if is_filled_for_debug else (100, 100, 100)
                thick = 2 if is_filled_for_debug else 1
                cv2.rectangle(debug_img, (x1, y1), (x2, y2), color, thick)
                cv2.putText(debug_img, f"{darkness_ratios[option]:.0f}", (x1, y1-2),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.25, color, 1)
        
        # Find the DARKEST option (minimum intensity)
        min_intensity = min(darkness_ratios.values())
        max_intensity = max(darkness_ratios.values())
        
        # Calculate contrast between darkest and lightest
        contrast = max_intensity - min_intensity
        
        # Only mark as filled if there's significant contrast (at least 30 intensity difference)
        # AND the darkest one is sufficiently dark (below 180)
        if contrast >= 30 and min_intensity < 180:
            # Find which option is darkest
            darkest_option = min(darkness_ratios, key=darkness_ratios.get)
            answers[q_num] = darkest_option
            
            # Confidence based on contrast (higher contrast = more confident)
            confidence_score = min(contrast / 100.0, 1.0)  # Normalize to 0-1
            confidence[q_num] = float(confidence_score)
        else:
            # No clear mark or all equally light
            answers[q_num] = None
            confidence[q_num] = 0.0
        
        # Soru numarası
        if debug_img is not None:
            ans = answers[q_num] if answers[q_num] else "-"
            cv2.putText(debug_img, f"{q_num}:{ans}", (int(start_x - 12), int(y_center + 5)), # Corrected: use y_center
                       cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 0, 0), 1)
    
    if debug_img is not None and debug_dir:
        cv2.imwrite(str(debug_dir / "41_bubble_analysis.jpg"), debug_img)
    
    return answers, confidence


def read_omr(image_path, num_questions=15, debug=True):
    """
    Ana OMR okuma fonksiyonu
    
    Args:
        image_path: Görüntü dosya yolu
        num_questions: Okunacak soru sayısı
        debug: Debug modunu aktif et
    
    Returns:
        Sonuç dict'i
    """
    debug_dir = None
    if debug:
        debug_dir = Path("debug_output")
        debug_dir.mkdir(exist_ok=True)
    
    # 1. Perspektif düzeltme
    print("[1/3] Perspektif düzeltme...")
    corrected = load_and_correct_perspective(image_path)
    
    if debug_dir:
        cv2.imwrite(str(debug_dir / "38_corrected.jpg"), corrected)
    
    # 2. Cevap alanını kes
    print("[2/3] Cevap alanı kesiliyor...")
    answer_region = extract_answer_region(corrected)
    
    if debug_dir:
        cv2.imwrite(str(debug_dir / "39_answer_region.jpg"), answer_region)
    
    # 3. Bubble analizi
    print("[3/3] Bubble'lar analiz ediliyor...")
    answers, confidence = analyze_bubbles(answer_region, num_questions, debug_dir)
    
    # Sonuç oluştur
    answered = sum(1 for a in answers.values() if a is not None)
    answer_string = "".join(answers.get(i, "-") or "-" for i in range(1, num_questions + 1))
    
    valid_conf = [c for c in confidence.values() if c > 0]
    avg_conf = sum(valid_conf) / len(valid_conf) if valid_conf else 0
    
    return {
        "success": True,
        "answers": answers,
        "confidence": confidence,
        "answer_string": answer_string,
        "summary": {
            "total": num_questions,
            "answered": answered,
            "blank": num_questions - answered,
            "average_confidence": round(avg_conf, 2)
        }
    }


# Test
if __name__ == "__main__":
    import sys
    
    image_path = sys.argv[1] if len(sys.argv) > 1 else "filled_form.png"
    num_q = int(sys.argv[2]) if len(sys.argv) > 2 else 15
    
    print("=" * 50)
    print(f"OMR Reader - {num_q} Soru")
    print("=" * 50)
    
    result = read_omr(image_path, num_q, debug=True)
    
    print("\n" + "-" * 50)
    print(f"Cevaplanan: {result['summary']['answered']}/{num_q}")
    print(f"Ortalama Guven: {result['summary']['average_confidence']:.0%}")
    print(f"\nCevap Dizisi: {result['answer_string']}")
    
    print("\nDetayli Sonuclar:")
    for i in range(1, num_q + 1):
        ans = result['answers'].get(i)
        conf = result['confidence'].get(i, 0)
        mark = "OK" if ans else "  "
        bos = 'BOS' if not ans else ans
        print(f"  {mark} Soru {i:2d}: {bos:4s} (guven: {conf:.0%})")
    
    # JSON kaydet
    with open("omr_result.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"\nDetayli sonuc: omr_result.json")
    print("Debug goruntuler: debug_output/")

