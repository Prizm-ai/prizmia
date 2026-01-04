import logging
import sys
from pathlib import Path

def setup_logging():
    """Configure le système de logging"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('app.log')
        ]
    )

def get_logger(name):
    """Retourne un logger avec le nom spécifié"""
    return logging.getLogger(name)

# Logger par défaut
logger = get_logger(__name__)

# Alias pour compatibilité avec les imports existants
Logger = logging.getLogger