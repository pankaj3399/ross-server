"""
FastAPI Server for LangFair Evaluation
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

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr)
    ],
    force=True
)
logger = logging.getLogger(__name__)

class MemoryLimitedFormatter(logging.Formatter):
    def format(self, record):
        if hasattr(record, 'msg') and isinstance(record.msg, str) and len(record.msg) > 500:
            record.msg = record.msg[:500] + "... [truncated]"
        return super().format(record)

for handler in logging.root.handlers:
    handler.setFormatter(MemoryLimitedFormatter())

app = FastAPI(
    title="LangFair Evaluation Service",
    description="Microservice for evaluating LLM responses using LangFair",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

evaluator = None

def get_evaluator():
    """Get or create the evaluator instance (lazy initialization)."""
    global evaluator
    if evaluator is None:
        try:
            evaluator = LangFairEvaluator()
            logger.info("LangFair evaluator initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize evaluator: {e}", exc_info=False)
            raise
    return evaluator

class EvaluateRequest(BaseModel):
    """Request body for evaluation endpoint."""
    project_id: str = Field(..., description="Unique project identifier")
    category: str = Field(..., description="Category of the question (e.g., 'gender', 'race')")
    question_text: str = Field(..., description="The question/prompt that was asked")
    user_response: str = Field(..., description="The response to evaluate")
    include_counterfactual: Optional[bool] = Field(False, description="Whether to include counterfactual fairness evaluation (slower)")

class EvaluateResponse(BaseModel):
    """Response from evaluation endpoint."""
    success: bool
    metrics: dict
    error: Optional[str] = None

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "evaluator_initialized": evaluator is not None
    }

@app.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(request: EvaluateRequest):
    """
    Main evaluation endpoint.
    
    Args:
        request: EvaluateRequest containing project_id, category, question_text, user_response
    
    Returns:
        EvaluateResponse with metrics and success status
    """
    try:
        eval_instance = get_evaluator()
        
        result = await eval_instance.evaluate_response(
            question_text=request.question_text,
            user_response=request.user_response,
            category=request.category,
            include_counterfactual=request.include_counterfactual
        )
        
        return EvaluateResponse(
            success=True,
            metrics=result["metrics"]
        )
    
    except ValueError as e:
        logger.warning(f"Validation error: {e}", exc_info=False)
        raise HTTPException(
            status_code=400,
            detail=f"Validation error: {str(e)}"
        )
    except Exception as e:
        error_msg = str(e)[:200]
        logger.error(f"Error during evaluation: {error_msg}", exc_info=False)
        error_detail = f"Evaluation failed: {error_msg}"
        if hasattr(e, '__class__'):
            error_detail += f" (Type: {e.__class__.__name__})"
        raise HTTPException(
            status_code=500,
            detail=error_detail
        )

if __name__ == "__main__":
    import uvicorn
    is_production = os.getenv("RENDER") is not None or os.getenv("ENV") == "production"
    
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=not is_production,
        workers=1,
        limit_concurrency=int(os.getenv("MAX_CONCURRENT_REQUESTS", "2")),
        limit_max_requests=int(os.getenv("MAX_REQUESTS", "1000")),
        access_log=False,
        log_level="info"
    )

