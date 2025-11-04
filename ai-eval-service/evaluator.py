"""
LangFair Evaluator Module

This module uses LangFair's individual metric classes to evaluate responses
for bias, toxicity, and stereotypes.

Why this approach?
- We're evaluating a specific user-provided response, not generating new ones
- Individual metric classes let us evaluate existing responses directly
- More efficient than AutoEval which generates multiple responses

Why this exists:
- LangFair requires specific setup (LLM, prompts, etc.)
- This module handles all the complexity
- Provides a simple interface for the API server
"""

import os
from typing import Dict, Any, Optional

# Counterfactual generation requires LLM which has version conflicts
# For now, we'll skip it and only use toxicity/stereotype metrics
# try:
#     from langchain_google_genai import ChatGoogleGenerativeAI
#     HAS_LLM_SUPPORT = True
# except ImportError:
#     HAS_LLM_SUPPORT = False
HAS_LLM_SUPPORT = False  # Disabled due to version conflicts
from langfair.metrics.toxicity import ToxicityMetrics
from langfair.metrics.stereotype import StereotypeMetrics
from langfair.generator.counterfactual import CounterfactualGenerator
from langfair.metrics.counterfactual import CounterfactualMetrics
from dotenv import load_dotenv

# Load environment variables from .env file
# Why? So we can use GEMINI_API_KEY without hardcoding it
load_dotenv()


class LangFairEvaluator:
    """
    Wraps LangFair's metric classes to provide a simple evaluation interface.
    
    What it does:
    1. Sets up connection to Google Gemini API (for counterfactual generation)
    2. Initializes ToxicityMetrics, StereotypeMetrics, CounterfactualMetrics
    3. Evaluates a single response for toxicity, stereotypes, and optionally counterfactual fairness
    """
    
    def __init__(self):
        """
        Initialize the evaluator.
        
        Why InMemoryRateLimiter?
        - Prevents hitting API rate limits
        - Google has limits on how many requests per second
        - Rate limiter queues requests to stay within limits
        """
        # Note: GEMINI_API_KEY is not required for basic toxicity/stereotype metrics
        # Only needed if counterfactual evaluation is enabled (currently disabled)
        api_key = os.getenv("GEMINI_API_KEY", "")
        
        # Initialize metric evaluators (don't need LLM for these)
        # Why separate classes? Each handles different aspects of fairness
        # - ToxicityMetrics: Detects toxic/harmful language
        # - StereotypeMetrics: Detects stereotype associations
        # - CounterfactualGenerator: Generates alternative responses (needs LLM) - optional
        # - CounterfactualMetrics: Compares responses across groups
        
        # Note: device parameter is optional - uncomment if you have GPU
        # device = torch.device("cuda") if torch.cuda.is_available() else None
        self.toxicity_metrics = ToxicityMetrics()  # device=device if GPU available
        self.stereotype_metrics = StereotypeMetrics()
        self.counterfactual_metrics = CounterfactualMetrics()
        
        # Initialize LLM for counterfactual generation (currently disabled)
        # Counterfactual evaluation requires langchain-google-genai which has version conflicts
        # Toxicity and stereotype metrics work without LLM
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
                print(f"Warning: Could not initialize LLM for counterfactual generation: {e}")
                print("Counterfactual evaluation will be disabled. Toxicity and stereotype metrics will still work.")
        else:
            print("Note: Counterfactual evaluation is disabled. Toxicity and stereotype metrics are available.")
    
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
            Dictionary containing:
            - toxicity_metrics: Toxicity scores
            - stereotype_metrics: Stereotype scores
            - counterfactual_metrics: Counterfactual fairness scores (if include_counterfactual=True)
        """
        
        # Validate inputs
        if not question_text or not isinstance(question_text, str):
            question_text = ""
        if not user_response or not isinstance(user_response, str):
            user_response = ""
        
        if not user_response.strip():
            raise ValueError("user_response cannot be empty")
        
        # For toxicity and stereotype, we can evaluate the single response directly
        # LangFair expects lists, so we wrap our single response in a list
        prompts = [question_text]
        responses = [user_response]
        
        # 1. Evaluate Toxicity
        # Why evaluate toxicity? Detects harmful, offensive, or toxic language
        # This is important for ensuring safe AI responses
        toxicity_metrics = {}
        try:
            toxicity_result = self.toxicity_metrics.evaluate(
                prompts=prompts,
                responses=responses,
                return_data=True
            )
            toxicity_metrics = toxicity_result.get('metrics', {})
        except Exception as e:
            print(f"Error evaluating toxicity: {e}")
            import traceback
            traceback.print_exc()
            # Return default values on error
            toxicity_metrics = {
                "Toxic Fraction": 0.0,
                "Expected Maximum Toxicity": 0.0,
                "Toxicity Probability": 0.0,
            }
        
        # 2. Evaluate Stereotypes
        # Why evaluate stereotypes? Detects if response reinforces harmful stereotypes
        # Maps category to LangFair's expected format
        category_mapping = {
            "gender": "gender",
            "race": "race",
            "ethnicity": "race",  # LangFair uses "race" for ethnicity
            "religion": "religion",
            "age": "age",
        }
        langfair_category = category_mapping.get(category.lower(), "gender")  # Default to gender
        
        stereotype_metrics = {}
        try:
            stereotype_result = self.stereotype_metrics.evaluate(
                responses=responses,
                categories=[langfair_category]
            )
            stereotype_metrics = stereotype_result.get('metrics', {})
        except Exception as e:
            print(f"Error evaluating stereotypes: {e}")
            import traceback
            traceback.print_exc()
            # Return default values on error
            stereotype_metrics = {
                "Stereotype Association": 0.0,
                "Cooccurrence Bias": 0.0,
                f"Stereotype Fraction - {langfair_category}": 0.0,
            }
        
        # 3. Evaluate Counterfactual Fairness (optional, slower)
        # Why counterfactual? Checks if model treats different groups fairly
        # This generates alternative responses (e.g., "male" vs "female" versions)
        # and compares them for fairness
        counterfactual_metrics = {}
        if include_counterfactual and category.lower() in ["gender", "race"] and self.counterfactual_generator:
            try:
                # Generate counterfactual responses
                # This creates alternative versions of the response for different groups
                cf_generations = await self.counterfactual_generator.generate_responses(
                    prompts=prompts,
                    attribute=langfair_category,
                    count=5  # Generate 5 counterfactual pairs (less than standard 25 for speed)
                )
                
                # Extract male/female or other attribute pairs
                if langfair_category == "gender":
                    texts1 = cf_generations['data']['male_response']
                    texts2 = cf_generations['data']['female_response']
                else:
                    # For other attributes, use first two groups
                    texts1 = list(cf_generations['data'].values())[0]
                    texts2 = list(cf_generations['data'].values())[1]
                
                # Evaluate counterfactual fairness
                cf_result = self.counterfactual_metrics.evaluate(
                    texts1=texts1,
                    texts2=texts2,
                    attribute=langfair_category
                )
                counterfactual_metrics = cf_result.get('metrics', {})
            except Exception as e:
                print(f"Counterfactual evaluation failed: {e}")
                counterfactual_metrics = {"error": str(e)}
        
        # Format the response in a way our Node.js backend expects
        return {
            "success": True,
            "metrics": {
                "toxicity": self._format_toxicity_metrics(toxicity_metrics),
                "stereotype": self._format_stereotype_metrics(stereotype_metrics, category),
                "counterfactual": self._format_counterfactual_metrics(counterfactual_metrics) if counterfactual_metrics else {},
            },
        }
    
    def _format_toxicity_metrics(self, toxicity_metrics: Dict) -> Dict[str, float]:
        """
        Format toxicity metrics into a simple structure.
        
        What these metrics mean:
        - Toxic Fraction: Percentage of responses that are toxic (0-1)
        - Expected Maximum Toxicity: Highest toxicity score expected (0-1)
        - Toxicity Probability: Probability that a response will be toxic (0-1)
        """
        if not toxicity_metrics:
            return {
                "toxic_fraction": 0.0,
                "expected_max_toxicity": 0.0,
                "toxicity_probability": 0.0,
            }
        
        # Helper function to safely convert to float, handling None values
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
        """
        Format stereotype metrics into a simple structure.
        
        What these metrics mean:
        - Stereotype Association: How strongly stereotypes are associated (0-1, lower is better)
        - Cooccurrence Bias: How often stereotypes co-occur (0-1, lower is better)
        - Stereotype Fraction: Percentage of responses containing stereotypes (0-1)
        """
        if not stereotype_metrics:
            return {
                "stereotype_association": 0.0,
                "cooccurrence_bias": 0.0,
                "stereotype_fraction": 0.0,
            }
        
        # Helper function to safely convert to float, handling None values
        def safe_float(value, default=0.0):
            if value is None:
                return default
            try:
                return float(value)
            except (ValueError, TypeError):
                return default
        
        # LangFair returns metrics with category suffix (e.g., "Stereotype Fraction - gender")
        # We extract the base metric
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
        """
        Format counterfactual fairness metrics into a simple structure.
        
        What these metrics mean:
        - Cosine Similarity: How similar are responses when attributes change (0-1, higher is better)
        - RougeL Similarity: Text similarity using ROUGE-L (0-1, higher is better)
        - Bleu Similarity: Text similarity using BLEU (0-1, higher is better)
        - Sentiment Bias: Difference in sentiment between groups (0-1, lower is better)
        """
        if not counterfactual_metrics:
            return {
                "cosine_similarity": 0.0,
                "rouge_similarity": 0.0,
                "bleu_similarity": 0.0,
                "sentiment_bias": 0.0,
            }
        
        # Helper function to safely convert to float, handling None values
        def safe_float(value, default=0.0):
            if value is None:
                return default
            try:
                return float(value)
            except (ValueError, TypeError):
                return default
        
        # Counterfactual metrics are nested by attribute pair (e.g., "male-female")
        # We extract the first available pair
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

