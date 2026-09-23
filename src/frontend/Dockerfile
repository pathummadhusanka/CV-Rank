# Stage 1: Build the React application
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install dependencies using frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy frontend source code
COPY . .

# Build production bundle
RUN pnpm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
