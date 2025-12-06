# AI Evaluation Microservice

Lightweight FastAPI service that proxies LangFair models to score AI responses for toxicity, stereotypes, and fairness. This README focuses only on the two things you asked for: running it locally with Docker and deploying the same image to Render.

## Run Locally with Docker

```bash
cd examplar/ai-eval-service
echo "GEMINI_API_KEY=your_key" > .env
docker build -t ai-eval-service .
docker run -d \
  --name ai-eval-service \
  -p 8000:8000 \
  --env-file .env \
  --restart unless-stopped \
  ai-eval-service
curl http://localhost:8000/health   # {"status":"healthy","service":"LangFair Evaluation Service"}
```

Stop and clean up when you’re done:

```bash
docker stop ai-eval-service && docker rm ai-eval-service
```

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
   - Add `GEMINI_API_KEY` and any other required env variables.
   - **Memory optimization environment variables:**
     - `MAX_CONCURRENT_REQUESTS=2` - Limit concurrent requests (default: 2)
     - `MAX_REQUESTS=1000` - Auto-restart after N requests to prevent leaks (default: 1000)
     - `TOXICITY_BATCH_SIZE=1` - Batch size for toxicity evaluation (default: 1 for lightweight mode)
     - `LIGHTWEIGHT_EVAL_MODE=true` - Use lightweight models (default: true)
5. **Deploy and verify.**
   - Hit `https://<render-service>.onrender.com/health`.
   - Point clients to `LANGFAIR_SERVICE_URL=https://<render-service>.onrender.com`.
