# AI Evaluation Microservice - LangFair Integration

A Python microservice that evaluates AI responses for bias, fairness, toxicity, and stereotypes using the LangFair library.

## 🎯 What This Does

This microservice evaluates AI responses for:
- **Toxicity**: Detects harmful or offensive language
- **Stereotypes**: Identifies if responses reinforce harmful stereotypes
- **Counterfactual Fairness**: (Optional) Checks if responses are fair across different groups

## 📋 Prerequisites

Before you begin, ensure you have:
- **Python 3.12+** installed
- **pip** (Python package installer)
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/apikey))
- **Disk space**: ~2-3GB per project (see details below)

## 🚀 Quick Start (For Fresh Clones)

### Step 1: Navigate to the Service Directory

```bash
cd ai-eval-service
```

### Step 2: Create Virtual Environment

**Why?** A virtual environment isolates this project's dependencies from other Python projects, preventing conflicts.

```bash
python3 -m venv venv
```

**Troubleshooting:** If you get an error about `ensurepip` not being available:
```bash
# On Ubuntu/Debian:
sudo apt install python3.12-venv

# On macOS:
# Usually comes with Python, but if not:
brew install python@3.12
```

### Step 3: Activate Virtual Environment

```bash
source venv/bin/activate
```

**How to know it worked?** You'll see `(venv)` at the start of your terminal prompt.

**On Windows:**
```bash
venv\Scripts\activate
```

### Step 4: Install Dependencies

**Recommended:** Install CPU-only PyTorch first to save ~1.5GB per project:

```bash
# Install CPU-only PyTorch (saves ~1.5GB disk space)
pip install torch --index-url https://download.pytorch.org/whl/cpu

# Then install the rest
pip install -r requirements.txt
```

**Alternative (if you need GPU support):**
```bash
# Install full PyTorch with GPU support (takes ~2GB)
pip install -r requirements.txt
```

**What gets installed?**
- `langfair` - Main library for bias/fairness evaluation
- `fastapi` - Web framework for creating the API server
- `uvicorn` - Server that runs FastAPI
- `python-dotenv` - Loads environment variables from .env file
- PyTorch and other ML dependencies (~2-3GB total)

**Note:** Installation may take 10-15 minutes. LangFair downloads ~2-3GB of packages on first install.

**Troubleshooting:**
- **"No space left on device"**: Clean pip cache: `rm -rf ~/.cache/pip` (frees ~2-3GB)
- **Installation stuck**: Press Ctrl+C and try again, or check your internet connection

### Step 5: Create .env File

Create a `.env` file in the `ai-eval-service` directory:

```bash
nano .env
```

Add your Google Gemini API key:

```
GEMINI_API_KEY=your_actual_api_key_here
```

**Where to get API key?**
1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into your `.env` file

**Important:** 
- No spaces around the `=` sign
- Don't include quotes around the API key
- Never commit this file to git (already in .gitignore)

### Step 6: Run the Service

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**What this does:**
- `uvicorn` - Runs the FastAPI server
- `main:app` - Uses the `app` from `main.py` file
- `--host 0.0.0.0` - Makes it accessible from other services
- `--port 8000` - Runs on port 8000
- `--reload` - Auto-restarts when you change code (development mode)

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
✅ LangFair evaluator initialized successfully
```

**To stop the service:** Press `Ctrl+C`

**To deactivate virtual environment:** Type `deactivate`

## 🧪 Testing the Service

### Test 1: Health Check

Open a new terminal and run:

```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{"status":"healthy","evaluator_initialized":true}
```

### Test 2: Evaluate a Response

```bash
curl -X POST http://localhost:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test-123",
    "category": "gender",
    "question_text": "What is the role of women in technology?",
    "user_response": "Women are naturally less skilled at programming."
  }'
```

**Expected response:**
```json
{
  "success": true,
  "metrics": {
    "toxicity": {
      "toxic_fraction": 0.0,
      "expected_max_toxicity": 0.15,
      "toxicity_probability": 0.05
    },
    "stereotype": {
      "stereotype_association": 0.45,
      "cooccurrence_bias": 0.60,
      "stereotype_fraction": 0.12
    },
    "counterfactual": {}
  }
}
```

## 📁 File Structure

```
ai-eval-service/
├── main.py              # FastAPI server that receives HTTP requests
├── evaluator.py         # LangFair wrapper that performs evaluations
├── requirements.txt     # Lists all Python packages needed
├── .env                # Stores API keys (create this, don't commit!)
├── .gitignore          # Git ignore rules (venv, .env, etc.)
└── README.md           # This file
```

**Files you need to create:**
- `.env` - Contains your `GEMINI_API_KEY`

**Files automatically ignored by git:**
- `venv/` - Virtual environment (don't commit)
- `.env` - API keys (don't commit)
- `__pycache__/` - Python cache files

## 📊 Understanding the Metrics

### Toxicity Metrics

- **Toxic Fraction** (0-1): Percentage of text that is toxic
  - Lower is better (0 = no toxicity, 1 = completely toxic)
  
- **Expected Maximum Toxicity** (0-1): Highest toxicity score expected
  - Lower is better
  
- **Toxicity Probability** (0-1): Chance that text contains toxicity
  - Lower is better

### Stereotype Metrics

- **Stereotype Association** (0-1): How strongly stereotypes are associated
  - Lower is better (0 = no stereotypes, 1 = strong stereotypes)
  
- **Cooccurrence Bias** (0-1): How often stereotypes appear together
  - Lower is better
  
- **Stereotype Fraction** (0-1): Percentage of text containing stereotypes
  - Lower is better

### Counterfactual Metrics (Optional)

- **Cosine Similarity** (0-1): How similar responses are across groups
  - Higher is better (1 = identical, 0 = completely different)
  
- **Sentiment Bias** (0-1): Difference in sentiment between groups
  - Lower is better (0 = no bias, 1 = high bias)

## 🔗 Integrating with Node.js Backend

Once the Python service is running, your Node.js backend can call it.

### Update Backend Environment

Add to your backend `.env` file:

```bash
LANGFAIR_SERVICE_URL=http://localhost:8000
```

### Example Backend Integration

The backend should call the service like this:

```typescript
const response = await fetch(`${LANGFAIR_SERVICE_URL}/evaluate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    project_id: projectId,
    category: category,  // "gender", "race", "ethnicity", "religion", "age"
    question_text: questionText,
    user_response: userResponse,
    include_counterfactual: false  // Set to true for counterfactual metrics (slower)
  })
});

const evaluation = await response.json();
// Use evaluation.metrics for toxicity, stereotype, etc.
```

## 🚀 Production Deployment

### Deploying to Render

1. **Create a New Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - **Name**: `ai-eval-service`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install torch --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `ai-eval-service` (if service is in a subdirectory)

3. **Set Environment Variables**
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `PORT`: (Render sets this automatically)

4. **Choose Instance Type**
   - **Starter Tier ($7/month)**: Recommended (512MB RAM, 1GB disk)
   - **Standard Tier ($25/month)**: Better performance (2GB RAM, 10GB disk)

5. **Update Backend URL**
   ```bash
   LANGFAIR_SERVICE_URL=https://your-service.onrender.com
   ```

### Local Production Setup

For production locally, remove `--reload` flag:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Use a process manager like `systemd` or `supervisor` to keep it running.

## 📚 API Endpoints

### POST /evaluate

Evaluates a response for fairness/bias.

**Request Body:**
```json
{
  "project_id": "string",
  "category": "gender|race|ethnicity|religion|age",
  "question_text": "string",
  "user_response": "string",
  "include_counterfactual": false
}
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "toxicity": {
      "toxic_fraction": 0.0,
      "expected_max_toxicity": 0.15,
      "toxicity_probability": 0.05
    },
    "stereotype": {
      "stereotype_association": 0.45,
      "cooccurrence_bias": 0.60,
      "stereotype_fraction": 0.12
    },
    "counterfactual": {}
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "evaluator_initialized": true
}
```

## 🐛 Troubleshooting

### Problem: "GEMINI_API_KEY environment variable is required"

**Solution:**
1. Make sure `.env` file exists in `ai-eval-service/` folder
2. Contains: `GEMINI_API_KEY=your_key_here`
3. No spaces around the `=` sign
4. Restart the service after creating/updating `.env`

### Problem: "ModuleNotFoundError: No module named 'langfair'"

**Solution:**
1. Make sure virtual environment is activated (see `(venv)` in prompt)
2. Run: `pip install -r requirements.txt`
3. If still failing, try: `pip install --upgrade pip` then reinstall

### Problem: "Port 8000 already in use"

**Solution:** Use a different port:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```
Then update Node.js backend to use port 8001.

### Problem: "No space left on device"

**Solution:**
1. Clean pip cache: `rm -rf ~/.cache/pip` (frees ~2-3GB)
2. Install CPU-only PyTorch first (see Step 4)
3. Check disk space: `df -h`
4. Free up space or use a machine with more disk space

### Problem: Evaluation takes too long

**Why?** LangFair loads ML models on first evaluation, which takes time.

**Solution:**
- First evaluation: ~30-60 seconds (model download)
- Subsequent evaluations: ~1-2 seconds (models cached)
- Counterfactual evaluation is slower (set `include_counterfactual: false`)

### Problem: Service crashes on startup

**Solution:**
1. Check logs for specific error message
2. Verify `.env` file exists and has correct API key
3. Make sure virtual environment is activated
4. Try reinstalling dependencies: `pip install -r requirements.txt --force-reinstall`

## 📝 Quick Reference

### Start Service
```bash
cd ai-eval-service
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Stop Service
Press `Ctrl+C` in the terminal running the service

### Deactivate Virtual Environment
```bash
deactivate
```

### Reinstall Dependencies
```bash
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

### Check Service Health
```bash
curl http://localhost:8000/health
```

## ✅ Setup Checklist

For fresh clones:
- [ ] Navigate to `ai-eval-service` directory
- [ ] Create virtual environment: `python3 -m venv venv`
- [ ] Activate virtual environment: `source venv/bin/activate`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Create `.env` file with `GEMINI_API_KEY`
- [ ] Run service: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
- [ ] Test health endpoint: `curl http://localhost:8000/health`
- [ ] Test evaluation endpoint (see Testing section)
- [ ] Update backend `LANGFAIR_SERVICE_URL` environment variable

## 📚 Additional Resources

- [LangFair Documentation](https://langfair.readthedocs.io/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Google Gemini API](https://aistudio.google.com/apikey)

---

**Need help?** Check the Troubleshooting section above or review the error messages in your terminal.
