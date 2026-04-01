#!/usr/bin/env bash
set -e

# Start dev server in background
pnpm run dev &
DEV_PID=$!

# Wait for server to be ready
echo "Waiting for dev server..."
until curl -s http://localhost:5173 > /dev/null 2>&1; do
  sleep 1
done

echo "Taking screenshots..."
for route in stairs fence firepit; do
  npx playwright screenshot \
    --viewport-size=1280,800 \
    --wait-for-timeout=2000 \
    "http://localhost:5173/$route" \
    "screenshots/$route.png"
done

kill $DEV_PID
echo "Done. Screenshots updated in screenshots/"
