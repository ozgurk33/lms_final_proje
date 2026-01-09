# LMS Mobile App - React Native

Basit ve test edilebilir bir Learning Management System (LMS) mobil uygulaması.

## Özellikler

### 🎓 Öğrenci Özellikleri
- Kayıtlı kurslara erişim
- Kurs içeriklerini görüntüleme (videolar, PDF'ler)
- Sınav geçmişini görüntüleme
- Aktif sınavları görüntüleme (sınava giriş Web/Desktop gerektirir)

### 👨‍🏫 Eğitmen Özellikleri
- Atanan kursları görüntüleme
- Yeni kurs oluşturma
- Mevcut kursları düzenleme
- Öğrenci sayısını görüntüleme

### 👨‍💼 Admin Özellikleri
- Kullanıcı yönetimi
- Kurs yönetimi
- Temel istatistikler

## Teknik Detaylar

- **React Native:** 0.73.9
- **Navigation:** React Navigation (Stack Navigator)
- **State Management:** AsyncStorage
- **API Client:** Axios
- **Backend:** Node.js Express API (http://192.168.1.5:3000)

## Kurulum

### Gereksinimler
- Node.js 20.x
- React Native CLI
- Android Studio (Android için)
- Xcode (iOS için, sadece macOS)

### Adımlar

1. Bağımlılıkları yükleyin:
```bash
cd mobile
npm install
```

2. Android için çalıştırma:
```bash
npx react-native run-android
```

3. iOS için çalıştırma (macOS gerekli):
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

## Backend Bağlantısı

Uygulama varsayılan olarak `http://192.168.1.5:3000` adresine bağlanır. 

Backend'in çalıştığından emin olun:
```bash
cd ../backend
npm start
```

## Klasör Yapısı

```
mobile/
├── src/
│   ├── screens/
│   │   ├── auth/         # Login ekranı
│   │   ├── student/      # Öğrenci ekranları
│   │   ├── instructor/   # Eğitmen ekranları
│   │   └── admin/        # Admin ekranları
│   ├── navigation/       # Navigasyon yapısı
│   ├── services/         # API servisleri
│   └── utils/            # Yardımcı fonksiyonlar
├── android/              # Android native kod
├── ios/                  # iOS native kod
└── App.js               # Ana uygulama dosyası
```

## Test Kullanıcıları

Backend'de aşağıdaki test kullanıcılarını kullanabilirsiniz:

- **Öğrenci:** student@example.com / password123
- **Eğitmen:** instructor@example.com / password123
- **Admin:** admin@example.com / password123

## Önemli Notlar

- ⚠️ **Sınav Girişi:** Mobil uygulama üzerinden sınava giriş yapılamaz. Sınavlar için Web veya Desktop uygulaması kullanılmalıdır.
- 📱 **Network:** Backend'e erişim için cihazınızın aynı ağda olması gerekir.
- 🔄 **Offline:** Uygulama şu an için offline modu desteklememektedir.

## Sorun Giderme

### Metro bundler hatası
```bash
npx react-native start --reset-cache
```

### Android build hatası
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Port kullanımda hatası
```bash
npx react-native start --port 8082
```

## Geliştirme

Hot reload aktiftir. Kod değişiklikleri otomatik olarak yansıyacaktır.

Debug menüsü için cihazda silkeleme yapın veya `Ctrl+M` (Android) / `Cmd+D` (iOS) tuşlarına basın.

## Lisans

Bu proje eğitim amaçlı geliştirilmiştir.
