#!/usr/bin/env bash
# Setup: install dependencies for the LeetCode clone (PyCode).
# Usage: ./setup.sh
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Checking prerequisites..."

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 is required (the server executes Python solutions)." >&2
  echo "Install it, then re-run ./setup.sh" >&2
  exit 1
fi
echo "    python3: $(python3 --version 2>&1)"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node is required (Node 22 recommended, see Dockerfile)." >&2
  echo "Install Node, then re-run ./setup.sh" >&2
  echo "  macOS: brew install node" >&2
  echo "  or: https://nodejs.org/" >&2
  exit 1
fi
echo "    node: $(node -v)"

if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    echo "==> pnpm not found, enabling via corepack..."
    corepack enable
    corepack prepare pnpm@10.4.1 --activate
  else
    echo "==> pnpm not found and corepack is unavailable (Node 25+ removed it)."
    echo "==> Installing pnpm via npm..."
    npm install -g pnpm@10.4.1
  fi
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm is still not available after install attempts." >&2
  echo "Install it manually (https://pnpm.io/installation), then re-run ./setup.sh" >&2
  exit 1
fi
echo "    pnpm: $(pnpm -v)"

echo "==> Installing dependencies (pnpm install)..."
echo "    (Note: better-sqlite3 compiles a native module; if the install"
echo "     fails, install Xcode Command Line Tools and retry: xcode-select --install)"
pnpm install

echo "==> Checking database..."
if [ -f data/app.db ]; then
  echo "    bundled database present (data/app.db)."
else
  echo "    no data/app.db yet - it will be created and seeded on first start."
fi
echo "    (Optional: copy .env.example to .env to customize PORT, user, or AI keys.)"

echo ""
echo "Setup complete. Start the app with: ./run.sh"
