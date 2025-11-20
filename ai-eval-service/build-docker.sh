#!/bin/bash
# Optimized Docker build script for ai-eval-service
# This script helps manage disk space during builds

set -e

# Check if --no-cache flag is provided
NO_CACHE=""
if [ "$1" == "--no-cache" ]; then
  NO_CACHE="--no-cache"
  echo "🧹 Cleaning up Docker resources before build..."
  # Clean up unused Docker resources (build cache, unused images, etc.)
  docker system prune -f
fi

echo "📦 Building Docker image with optimized settings..."

# Check if buildx is available (for BuildKit)
if docker buildx version >/dev/null 2>&1; then
  echo "Using BuildKit (buildx available)..."
  DOCKER_BUILDKIT=1 docker build \
    --progress=plain \
    $NO_CACHE \
    -t ai-eval-service \
    .
else
  echo "Using standard Docker build (buildx not available)..."
  docker build \
    $NO_CACHE \
    -t ai-eval-service \
    .
fi

echo "✅ Build complete!"
echo ""
echo "To run the container:"
echo "  docker run -d --name ai-eval-service -p 8000:8000 --env-file .env --restart unless-stopped ai-eval-service"
echo ""
echo "To free up more space after build:"
echo "  docker system prune -a --volumes -f"

