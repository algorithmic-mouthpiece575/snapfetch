FROM node:22-slim

# ffmpeg (video+audio merging) + tooling to fetch the yt-dlp binary
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl \
 && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
      -o /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp \
 && apt-get purge -y curl && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies (Docker cache: copy manifests first)
COPY package*.json ./
RUN npm ci

# Source + TypeScript build → dist/
COPY . .
RUN npm run build

ENV NODE_ENV=production
# The server reads PORT from the environment (set to 3007 by docker-compose)
EXPOSE 3007
CMD ["node", "dist/index.js"]
