"""
Manuel Bubble Kalibrasyon Aracı
Mouse ile bubble'lara tıkla, koordinatlar kaydedilsin
"""

import cv2
import numpy as np
import json
from pathlib import Path

# Tıklanan noktalar
clicked_points = []
current_question = 1
current_option = 0  # 0=A, 1=B, 2=C, 3=D
OPTIONS = ["A", "B", "C", "D"]

# Kayıt
calibration_data = {}


def mouse_callback(event, x, y, flags, param):
    global clicked_points, current_question, current_option, calibration_data
    
    if event == cv2.EVENT_LBUTTONDOWN:
        option = OPTIONS[current_option]
        
        # Noktayı kaydet
        if current_question not in calibration_data:
            calibration_data[current_question] = {}
        
        calibration_data[current_question][option] = {"x": x, "y": y}
        clicked_points.append((x, y, current_question, option))
        
        print(f"Soru {current_question}, Şık {option}: ({x}, {y})")
        
        # Sonraki şıka geç
        current_option += 1
        if current_option >= 4:
            current_option = 0
            current_question += 1
            
            if current_question > 10:  # 10 soru için
                print("\n=== KALİBRASYON TAMAMLANDI ===")
                print("'s' tuşuna basarak kaydet")


def main():
    global clicked_points, current_question, current_option
    
    # Answer region'ı yükle
    image_path = "debug_output/39_answer_region.jpg"
    image = cv2.imread(image_path)
    
    if image is None:
        print(f"HATA: {image_path} bulunamadı!")
        print("Önce 'py -3 omr_reader.py filled_form.png 5' çalıştır")
        return
    
    # Pencereyi oluştur
    window_name = "Bubble Kalibrasyonu - Click on bubbles (A, B, C, D for each question)"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 1000, 800)
    cv2.setMouseCallback(window_name, mouse_callback)
    
    print("=" * 50)
    print("MANUEL KALİBRASYON")
    print("=" * 50)
    print("Her soru için A, B, C, D bubble'larına sırayla tıkla")
    print("Toplam 10 soru için")
    print("'q' = Çık, 's' = Kaydet, 'r' = Sıfırla")
    print("=" * 50)
    print(f"\nSoru {current_question}, Şık {OPTIONS[current_option]} bekliyor...")
    
    while True:
        # Görüntüyü kopyala ve işaretleri çiz
        display = image.copy()
        
        # Tıklanan noktaları çiz
        for (x, y, q, opt) in clicked_points:
            cv2.circle(display, (x, y), 12, (0, 255, 0), 3)
            cv2.putText(display, f"{q}{opt}", (x+15, y+5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 2)
        
        # Mevcut durumu göster
        status = f"Soru {current_question}, Sik {OPTIONS[current_option]}"
        cv2.putText(display, status, (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        
        cv2.imshow(window_name, display)
        
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q'):
            break
        elif key == ord('s'):
            # Kaydet
            save_calibration()
            break
        elif key == ord('r'):
            # Sıfırla
            clicked_points = []
            calibration_data = {}
            current_question = 1
            current_option = 0
            print("Sıfırlandı!")
    
    cv2.destroyAllWindows()


def save_calibration():
    """Kalibrasyon verilerini kaydet ve grid parametrelerini hesapla"""
    
    if not calibration_data:
        print("Kayıt edilecek veri yok!")
        return
    
    # JSON olarak kaydet
    with open("calibration.json", "w") as f:
        json.dump(calibration_data, f, indent=2)
    
    print("\n=== KALİBRASYON VERİLERİ ===")
    
    # Grid parametrelerini hesapla
    if 1 in calibration_data and "A" in calibration_data[1]:
        first_a = calibration_data[1]["A"]
        print(f"İlk bubble (1:A): x={first_a['x']}, y={first_a['y']}")
        
        # Bubble spacing hesapla (A-B arası)
        if "B" in calibration_data[1]:
            b = calibration_data[1]["B"]
            spacing_x = b["x"] - first_a["x"]
            print(f"Bubble spacing (X): {spacing_x} px")
        
        # Satır yüksekliği (Soru 1 - Soru 2 arası)
        if 2 in calibration_data and "A" in calibration_data[2]:
            second_a = calibration_data[2]["A"]
            row_height = second_a["y"] - first_a["y"]
            print(f"Satır yüksekliği: {row_height} px")
    
    print(f"\nKalibrasyon kaydedildi: calibration.json")
    print("\nBu değerleri omr_reader.py'de kullan:")
    
    # Önerilen kod
    if len(calibration_data) >= 2:
        a1 = calibration_data[1]["A"]
        b1 = calibration_data[1]["B"]
        a2 = calibration_data[2]["A"]
        
        x_offset = a1["x"]
        y_offset = a1["y"]  
        spacing = b1["x"] - a1["x"]
        row_h = a2["y"] - a1["y"]
        
        print(f"""
    # KALİBRE EDİLMİŞ DEĞERLER
    first_bubble_x = {x_offset}  # İlk bubble X
    first_bubble_y = {y_offset}  # İlk bubble Y  
    bubble_spacing = {spacing}   # A-B arası
    row_height = {row_h}         # Satır yüksekliği
        """)


if __name__ == "__main__":
    main()
