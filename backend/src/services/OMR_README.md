# OMR Detector - README

## Nedir?

Bu sistem, optik cevap kağıtlarını otomatik olarak okuyarak işaretli cevapları tespit eden bir Optical Mark Recognition (OMR) algoritmasıdır.

## Özellikler

✅ **Robust Form Tespiti**: Kağıdın köşelerini otomatik tespit eder ve perspektif düzeltmesi yapar  
✅ **Adaptive Thresholding**: Farklı aydınlatma koşullarında çalışır  
✅ **Yüksek Doğruluk**: Circular bubble detection ile %90+ doğruluk  
✅ **Debug Görselleri**: Her aşama için görsel çıktı üretir  
✅ **Flexible**: 50 soruluk standart formlar için optimize edilmiş  

## Kullanım

### Doğrudan Python ile

```bash
python omr_detector.py <gorsel_yolu>
```

**Örnek:**
```bash
python omr_detector.py test_sheet.jpg
```

**Çıktı:**
```json
{
  "status": "success",
  "answers": {
    "1": "A",
    "2": "B",
    "3": "C",
    ...
  },
  "confidence": {
    "1": 0.95,
    "2": 0.87,
    ...
  },
  "statistics": {
    "total_questions": 50,
    "marked_questions": 45,
    "unmarked_questions": 5,
    "bubbles_detected": 203,
    "zone_detected": true
  },
  "debug_images": {...}
}
```

### Test Script ile

```bash
python test_omr.py <gorsel_yolu>
```

Test scripti renkli ve detaylı çıktı sağlar.

## Parametre Ayarları

Dosyanın başındaki konfigürasyon değişkenleri ile ayar yapabilirsiniz:

```python
# Bubble Detection Parameters
MIN_BUBBLE_AREA = 150          # Minimum bubble alanı (piksel²)
MAX_BUBBLE_AREA = 800          # Maximum bubble alanı (piksel²)
MIN_ASPECT_RATIO = 0.75        # Minimum en/boy oranı
MAX_ASPECT_RATIO = 1.25        # Maximum en/boy oranı
CIRCULARITY_THRESHOLD = 0.65   # Dairesellik eşiği (0-1)

# Fill Detection Parameters
FILL_THRESHOLD = 0.30          # İşaretli sayılması için minimum doluluk
MIN_FILL_DIFFERENCE = 1.3      # Kazanan/2. arasındaki minimum fark
```

## Debug Görselleri

Algoritma her aşama için debug görseli üretir:

1. `debug_omr_*_original.jpg` - Orijinal görüntü
2. `debug_omr_*_corners.jpg` - Tespit edilen köşeler
3. `debug_omr_*_warped.jpg` - Perspektif düzeltme sonrası
4. `debug_omr_*_bubbles.jpg` - Tespit edilen tüm bubbles
5. `debug_omr_*_threshold.jpg` - Threshold görüntüsü
6. `debug_omr_*_zone.jpg` - Cevap bölgesi
7. `debug_omr_*_grid.jpg` - Grid layout
8. `debug_omr_*_answers.jpg` - İşaretli cevaplar (yeşil)

## Backend Entegrasyonu

Backend Node.js servisi ile kullanım:

```javascript
const { execSync } = require('child_process');
const path = require('path');

function processOMR(imagePath) {
    const scriptPath = path.join(__dirname, 'omr_detector.py');
    const result = execSync(`python "${scriptPath}" "${imagePath}"`, {
        encoding: 'utf-8'
    });
    
    return JSON.parse(result);
}
```

## Mobil Entegrasyon

Mobil uygulamadan kullanım için backend API endpoint'i:

```
POST /api/omr/process
Content-Type: multipart/form-data

{
  "image": <file>
}
```

## Troubleshooting

### Problem: "Failed to load image"
**Çözüm**: Görüntü yolu doğru mu kontrol edin.

### Problem: Düşük doğruluk
**Çözüm**: 
- Görüntü kalitesini artırın
- İyi aydınlatma kullanın
- Kağıdı düz yüzeyde fotoğraflayın
- Parametreleri ayarlayın

### Problem: "Not enough bubbles detected"
**Çözüm**:
- `MIN_BUBBLE_AREA` ve `MAX_BUBBLE_AREA` değerlerini ayarlayın
- `CIRCULARITY_THRESHOLD` değerini düşürün (0.6 gibi)

### Problem: Form köşeleri tespit edilemiyor
**Çözüm**:
- Görüntüde kağıt net görünüyor mu?
- Arka plan sade mi?
- Kontrast yeterli mi?

## Gereksinimler

```bash
pip install opencv-python numpy
```

## Versiyon

**v2.0** - Tamamen yeniden yazılmış, daha robust ve hızlı algoritma

## Lisans

SE_FINAL Project - 2026
