# Multi-stage build for smaller image size (important for AWS free tier)
# Stage 1: Build dependencies
FROM python:3.12-slim as builder

# Install system dependencies needed for building
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy requirements first (for better Docker layer caching)
COPY requirements.txt .

# Install PyTorch CPU-only first (saves ~1.5GB)
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch && \
    pip cache purge || true

# Install other dependencies
RUN pip install --no-cache-dir -r requirements.txt && \
    pip cache purge || true && \
    rm -rf /tmp/* /var/tmp/*

# Stage 2: Runtime image (much smaller)
FROM python:3.12-slim

# Install only runtime dependencies (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && rm -rf /tmp/* /var/tmp/*

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app && \
    chown -R appuser:appuser /app

# Set working directory
WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY --chown=appuser:appuser main.py evaluator.py ./

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
# Use --host 0.0.0.0 to allow external connections
# PORT can be set via environment variable (defaults to 8000)
# Using shell form to allow environment variable expansion
CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

