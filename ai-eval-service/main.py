from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Any
import os
import logging
import sys
import json
import subprocess
from dotenv import load_dotenv

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

def run_worker(payload: dict, timeout: int = 300):
    try:
        worker_path = os.path.join(os.path.dirname(__file__), "worker.py")
        
        # Verify worker.py exists before spawning subprocess
        if not os.path.exists(worker_path):
            raise FileNotFoundError(f"Worker script not found at {worker_path}")
        
        json_input = json.dumps(payload)
        
        result = subprocess.run(
            [sys.executable, worker_path],
            input=json_input,
            text=True,
            capture_output=True,
            timeout=timeout,
            check=False
        )
        
        if result.returncode != 0:
            try:
                error_data = json.loads(result.stdout)
                if not error_data.get("success", True):
                    return error_data
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(
                    f"Failed to parse worker error response as JSON: {e}. "
                    f"Worker stdout (first 500 chars): {result.stdout[:500]}. "
                    f"Worker stderr (first 500 chars): {result.stderr[:500]}"
                )
                # Re-raise with context to ensure the parsing error isn't silently ignored
                raise RuntimeError(
                    f"Worker process failed and error response could not be parsed as JSON. "
                    f"Worker stderr: {result.stderr[:500]}"
                ) from e
            raise RuntimeError(f"Worker process failed: {result.stderr[:500]}")
        
        output_data = json.loads(result.stdout)
        return output_data
    except subprocess.TimeoutExpired as e:
        raise HTTPException(
            status_code=504,
            detail="Evaluation timeout - request took longer than 5 minutes"
        ) from e
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid response from worker: {str(e)}"
        ) from e
    except Exception as e:
        error_msg = str(e)[:200]
        logger.exception(f"Worker execution error: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail=f"Worker execution failed: {error_msg}"
        ) from e

@app.get("/health")
async def health_check():
    worker_path = os.path.join(os.path.dirname(__file__), "worker.py")
    
    if not os.path.exists(worker_path):
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "message": f"Worker script not found at {worker_path}. Service is degraded."
            }
        )
    
    return {
        "status": "healthy"
    }

@app.post("/evaluate", response_model=List[EvaluateItemResponse])
async def evaluate(request: EvaluateRequest) -> List[EvaluateItemResponse]:
    try:
        items = [
            {
                'question_text': item.question_text,
                'user_response': item.user_response,
                'category': item.category
            }
            for item in request.items
        ]
        
        payload = {
            "type": "batch",
            "items": items
        }
        
        worker_result = run_worker(payload)
        
        if not worker_result.get("success", False):
            error_msg = worker_result.get("error", "Unknown error")
            raise HTTPException(
                status_code=500,
                detail=f"Evaluation failed: {error_msg}"
            )
        
        results = worker_result.get("results", [])
        
        response_array = []
        for result in results:
            response_array.append(
                EvaluateItemResponse(
                    success=result.get("success", True),
                    metrics=result.get("metrics", {})
                )
            )
        
        return response_array
    
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
