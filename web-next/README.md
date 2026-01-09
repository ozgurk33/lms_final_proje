# Web Application

Modern Next.js web application with PWA support for the LMS system.

## Features

- Progressive Web App (PWA)
- Server-Side Rendering (SSR)
- Responsive design
- Multi-language support (English/Turkish)
- Dark/Light theme
- Course management interface
- Interactive quiz system
- Safe Exam Browser integration
- Real-time notifications
- Offline support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React with Custom CSS
- **State Management**: Context API + Zustand
- **Authentication**: JWT
- **i18n**: Custom implementation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
Create `.env.local` with:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

3. Start development server:
```bash
npm run dev
```

The app will run on `http://localhost:3001`

4. Build for production:
```bash
npm run build
npm start
```

## Project Structure

- `/app` - Next.js App Router pages
- `/components` - Reusable React components
- `/services` - API service layer
- `/store` - State management
- `/i18n` - Internationalization files
- `/public` - Static assets

## Features by Role

**Student:**
- Browse and enroll in courses
- Take quizzes
- View grades and progress

**Instructor:**
- Create and manage courses
- Build quizzes with various question types
- Grade submissions
- View analytics

**Admin:**
- Manage users and roles
- Course assignments
- System configuration
