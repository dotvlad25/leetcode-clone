#!/usr/bin/env bash
# Run the app locally (development mode).
# Usage: ./run.sh   (honors PORT env var, defaults to 3000)
set -euo pipefail
cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ ! -d node_modules ]; then
  echo "ERROR: node_modules not found. Run ./setup.sh first." >&2
  exit 1
fi

PORT="${PORT:-3000}"
export PORT NODE_ENV=development
echo "==> Starting dev server on http://localhost:${PORT}/ ..."
exec pnpm dev
