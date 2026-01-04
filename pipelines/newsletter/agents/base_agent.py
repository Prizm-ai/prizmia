# agents/base_agent.py
from abc import ABC, abstractmethod
import logging

class BaseAgent(ABC):
    def __init__(self, agent_name: str = None):
        """
        Constructeur de base pour tous les agents
        
        Args:
            agent_name: Nom de l'agent (optionnel)
        """
        self.agent_name = agent_name or self.__class__.__name__
        self.logger = logging.getLogger(f"agents.{self.agent_name.lower()}")
        self.is_initialized = False
        self._initialize()
    
    def _initialize(self):
        """Méthode d'initialisation commune à tous les agents"""
        try:
            self.setup()
            self.is_initialized = True
            self.logger.info(f"Agent {self.agent_name} initialise avec succes")
        except Exception as e:
            self.logger.error(f"Erreur lors de l'initialisation de l'agent {self.agent_name}: {e}")
            self.is_initialized = False
            raise
    
    def setup(self):
        """Méthode de configuration spécifique à chaque agent (optionnelle)"""
        pass
    
    @abstractmethod
    def execute(self, *args, **kwargs):
        """
        Méthode d'exécution principale que chaque agent doit implémenter
        
        Returns:
            dict: Résultat de l'exécution
        """
        pass
    
    def is_available(self) -> bool:
        """Vérifie si l'agent est disponible pour l'exécution"""
        return self.is_initialized
    
    def get_status(self) -> dict:
        """Retourne le statut de l'agent"""
        return {
            'name': self.agent_name,
            'initialized': self.is_initialized,
            'available': self.is_available()
        }