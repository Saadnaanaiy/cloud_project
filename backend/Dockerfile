# Stage 1: Build the NestJS application
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run the production Node server
FROM node:24-alpine

WORKDIR /app

# Create a non-root user for security (required by K8s PodSecurityStandards)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to the non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the application port (configurable via PORT env var, default 3001)
EXPOSE 3001

# Start the application
CMD ["node", "dist/main"]
