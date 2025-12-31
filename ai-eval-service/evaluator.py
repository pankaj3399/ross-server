import os
import logging
import gc
import asyncio
from typing import Dict, Any, Optional, List

HAS_LLM_SUPPORT = False
from langfair.metrics.toxicity import ToxicityMetrics
from langfair.metrics.stereotype import StereotypeMetrics
from langfair.generator.counterfactual import CounterfactualGenerator
from langfair.metrics.counterfactual import CounterfactualMetrics
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def _parse_bool_env(var_name: str, default: bool = False) -> bool:
    raw_value = os.getenv(var_name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


class LangFairEvaluator:
    
    def __init__(self):
        self.lightweight_mode = _parse_bool_env("LIGHTWEIGHT_EVAL_MODE", default=True)
        self._toxicity_metrics = None
        self._stereotype_metrics = None
        self._counterfactual_metrics = None
        self._llm = None
        self._counterfactual_generator = None
    
    def _get_toxicity_metrics(self):
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
    
    def _get_stereotype_metrics(self):
        if self._stereotype_metrics is None:
            self._stereotype_metrics = StereotypeMetrics()
        return self._stereotype_metrics
    
    def _get_counterfactual_metrics(self):
        if self._counterfactual_metrics is None:
            self._counterfactual_metrics = CounterfactualMetrics()
        return self._counterfactual_metrics
    
    def _get_counterfactual_generator(self):
        if self._counterfactual_generator is None:
            api_key = os.getenv("GEMINI_API_KEY", "")
            if HAS_LLM_SUPPORT and api_key:
                try:
                    from langchain_google_genai import ChatGoogleGenerativeAI
                    from langchain_core.rate_limiters import InMemoryRateLimiter
                    rate_limiter = InMemoryRateLimiter(
                        requests_per_second=4.5,
                        check_every_n_seconds=0.5,
                        max_bucket_size=280,
                    )
                    self._llm = ChatGoogleGenerativeAI(
                        model="gemini-pro",
                        google_api_key=api_key,
                        temperature=0.3,
                        rate_limiter=rate_limiter,
                    )
                    self._counterfactual_generator = CounterfactualGenerator(langchain_llm=self._llm)
                except Exception as e:
                    logger.warning(f"Could not initialize LLM for counterfactual generation: {e}")
        return self._counterfactual_generator
    
    async def evaluate_response(
        self,
        question_text: str,
        user_response: str,
        category: str = "general",
        include_counterfactual: bool = False
    ) -> Dict[str, Any]:
        
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
        
        category_mapping = {
            "gender": "gender",
            "race": "race",
            "ethnicity": "race",
            "religion": "religion",
            "age": "age",
        }
        langfair_category = category_mapping.get(category.lower(), "gender")
        
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
        
        counterfactual_metrics = {}
        if include_counterfactual and category.lower() in ["gender", "race"]:
            cf_generator = self._get_counterfactual_generator()
            if cf_generator:
                try:
                    cf_generations = await cf_generator.generate_responses(
                        prompts=prompts,
                        attribute=langfair_category,
                        count=2
                    )
                    
                    if langfair_category == "gender":
                        texts1 = cf_generations['data']['male_response']
                        texts2 = cf_generations['data']['female_response']
                    else:
                        texts1 = list(cf_generations['data'].values())[0]
                        texts2 = list(cf_generations['data'].values())[1]
                    
                    cf_result = self._get_counterfactual_metrics().evaluate(
                        texts1=texts1,
                        texts2=texts2,
                        attribute=langfair_category
                    )
                    counterfactual_metrics = cf_result.get('metrics', {})
                except Exception as e:
                    error_msg = str(e)[:200]
                    logger.error(f"Counterfactual evaluation failed: {error_msg}", exc_info=False)
                    counterfactual_metrics = {"error": error_msg}
        
        result = {
            "success": True,
            "metrics": {
                "toxicity": self._format_toxicity_metrics(toxicity_metrics),
                "stereotype": self._format_stereotype_metrics(stereotype_metrics, category),
                "counterfactual": self._format_counterfactual_metrics(counterfactual_metrics) if counterfactual_metrics else {},
            },
        }
        
        return result

    def _resolve_toxicity_classifiers(self) -> List[str]:
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
    
    def _format_toxicity_metrics(self, toxicity_metrics: Dict) -> Dict[str, float]:
        if not toxicity_metrics:
            return {
                "toxic_fraction": 0.0,
                "expected_max_toxicity": 0.0,
                "toxicity_probability": 0.0,
            }
        
        def safe_float(value, default=0.0):
            if value is None:
                return default
            try:
                return float(value)
            except (ValueError, TypeError):
                return default
        
        return {
            "toxic_fraction": safe_float(toxicity_metrics.get('Toxic Fraction'), 0.0),
            "expected_max_toxicity": safe_float(toxicity_metrics.get('Expected Maximum Toxicity'), 0.0),
            "toxicity_probability": safe_float(toxicity_metrics.get('Toxicity Probability'), 0.0),
        }
    
    def _format_stereotype_metrics(self, stereotype_metrics: Dict, category: str = "gender") -> Dict[str, float]:
        if not stereotype_metrics:
            return {
                "stereotype_association": 0.0,
                "cooccurrence_bias": 0.0,
                "stereotype_fraction": 0.0,
            }
        
        def safe_float(value, default=0.0):
            if value is None:
                return default
            try:
                return float(value)
            except (ValueError, TypeError):
                return default
        
        stereotype_fraction_key = None
        for key in stereotype_metrics.keys():
            if 'Stereotype Fraction' in key:
                stereotype_fraction_key = key
                break
        
        return {
            "stereotype_association": safe_float(stereotype_metrics.get('Stereotype Association'), 0.0),
            "cooccurrence_bias": safe_float(stereotype_metrics.get('Cooccurrence Bias'), 0.0),
            "stereotype_fraction": safe_float(stereotype_metrics.get(stereotype_fraction_key), 0.0) if stereotype_fraction_key else 0.0,
        }
    
    def _format_counterfactual_metrics(self, counterfactual_metrics: Dict) -> Dict[str, float]:
        if not counterfactual_metrics:
            return {
                "cosine_similarity": 0.0,
                "rouge_similarity": 0.0,
                "bleu_similarity": 0.0,
                "sentiment_bias": 0.0,
            }
        
        def safe_float(value, default=0.0):
            if value is None:
                return default
            try:
                return float(value)
            except (ValueError, TypeError):
                return default
        
        first_pair = None
        if counterfactual_metrics:
            first_pair = list(counterfactual_metrics.keys())[0]
            metrics = counterfactual_metrics[first_pair]
        else:
            metrics = {}
        
        return {
            "cosine_similarity": safe_float(metrics.get('Cosine Similarity'), 0.0),
            "rouge_similarity": safe_float(metrics.get('RougeL Similarity'), 0.0),
            "bleu_similarity": safe_float(metrics.get('Bleu Similarity'), 0.0),
            "sentiment_bias": safe_float(metrics.get('Sentiment Bias'), 0.0),
        }
    
    async def evaluate_batch(
        self,
        items: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        if len(items) > 5:
            raise ValueError("Batch evaluation supports maximum 5 items")
        
        if len(items) == 0:
            raise ValueError("At least one item is required for batch evaluation")
        
        validated_items = []
        for i, item in enumerate(items):
            question_text = item.get('question_text', '')
            user_response = item.get('user_response', '')
            category = item.get('category', 'general')
            include_counterfactual = item.get('include_counterfactual', False)
            
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
                'include_counterfactual': include_counterfactual,
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
        
        category_mapping = {
            "gender": "gender",
            "race": "race",
            "ethnicity": "race",
            "religion": "religion",
            "age": "age",
        }
        
        stereotype_results = []
        category_groups = {}
        for item in validated_items:
            langfair_category = category_mapping.get(item['category'].lower(), "gender")
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
        
        counterfactual_results = [None] * len(validated_items)
        
        counterfactual_tasks = []
        for item in validated_items:
            if item['include_counterfactual'] and item['category'].lower() in ["gender", "race"]:
                langfair_category = category_mapping.get(item['category'].lower(), "gender")
                cf_generator = self._get_counterfactual_generator()
                if cf_generator:
                    counterfactual_tasks.append(
                        self._evaluate_counterfactual_single(
                            item['question_text'],
                            langfair_category,
                            item['index']
                        )
                    )
        
        if counterfactual_tasks:
            cf_results = await asyncio.gather(*counterfactual_tasks, return_exceptions=True)
            for result in cf_results:
                if isinstance(result, tuple) and not isinstance(result[1], Exception):
                    idx, cf_metrics = result
                    counterfactual_results[idx] = cf_metrics
        
        results = []
        for i, item in enumerate(validated_items):
            toxicity_metrics = toxicity_results[i]
            _, stereotype_metrics, category = stereotype_results[i]
            counterfactual_metrics = counterfactual_results[i]
            
            result = {
                "success": True,
                "metrics": {
                    "toxicity": self._format_toxicity_metrics(toxicity_metrics),
                    "stereotype": self._format_stereotype_metrics(stereotype_metrics, item['category']),
                    "counterfactual": self._format_counterfactual_metrics(counterfactual_metrics) if counterfactual_metrics else {},
                },
            }
            results.append(result)
        
        return results
    
    async def _evaluate_counterfactual_single(
        self,
        question_text: str,
        langfair_category: str,
        index: int
    ) -> tuple:
        try:
            cf_generator = self._get_counterfactual_generator()
            if not cf_generator:
                return (index, {"error": "Counterfactual generator not available"})
            
            cf_generations = await cf_generator.generate_responses(
                prompts=[question_text],
                attribute=langfair_category,
                count=2
            )
            
            if langfair_category == "gender":
                texts1 = cf_generations['data']['male_response']
                texts2 = cf_generations['data']['female_response']
            else:
                texts1 = list(cf_generations['data'].values())[0]
                texts2 = list(cf_generations['data'].values())[1]
            
            cf_result = self._get_counterfactual_metrics().evaluate(
                texts1=texts1,
                texts2=texts2,
                attribute=langfair_category
            )
            counterfactual_metrics = cf_result.get('metrics', {})
            return (index, counterfactual_metrics)
        except Exception as e:
            error_msg = str(e)[:200]
            logger.error(f"Counterfactual evaluation failed for item {index}: {error_msg}", exc_info=False)
            return (index, {"error": error_msg})
    
    def cleanup(self):
        if self._toxicity_metrics is not None:
            del self._toxicity_metrics
            self._toxicity_metrics = None
        if self._stereotype_metrics is not None:
            del self._stereotype_metrics
            self._stereotype_metrics = None
        if self._counterfactual_metrics is not None:
            del self._counterfactual_metrics
            self._counterfactual_metrics = None
        if self._counterfactual_generator is not None:
            del self._counterfactual_generator
            self._counterfactual_generator = None
        if self._llm is not None:
            del self._llm
            self._llm = None
        gc.collect()
