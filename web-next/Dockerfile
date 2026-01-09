# Web-Next Dockerfile - Production Build
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build for production
RUN npm run build

# Expose port
EXPOSE 5173

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5173
ENV NEXT_TELEMETRY_DISABLED=1

# Start production server
CMD ["npm", "start"]
