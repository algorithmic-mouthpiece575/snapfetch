# ---- Build stage ----
FROM node:22-slim AS build

WORKDIR /app

# Dependencies (Docker cache: copy manifests first)
COPY package*.json ./
RUN npm ci

# Source + production build.
# VITE_API_ORIGIN / VITE_GITHUB_REPO are read from client/.env.production
# (committed; values are public, embedded in the bundle).
COPY . .
RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine

# Static build output
COPY --from=build /app/dist /usr/share/nginx/html

# Container nginx: listens on 3008 with SPA fallback (replaces the default vhost)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3008
