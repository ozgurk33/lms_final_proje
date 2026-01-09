"""
OMR Cevap Okuyucu
Kalibre edilmiş bubble pozisyonlarını kullanarak işaretli şıkları tespit eder
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

# Şıklar
OPTIONS = ["A", "B", "C", "D"]

# Bubble tespit parametreleri
BUBBLE_RADIUS = 10  # Bubble çapı (piksel)
INTENSITY_THRESHOLD = 220  # Bu değerin altındaki bubble'lar "işaretli" sayılır (210'dan 220'ye çıkardık)
CONTRAST_THRESHOLD = 5  # Kontrast eşiği (10'dan 5'e düşürdük - çok hassas)


def load_calibration():
    """calibration.json dosyasını yükle"""
    try:
        # Get the directory where this script is located
        script_dir = Path(__file__).parent
        calibration_path = script_dir / "calibration.json"
        
        with open(calibration_path, "r") as f:
            data = json.load(f)
        calibration = {}
        for q_str, options in data.items():
            calibration[int(q_str)] = options
        return calibration
    except FileNotFoundError:
        print("❌ HATA: calibration.json bulunamadı!")
        print("Önce kalibrasyon yapmalısınız:")
        print("  python calibrate_runner.py <roi_görüntüsü>")
        return None
    except Exception as e:
        print(f"❌ Kalibrasyon yükleme hatası: {e}")
        return None


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
    """Görüntüde kağıt sınırlarını bul"""
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


def read_answers(image_path):
    """
    OMR formundaki cevapları oku
    
    Args:
        image_path: Form görüntüsü yolu
        
    Returns:
        dict: Soru numarası -> Cevap (A/B/C/D) veya None
    """
    # Kalibrasyon verilerini yükle
    calibration = load_calibration()
    if calibration is None:
        return None
    
    # Görüntüyü yükle
    print(f"📸 Görüntü yükleniyor: {image_path}")
    image = cv2.imread(str(image_path))
    
    # OpenCV başarısız olursa PIL ile dene
    if image is None:
        print("⚠️ cv2.imread başarısız, PIL ile deneniyor...")
        try:
            from PIL import Image
            pil_image = Image.open(str(image_path))
            # RGB'ye çevir (RGBA olabilir)
            if pil_image.mode == 'RGBA':
                pil_image = pil_image.convert('RGB')
            # Numpy array'e çevir
            image = np.array(pil_image)
            # RGB -> BGR (OpenCV formatı)
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            print("✅ PIL ile görüntü yüklendi")
        except Exception as e:
            print(f"❌ PIL ile de yüklenemedi: {e}")
            image = None
    
    if image is None:
        print(f"❌ HATA: Görüntü yüklenemedi: {image_path}")
        return None
    
    # A4 tespiti ve perspektif düzeltme
    print("🔍 A4 kağıt tespiti yapılıyor...")
    corners = find_paper_contour(image)
    
    if corners is not None:
        print("✅ Kağıt köşeleri bulundu, perspektif düzeltiliyor...")
        warped = correct_perspective(image, corners)
    else:
        print("⚠️ Kağıt köşeleri bulunamadı, görüntü resize ediliyor...")
        warped = cv2.resize(image, (TARGET_WIDTH, TARGET_HEIGHT))
    
    # ROI (cevap bölgesi) extract et
    print("📐 Cevap bölgesi çıkarılıyor...")
    gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    
    roi_y1 = int(h * ROI_Y_START)
    roi_y2 = int(h * ROI_Y_END)
    roi_x1 = int(w * ROI_X_START)
    roi_x2 = int(w * ROI_X_END)
    
    roi = gray[roi_y1:roi_y2, roi_x1:roi_x2]
    roi_h, roi_w = roi.shape
    
    # Her soru için cevapları oku
    print(f"🎯 Cevaplar okunuyor... ({len(calibration)} soru)")
    print("="*60)
    
    answers = {}
    confidence_scores = {}
    
    for q_num in sorted(calibration.keys()):
        # Her şık için intensity değerini ölç
        intensities = {}
        
        for option in OPTIONS:
            if option in calibration[q_num]:
                x_center = calibration[q_num][option]["x"]
                y_center = calibration[q_num][option]["y"]
                
                # Bubble bölgesini al
                bx1 = max(0, x_center - BUBBLE_RADIUS)
                bx2 = min(roi_w, x_center + BUBBLE_RADIUS)
                by1 = max(0, y_center - BUBBLE_RADIUS)
                by2 = min(roi_h, y_center + BUBBLE_RADIUS)
                
                bubble = roi[by1:by2, bx1:bx2]
                
                if bubble.size > 0:
                    avg_intensity = np.mean(bubble)
                    intensities[option] = avg_intensity
                else:
                    intensities[option] = 255  # Beyaz (okunamadı)
        
        # En koyu şıkkı bul (en düşük intensity)
        if intensities:
            darkest_option = min(intensities, key=intensities.get)
            darkest_value = intensities[darkest_option]
            
            # En açık şıkkı bul (kontrast hesabı için)
            lightest_value = max(intensities.values())
            contrast = lightest_value - darkest_value
            
            # TÜM ŞIK DEĞERLERİNİ GÖSTER (DEBUG)
            intensities_str = " | ".join([f"{opt}:{int(intensities[opt])}" for opt in OPTIONS if opt in intensities])
            
            # Karar ver: Yeterince koyu mu ve kontrast yeterli mi?
            if darkest_value < INTENSITY_THRESHOLD and contrast > CONTRAST_THRESHOLD:
                answers[q_num] = darkest_option
                confidence = min(contrast / 80.0, 1.0)
                confidence_scores[q_num] = confidence
                
                # Detaylı bilgi göster
                status = "✓"
                print(f"  {status} Soru {q_num:2d}: {darkest_option} "
                      f"(koyu: {int(darkest_value)}, kontrast: {int(contrast)}, "
                      f"güven: {confidence:.0%})")
                print(f"      [{intensities_str}]")
            else:
                # Boş bırakılmış veya eşikleri geçememiş
                answers[q_num] = None
                confidence_scores[q_num] = 0.0
                reason = ""
                if darkest_value >= INTENSITY_THRESHOLD:
                    reason = "çok açık"
                elif contrast <= CONTRAST_THRESHOLD:
                    reason = "kontrast düşük"
                print(f"  ○ Soru {q_num:2d}: BOŞ "
                      f"(koyu: {int(darkest_value)}, kontrast: {int(contrast)}, sebep: {reason})")
                print(f"      [{intensities_str}]")
        else:
            answers[q_num] = None
            confidence_scores[q_num] = 0.0
            print(f"  ✗ Soru {q_num:2d}: OKUNAMADI")
    
    print("="*60)
    
    # Özet
    answered_count = sum(1 for ans in answers.values() if ans is not None)
    blank_count = len(answers) - answered_count
    avg_confidence = sum(confidence_scores.values()) / len(confidence_scores) if confidence_scores else 0
    
    return {
        "success": True,
        "answers": answers,
        "confidence": confidence_scores,
        "summary": {
            "total": len(calibration),
            "answered": answered_count,
            "blank": blank_count,
            "average_confidence": round(avg_confidence, 2)
        }
    }


def main():
    if len(sys.argv) < 2:
        print("Kullanım: python omr_answer_reader.py <görüntü_yolu>")
        print("\nÖrnek:")
        print("  python omr_answer_reader.py test_uploaded.png")
        print("\nNot: calibration.json dosyası aynı klasörde olmalı!")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    print("="*60)
    print("OMR CEVAP OKUYUCU")
    print("="*60)
    
    result = read_answers(image_path)
    
    if result is None:
        print("\n❌ Cevap okuma başarısız!")
        sys.exit(1)
    
    # Sonuçları JSON olarak kaydet
    script_dir = Path(__file__).parent
    output_file = script_dir / "omr_answers.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\n📁 Sonuçlar kaydedildi: {output_file}")
    
    # Özet göster
    print("\n" + "="*60)
    print("ÖZET")
    print("="*60)
    print(f"Toplam Soru:     {result['summary']['total']}")
    print(f"Cevaplanan:      {result['summary']['answered']}")
    print(f"Boş:             {result['summary']['blank']}")
    print(f"Ortalama Güven:  {result['summary']['average_confidence']:.0%}")
    
    # Cevap dizisi
    answer_string = ""
    for q in sorted(result['answers'].keys()):
        ans = result['answers'][q]
        answer_string += ans if ans else "X"
    
    print(f"\nCevap Dizisi: {answer_string}")
    print("="*60)
    print("\n✅ İşlem tamamlandı!")


if __name__ == "__main__":
    main()
