FROM node:22-slim

# python3 runs submitted solutions; build-essential + python3 are also needed to
# compile better-sqlite3 if no prebuilt binary matches the image.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy everything (patches/ must be present before pnpm install)
COPY . .

# Install all dependencies (including devDeps needed for the build)
RUN npm install -g corepack@latest && corepack pnpm install

# Build frontend (vite → dist/public) and server (esbuild → dist/index.js)
RUN corepack pnpm run build

ENV NODE_ENV=production
# SQLite file lives on a volume so submissions survive container restarts
ENV DATABASE_URL=/app/data/app.db
VOLUME ["/app/data"]
EXPOSE 3000

CMD ["node", "dist/index.js"]
