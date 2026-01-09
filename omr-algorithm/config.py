"""
OMR Algorithm Configuration
Optik form için konfigürasyon parametreleri
"""

# Hedef görüntü boyutları (perspektif düzeltme sonrası)
TARGET_WIDTH = 800
TARGET_HEIGHT = 1100

# Grid yapısı - 50 soru, 5 sütun x 10 satır
GRID_COLS = 5
GRID_ROWS = 10
NUM_QUESTIONS = 50
OPTIONS = ["A", "B", "C", "D"]

# ROI (Region of Interest) oranları - soru alanının form içindeki konumu
# Bu değerler formun yapısına göre ayarlanmalı
ROI = {
    "x_start": 0.05,   # Soldan %5
    "x_end": 0.95,     # Sağdan %5
    "y_start": 0.35,   # Üstten %35 (header alanını atla)
    "y_end": 0.92,     # Alttan %8
}

# Bubble tespit parametreleri
BUBBLE = {
    "fill_threshold": 0.35,      # %35 doluluk = işaretli kabul et
    "confidence_threshold": 0.5, # Güven skoru eşiği
    "min_separation": 0.15,      # İşaretli-işaretsiz farkı minimum
}

# Perspektif düzeltme parametreleri
PERSPECTIVE = {
    "blur_kernel": (5, 5),
    "canny_low": 50,
    "canny_high": 150,
    "contour_approx_factor": 0.02,
}

# Debug modu
DEBUG = True
DEBUG_OUTPUT_DIR = "debug_output"
