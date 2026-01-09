"""
OMR Pipeline Visualizer
A4 tespiti, cevap bölgesi yakınlaştırma ve bubble detection aşamalarını ayrı ayrı görselleştirir
"""

import cv2
import numpy as np
import json
import sys
from pathlib import Path

# Config
TARGET_WIDTH = 1654
TARGET_HEIGHT = 2339

# Cevap bölgesi oranları
ROI_Y_START = 0.38
ROI_Y_END = 0.92
ROI_X_START = 0.04
ROI_X_END = 0.96

# Grid parametreleri
NUM_QUESTIONS = 15
GRID_COLS = 5
GRID_ROWS = 10
OPTIONS = ["A", "B", "C", "D"]

# Kalibrasyon verisini yükle (varsa)
def load_calibration():
    """calibration.json dosyasını yükle"""
    try:
        with open("calibration.json", "r") as f:
            data = json.load(f)
        # String key'leri integer'a çevir
        calibration = {}
        for q_str, options in data.items():
            calibration[int(q_str)] = options
        return calibration
    except FileNotFoundError:
        return None
    except Exception as e:
        print(f"⚠️ Kalibrasyon yükleme hatası: {e}")
        return None

# Perspective correction parametreleri
BLUR_KERNEL = (5, 5)
CANNY_LOW = 50
CANNY_HIGH = 150


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
    """Görüntüde kağıt sınırlarını bul"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, BLUR_KERNEL, 0)
    edges = cv2.Canny(blurred, CANNY_LOW, CANNY_HIGH)
    
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


def visualize_pipeline(image_path, output_dir="output"):
    """
    OMR pipeline'ı görselleştir ve aşamaları ayrı ayrı kaydet
    
    Args:
        image_path: Giriş görüntüsü yolu
        output_dir: Çıkış klasörü
    """
    # Çıkış klasörünü oluştur
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Görüntüyü yükle
    print(f"📸 Görüntü yükleniyor: {image_path}")
    image = cv2.imread(str(image_path))
    if image is None:
        print(f"❌ HATA: Görüntü yüklenemedi: {image_path}")
        return False
    
    # ============================================================
    # AŞAMA 1: A4 KAĞIT TESPİTİ VE PERSPEKTİF DÜZELTİLMESİ
    # ============================================================
    print("\n" + "="*60)
    print("AŞAMA 1: A4 KAĞIT TESPİTİ")
    print("="*60)
    
    # Kağıt köşelerini bul
    corners = find_paper_contour(image)
    
    # Tespit edilen köşeleri görselleştir
    stage1_visual = image.copy()
    
    if corners is not None:
        print("✅ Kağıt köşeleri bulundu!")
        
        # Köşeleri çiz
        for i, corner in enumerate(corners):
            x, y = int(corner[0]), int(corner[1])
            cv2.circle(stage1_visual, (x, y), 15, (0, 255, 0), -1)
            cv2.putText(stage1_visual, f"{i+1}", (x-10, y-20),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 3)
        
        # Sınırları çiz
        cv2.polylines(stage1_visual, [corners.astype(np.int32)], True, (0, 255, 0), 5)
        
        # Perspektif düzeltme uygula
        warped = correct_perspective(image, corners)
    else:
        print("⚠️ Kağıt köşeleri bulunamadı, görüntü resize ediliyor...")
        warped = cv2.resize(image, (TARGET_WIDTH, TARGET_HEIGHT))
    
    # ÇIKTI 1: A4 tespit görüntüsü
    output1 = output_path / "1_a4_detection.jpg"
    cv2.imwrite(str(output1), stage1_visual)
    print(f"💾 Kaydedildi: {output1}")
    
    # Düzeltilmiş görüntü
    output1_corrected = output_path / "1_a4_corrected.jpg"
    cv2.imwrite(str(output1_corrected), warped)
    print(f"💾 Kaydedildi: {output1_corrected}")
    
    # ============================================================
    # AŞAMA 2: CEVAP BÖLGESİ YAKINLAŞTIRMA (ROI EXTRACTION)
    # ============================================================
    print("\n" + "="*60)
    print("AŞAMA 2: CEVAP BÖLGESİ YAKINLAŞTIRMA")
    print("="*60)
    
    # Gri tonlama
    gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    
    # ROI koordinatları
    roi_y1 = int(h * ROI_Y_START)
    roi_y2 = int(h * ROI_Y_END)
    roi_x1 = int(w * ROI_X_START)
    roi_x2 = int(w * ROI_X_END)
    
    print(f"📐 ROI Koordinatları:")
    print(f"   X: {roi_x1} - {roi_x2} (genişlik: {roi_x2 - roi_x1}px)")
    print(f"   Y: {roi_y1} - {roi_y2} (yükseklik: {roi_y2 - roi_y1}px)")
    
    # ROI'yi kes
    roi = gray[roi_y1:roi_y2, roi_x1:roi_x2]
    
    # ROI bölgesini ana görüntüde işaretle
    stage2_visual = warped.copy()
    cv2.rectangle(stage2_visual, (roi_x1, roi_y1), (roi_x2, roi_y2), (0, 255, 0), 8)
    cv2.putText(stage2_visual, "CEVAP BOLGESI", (roi_x1 + 20, roi_y1 - 20),
               cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 4)
    
    # ÇIKTI 2A: ROI işaretli tam görüntü
    output2a = output_path / "2_answer_region_marked.jpg"
    cv2.imwrite(str(output2a), stage2_visual)
    print(f"💾 Kaydedildi: {output2a}")
    
    # ÇIKTI 2B: Sadece ROI (yakınlaştırılmış)
    output2b = output_path / "2_answer_region_zoomed.jpg"
    roi_bgr = cv2.cvtColor(roi, cv2.COLOR_GRAY2BGR)
    cv2.imwrite(str(output2b), roi_bgr)
    print(f"💾 Kaydedildi: {output2b}")
    
    # ============================================================
    # AŞAMA 3: BUBBLE DETECTION
    # ============================================================
    print("\n" + "="*60)
    print("AŞAMA 3: BUBBLE DETECTION")
    print("="*60)
    
    roi_h, roi_w = roi.shape
    
    # Kalibrasyon verısını yükle
    calibration = load_calibration()
    
    if calibration:
        print(f"✅ Kalibrasyon dosyası bulundu! ({len(calibration)} soru)")
        print(f"📍 Kalibre edilmiş koordinatlar kullanılıyor...")
        use_calibration = True
    else:
        print(f"⚠️ Kalibrasyon dosyası yok, grid tabanlı tespit kullanılıyor...")
        use_calibration = False
        
        # Grid parametreleri
        col_width = roi_w / GRID_COLS
        row_height = roi_h / GRID_ROWS
        option_width = col_width / len(OPTIONS)
        
        print(f"📊 Grid Parametreleri:")
        print(f"   Sütun genişliği: {col_width:.1f}px")
        print(f"   Satır yüksekliği: {row_height:.1f}px")
        print(f"   Şık genişliği: {option_width:.1f}px")
    
    # Debug görüntüsü oluştur
    stage3_visual = cv2.cvtColor(roi.copy(), cv2.COLOR_GRAY2BGR)
    
    # Tüm bubble'ları tespit et ve işaretle
    bubble_count = 0
    
    if use_calibration:
        # KALİBRASYON TABANLI BUBBLE DETECTION
        for q_num in calibration.keys():
            for option in OPTIONS:
                if option in calibration[q_num]:
                    # Kalibre edilmiş koordinatları al
                    x_center = calibration[q_num][option]["x"]
                    y_center = calibration[q_num][option]["y"]
                    
                    # Bubble çapı (ortalama 15-20 piksel)
                    bubble_radius = 10
                    
                    # Bubble bölgesi
                    bx1 = max(0, x_center - bubble_radius)
                    bx2 = min(roi_w, x_center + bubble_radius)
                    by1 = max(0, y_center - bubble_radius)
                    by2 = min(roi_h, y_center + bubble_radius)
                    
                    bubble = roi[by1:by2, bx1:bx2]
                    
                    if bubble.size > 0:
                        avg_intensity = np.mean(bubble)
                        bubble_count += 1
                        
                        # Renk kodlu çizim - MAVİ (kalibre edilmiş)
                        if avg_intensity < 200:
                            color = (255, 128, 0)  # Mavi - potansiyel işaretli
                            thickness = 2
                        else:
                            color = (200, 150, 100)  # Açık mavi - boş
                            thickness = 1
                        
                        # Bubble dikdörtgeni
                        cv2.rectangle(stage3_visual, (bx1, by1), (bx2, by2), color, thickness)
                        
                        # Intensity değeri
                        cv2.putText(stage3_visual, f"{int(avg_intensity)}", 
                                   (bx1 + 2, by1 + 12), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.3, color, 1)
            
            # Soru numarası (ilk şıkkın yanına)
            if "A" in calibration[q_num]:
                x_pos = calibration[q_num]["A"]["x"] - 30
                y_pos = calibration[q_num]["A"]["y"] + 5
                cv2.putText(stage3_visual, f"S{q_num}", 
                           (x_pos, y_pos), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
        
        print(f"✅ {bubble_count} bubble (KALİBRE) tespit edildi")
        
        # Legend ekle
        legend_y = roi_h - 40
        cv2.rectangle(stage3_visual, (10, legend_y), (30, legend_y + 20), (255, 128, 0), 2)
        cv2.putText(stage3_visual, "Kalibre Edilmis", (35, legend_y + 15), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 128, 0), 2)
    
    else:
        # GRİD TABANLI BUBBLE DETECTION (FALLBACK)
        for q_num in range(1, NUM_QUESTIONS + 1):
            col = (q_num - 1) // GRID_ROWS
            row = (q_num - 1) % GRID_ROWS
            
            y_center = int((row + 0.5) * row_height)
            x_col_start = int(col * col_width)
            
            for opt_idx, option in enumerate(OPTIONS):
                x_option_center = int(x_col_start + (opt_idx + 0.5) * option_width)
                
                # Bubble boyutları
                bubble_w = int(option_width * 0.4)
                bubble_h = int(row_height * 0.4)
                
                # Bubble bölgesi
                bx1 = max(0, x_option_center - bubble_w // 2)
                bx2 = min(roi_w, x_option_center + bubble_w // 2)
                by1 = max(0, y_center - bubble_h // 2)
                by2 = min(roi_h, y_center + bubble_h // 2)
                
                bubble = roi[by1:by2, bx1:bx2]
                
                if bubble.size > 0:
                    avg_intensity = np.mean(bubble)
                    bubble_count += 1
                    
                    # Renk kodlu çizim - YEŞİL/GRİ (grid tabanlı)
                    if avg_intensity < 200:
                        color = (0, 255, 0)  # Yeşil - potansiyel işaretli
                        thickness = 2
                    else:
                        color = (128, 128, 128)  # Gri - boş
                        thickness = 1
                    
                    # Bubble dikdörtgeni
                    cv2.rectangle(stage3_visual, (bx1, by1), (bx2, by2), color, thickness)
                    
                    # Intensity değeri
                    cv2.putText(stage3_visual, f"{int(avg_intensity)}", 
                               (bx1 + 2, by1 + 12), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.3, color, 1)
            
            # Soru numarası
            cv2.putText(stage3_visual, f"S{q_num}", 
                       (x_col_start - 30, y_center + 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 0), 1)
        
        print(f"✅ {bubble_count} bubble (GRID) tespit edildi")
        
        # Grid çizgileri ekle
        for col in range(GRID_COLS + 1):
            x = int(col * col_width)
            cv2.line(stage3_visual, (x, 0), (x, roi_h), (255, 0, 255), 1)
        
        for row in range(GRID_ROWS + 1):
            y = int(row * row_height)
            cv2.line(stage3_visual, (0, y), (roi_w, y), (255, 0, 255), 1)
        
        # Legend ekle
        legend_y = roi_h - 40
        cv2.rectangle(stage3_visual, (10, legend_y), (30, legend_y + 20), (0, 255, 0), 2)
        cv2.putText(stage3_visual, "Grid Tabanli (kalibre edin!)", (35, legend_y + 15), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    # ÇIKTI 3: Bubble detection görüntüsü
    output3 = output_path / "3_bubble_detection.jpg"
    cv2.imwrite(str(output3), stage3_visual)
    print(f"💾 Kaydedildi: {output3}")
    
    # ============================================================
    # ÖZET
    # ============================================================
    print("\n" + "="*60)
    print("✨ TÜM AŞAMALAR TAMAMLANDI!")
    print("="*60)
    print(f"\n📁 Çıktı dosyaları ({output_dir}/):")
    print(f"   1️⃣  1_a4_detection.jpg        - A4 kağıt tespiti (köşeler işaretli)")
    print(f"   1️⃣  1_a4_corrected.jpg        - Perspektif düzeltilmiş görüntü")
    print(f"   2️⃣  2_answer_region_marked.jpg - Cevap bölgesi işaretli")
    print(f"   2️⃣  2_answer_region_zoomed.jpg - Cevap bölgesi yakınlaştırılmış")
    print(f"   3️⃣  3_bubble_detection.jpg     - Bubble detection (tüm bubble'lar)")
    print()
    
    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Kullanım: python omr_pipeline_visualizer.py <görüntü_yolu> [çıkış_klasörü]")
        print("\nÖrnek:")
        print("  python omr_pipeline_visualizer.py test_form.png")
        print("  python omr_pipeline_visualizer.py test_form.png my_outputs")
        sys.exit(1)
    
    image_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "output"
    
    success = visualize_pipeline(image_path, output_dir)
    
    if success:
        print("🎉 İşlem başarıyla tamamlandı!")
    else:
        print("❌ İşlem başarısız oldu!")
        sys.exit(1)
