from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Any, Optional
import asyncio
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

# Shared across requests: models load once at startup and stay warm.
_evaluator: Optional[LangFairEvaluator] = None
_eval_lock: Optional[asyncio.Lock] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _evaluator, _eval_lock
    _eval_lock = asyncio.Lock()
    _evaluator = LangFairEvaluator()
    logger.info("Starting model warmup (one-time load)...")
    try:
        await asyncio.to_thread(_evaluator.warmup)
    except Exception:
        logger.exception("Model warmup failed")
        _evaluator.cleanup()
        _evaluator = None
        raise
    logger.info("Evaluation service ready with warm models")
    yield
    if _evaluator is not None:
        _evaluator.cleanup()
        _evaluator = None
    _eval_lock = None


app = FastAPI(
    title="LangFair Evaluation Service",
    description="Microservice for evaluating LLM responses using LangFair",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EvaluateItem(BaseModel):
    project_id: str = Field(..., description="Unique project identifier")
    category: str = Field(..., description="Category of the question (e.g., 'gender', 'race')")
    question_text: str = Field(..., description="The question/prompt that was asked")
    user_response: str = Field(..., description="The response to evaluate")

class EvaluateRequest(BaseModel):
    items: list[EvaluateItem] = Field(..., min_items=1, max_items=20, description="List of items to evaluate (max 20)")

class EvaluateItemResponse(BaseModel):
    success: bool = Field(..., description="Whether the evaluation was successful")
    metrics: dict[str, Any] = Field(..., description="Evaluation metrics for this item")


def _require_evaluator() -> LangFairEvaluator:
    if _evaluator is None:
        raise HTTPException(
            status_code=503,
            detail="Evaluation models are not loaded yet",
        )
    return _evaluator


@app.get("/health")
async def health_check():
    if _evaluator is None:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "message": "Models are still loading or failed to load",
            },
        )

    return {
        "status": "healthy",
        "models_loaded": True,
    }


@app.post("/evaluate", response_model=List[EvaluateItemResponse])
async def evaluate(request: EvaluateRequest) -> List[EvaluateItemResponse]:
    evaluator = _require_evaluator()
    if _eval_lock is None:
        raise HTTPException(status_code=503, detail="Evaluation service is not ready")

    try:
        items = [
            {
                'project_id': item.project_id,
                'question_text': item.question_text,
                'user_response': item.user_response,
                'category': item.category
            }
            for item in request.items
        ]

        # Serialize inference: one shared model instance is not safely concurrent.
        # Requests queue here instead of each spawning a process and reloading models.
        async with _eval_lock:
            results = await asyncio.to_thread(evaluator.evaluate_batch, items)

        return [
            EvaluateItemResponse(
                success=result.get("success", True),
                metrics=result.get("metrics", {}),
            )
            for result in results
        ]

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning("Validation error: %s", e, exc_info=False)
        raise HTTPException(
            status_code=400,
            detail=f"Validation error: {e!s}"
        ) from e
    except Exception as e:
        error_msg = str(e)[:200]
        logger.exception("Error during evaluation: %s", error_msg)
        error_detail = f"Evaluation failed: {error_msg}"
        if hasattr(e, '__class__'):
            error_detail += f" (Type: {e.__class__.__name__})"
        raise HTTPException(
            status_code=500,
            detail=error_detail
        ) from e

if __name__ == "__main__":
    import uvicorn
    is_production = os.getenv("RAILWAY_ENVIRONMENT") is not None or os.getenv("RENDER") is not None or os.getenv("ENV") == "production"

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=not is_production,
        workers=1,
        # HTTP concurrency (queued requests). Actual model inference is serialized by _eval_lock.
        limit_concurrency=int(os.getenv("MAX_CONCURRENT_REQUESTS", "10")),
        limit_max_requests=int(os.getenv("MAX_REQUESTS", "1000")),
        access_log=False,
        log_level="info"
    )
