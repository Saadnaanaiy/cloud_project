# Stage 1: Build the React application
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Accept build arguments for environment variables baked into the static build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_RECAPTCHA_SITE_KEY
ENV VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY

# Build the app for production
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the built files from the previous stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Use custom Nginx config for SPA route fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
