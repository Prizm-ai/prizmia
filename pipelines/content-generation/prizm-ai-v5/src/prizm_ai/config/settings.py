"""
Configuration centralisée du pipeline Prizm AI V5.

Utilise pydantic-settings pour charger et valider les variables d'environnement.
"""

from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration principale du pipeline."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # -----------------
    # APIs IA
    # -----------------
    anthropic_api_key: str
    openai_api_key: str
    perplexity_api_key: str
    
    # -----------------
    # LangSmith (Optionnel)
    # -----------------
    langchain_tracing_v2: bool = True
    langchain_api_key: Optional[str] = None
    langchain_project: str = "prizm-ai-v5"
    
    # -----------------
    # Chemins
    # -----------------
    blog_path: Path = Path("C:/Users/Samuel/Documents/prizmia/src/content/blog")
    images_path: Path = Path("C:/Users/Samuel/Documents/prizmia/public/images/blog")
    site_path: Path = Path("C:/Users/Samuel/Documents/prizmia")
    
    # -----------------
    # Configuration Pipeline
    # -----------------
    max_revisions: int = 2
    target_score: float = 7.0
    default_model: str = "claude-sonnet-4-20250514"
    debug: bool = False
    
    # -----------------
    # Contraintes articles
    # -----------------
    min_words: int = 1400
    max_words: int = 2000
    max_pme_occurrences: int = 5
    max_eti_occurrences: int = 3
    
    # -----------------
    # Configuration Rédaction (FUSION V4)
    # -----------------
    temperature_redaction: float = 0.3          # V4: plus factuel (était 0.7)
    max_retries_section: int = 3                # V4: retry si section trop courte
    
    # Longueurs par section (V4)
    longueur_introduction_min: int = 200
    longueur_introduction_cible: int = 250
    longueur_section_min: int = 500
    longueur_section_cible: int = 550
    longueur_conclusion_min: int = 250
    longueur_conclusion_cible: int = 300
    
    # -----------------
    # Mode Dirigé (FUSION V4)
    # -----------------
    mode_dirige_default: bool = False
    
    # -----------------
    # Historique Anti-répétition (FUSION V4)
    # -----------------
    historique_filename: str = "historique_sujets.json"
    
    # -----------------
    # Propriétés calculées
    # -----------------
    @property
    def output_path(self) -> Path:
        """Chemin vers le dossier output du pipeline."""
        return Path(__file__).parent.parent.parent.parent / "output"
    
    @property
    def templates_path(self) -> Path:
        """Chemin vers les templates d'articles."""
        return Path(__file__).parent.parent.parent.parent / "templates"
    
    @property
    def historique_path(self) -> Path:
        """Chemin vers le fichier d'historique des sujets traités (FUSION V4)."""
        return self.output_path / self.historique_filename
    
    def validate_paths(self) -> bool:
        """Vérifie que les chemins critiques existent."""
        paths_to_check = [self.blog_path, self.images_path, self.site_path]
        for path in paths_to_check:
            if not path.exists():
                print(f"⚠️ Chemin inexistant: {path}")
                return False
        return True


# Instance singleton
settings = Settings()


# Vérification au chargement
if __name__ == "__main__":
    print("🔧 Configuration Prizm AI V5")
    print("=" * 40)
    print(f"Anthropic API: {'✓' if settings.anthropic_api_key else '✗'}")
    print(f"OpenAI API: {'✓' if settings.openai_api_key else '✗'}")
    print(f"Perplexity API: {'✓' if settings.perplexity_api_key else '✗'}")
    print(f"LangSmith: {'✓' if settings.langchain_api_key else '✗ (optionnel)'}")
    print(f"Blog path: {settings.blog_path}")
    print(f"Paths valid: {'✓' if settings.validate_paths() else '✗'}")
