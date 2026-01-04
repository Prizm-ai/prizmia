#!/usr/bin/env python3
"""
Package agents - Newsletter PrizmAI
Initialisation des agents de traitement automatisé
"""

# Imports des agents principaux
from .base_agent import BaseAgent
from .orchestrator import Orchestrator  
from .agent_veille import AgentVeille
from .agent_mailchimp import AgentMailchimp as AgentMailChimp

# Imports des agents de rédaction avec toutes les classes nécessaires
from .agent_redacteur import AgentRedacteur, AINewsletterWriter, ArticleRequest, GeneratedContent
from .agent_redacteur_chef import AgentRedacteurChef, NewsletterStructure, EditorialCoordinator

# Export des classes principales
__all__ = [
    # Agents de base
    'BaseAgent',
    'Orchestrator',
    'AgentVeille', 
    'AgentMailChimp',
    
    # Agents de rédaction
    'AgentRedacteur',
    'AgentRedacteurChef', 
    'RedacteurEnChef',  # Alias pour compatibilité
    
    # Classes de données
    'ArticleRequest',
    'GeneratedContent',
    'NewsletterStructure',
    
    # Classes utilitaires
    'AINewsletterWriter',
    'EditorialCoordinator'
]

print("[PACKAGE] Package agents initialisé avec succès")