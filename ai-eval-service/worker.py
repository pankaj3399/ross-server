"""
Optional CLI entrypoint for local one-off evaluation.

Production traffic goes through main.py, which keeps a shared warm LangFairEvaluator.
"""
import sys
import json
import logging
from evaluator import LangFairEvaluator

logging.basicConfig(
    level=logging.ERROR,
    format='%(levelname)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)

ERROR_EMPTY_ITEMS = "Items list cannot be empty"


def run_evaluation(payload):
    evaluator = LangFairEvaluator()

    try:
        items = payload.get("items", [])
        if not items:
            raise ValueError(ERROR_EMPTY_ITEMS)

        results = evaluator.evaluate_batch(items)
        return {"success": True, "results": results}
    finally:
        evaluator.cleanup()


def main():
    try:
        input_data = sys.stdin.read()
        payload = json.loads(input_data)

        result = run_evaluation(payload)

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
