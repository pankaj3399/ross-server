FROM python:3.12-slim as builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Copy pyproject.toml for dependency installation
COPY pyproject.toml ./

# Install torch with pinned version for reproducibility (not in pyproject.toml)
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.1.0 && \
    pip cache purge || true

# Install dependencies from pyproject.toml
RUN pip install --no-cache-dir . && \
    pip cache purge || true && \
    rm -rf /tmp/* /var/tmp/*

FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && rm -rf /tmp/* /var/tmp/*

RUN useradd -m -u 1000 appuser && \
    mkdir -p /app && \
    chown -R appuser:appuser /app

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY --chown=appuser:appuser main.py evaluator.py worker.py ./

USER appuser

# Pre-download NLTK data used by stereotype metrics (avoids first-request downloads).
RUN python -c "import nltk; nltk.download('stopwords', quiet=True)"

EXPOSE 8000

# Models warm up during app lifespan; allow a long start period before health fails.
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --limit-concurrency ${MAX_CONCURRENT_REQUESTS:-10} --limit-max-requests ${MAX_REQUESTS:-1000} --no-access-log"]
