"""
OMR Reader - Basit Siyahlık Tabanlı Algılama
perspective.py ile düzeltilmiş görüntüyü okur
Bubble pozisyonlarını bulur ve en siyah olanı seçer
"""

import cv2
import numpy as np
import json
import sys

# 15 soru, 5 sütun x 10 satır (her sütunda 10 soru)
NUM_QUESTIONS = 15
GRID_COLS = 5
GRID_ROWS = 10
OPTIONS = ["A", "B", "C", "D"]

# Cevap bölgesi oranları (çalışan değerlerde tutuluyor)
ROI_Y_START = 0.38
ROI_Y_END = 0.92
ROI_X_START = 0.04
ROI_X_END = 0.96


def read_omr(image_path):
    """Ana OMR okuma fonksiyonu"""
    
    # 1. Görüntüyü yükle
    img = cv2.imread(image_path)
    if img is None:
        return {"success": False, "error": "Görüntü yüklenemedi"}
    
    # 2. Gri tonlamaya çevir
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    
    # 3. Cevap bölgesini (ROI) kes
    roi_y1 = int(h * ROI_Y_START)
    roi_y2 = int(h * ROI_Y_END)
    roi_x1 = int(w * ROI_X_START)
    roi_x2 = int(w * ROI_X_END)
    
    roi = gray[roi_y1:roi_y2, roi_x1:roi_x2]
    roi_h, roi_w = roi.shape
    
    # 4. Grid parametrelerini hesapla
    col_width = roi_w / GRID_COLS  # Her sütunun genişliği
    row_height = roi_h / GRID_ROWS  # Her satırın yüksekliği
    option_width = col_width / len(OPTIONS)  # Her şıkkın genişliği
    
    answers = {}
    confidence = {}
    
    # Debug görüntüsü oluştur
    debug_img = cv2.cvtColor(roi.copy(), cv2.COLOR_GRAY2BGR)
    
    # 5. Her soruyu işle
    for q_num in range(1, NUM_QUESTIONS + 1):
        # Sütun ve satır pozisyonunu hesapla
        col = (q_num - 1) // GRID_ROWS
        row = (q_num - 1) % GRID_ROWS
        
        # Satır merkezi Y koordinatı
        y_center = int((row + 0.5) * row_height)
        
        # Sütun başlangıcı X koordinatı  
        x_col_start = int(col * col_width)
        
        # Her şık için siyahlık ölç
        darkness_values = {}
        
        for opt_idx, option in enumerate(OPTIONS):
            # Şık merkezi X koordinatı
            x_option_center = int(x_col_start + (opt_idx + 0.5) * option_width)
            
            # Bubble örnekleme bölgesi boyutları
            # Option genişliğinin %40'ı, satır yüksekliğinin %40'ı
            bubble_w = int(option_width * 0.4)
            bubble_h = int(row_height * 0.4)
            
            # Bubble bölgesini kes
            bx1 = max(0, x_option_center - bubble_w // 2)
            bx2 = min(roi_w, x_option_center + bubble_w // 2)
            by1 = max(0, y_center - bubble_h // 2)
            by2 = min(roi_h, y_center + bubble_h // 2)
            
            bubble = roi[by1:by2, bx1:bx2]
            
            if bubble.size > 0:
                # Ortalama siyahlık hesapla
                # Düşük değer = koyu = dolu
                # 0 = siyah, 255 = beyaz
                avg_intensity = np.mean(bubble)
                darkness_values[option] = avg_intensity
            else:
                darkness_values[option] = 255  # Beyaz (boş)
            
            # Debug: Bubble bölgesini çiz
            color = (0, 255, 0) if darkness_values[option] < 200 else (128, 128, 128)
            cv2.rectangle(debug_img, (bx1, by1), (bx2, by2), color, 1)
            # Intensity değerini yaz
            cv2.putText(debug_img, f"{int(darkness_values[option])}", 
                       (bx1, by1-2), cv2.FONT_HERSHEY_SIMPLEX, 0.3, color, 1)
        
        # En koyu (en düşük intensity) şıkkı bul
        darkest_option = min(darkness_values, key=darkness_values.get)
        darkest_value = darkness_values[darkest_option]
        
        # En açık (en yüksek intensity) şıkkı bul
        lightest_value = max(darkness_values.values())
        
        # Kontrast hesapla (açık - koyu)
        contrast = lightest_value - darkest_value
        
        # Karar ver:
        # 1. En koyu şık yeterince koyu olmalı (< 200)
        # 2. Kontrast yeterince yüksek olmalı (> 20)
        if darkest_value < 200 and contrast > 20:
            answers[q_num] = darkest_option
            # Güven kontrasta bağlı
            conf = min(contrast / 80.0, 1.0)
            confidence[q_num] = float(conf)
        else:
            # Boş bırakılmış
            answers[q_num] = None
            confidence[q_num] = 0.0
        
        # Debug: Soru numarası ve cevabı yaz
        ans_text = answers[q_num] if answers[q_num] else "X"
        cv2.putText(debug_img, f"Q{q_num}:{ans_text}", 
                   (x_col_start - 20, y_center), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 0), 1)
    
    # Debug görüntüsünü kaydet
    cv2.imwrite("debug_bubbles.jpg", debug_img)
    print("Debug görüntü kaydedildi: debug_bubbles.jpg")
    
    # Özet bilgiler
    answered = sum(1 for ans in answers.values() if ans is not None)
    avg_conf = sum(confidence.values()) / len(confidence) if confidence else 0
    answer_str = "".join([answers.get(i) or "X" for i in range(1, NUM_QUESTIONS + 1)])
    
    return {
        "success": True,
        "answers": answers,
        "confidence": confidence,
        "answer_string": answer_str,
        "summary": {
            "total": NUM_QUESTIONS,
            "answered": answered,
            "blank": NUM_QUESTIONS - answered,
            "average_confidence": round(avg_conf, 2)
        }
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Görüntü yolu belirtilmedi"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = read_omr(image_path)
    
    # JSON'a kaydet
    with open("omr_result.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    # Ekrana yazdır
    print(json.dumps(result, indent=2))
    
    # Özet
    if result["success"]:
        print(f"\n{'='*50}")
        print(f"Cevaplanan: {result['summary']['answered']}/{result['summary']['total']}")
        print(f"Ortalama Guven: {result['summary']['average_confidence']:.0%}")
        print(f"\nCevap Dizisi: {result['answer_string']}")
        print(f"{'='*50}")
        
        # Detaylı
        print("\nDetayli Sonuclar:")
        for i in range(1, NUM_QUESTIONS + 1):
            ans = result['answers'].get(i)
            conf = result['confidence'].get(i, 0)
            mark = "OK" if ans else "  "
            bos = ans if ans else 'BOS'
            print(f"  {mark} Soru {i:2d}: {bos:4s} (guven: {conf:.0%})")
        
        print(f"\nDetayli sonuc: omr_result.json")
