"""
Client OpenAI pour Newsletter AI PRIZM
GÃ¨re les interactions avec l'API OpenAI GPT-4
"""

import openai
import logging
import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import json

logger = logging.getLogger(__name__)

@dataclass
class CompletionResult:
    """RÃ©sultat d'une completion OpenAI"""
    content: str
    tokens_used: int
    model: str
    finish_reason: str
    response_time: float

class OpenAIClient:
    """Client pour interagir avec l'API OpenAI"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.api_key = config.get("api_key", "")
        self.model = config.get("model", "gpt-4")
        self.temperature = config.get("temperature", 0.7)
        self.max_tokens = config.get("max_tokens", 2000)
        self.timeout = config.get("timeout", 30)
        self.max_retries = config.get("max_retries", 3)
        self.backoff_factor = config.get("backoff_factor", 2.0)
        
        # Configuration du client OpenAI
        if self.api_key:
            openai.api_key = self.api_key
        else:
            logger.warning("ClÃ© API OpenAI non fournie")
        
        # Statistiques d'utilisation
        self.total_tokens_used = 0
        self.total_requests = 0
        self.failed_requests = 0
        
        logger.info(f"Client OpenAI initialisÃ© - ModÃ¨le: {self.model}")
    
    def generate_completion(self, 
                          prompt: str,
                          temperature: Optional[float] = None,
                          max_tokens: Optional[int] = None,
                          system_message: Optional[str] = None) -> str:
        """GÃ©nÃ¨re une completion avec le modÃ¨le configurÃ©"""
        
        if not self.api_key:
            logger.error("ClÃ© API OpenAI manquante")
            raise ValueError("ClÃ© API OpenAI non configurÃ©e")
        
        # ParamÃ¨tres de la requÃªte
        temp = temperature if temperature is not None else self.temperature
        tokens = max_tokens if max_tokens is not None else self.max_tokens
        
        # Construction des messages
        messages = []
        
        if system_message:
            messages.append({
                "role": "system",
                "content": system_message
            })
        
        messages.append({
            "role": "user", 
            "content": prompt
        })
        
        # Tentatives avec retry
        for attempt in range(self.max_retries):
            try:
                start_time = time.time()
                
                response = openai.ChatCompletion.create(
                    model=self.model,
                    messages=messages,
                    temperature=temp,
                    max_tokens=tokens,
                    timeout=self.timeout
                )
                
                response_time = time.time() - start_time
                
                # Extraction du contenu
                content = response.choices[0].message.content.strip()
                tokens_used = response.usage.total_tokens
                finish_reason = response.choices[0].finish_reason
                
                # Mise Ã  jour des statistiques
                self.total_tokens_used += tokens_used
                self.total_requests += 1
                
                logger.info(f"Completion rÃ©ussie - Tokens: {tokens_used}, Temps: {response_time:.2f}s")
                
                return content
                
            except openai.error.RateLimitError as e:
                logger.warning(f"Rate limit atteint, tentative {attempt + 1}/{self.max_retries}")
                if attempt < self.max_retries - 1:
                    wait_time = self.backoff_factor ** attempt
                    time.sleep(wait_time)
                else:
                    self.failed_requests += 1
                    raise e
                    
            except openai.error.APIError as e:
                logger.error(f"Erreur API OpenAI: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.backoff_factor ** attempt)
                else:
                    self.failed_requests += 1
                    raise e
                    
            except Exception as e:
                logger.error(f"Erreur inattendue: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.backoff_factor ** attempt)
                else:
                    self.failed_requests += 1
                    raise e
        
        # Si on arrive ici, toutes les tentatives ont Ã©chouÃ©
        self.failed_requests += 1
        raise Exception("Ã‰chec de toutes les tentatives de completion")
    
    def generate_structured_completion(self,
                                     prompt: str,
                                     expected_format: str = "json",
                                     schema: Optional[Dict] = None) -> Dict[str, Any]:
        """GÃ©nÃ¨re une completion avec format structurÃ© attendu"""
        
        # Ajout d'instructions de formatage au prompt
        if expected_format.lower() == "json":
            structured_prompt = f"""
{prompt}

IMPORTANT: RÃ©pondez UNIQUEMENT en format JSON valide, sans texte supplÃ©mentaire.
Format attendu: {json.dumps(schema) if schema else 'JSON standard'}
"""
        else:
            structured_prompt = f"""
{prompt}

IMPORTANT: RÃ©pondez dans ce format exact: {expected_format}
"""
        
        try:
            response = self.generate_completion(structured_prompt)
            
            if expected_format.lower() == "json":
                # Tentative de parsing JSON
                try:
                    return json.loads(response)
                except json.JSONDecodeError:
                    # Nettoyage du JSON si malformÃ©
                    cleaned_response = self._clean_json_response(response)
                    return json.loads(cleaned_response)
            else:
                return {"content": response, "format": expected_format}
                
        except Exception as e:
            logger.error(f"Erreur gÃ©nÃ©ration structurÃ©e: {e}")
            raise e
    
    def generate_with_examples(self,
                             task_description: str,
                             examples: List[Dict[str, str]],
                             user_input: str) -> str:
        """GÃ©nÃ¨re une completion avec des exemples few-shot"""
        
        # Construction du prompt avec exemples
        prompt_parts = [task_description, "\n\nExemples:"]
        
        for i, example in enumerate(examples, 1):
            prompt_parts.append(f"\nExemple {i}:")
            prompt_parts.append(f"EntrÃ©e: {example.get('input', '')}")
            prompt_parts.append(f"Sortie: {example.get('output', '')}")
        
        prompt_parts.append(f"\n\nMaintenant, traitez cette entrÃ©e:")
        prompt_parts.append(f"EntrÃ©e: {user_input}")
        prompt_parts.append("Sortie:")
        
        full_prompt = "\n".join(prompt_parts)
        
        return self.generate_completion(full_prompt)
    
    def generate_with_context(self,
                            context: Dict[str, Any],
                            task: str,
                            additional_instructions: str = None) -> str:
        """GÃ©nÃ¨re une completion avec contexte riche"""
        
        # Construction du prompt contextuel
        context_parts = ["Contexte:"]
        
        for key, value in context.items():
            if isinstance(value, (list, dict)):
                context_parts.append(f"- {key}: {json.dumps(value, ensure_ascii=False)}")
            else:
                context_parts.append(f"- {key}: {value}")
        
        prompt_parts = [
            "\n".join(context_parts),
            f"\nTÃ¢che: {task}"
        ]
        
        if additional_instructions:
            prompt_parts.append(f"\nInstructions supplÃ©mentaires: {additional_instructions}")
        
        full_prompt = "\n\n".join(prompt_parts)
        
        return self.generate_completion(full_prompt)
    
    def estimate_tokens(self, text: str) -> int:
        """Estime le nombre de tokens dans un texte"""
        
        # Approximation simple : ~4 caractÃ¨res par token pour le franÃ§ais
        return len(text) // 4
    
    def check_rate_limit_status(self) -> Dict[str, Any]:
        """VÃ©rifie le statut des limites de taux"""
        
        try:
            # Test simple avec une requÃªte minimale
            start_time = time.time()
            
            test_response = openai.ChatCompletion.create(
                model=self.model,
                messages=[{"role": "user", "content": "test"}],
                max_tokens=1,
                temperature=0
            )
            
            response_time = time.time() - start_time
            
            return {
                "status": "ok",
                "response_time": response_time,
                "model_available": True
            }
            
        except openai.error.RateLimitError:
            return {
                "status": "rate_limited",
                "model_available": False,
                "message": "Rate limit atteint"
            }
        except Exception as e:
            return {
                "status": "error",
                "model_available": False,
                "message": str(e)
            }
    
    def get_usage_statistics(self) -> Dict[str, Any]:
        """Retourne les statistiques d'utilisation"""
        
        success_rate = 0
        if self.total_requests > 0:
            success_rate = ((self.total_requests - self.failed_requests) / self.total_requests) * 100
        
        return {
            "total_requests": self.total_requests,
            "failed_requests": self.failed_requests,
            "success_rate": round(success_rate, 2),
            "total_tokens_used": self.total_tokens_used,
            "average_tokens_per_request": (
                round(self.total_tokens_used / self.total_requests) 
                if self.total_requests > 0 else 0
            ),
            "model": self.model,
            "temperature": self.temperature
        }
    
    def _clean_json_response(self, response: str) -> str:
        """Nettoie une rÃ©ponse JSON malformÃ©e"""
        
        # Suppression du texte avant le premier {
        start_idx = response.find('{')
        if start_idx != -1:
            response = response[start_idx:]
        
        # Suppression du texte aprÃ¨s le dernier }
        end_idx = response.rfind('}')
        if end_idx != -1:
            response = response[:end_idx + 1]
        
        # Remplacement des guillemets simples par doubles
        response = response.replace("'", '"')
        
        # Suppression des commentaires // ou /* */
        response = re.sub(r'//.*?\n', '\n', response)
        response = re.sub(r'/\*.*?\*/', '', response, flags=re.DOTALL)
        
        return response
    
    def validate_api_key(self) -> bool:
        """Valide que la clÃ© API fonctionne"""
        
        if not self.api_key:
            return False
        
        try:
            openai.Model.list()
            return True
        except Exception as e:
            logger.error(f"ClÃ© API invalide: {e}")
            return False
    
    def get_available_models(self) -> List[str]:
        """Retourne la liste des modÃ¨les disponibles"""
        
        try:
            models = openai.Model.list()
            return [model.id for model in models.data if 'gpt' in model.id.lower()]
        except Exception as e:
            logger.error(f"Erreur rÃ©cupÃ©ration modÃ¨les: {e}")
            return []
    
    def get_status(self) -> Dict[str, Any]:
        """Retourne le statut complet du client"""
        
        return {
            "api_key_configured": bool(self.api_key),
            "api_key_valid": self.validate_api_key(),
            "model": self.model, 
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "usage_stats": self.get_usage_statistics(),
            "rate_limit_status": self.check_rate_limit_status()
        }

# Client global (optionnel)
_global_client: Optional[OpenAIClient] = None

def get_global_client() -> Optional[OpenAIClient]:
    """Retourne le client global s'il existe"""
    return _global_client

def set_global_client(client: OpenAIClient) -> None:
    """DÃ©finit le client global"""
    global _global_client
    _global_client = client

def create_client_from_config(config: Dict[str, Any]) -> OpenAIClient:
    """CrÃ©e un client Ã  partir d'une configuration"""
    return OpenAIClient(config)

