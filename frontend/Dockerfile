# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy build timestamp to bust Docker cache
COPY .buildtimestamp ./

COPY package*.json ./
RUN npm ci

COPY . .

# Build with environment variable
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build timestamp to bust cache in production stage too
COPY .buildtimestamp /tmp/buildtimestamp

COPY --from=builder /app/dist /usr/share/nginx/html

# Remove default nginx config and use Railway config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx-railway.conf /etc/nginx/nginx.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
