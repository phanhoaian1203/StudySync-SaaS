# ============================================================
# STAGE 1: BUILD — Node.js compile React/TypeScript → dist/
# ============================================================
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files trước để cache layer node_modules
# Nếu package.json không đổi → Docker bỏ qua bước npm ci
COPY package.json package-lock.json ./

# Cài dependencies
# Dùng npm install thay vì npm ci để tự động sync package-lock.json
RUN npm install

# Copy toàn bộ source code
COPY . .

# Build production bundle (output → /app/dist)
RUN npm run build

# ============================================================
# STAGE 2: SERVE — Nginx phục vụ file tĩnh đã build
# Image nginx:alpine rất nhỏ (~25MB)
# ============================================================
FROM nginx:alpine AS final

# Copy file build từ Stage 1 vào thư mục web của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy cấu hình Nginx tùy chỉnh (hỗ trợ React Router SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
