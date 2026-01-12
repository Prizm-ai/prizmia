"""
Classe de base pour tous les agents Prizm AI.

Chaque agent hérite de BaseAgent et implémente la méthode run().
"""

from abc import ABC, abstractmethod
from typing import Optional
from datetime import datetime

from prizm_ai.graph.state import GraphState, log_state, add_error


class BaseAgent(ABC):
    """
    Classe de base abstraite pour tous les agents.
    
    Chaque agent doit implémenter la méthode run() qui prend l'état
    en entrée et retourne l'état modifié.
    """
    
    name: str = "BaseAgent"
    
    def __init__(self):
        """Initialise l'agent."""
        self.created_at = datetime.now()
    
    @abstractmethod
    async def run(self, state: GraphState) -> GraphState:
        """
        Exécute la logique de l'agent.
        
        Args:
            state: État actuel du workflow
            
        Returns:
            État modifié
        """
        pass
    
    def log(self, state: GraphState, message: str) -> GraphState:
        """
        Ajoute un log à l'état.
        
        Args:
            state: État actuel
            message: Message à logger
            
        Returns:
            État avec log ajouté
        """
        return log_state(state, f"[{self.name}] {message}")
    
    def error(self, state: GraphState, error: str) -> GraphState:
        """
        Ajoute une erreur à l'état.
        
        Args:
            state: État actuel
            error: Message d'erreur
            
        Returns:
            État avec erreur ajoutée
        """
        return add_error(state, f"[{self.name}] {error}")
    
    def __repr__(self) -> str:
        return f"<{self.name}>"
