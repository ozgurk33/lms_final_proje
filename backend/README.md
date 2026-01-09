# Backend API

Node.js/Express RESTful API with PostgreSQL database for the LMS system.

## Features

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Course and enrollment management
- Quiz creation and grading system
- OMR (Optical Mark Recognition) integration
- Safe Exam Browser (SEB) support
- File upload handling
- Audit logging
- Rate limiting

## Tech Stack

- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and JWT secrets.

3. Run database migrations:
```bash
npx prisma generate
npx prisma migrate dev
```

4. Seed the database (optional):
```bash
npx prisma db seed
```

5. Start the server:
```bash
npm run dev    # Development mode
npm start      # Production mode
```

The API will run on `http://localhost:3000`

## API Endpoints

- `/api/auth` - Authentication (login, register, refresh)
- `/api/users` - User management
- `/api/courses` - Course management
- `/api/quizzes` - Quiz management
- `/api/admin` - Admin operations
- `/api/instructor` - Instructor operations

## Docker Support

Start with Docker:
```bash
docker-compose up -d
```
