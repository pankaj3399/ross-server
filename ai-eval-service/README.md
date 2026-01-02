# AI Evaluation Microservice

Lightweight FastAPI service that proxies LangFair models to score AI responses for toxicity, stereotypes, and fairness. This README focuses only on the two things you asked for: running it locally with Docker and deploying the same image to Render.

## Run Locally with Docker

```bash
cd examplar/ai-eval-service
docker build -t ai-eval-service .
docker run -d \
  --name ai-eval-service \
  -p 8000:8000 \
  --env-file .env \
  --restart unless-stopped \
  ai-eval-service
curl http://localhost:8000/health   # {"status":"healthy","service":"LangFair Evaluation Service"}
```

Stop and clean up when you're done:

```bash
docker stop ai-eval-service && docker rm ai-eval-service
```

## Environment Variables

All environment variables used by the service:

- **PORT** (default: 8000) - Server port
- **HOST** (default: 0.0.0.0) - Server host address
- **ENV** (optional) - Environment mode, set to "production" to disable auto-reload
- **RENDER** (optional) - Automatically set by Render platform, used to detect production
- **LIGHTWEIGHT_EVAL_MODE** (default: true) - Use lightweight models to reduce memory usage
- **TOXICITY_BATCH_SIZE** (default: 1 for lightweight mode, 8 otherwise) - Batch size for toxicity evaluation
- **TOXICITY_CLASSIFIERS** (optional) - Comma-separated list of toxicity classifiers (e.g., "toxigen,detoxify_unbiased"). Overrides default based on LIGHTWEIGHT_EVAL_MODE
- **MAX_CONCURRENT_REQUESTS** (default: 2) - Limit concurrent requests to prevent memory issues
- **MAX_REQUESTS** (default: 1000) - Auto-restart after N requests to prevent memory leaks

## Deploy by Connecting the Repository to Render

1. **Push the repo to GitHub/GitLab.**
   - Ensure the Dockerfile and `.env.example` (or docs for env vars) are committed.
2. **Create a Render Web Service.**
   - Click “New +” → “Web Service” → “Build and deploy from a Git repository”.
   - Select your repo/branch and confirm Render detects the Dockerfile.
3. **Confirm Render’s build settings.**
   - Environment: Docker.
   - Docker context: repo root (or `ai-eval-service` if the service lives in a subfolder).
   - Dockerfile path: `ai-eval-service/Dockerfile` if needed.
4. **Set runtime values.**
   - `PORT=8000`.
   - Add any other required env variables.
   - **Memory optimization environment variables:**
     - `MAX_CONCURRENT_REQUESTS=2` - Limit concurrent requests (default: 2)
     - `MAX_REQUESTS=1000` - Auto-restart after N requests to prevent leaks (default: 1000)
     - `TOXICITY_BATCH_SIZE=1` - Batch size for toxicity evaluation (default: 1 for lightweight mode)
     - `LIGHTWEIGHT_EVAL_MODE=true` - Use lightweight models (default: true)
     - `TOXICITY_CLASSIFIERS` - Comma-separated list of toxicity classifiers (optional, overrides default based on LIGHTWEIGHT_EVAL_MODE)
     - `HOST=0.0.0.0` - Server host (default: 0.0.0.0)
     - `ENV=production` - Environment mode, set to "production" to disable auto-reload (optional)
     - `RENDER` - Automatically set by Render platform (optional, used to detect production)
5. **Deploy and verify.**
   - Hit `https://<render-service>.onrender.com/health`.
   - Point clients to `LANGFAIR_SERVICE_URL=https://<render-service>.onrender.com`.
