# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for native modules and OpenSSL
RUN apk add --no-cache python3 make g++ openssl

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy prisma files and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Stage 2: Production stage
FROM node:20-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Install OpenSSL and security updates (required for Prisma)
RUN apk update && apk upgrade && \
    apk add --no-cache openssl openssl-dev && \
    rm -rf /var/cache/apk/*

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy prisma files and regenerate client for this platform
COPY --from=builder /app/prisma ./prisma/
RUN npx prisma generate

# Copy application code
COPY --chown=nodejs:nodejs . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start application
CMD ["node", "src/index.js"]
