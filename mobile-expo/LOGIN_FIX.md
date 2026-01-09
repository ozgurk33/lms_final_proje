# 🔧 Login 400 Hatası Çözümü

## Sorun
Expo Go'da login yaparken 400 Bad Request hatası alıyorsun.

## Çözüm Adımları

### 1. Backend Kontrolü
Backend terminalinde şunu görmeli:
```
🚀 LMS Backend Server running on port 3000
📡 Accessible at: http://192.168.1.5:3000
```

**Backend çalışmıyorsa:**
```bash
cd c:\SE_FINAL\SE_FINAL_ODEV_SON\backend
npm start
```

### 2. Doğru Kullanıcı Bilgileri

**Veritabanındaki kullanıcıları görmek için:**
```bash
cd c:\SE_FINAL\SE_FINAL_ODEV_SON\backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.findMany().then(users => { users.forEach(u => console.log('Email:', u.email, '| Role:', u.role)); prisma.$disconnect(); });"
```

**Muhtemelen denemen gereken:**
- Email: `student@example.com`
- Şifre: `password123`

**Veya:**
- Email: `instructor@example.com`
- Şifre: `password123`

**Veya:**
- Email: `admin@example.com`
- Şifre: `password123`

### 3. Backend Log Kontrolü

Backend terminalinde hata mesajı var mı? Varsa buraya kopyala.

### 4. IP Adresi Kontrolü

Eğer backend farklı bir IP'de çalışıyorsa:

`mobile-expo/src/utils/api.js` dosyasında:
```javascript
const API_BASE_URL = 'http://192.168.1.5:3000';
```

IP'yi backend'in çalıştığı IP ile değiştir.

## Test

Doğru credentials ile giriş yap ve backend loglarını kontrol et!
