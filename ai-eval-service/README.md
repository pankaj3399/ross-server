# AI Evaluation Microservice

FastAPI service that scores AI responses for toxicity, stereotypes, and fairness using LangFair.

Models are loaded **once at startup** and reused for every `/evaluate` request (inference is serialized with an in-process lock so the shared models stay safe).

## Run Locally with Docker

```bash
cd ai-eval-service
docker build -t ai-eval-service .
docker run -d \
  --name ai-eval-service \
  -p 8000:8000 \
  --env-file .env \
  --restart unless-stopped \
  ai-eval-service
# Wait for warmup (first boot downloads HF models), then:
curl http://localhost:8000/health   # {"status":"healthy","models_loaded":true}
```

Stop and clean up when you're done:

```bash
docker stop ai-eval-service && docker rm ai-eval-service
```

## Environment Variables

- **PORT** (default: 8000) - Server port (Railway injects this; do not hardcode in production)
- **HOST** (default: 0.0.0.0) - Server host address
- **ENV** (optional) - Set to `production` to disable auto-reload
- **LIGHTWEIGHT_EVAL_MODE** (default: true) - Use lightweight models to reduce memory usage
- **TOXICITY_BATCH_SIZE** (default: 1 for lightweight mode, 8 otherwise)
- **TOXICITY_CLASSIFIERS** (optional) - Comma-separated classifiers override
- **MAX_CONCURRENT_REQUESTS** (default: 10) - Max in-flight HTTP connections (queued). Model inference itself is one-at-a-time.
- **MAX_REQUESTS** (default: 1000) - Recycle the process after N requests
- **HF_TOKEN** (optional) - Hugging Face token for more reliable model downloads on startup

## Deploy on Railway

1. Connect the repo and set **Root Directory** to `ai-eval-service`.
2. Builder: Dockerfile (`railway.toml` already points at it).
3. Set env vars from `.env.example` (`ENV=production`, `LIGHTWEIGHT_EVAL_MODE=true`, etc.).
4. Generate a public domain and wait for `/health` (first deploy can take several minutes while models warm up).
5. Point the backend at `LANGFAIR_SERVICE_URL=https://<your-railway-url>` (no trailing slash).
