# ========== Stage 1: Build Landing Page ==========
FROM node:20-alpine AS landing-build
WORKDIR /app

# Copy root .env (Vite reads VITE_* vars from envDir at build time)
COPY .env.production .env

# Install dependencies
COPY frontend/landing-page/package.json frontend/landing-page/package-lock.json* ./frontend/landing-page/
WORKDIR /app/frontend/landing-page
RUN npm install

# Copy source and build
WORKDIR /app
COPY frontend/landing-page ./frontend/landing-page
WORKDIR /app/frontend/landing-page
RUN npm run build

# ========== Stage 2: Build Main Webapp ==========
FROM node:20-alpine AS webapp-build
WORKDIR /app

# Copy root .env (Vite reads VITE_* vars from envDir at build time)
COPY .env.production .env

# Install dependencies
COPY frontend/main-webapp/package.json frontend/main-webapp/package-lock.json* ./frontend/main-webapp/
WORKDIR /app/frontend/main-webapp
RUN npm install

# Copy source and build
WORKDIR /app
COPY frontend/main-webapp ./frontend/main-webapp
WORKDIR /app/frontend/main-webapp
RUN npm run build

# ========== Stage 3: Nginx with static files ==========
FROM nginx:alpine

# Copy built static files
COPY --from=landing-build /app/frontend/landing-page/dist /usr/share/nginx/html/landing
COPY --from=webapp-build /app/frontend/main-webapp/dist /usr/share/nginx/html/webapp

# Copy nginx configuration
COPY infrastructure/nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
