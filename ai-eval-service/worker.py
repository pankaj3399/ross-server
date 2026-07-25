import sys
import os

# Preserve real stdout stream and redirect sys.stdout to sys.stderr
# so third-party library imports (toxigen, transformers, spacy, etc.) don't corrupt stdout JSON
_real_stdout = sys.stdout
sys.stdout = sys.stderr

import json
import asyncio
import logging

logging.basicConfig(
    level=logging.ERROR,
    format='%(levelname)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)

from evaluator import LangFairEvaluator

ERROR_EMPTY_ITEMS = "Items list cannot be empty"

async def run_evaluation(payload):
    evaluator = LangFairEvaluator()
    
    try:
        # Always use batch evaluation (works for single items too)
        items = payload.get("items", [])
        if not items:
            raise ValueError(ERROR_EMPTY_ITEMS)
        
        results = await evaluator.evaluate_batch(items)
        return {"success": True, "results": results}
    finally:
        evaluator.cleanup()

def main():
    try:
        input_data = sys.stdin.read()
        payload = json.loads(input_data)
        
        result = asyncio.run(run_evaluation(payload))
        
        _real_stdout.write(json.dumps(result) + "\n")
        _real_stdout.flush()
        sys.exit(0)
    except json.JSONDecodeError as e:
        error_result = {
            "success": False,
            "error": f"Invalid JSON input: {str(e)}"
        }
        _real_stdout.write(json.dumps(error_result) + "\n")
        _real_stdout.flush()
        sys.exit(1)
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)[:500]
        }
        _real_stdout.write(json.dumps(error_result) + "\n")
        _real_stdout.flush()
        sys.exit(1)

if __name__ == "__main__":
    main()

