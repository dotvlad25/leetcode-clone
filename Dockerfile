FROM node:22-slim

# Install Python 3 for server-side code execution
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy everything (patches/ must be present before pnpm install)
COPY . .

# Install all dependencies (including devDeps needed for the build)
RUN npm install -g corepack@latest && corepack pnpm install

# Build frontend (vite → dist/public) and server (esbuild → dist/index.js)
RUN corepack pnpm run build

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
