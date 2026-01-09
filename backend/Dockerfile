# Backend Dockerfile - Node.js/Express API with Prisma + Python/OpenCV for OMR
FROM node:20-alpine AS base

# Install OpenSSL for Prisma + Python and OpenCV + Pillow
RUN apk add --no-cache \
    openssl \
    python3 \
    py3-numpy \
    py3-opencv \
    py3-pillow

# Create python symlink
RUN ln -sf python3 /usr/bin/python

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
FROM base AS dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Production image
FROM base AS runner

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads temp/frames temp/omr

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
