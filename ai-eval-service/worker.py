import sys
import json
import asyncio
import logging
from evaluator import LangFairEvaluator

logging.basicConfig(
    level=logging.ERROR,
    format='%(levelname)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)

async def run_evaluation(payload):
    evaluator = LangFairEvaluator()
    
    try:
        if payload.get("type") == "batch":
            items = payload.get("items", [])
            results = await evaluator.evaluate_batch(items)
            return {"success": True, "results": results}
        else:
            result = await evaluator.evaluate_response(
                question_text=payload.get("question_text", ""),
                user_response=payload.get("user_response", ""),
                category=payload.get("category", "general")
            )
            return {"success": True, "result": result}
    finally:
        evaluator.cleanup()

def main():
    try:
        input_data = sys.stdin.read()
        payload = json.loads(input_data)
        
        result = asyncio.run(run_evaluation(payload))
        
        print(json.dumps(result))
        sys.exit(0)
    except json.JSONDecodeError as e:
        error_result = {
            "success": False,
            "error": f"Invalid JSON input: {str(e)}"
        }
        print(json.dumps(error_result))
        sys.exit(1)
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)[:500]
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()

