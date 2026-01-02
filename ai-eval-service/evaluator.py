import os
import logging
import gc
from typing import Any, ClassVar


from langfair.metrics.toxicity import ToxicityMetrics
from langfair.metrics.stereotype import StereotypeMetrics
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def _safe_float(value, default=0.0) -> float:
    """Safely convert a value to float, returning default on error."""
    if value is None:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def _parse_bool_env(var_name: str, default: bool = False) -> bool:
    raw_value = os.getenv(var_name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


class LangFairEvaluator:
    CATEGORY_MAPPING: ClassVar[dict[str, str]] = {
        "gender": "gender",
        "race": "race",
        "ethnicity": "race",
        "religion": "religion",
        "age": "age",
    }
    
    def __init__(self):
        self.lightweight_mode = _parse_bool_env("LIGHTWEIGHT_EVAL_MODE", default=True)
        self._toxicity_metrics = None
        self._stereotype_metrics = None
        self._seen_unrecognized = set()
    
    def _get_toxicity_metrics(self) -> ToxicityMetrics:
        if self._toxicity_metrics is None:
            toxicity_classifiers = self._resolve_toxicity_classifiers()
            toxicity_batch_size = int(
                os.getenv(
                    "TOXICITY_BATCH_SIZE",
                    "1" if self.lightweight_mode else "8",
                )
            )
            self._toxicity_metrics = ToxicityMetrics(
                classifiers=toxicity_classifiers,
                batch_size=toxicity_batch_size,
            )
        return self._toxicity_metrics
    
    def _get_stereotype_metrics(self) -> StereotypeMetrics:
        if self._stereotype_metrics is None:
            self._stereotype_metrics = StereotypeMetrics()
        return self._stereotype_metrics
    
    async def evaluate_response(
        self,
        question_text: str,
        user_response: str,
        category: str = "general"
    ) -> dict[str, Any]:
        
        if not question_text or not isinstance(question_text, str):
            question_text = ""
        if not user_response or not isinstance(user_response, str):
            user_response = ""
        
        if not user_response.strip():
            raise ValueError("user_response cannot be empty")
        
        prompts = [question_text]
        responses = [user_response]
        
        toxicity_metrics = {}
        try:
            toxicity_result = self._get_toxicity_metrics().evaluate(
                prompts=prompts,
                responses=responses,
                return_data=True
            )
            toxicity_metrics = toxicity_result.get('metrics', {})
        except Exception as e:
            error_msg = str(e)[:200]
            logger.error(f"Error evaluating toxicity: {error_msg}", exc_info=False)
            toxicity_metrics = {
                "Toxic Fraction": 0.0,
                "Expected Maximum Toxicity": 0.0,
                "Toxicity Probability": 0.0,
            }
        
        category_lower = category.lower()
        if category_lower not in self.CATEGORY_MAPPING:
            valid_categories = ', '.join(sorted(self.CATEGORY_MAPPING.keys()))
            raise ValueError(f"Unrecognized category '{category}'. Valid categories: {valid_categories}")
        langfair_category = self.CATEGORY_MAPPING[category_lower]
        
        stereotype_metrics = {}
        try:
            stereotype_result = self._get_stereotype_metrics().evaluate(
                responses=responses,
                categories=[langfair_category]
            )
            stereotype_metrics = stereotype_result.get('metrics', {})
        except Exception as e:
            error_msg = str(e)[:200]
            logger.error(f"Error evaluating stereotypes: {error_msg}", exc_info=False)
            stereotype_metrics = {
                "Stereotype Association": 0.0,
                "Cooccurrence Bias": 0.0,
                f"Stereotype Fraction - {langfair_category}": 0.0,
            }
        
        result = {
            "success": True,
            "metrics": {
                "toxicity": self._format_toxicity_metrics(toxicity_metrics),
                "stereotype": self._format_stereotype_metrics(stereotype_metrics),
            },
        }
        
        return result

    def _resolve_toxicity_classifiers(self) -> list[str]:
        override = os.getenv("TOXICITY_CLASSIFIERS")
        if override:
            classifiers = [
                classifier.strip()
                for classifier in override.split(",")
                if classifier.strip()
            ]
            if classifiers:
                return classifiers

        if self.lightweight_mode:
            return ["toxigen"]

        return ["detoxify_unbiased"]
    
    def _format_toxicity_metrics(self, toxicity_metrics: dict[str, Any]) -> dict[str, float]:
        if not toxicity_metrics:
            return {
                "toxic_fraction": 0.0,
                "expected_max_toxicity": 0.0,
                "toxicity_probability": 0.0,
            }
        
        return {
            "toxic_fraction": _safe_float(toxicity_metrics.get('Toxic Fraction'), 0.0),
            "expected_max_toxicity": _safe_float(toxicity_metrics.get('Expected Maximum Toxicity'), 0.0),
            "toxicity_probability": _safe_float(toxicity_metrics.get('Toxicity Probability'), 0.0),
        }
    
    def _format_stereotype_metrics(self, stereotype_metrics: dict[str, Any]) -> dict[str, float]:
        if not stereotype_metrics:
            return {
                "stereotype_association": 0.0,
                "cooccurrence_bias": 0.0,
                "stereotype_fraction": 0.0,
            }
        
        stereotype_fraction_key = None
        for key in stereotype_metrics.keys():
            if 'Stereotype Fraction' in key:
                stereotype_fraction_key = key
                break
        
        return {
            "stereotype_association": _safe_float(stereotype_metrics.get('Stereotype Association'), 0.0),
            "cooccurrence_bias": _safe_float(stereotype_metrics.get('Cooccurrence Bias'), 0.0),
            "stereotype_fraction": _safe_float(stereotype_metrics.get(stereotype_fraction_key), 0.0),
        }
    
    async def evaluate_batch(
        self,
        items: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        if len(items) == 0:
            raise ValueError("At least one item is required for batch evaluation")
        
        validated_items = []
        for i, item in enumerate(items):
            question_text = item.get('question_text', '')
            user_response = item.get('user_response', '')
            category = item.get('category', 'general')
            
            if not isinstance(question_text, str):
                question_text = ""
            if not isinstance(user_response, str):
                user_response = ""
            
            if not user_response.strip():
                raise ValueError(f"Item {i}: user_response cannot be empty")
            
            validated_items.append({
                'question_text': question_text,
                'user_response': user_response,
                'category': category,
                'index': i
            })
        
        all_prompts = [item['question_text'] for item in validated_items]
        all_responses = [item['user_response'] for item in validated_items]
        
        toxicity_results = []
        try:
            toxicity_result = self._get_toxicity_metrics().evaluate(
                prompts=all_prompts,
                responses=all_responses,
                return_data=True
            )
            batch_toxicity_metrics = toxicity_result.get('metrics', {})
            toxicity_data = toxicity_result.get('data', {})
            
            if toxicity_data and isinstance(toxicity_data, dict):
                per_item_scores = toxicity_data.get('scores', [])
                if per_item_scores and len(per_item_scores) == len(validated_items):
                    for scores in per_item_scores:
                        item_metrics = {
                            "Toxic Fraction": scores.get('toxic_fraction', 0.0) if isinstance(scores, dict) else 0.0,
                            "Expected Maximum Toxicity": scores.get('expected_max_toxicity', 0.0) if isinstance(scores, dict) else float(scores) if isinstance(scores, (int, float)) else 0.0,
                            "Toxicity Probability": scores.get('toxicity_probability', 0.0) if isinstance(scores, dict) else 0.0,
                        }
                        toxicity_results.append(item_metrics)
                else:
                    for _ in validated_items:
                        toxicity_results.append(batch_toxicity_metrics)
            else:
                for _ in validated_items:
                    toxicity_results.append(batch_toxicity_metrics)
        except Exception as e:
            error_msg = str(e)[:200]
            logger.error(f"Error evaluating toxicity in batch: {error_msg}", exc_info=False)
            default_toxicity = {
                "Toxic Fraction": 0.0,
                "Expected Maximum Toxicity": 0.0,
                "Toxicity Probability": 0.0,
            }
            toxicity_results = [default_toxicity] * len(validated_items)
        
        stereotype_results = []
        category_groups = {}
        for item in validated_items:
            category_lower = item['category'].lower()
            if category_lower not in self.CATEGORY_MAPPING:
                if category_lower not in self._seen_unrecognized:
                    self._seen_unrecognized.add(category_lower)
                    context_info = f" (item index: {item.get('index', 'unknown')})"
                    logger.warning(
                        "Unrecognized category '%s' not found in CATEGORY_MAPPING, defaulting to 'gender'.%s",
                        item['category'],
                        context_info
                    )
                langfair_category = 'gender'
            else:
                langfair_category = self.CATEGORY_MAPPING[category_lower]
            if langfair_category not in category_groups:
                category_groups[langfair_category] = []
            category_groups[langfair_category].append(item)
        
        for langfair_category, group_items in category_groups.items():
            group_responses = [item['user_response'] for item in group_items]
            group_indices = [item['index'] for item in group_items]
            
            try:
                stereotype_result = self._get_stereotype_metrics().evaluate(
                    responses=group_responses,
                    categories=[langfair_category]
                )
                group_stereotype_metrics = stereotype_result.get('metrics', {})
                
                for idx in group_indices:
                    stereotype_results.append((idx, group_stereotype_metrics, langfair_category))
            except Exception as e:
                error_msg = str(e)[:200]
                logger.error(f"Error evaluating stereotypes for category {langfair_category}: {error_msg}", exc_info=False)
                default_stereotype = {
                    "Stereotype Association": 0.0,
                    "Cooccurrence Bias": 0.0,
                    f"Stereotype Fraction - {langfair_category}": 0.0,
                }
                for idx in group_indices:
                    stereotype_results.append((idx, default_stereotype, langfair_category))
        
        stereotype_results.sort(key=lambda x: x[0])
        
        results = []
        for i, item in enumerate(validated_items):
            toxicity_metrics = toxicity_results[i]
            _, stereotype_metrics, category = stereotype_results[i]
            
            result = {
                "success": True,
                "metrics": {
                    "toxicity": self._format_toxicity_metrics(toxicity_metrics),
                    "stereotype": self._format_stereotype_metrics(stereotype_metrics),
                },
            }
            results.append(result)
        
        return results
    
    def cleanup(self):
        if self._toxicity_metrics is not None:
            del self._toxicity_metrics
            self._toxicity_metrics = None
        if self._stereotype_metrics is not None:
            del self._stereotype_metrics
            self._stereotype_metrics = None
        gc.collect()
