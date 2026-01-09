"""
Kalibrasyon Aracı - Kolay Kullanım
Pipeline'dan ROI extract edip kalibrasyon yapılmasını sağlar
"""

import cv2
import sys
import os
from pathlib import Path
import subprocess

def prepare_calibration(roi_image_path):
    """
    ROI görüntüsünü kalibrasyon için hazırla
    
    Args:
        roi_image_path: Cevap bölgesi (ROI) görüntüsü yolu
    """
    roi_path = Path(roi_image_path)
    
    if not roi_path.exists():
        print(f"❌ HATA: Görüntü bulunamadı: {roi_image_path}")
        return False
    
    # Debug output klasörünü oluştur
    debug_dir = Path("debug_output")
    debug_dir.mkdir(exist_ok=True)
    
    # ROI görüntüsünü debug klasörüne kopyala
    target_path = debug_dir / "39_answer_region.jpg"
    
    # Görüntüyü yükle ve kaydet
    img = cv2.imread(str(roi_path))
    if img is None:
        print(f"❌ HATA: Görüntü yüklenemedi: {roi_image_path}")
        return False
    
    cv2.imwrite(str(target_path), img)
    print(f"✅ ROI görüntüsü hazırlandı: {target_path}")
    
    return True


def run_calibration():
    """Kalibrasyon aracını çalıştır"""
    print("\n" + "="*60)
    print("KALİBRASYON ARACI BAŞLATILIYOR")
    print("="*60)
    print("\n📋 Talimatlar:")
    print("  1. Her soru için A, B, C, D bubble'larına sırayla tıklayın")
    print("  2. Toplam 10 soru × 4 şık = 40 tıklama yapılacak")
    print("  3. Tamamlandığında 's' tuşuna basıp kaydedin")
    print("  4. Hata yaparsanız 'r' ile sıfırlayabilirsiniz")
    print("\n" + "="*60 + "\n")
    
    # calibrate.py'yi çalıştır
    try:
        subprocess.run([sys.executable, "calibrate.py"], check=True)
        print("\n✅ Kalibrasyon tamamlandı!")
        print("📁 Kalibrasyon dosyası: calibration.json")
        return True
    except subprocess.CalledProcessError:
        print("\n❌ Kalibrasyon iptal edildi veya hata oluştu")
        return False
    except FileNotFoundError:
        print("\n❌ HATA: calibrate.py bulunamadı!")
        return False


def main():
    if len(sys.argv) < 2:
        print("Kullanım: python calibrate_runner.py <roi_görüntüsü>")
        print("\nÖrnek:")
        print("  python calibrate_runner.py pipeline_output/2_answer_region_zoomed.jpg")
        print("\nVeya önce pipeline'ı çalıştırın:")
        print("  python omr_pipeline_visualizer.py test_form.png output")
        print("  python calibrate_runner.py output/2_answer_region_zoomed.jpg")
        sys.exit(1)
    
    roi_image = sys.argv[1]
    
    print("🔧 Kalibrasyon Hazırlığı")
    print("="*60)
    
    # ROI görüntüsünü hazırla
    if not prepare_calibration(roi_image):
        sys.exit(1)
    
    # Kalibrasyon aracını çalıştır
    if run_calibration():
        print("\n🎉 Artık pipeline'ı kalibrasyonlu çalıştırabilirsiniz!")
        print("   python omr_pipeline_visualizer.py <görüntü> <çıkış_klasörü>")
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
