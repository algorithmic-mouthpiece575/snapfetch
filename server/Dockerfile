FROM node:22-slim

# ffmpeg (video+audio merging) + the standalone yt-dlp binary.
# NOTE: we fetch "yt-dlp_linux" (self-contained, bundles its own Python) rather
# than the plain "yt-dlp" asset, which is a Python zipapp and would need python3
# in the image (otherwise it exits 127 — "python3: command not found").
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl \
 && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux \
      -o /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp \
 && yt-dlp --version \
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
