"""
FastAPI Server for LangFair Evaluation

This is the main API server that:
1. Receives evaluation requests from Node.js backend
2. Calls the LangFair evaluator
3. Returns structured results

Why FastAPI?
- Modern, fast Python web framework
- Automatic API documentation
- Type validation with Pydantic
- Async support (needed for LangFair)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import os
import logging
import sys
from dotenv import load_dotenv
from evaluator import LangFairEvaluator

# Load environment variables
load_dotenv()

# Configure logging to prevent memory accumulation
# Use stderr with limited buffer, no file logging to avoid disk I/O
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr)  # Use stderr, not stdout
    ],
    force=True  # Override any existing configuration
)
logger = logging.getLogger(__name__)

# Limit log message length to prevent memory issues
class MemoryLimitedFormatter(logging.Formatter):
    def format(self, record):
        # Truncate very long messages
        if hasattr(record, 'msg') and isinstance(record.msg, str) and len(record.msg) > 500:
            record.msg = record.msg[:500] + "... [truncated]"
        return super().format(record)

# Apply formatter to all handlers
for handler in logging.root.handlers:
    handler.setFormatter(MemoryLimitedFormatter())

# Create FastAPI app
# Why FastAPI? It's modern, fast, and has great documentation features
app = FastAPI(
    title="LangFair Evaluation Service",
    description="Microservice for evaluating LLM responses using LangFair",
    version="1.0.0"
)

# Enable CORS (Cross-Origin Resource Sharing)
# Why? Allows Node.js backend (running on different port) to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your backend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize evaluator lazily (on first request)
# Why lazy initialization? Initializing heavy ML models on startup can cause memory issues
# Lazy initialization allows the service to start quickly and only load models when needed
evaluator = None

def get_evaluator():
    """
    Get or create the evaluator instance (lazy initialization).
    This ensures we only load heavy ML models when actually needed.
    """
    global evaluator
    if evaluator is None:
        try:
            evaluator = LangFairEvaluator()
            logger.info("LangFair evaluator initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize evaluator: {e}", exc_info=False)  # exc_info=False to save memory
            raise
    return evaluator

# Request model - defines what data we expect
class EvaluateRequest(BaseModel):
    """
    Request body for evaluation endpoint.
    
    Why Pydantic models?
    - Automatic validation (ensures data types are correct)
    - Automatic documentation
    - Type safety
    """
    project_id: str = Field(..., description="Unique project identifier")
    category: str = Field(..., description="Category of the question (e.g., 'gender', 'race')")
    question_text: str = Field(..., description="The question/prompt that was asked")
    user_response: str = Field(..., description="The response to evaluate")
    include_counterfactual: Optional[bool] = Field(False, description="Whether to include counterfactual fairness evaluation (slower)")

# Response model - defines what we return
class EvaluateResponse(BaseModel):
    """
    Response from evaluation endpoint.
    """
    success: bool
    metrics: dict
    error: Optional[str] = None

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Why? Allows monitoring systems to check if service is running.
    Also useful for debugging.
    """
    return {
        "status": "healthy",
        "evaluator_initialized": evaluator is not None
    }

@app.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(request: EvaluateRequest):
    """
    Main evaluation endpoint.
    
    This endpoint:
    1. Receives question and response from Node.js backend
    2. Calls LangFair evaluator
    3. Returns structured metrics
    
    Args:
        request: EvaluateRequest containing project_id, category, question_text, user_response
    
    Returns:
        EvaluateResponse with metrics and success status
    """
    try:
        # Get evaluator (lazy initialization - only loads on first request)
        # This prevents memory issues by avoiding heavy startup initialization
        eval_instance = get_evaluator()
        
        # Call the evaluator
        # Why async/await? LangFair makes async API calls
        # We need to wait for them to complete
        result = await eval_instance.evaluate_response(
            question_text=request.question_text,
            user_response=request.user_response,
            category=request.category,
            include_counterfactual=request.include_counterfactual
        )
        
        # Return the result
        return EvaluateResponse(
            success=True,
            metrics=result["metrics"]
        )
    
    except ValueError as e:
        # Handle validation errors (e.g., missing API key, empty input)
        # Use logger with exc_info=False to avoid storing full traceback in memory
        logger.warning(f"Validation error: {e}", exc_info=False)
        raise HTTPException(
            status_code=400,
            detail=f"Validation error: {str(e)}"
        )
    except Exception as e:
        # Handle any other errors
        # Log only error message, not full traceback to save memory
        error_msg = str(e)[:200]  # Limit error message length
        logger.error(f"Error during evaluation: {error_msg}", exc_info=False)
        # Return more detailed error for debugging
        error_detail = f"Evaluation failed: {error_msg}"
        if hasattr(e, '__class__'):
            error_detail += f" (Type: {e.__class__.__name__})"
        raise HTTPException(
            status_code=500,
            detail=error_detail
        )

# Run the server
# This is only used when running directly with: python main.py
# Normally we use: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    # In production (Render), PORT is set by Render, reload should be False
    # In development, reload=True for auto-restart on code changes
    is_production = os.getenv("RENDER") is not None or os.getenv("ENV") == "production"
    
    # Memory-optimized settings for 512MB RAM
    # Single worker, limited connections, no access logs (saves memory)
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=not is_production,  # Auto-reload only in development
        workers=1,  # Single worker for low memory
        limit_concurrency=int(os.getenv("MAX_CONCURRENT_REQUESTS", "2")),  # Limit concurrent requests
        limit_max_requests=int(os.getenv("MAX_REQUESTS", "1000")),  # Restart after N requests to prevent leaks
        access_log=False,  # Disable access logs to save memory
        log_level="info"
    )

