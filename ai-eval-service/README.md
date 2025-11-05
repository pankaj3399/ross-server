# AI Evaluation Microservice - LangFair Integration

A Python microservice that evaluates AI responses for bias, fairness, toxicity, and stereotypes using the LangFair library.

## ⚡ Quick Deploy on AWS Free Tier

```bash
# On AWS EC2 instance
git clone <your-repo-url>
cd ross-server/ai-eval-service
echo "GEMINI_API_KEY=your_key" > .env
docker build -t ai-eval-service .
docker run -d -p 8000:8000 --env-file .env --restart unless-stopped ai-eval-service
```

That's it! Service runs at `http://your-ec2-ip:8000`

See [Deployment Guide](#-aws-free-tier-deployment) for detailed steps.

## 🎯 What This Does

This microservice evaluates AI responses for:
- **Toxicity**: Detects harmful or offensive language
- **Stereotypes**: Identifies if responses reinforce harmful stereotypes
- **Counterfactual Fairness**: (Optional) Checks if responses are fair across different groups

## 📋 Prerequisites

- **Docker** installed ([Get Docker](https://docs.docker.com/get-docker/))
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/apikey))

## 🚀 Quick Start (Recommended: Docker)

### Step 1: Navigate to the Service Directory

```bash
cd ai-eval-service
```

### Step 2: Create .env File

Create a `.env` file with your Google Gemini API key:

```bash
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env
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

### Step 3: Build and Run with Docker

```bash
# Build the Docker image
docker build -t ai-eval-service .

# Run the container
docker run -d \
  --name ai-eval-service \
  -p 8000:8000 \
  --env-file .env \
  --restart unless-stopped \
  ai-eval-service
```

**What this does:**
- `docker build` - Builds the Docker image with all dependencies
- `docker run` - Starts the container
- `-d` - Runs in background (detached mode)
- `-p 8000:8000` - Maps port 8000 from container to host
- `--env-file .env` - Loads environment variables from .env file
- `--restart unless-stopped` - Auto-restarts if container crashes

**Expected output:**
```bash
# Check if running
docker ps

# Check logs
docker logs -f ai-eval-service
```

You should see:
```
✅ LangFair evaluator initialized successfully
INFO:     Application startup complete.
```

### Step 4: Verify Service is Running

```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{"status":"healthy","service":"LangFair Evaluation Service"}
```

**To stop the service:**
```bash
docker stop ai-eval-service && docker rm ai-eval-service
```

**To restart the service:**
```bash
docker restart ai-eval-service
```

## 🐍 Alternative: Local Development (Without Docker)

If you prefer to run without Docker for development:

### Prerequisites
- **Python 3.12+** installed
- **pip** (Python package installer)

### Setup

```bash
# 1. Create virtual environment
python3 -m venv venv

# 2. Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install CPU-only PyTorch first (saves ~1.5GB)
pip install torch --index-url https://download.pytorch.org/whl/cpu

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file
echo "GEMINI_API_KEY=your_key" > .env

# 6. Run service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Note:** Installation may take 10-15 minutes. LangFair downloads ~2-3GB of packages on first install.

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

### Problem: Docker container exits immediately

**Solution:**
1. Check logs: `docker logs ai-eval-service`
2. Verify `.env` file exists and has correct API key
3. Check if port 8000 is already in use: `docker ps`
4. Rebuild the image: `docker build -t ai-eval-service .`

### Problem: Service crashes on startup

**Solution:**
1. Check logs: `docker logs ai-eval-service`
2. Verify `.env` file exists and has correct API key
3. Rebuild the image: `docker build --no-cache -t ai-eval-service .`

## 📝 Quick Reference

### Start Service (Docker)
```bash
cd ai-eval-service
docker build -t ai-eval-service .
docker run -d -p 8000:8000 --env-file .env --restart unless-stopped ai-eval-service
```

### Stop Service (Docker)
```bash
docker stop ai-eval-service && docker rm ai-eval-service
```

### Check Service Health
```bash
curl http://localhost:8000/health
```

### View Logs
```bash
docker logs -f ai-eval-service
```

### Restart Service
```bash
docker restart ai-eval-service
```

## ✅ Setup Checklist (Docker)

For fresh clones:
- [ ] Navigate to `ai-eval-service` directory
- [ ] Create `.env` file with `GEMINI_API_KEY`
- [ ] Build Docker image: `docker build -t ai-eval-service .`
- [ ] Run container: `docker run -d -p 8000:8000 --env-file .env --restart unless-stopped ai-eval-service`
- [ ] Test health endpoint: `curl http://localhost:8000/health`
- [ ] Test evaluation endpoint (see Testing section)
- [ ] Update backend `LANGFAIR_SERVICE_URL` environment variable

## ☁️ AWS Free Tier Deployment

Deploy this service on AWS EC2 free tier (t2.micro or t3.micro) with minimal configuration.

### Prerequisites
- AWS account (free tier eligible)
- Basic knowledge of SSH and terminal commands

### Step 1: Launch EC2 Instance

1. **Go to AWS Console** → EC2 → Launch Instance
2. **Configure instance**:
   - **Name**: `ai-eval-service`
   - **AMI**: Ubuntu 22.04 LTS (Free tier eligible)
   - **Instance type**: `t2.micro` (Free tier eligible)
   - **Key pair**: Create or select existing key pair (download `.pem` file)
   - **Security group**: 
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 8000) from anywhere (0.0.0.0/0)
     - Allow Custom TCP (port 8000) from anywhere
3. **Launch instance**

### Step 2: Connect to EC2 Instance

```bash
# Replace with your key file and instance details
ssh -i your-key.pem ubuntu@your-instance-ip
```

### Step 3: Install Docker on EC2

```bash
# Update system
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker ubuntu

# Install Docker Compose (optional, but recommended)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and log back in for group changes to take effect
exit
```

### Step 4: Clone and Deploy

```bash
# SSH back into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Clone your repository
git clone <your-repo-url>
cd ross-server/ai-eval-service

# Create .env file
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env

# Build and run (ONE COMMAND!)
docker build -t ai-eval-service . && \
docker run -d -p 8000:8000 --env-file .env --restart unless-stopped ai-eval-service
```

### Step 5: Verify Deployment

```bash
# Check if container is running
docker ps

# Check health endpoint
curl http://localhost:8000/health

# View logs
docker logs -f ai-eval-service

# Test from your local machine
curl http://your-ec2-public-ip:8000/health
```

### Step 6: Update Backend Configuration

Update your Node.js backend `.env` file:
```bash
LANGFAIR_SERVICE_URL=http://your-ec2-public-ip:8000
```

### Troubleshooting AWS Deployment

#### Problem: Out of memory on t2.micro

**Solution**: The service needs at least 2GB RAM. Options:
1. Use `t3.micro` (free tier eligible, 1GB RAM but can burst)
2. Add swap space:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### Problem: Port 8000 not accessible

**Solution**: Check security group:
1. Go to EC2 → Security Groups
2. Edit inbound rules
3. Add rule: Custom TCP, Port 8000, Source 0.0.0.0/0

#### Problem: Service stops after SSH disconnect

**Solution**: Use `--restart unless-stopped` flag (already included in deployment command):
```bash
docker run -d --restart unless-stopped -p 8000:8000 --env-file .env ai-eval-service
```

#### Problem: Docker build fails (out of disk space)

**Solution**: Clean up Docker:
```bash
docker system prune -a --volumes
```

### Cost Optimization for AWS Free Tier

- **Instance**: Use `t2.micro` or `t3.micro` (750 hours/month free)
- **Storage**: Use 8GB gp3 EBS (30GB free tier)
- **Data Transfer**: First 100GB/month free
- **Total Cost**: $0/month if within free tier limits

### Monitoring

```bash
# Check container status
docker ps

# View logs
docker logs -f ai-eval-service

# Check resource usage
docker stats ai-eval-service

# Restart service
docker restart ai-eval-service
```

## 📚 Additional Resources

- [LangFair Documentation](https://langfair.readthedocs.io/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Google Gemini API](https://aistudio.google.com/apikey)

---

**Need help?** Check the Troubleshooting section above or review the error messages in your terminal.
