"""Configuration Prizm AI V5."""

from prizm_ai.config.settings import settings
from prizm_ai.config.visual_identity import visual_identity
from prizm_ai.config.voix_prizm import voix_prizm
from prizm_ai.config.templates import TEMPLATES, get_template, get_template_prompt

__all__ = [
    "settings",
    "visual_identity", 
    "voix_prizm",
    "TEMPLATES",
    "get_template",
    "get_template_prompt"
]
