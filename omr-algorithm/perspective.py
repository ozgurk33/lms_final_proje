"""
Perspective Correction Module
Kağıt perspektifini düzeltme ve görüntüyü normalize etme
"""

import cv2
import numpy as np
from pathlib import Path
import config


def order_points(pts):
    """
    Dört köşe noktasını sırala: sol-üst, sağ-üst, sağ-alt, sol-alt
    
    Args:
        pts: 4x2 numpy array (4 nokta, her biri x,y)
    
    Returns:
        Sıralı 4x2 numpy array
    """
    rect = np.zeros((4, 2), dtype="float32")
    
    # Sol-üst: x+y toplamı en küçük
    # Sağ-alt: x+y toplamı en büyük
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # Sol-üst
    rect[2] = pts[np.argmax(s)]  # Sağ-alt
    
    # Sağ-üst: y-x farkı en küçük (x büyük, y küçük)
    # Sol-alt: y-x farkı en büyük (x küçük, y büyük)
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # Sağ-üst
    rect[3] = pts[np.argmax(diff)]  # Sol-alt
    
    return rect


def find_paper_contour(image, debug_dir=None):
    """
    Görüntüde kağıt sınırlarını bul
    
    Args:
        image: BGR formatında görüntü
        debug_dir: Debug görüntüleri için klasör (opsiyonel)
    
    Returns:
        4 köşe noktası (4x2 array) veya None
    """
    # Gri tonlamaya çevir
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Gaussian blur ile gürültü azalt
    blurred = cv2.GaussianBlur(gray, config.PERSPECTIVE["blur_kernel"], 0)
    
    # Canny kenar algılama
    edges = cv2.Canny(
        blurred, 
        config.PERSPECTIVE["canny_low"], 
        config.PERSPECTIVE["canny_high"]
    )
    
    # Kenarları genişlet (daha iyi contour tespiti için)
    kernel = np.ones((3, 3), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=2)
    
    if debug_dir:
        cv2.imwrite(str(debug_dir / "01_gray.jpg"), gray)
        cv2.imwrite(str(debug_dir / "02_blurred.jpg"), blurred)
        cv2.imwrite(str(debug_dir / "03_edges.jpg"), edges)
    
    # Contour'ları bul
    contours, _ = cv2.findContours(
        edges.copy(), 
        cv2.RETR_EXTERNAL, 
        cv2.CHAIN_APPROX_SIMPLE
    )
    
    if not contours:
        return None
    
    # En büyük contour'u al (muhtemelen kağıt)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    # Debug: en büyük 5 contour'u çiz
    if debug_dir:
        debug_img = image.copy()
        for i, cnt in enumerate(contours[:5]):
            color = [(0, 255, 0), (255, 0, 0), (0, 0, 255), (255, 255, 0), (0, 255, 255)][i]
            cv2.drawContours(debug_img, [cnt], -1, color, 2)
        cv2.imwrite(str(debug_dir / "04_top_contours.jpg"), debug_img)
    
    # Dörtgen şekil ara - farklı approximation faktörleri dene
    approx_factors = [0.02, 0.03, 0.04, 0.05, 0.01]
    
    for contour in contours[:5]:
        area = cv2.contourArea(contour)
        image_area = image.shape[0] * image.shape[1]
        
        # Yeterince büyük değilse atla
        if area < image_area * 0.1:
            continue
        
        # Farklı approximation faktörlerini dene
        for factor in approx_factors:
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, factor * peri, True)
            
            if len(approx) == 4:
                if debug_dir:
                    debug_img = image.copy()
                    cv2.drawContours(debug_img, [approx], -1, (0, 255, 0), 3)
                    for i, pt in enumerate(approx):
                        cv2.circle(debug_img, tuple(pt[0]), 10, (0, 0, 255), -1)
                        cv2.putText(debug_img, str(i), tuple(pt[0] + [10, 10]), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
                    cv2.imwrite(str(debug_dir / "05_detected_paper.jpg"), debug_img)
                
                return approx.reshape(4, 2)
        
        # Approximation başarısız olduysa, convex hull dene ve köşeleri bul
        hull = cv2.convexHull(contour)
        
        # Hull'dan 4 köşeyi bul (en uzak noktalar)
        corners = find_four_corners_from_hull(hull, image.shape)
        if corners is not None:
            if debug_dir:
                debug_img = image.copy()
                cv2.drawContours(debug_img, [hull], -1, (255, 0, 255), 2)
                for i, pt in enumerate(corners):
                    cv2.circle(debug_img, (int(pt[0]), int(pt[1])), 10, (0, 255, 0), -1)
                cv2.imwrite(str(debug_dir / "05_detected_paper.jpg"), debug_img)
            return corners
    
    return None


def find_four_corners_from_hull(hull, image_shape):
    """
    Convex hull'dan 4 köşeyi bul
    """
    if len(hull) < 4:
        return None
    
    # Hull noktalarını düzleştir
    points = hull.reshape(-1, 2)
    
    # Görüntü köşelerine en yakın noktaları bul
    height, width = image_shape[:2]
    target_corners = np.array([
        [0, 0],           # Sol-üst
        [width, 0],       # Sağ-üst
        [width, height],  # Sağ-alt
        [0, height]       # Sol-alt
    ])
    
    corners = []
    for target in target_corners:
        distances = np.sqrt(np.sum((points - target) ** 2, axis=1))
        closest_idx = np.argmin(distances)
        corners.append(points[closest_idx])
    
    return np.array(corners, dtype="float32")


def warp_perspective(image, corners, debug_dir=None):
    """
    Perspektif dönüşümü uygula
    
    Args:
        image: BGR formatında görüntü
        corners: 4 köşe noktası (4x2 array)
        debug_dir: Debug klasörü
    
    Returns:
        Düzeltilmiş görüntü
    """
    # Köşeleri sırala
    rect = order_points(corners.astype("float32"))
    
    if debug_dir:
        debug_img = image.copy()
        labels = ["TL", "TR", "BR", "BL"]
        colors = [(0, 0, 255), (0, 255, 0), (255, 0, 0), (255, 255, 0)]
        for i, (point, label, color) in enumerate(zip(rect, labels, colors)):
            x, y = int(point[0]), int(point[1])
            cv2.circle(debug_img, (x, y), 10, color, -1)
            cv2.putText(debug_img, label, (x + 15, y), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
        cv2.imwrite(str(debug_dir / "06_ordered_corners.jpg"), debug_img)
    
    # Hedef noktalar
    dst = np.array([
        [0, 0],
        [config.TARGET_WIDTH - 1, 0],
        [config.TARGET_WIDTH - 1, config.TARGET_HEIGHT - 1],
        [0, config.TARGET_HEIGHT - 1]
    ], dtype="float32")
    
    # Perspektif dönüşüm matrisi
    M = cv2.getPerspectiveTransform(rect, dst)
    
    # Dönüşümü uygula
    warped = cv2.warpPerspective(
        image, M, 
        (config.TARGET_WIDTH, config.TARGET_HEIGHT)
    )
    
    if debug_dir:
        cv2.imwrite(str(debug_dir / "07_warped.jpg"), warped)
    
    return warped


def correct_perspective(image_path, output_path=None, debug=False):
    """
    Ana fonksiyon: Görüntüdeki kağıdı bul ve perspektifi düzelt
    
    Args:
        image_path: Giriş görüntüsü yolu
        output_path: Çıkış görüntüsü yolu (opsiyonel)
        debug: Debug modunu aktif et
    
    Returns:
        Düzeltilmiş görüntü veya None (başarısızsa)
    """
    # Görüntüyü yükle
    image = cv2.imread(str(image_path))
    if image is None:
        print(f"HATA: Görüntü yüklenemedi: {image_path}")
        return None
    
    # Debug klasörü
    debug_dir = None
    if debug:
        debug_dir = Path(config.DEBUG_OUTPUT_DIR)
        debug_dir.mkdir(exist_ok=True)
        cv2.imwrite(str(debug_dir / "00_original.jpg"), image)
    
    # Kağıt köşelerini bul
    corners = find_paper_contour(image, debug_dir)
    
    if corners is None:
        print("UYARI: Kağıt köşeleri bulunamadı, orijinal görüntü döndürülüyor")
        # Fallback: görüntüyü sadece resize et
        warped = cv2.resize(image, (config.TARGET_WIDTH, config.TARGET_HEIGHT))
    else:
        # Perspektif düzeltme uygula
        warped = warp_perspective(image, corners, debug_dir)
    
    # Çıkış dosyasına kaydet
    if output_path:
        cv2.imwrite(str(output_path), warped)
        print(f"Düzeltilmiş görüntü kaydedildi: {output_path}")
    
    return warped


# Test kodu
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Kullanım: python perspective.py <görüntü_yolu> [çıkış_yolu]")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "corrected_output.jpg"
    
    result = correct_perspective(input_path, output_path, debug=True)
    
    if result is not None:
        print("Perspektif düzeltme başarılı!")
    else:
        print("Perspektif düzeltme başarısız!")
