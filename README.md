# LMS - Learning Management System

A comprehensive Learning Management System featuring web, mobile, and desktop applications with an integrated OMR (Optical Mark Recognition) scanner for automated test grading.

## 🚀 Features

### Web Application (Next.js)
- Progressive Web App (PWA) support
- Responsive design for all devices
- Multi-language support (English/Turkish)
- Dark/Light theme
- Course management and enrollment
- Interactive quiz system
- Safe Exam Browser (SEB) integration
- Real-time notifications

### Mobile Application (React Native + Expo)
- Native OMR scanner with camera integration
- Course browsing and enrollment
- Quiz participation
- Offline capabilities
- Push notifications

### Desktop Application (Electron)
- Full LMS functionality in a native desktop app
- Cross-platform support (Windows, macOS, Linux)

### OMR Algorithm (Python + OpenCV)
- Automatic optical mark recognition
- 10-question answer sheet processing
- Perspective correction
- Confidence scoring for each answer

## 📋 Prerequisites

- **Node.js** 16+ and npm
- **Docker** and Docker Compose
- **Python** 3.8+ (for OMR module)
- **Expo CLI** (for mobile development)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ozgurk33/lms_final_proje.git
cd lms_final_proje
```

### 2. Backend Setup

Start the database and backend services with Docker:
```bash
docker-compose up -d
```

Install backend dependencies:
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm start
```

The backend will run on `http://localhost:3000`

### 3. Web Application Setup

```bash
cd web-next
npm install
npm run dev
```

The web app will run on `http://localhost:3001`

### 4. Mobile Application Setup

```bash
cd mobile-expo
npm install
npx expo start
```

Scan the QR code with Expo Go app on your mobile device.

### 5. Desktop Application Setup

```bash
cd desktop
npm install
npm start
```

### 6. OMR Algorithm Setup

```bash
cd omr-algorithm
pip install -r requirements.txt
python omr_answer_reader.py
```

## 📁 Project Structure

```
├── backend/           # Node.js/Express API with PostgreSQL
├── web-next/          # Next.js web application
├── mobile-expo/       # React Native mobile app
├── desktop/           # Electron desktop app
├── omr-algorithm/     # Python OMR system
└── docker-compose.yml # Docker configuration
```

## 🔧 Environment Variables

Each module requires environment configuration:

- **Backend**: Copy `.env.example` to `.env` and configure database credentials
- **Web**: Configure API endpoint in environment variables
- **Mobile**: Update API base URL in configuration files

## 🎯 Usage

1. **Admin**: Manage users, courses, and system settings
2. **Instructor**: Create courses, quizzes, and grade submissions
3. **Student**: Enroll in courses, take quizzes, view grades
4. **OMR**: Scan and automatically grade answer sheets

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Safe Exam Browser integration
- Input sanitization
- Rate limiting

## 📝 License

Educational project for Software Engineering course.

## 👥 Contributors

Developed as a final project for Software Engineering course.
