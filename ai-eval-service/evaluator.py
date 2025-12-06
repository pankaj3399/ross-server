import os
import logging
import gc
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
    """Parse boolean environment variables."""
    raw_value = os.getenv(var_name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


class LangFairEvaluator:
    """Wraps LangFair's metric classes to provide a simple evaluation interface."""
    
    def __init__(self):
        """Initialize the evaluator."""
        api_key = os.getenv("GEMINI_API_KEY", "")
        
        self.lightweight_mode = _parse_bool_env("LIGHTWEIGHT_EVAL_MODE", default=True)

        toxicity_classifiers = self._resolve_toxicity_classifiers()
        toxicity_batch_size = int(
            os.getenv(
                "TOXICITY_BATCH_SIZE",
                "1" if self.lightweight_mode else "8",
            )
        )

        self.toxicity_metrics = ToxicityMetrics(
            classifiers=toxicity_classifiers,
            batch_size=toxicity_batch_size,
        )
        self.stereotype_metrics = StereotypeMetrics()
        self.counterfactual_metrics = CounterfactualMetrics()
        
        self.llm = None
        self.counterfactual_generator = None
        if HAS_LLM_SUPPORT and api_key:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                from langchain_core.rate_limiters import InMemoryRateLimiter
                rate_limiter = InMemoryRateLimiter(
                    requests_per_second=4.5,
                    check_every_n_seconds=0.5,
                    max_bucket_size=280,
                )
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-pro",
                    google_api_key=api_key,
                    temperature=0.3,
                    rate_limiter=rate_limiter,
                )
                self.counterfactual_generator = CounterfactualGenerator(langchain_llm=self.llm)
            except Exception as e:
                logger.warning(f"Could not initialize LLM for counterfactual generation: {e}")
                logger.warning("Counterfactual evaluation will be disabled. Toxicity and stereotype metrics will still work.")
        else:
            logger.info("Counterfactual evaluation is disabled. Toxicity and stereotype metrics are available.")
    
    async def evaluate_response(
        self,
        question_text: str,
        user_response: str,
        category: str = "general",
        include_counterfactual: bool = False
    ) -> Dict[str, Any]:
        """
        Evaluate a single response using LangFair.
        
        Args:
            question_text: The question/prompt that was asked
            user_response: The response to evaluate
            category: Category of the question (e.g., "gender", "race")
            include_counterfactual: Whether to generate and evaluate counterfactual responses (slower)
        
        Returns:
            Dictionary containing toxicity_metrics, stereotype_metrics, and optionally counterfactual_metrics
        """
        
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
            toxicity_result = self.toxicity_metrics.evaluate(
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
            stereotype_result = self.stereotype_metrics.evaluate(
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
        if include_counterfactual and category.lower() in ["gender", "race"] and self.counterfactual_generator:
            try:
                cf_generations = await self.counterfactual_generator.generate_responses(
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
                
                cf_result = self.counterfactual_metrics.evaluate(
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
        
        try:
            del prompts, responses
        except NameError:
            pass
        
        gc.collect()
        
        return result

    def _resolve_toxicity_classifiers(self) -> List[str]:
        """Determine which toxicity classifiers to load."""
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
        """Format toxicity metrics into a simple structure."""
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
        """Format stereotype metrics into a simple structure."""
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
        """Format counterfactual fairness metrics into a simple structure."""
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

