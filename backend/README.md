# LMS Backend

Backend API for Learning Management System.

## Tech Stack

- **Runtime**: Node.js 20.x
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Authentication**: JWT + OAuth 2.0 (Google)
- **Security**: Helmet, CORS, Rate Limiting, Input Sanitization

## Features

### Authentication & Authorization (3.5 points)
- ✅ Local authentication (JWT)
- ✅ Google OAuth 2.0
- ✅ 2FA (TOTP)
- ✅ Password policy enforcement

### User Management (5.0 points)
- ✅ 6 Roles: SUPER_ADMIN, ADMIN, INSTRUCTOR, ASSISTANT, STUDENT, GUEST
- ✅ Role-based access control (RBAC)
- ✅ User CRUD operations

### Security (4.8 points)
- ✅ AES-256 encryption
- ✅ bcrypt password hashing
- ✅ SQL Injection protection (Prisma ORM)
- ✅ XSS protection (input sanitization)
- ✅ Rate limiting
- ✅ Audit logging
- ⚠️ HTTPS (production)
- ⚠️ CSRF tokens (to be implemented)

**Total: ~13.3 points**

## Setup

### Prerequisites
- Node.js 20.x
- PostgreSQL 16
- npm or yarn

### Installation

```bash
# Install dependencies
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Setup database
npx prisma migrate dev
npx prisma generate

# Run in development
npm run dev

# Run in production
npm start
```

### Environment Variables

See `.env` file for required configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `ENCRYPTION_KEY`: 32-character key for AES-256

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/google` - Login with Google
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify and enable 2FA
- `POST /api/auth/2fa/login` - Login with 2FA code
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - Get all users (Admin+)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin+)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user (Admin+)
- `PUT /api/users/:id/role` - Change user role (Super Admin only)

### Courses (TODO)
### Quizzes (TODO)

## Security Features

### Rate Limiting
- General API: 100 req/15min
- Auth endpoints: 5 req/15min
- Write operations: 20 req/15min

### Password Policy
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### Audit Logging
All critical actions are logged to database:
- User registration/login
- Role changes
- User creation/deletion
- 2FA setup

## Development

```bash
# Run with auto-reload
npm run dev

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Run tests
npm test
```

## License

MIT
