FROM oven/bun:latest AS builder

WORKDIR /app

# Build arguments for frontend public environment variables (no hardcoded secrets)
ARG VITE_MAP_API_KEY=""
ARG VITE_MAP_TILE_URL="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
ARG VITE_APP_NAME="ReTrails"

ENV VITE_MAP_API_KEY=$VITE_MAP_API_KEY
ENV VITE_MAP_TILE_URL=$VITE_MAP_TILE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

COPY package.json bun.lock* ./
RUN bun install

COPY . .
RUN bun run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
