"""
Identité visuelle Prizm AI - V2.

AMÉLIORATIONS V2 :
- Prompt hero adapté au contexte IA/tech
- Éléments visuels spécifiques selon le sujet
- Mots-clés tech détectés pour enrichir le prompt
"""

from dataclasses import dataclass
from typing import Dict, List
import re


@dataclass
class Palette:
    """Palette de couleurs Prizm AI."""
    
    principal: str = "#1E3A5F"      # Navy Blue - Confiance, expertise
    secondaire: str = "#6366F1"     # Indigo - Innovation, différenciation
    accent: str = "#F97316"         # Coral Orange - Action, énergie
    fond: str = "#F8FAFC"           # Off-white - Respiration, clarté
    texte: str = "#1E293B"          # Near-black - Lisibilité
    gris: str = "#64748B"           # Slate - Éléments secondaires
    
    def to_list(self) -> List[str]:
        """Retourne les couleurs principales pour les graphiques."""
        return [self.principal, self.secondaire, self.accent, self.gris]
    
    def to_dict(self) -> Dict[str, str]:
        """Retourne toutes les couleurs en dictionnaire."""
        return {
            "principal": self.principal,
            "secondaire": self.secondaire,
            "accent": self.accent,
            "fond": self.fond,
            "texte": self.texte,
            "gris": self.gris
        }


# Mapping mots-clés → éléments visuels
VISUAL_ELEMENTS = {
    # IA et automatisation
    "agent": "stylized robot assistant, digital helper, autonomous system visualization",
    "autonome": "self-operating machine, automated workflow arrows, no human intervention",
    "automatisation": "conveyor belt metaphor, gears and cogs, streamlined process",
    "ia": "neural network abstract pattern, brain-circuit hybrid, intelligent system",
    "intelligence artificielle": "abstract AI brain, connected nodes, digital synapses",
    "machine learning": "data flowing into machine, learning curves, pattern recognition",
    "chatbot": "speech bubbles with digital elements, conversational interface",
    "génératif": "creative sparks, content creation visual, generation process",
    
    # Business et PME
    "pme": "small business storefront, local shop modernizing, entrepreneur at desk",
    "eti": "medium-sized factory, growing company, scaling business",
    "entreprise": "office building silhouette, business environment, corporate setting",
    "dirigeant": "leader figure, decision maker at crossroads, CEO perspective",
    "productivité": "upward graph, efficiency arrows, time savings clock",
    
    # Transformation et adoption
    "transformation": "metamorphosis visual, caterpillar to butterfly, evolution stages",
    "adoption": "embracing technology, integration process, onboarding visual",
    "déploiement": "rollout arrows, expansion pattern, implementation stages",
    "stratégie": "chess pieces, roadmap visual, strategic planning",
    
    # Données et tech
    "données": "data streams, database visualization, information flow",
    "cloud": "cloud computing icons, server abstraction, connected infrastructure",
    "digital": "binary code aesthetic, pixel elements, screen interfaces",
    "numérique": "digital transformation, tech integration, modern tools"
}


@dataclass
class VisualIdentity:
    """Identité visuelle complète Prizm AI - V2."""
    
    style_name: str = "Flat Bold Editorial"
    palette: Palette = None
    inspirations: List[str] = None
    caracteristiques: List[str] = None
    
    # Prompt DALL-E de base (signature) - AMÉLIORÉ V2
    prompt_base: str = """Editorial illustration in the style of The Economist and New York Times Opinion.
Bold flat color blocks with visible risograph grain texture.
Limited palette strictly enforced: deep navy blue (#1E3A5F), warm coral-orange (#F97316), indigo (#6366F1), cream white (#F8FAFC).
Subtle retro editorial aesthetic, confident and authoritative.
No 3D effects, no gradients, no stock photo aesthetic, no text, no words, no letters.
High contrast, clean composition.
FULL BLEED COMPOSITION - the illustration must extend edge to edge, filling the entire frame with NO borders, NO frames, NO margins, NO empty space around the edges.
Aspect ratio 16:9."""
    
    adaptations_type: Dict[str, str] = None
    
    def __post_init__(self):
        if self.palette is None:
            self.palette = Palette()
        
        if self.inspirations is None:
            self.inspirations = [
                "The Economist illustrations",
                "New York Times Opinion",
                "Risograph texture",
                "Mid-century modern editorial"
            ]
        
        if self.caracteristiques is None:
            self.caracteristiques = [
                "Aplats de couleur francs, pas de dégradés",
                "Texture grain risograph visible",
                "Compositions dynamiques",
                "Contrast élevé",
                "Pas de 3D ni d'effets",
                "Éléments tech stylisés pour sujets IA"
            ]
        
        if self.adaptations_type is None:
            self.adaptations_type = {
                "actualite": "Sense of immediacy, news-like urgency, dynamic composition. Breaking news energy, forward momentum.",
                "analyse": "Contemplative mood, examining data elements, analytical perspective. Thoughtful atmosphere with visual depth.",
                "guide": "Step-by-step visual metaphor, clear progression, helpful visual cues. Instructive and welcoming.",
                "opinion": "Bold composition, thought leadership visual, assertive stance. Visionary and confident."
            }
    
    def _extract_visual_keywords(self, sujet: str) -> List[str]:
        """
        Extrait les mots-clés visuels pertinents du sujet.
        
        Args:
            sujet: Titre ou description du sujet
            
        Returns:
            Liste d'éléments visuels à inclure dans le prompt
        """
        sujet_lower = sujet.lower()
        visual_elements = []
        
        for keyword, visual in VISUAL_ELEMENTS.items():
            if keyword in sujet_lower:
                visual_elements.append(visual)
        
        # Si aucun mot-clé trouvé, ajouter des éléments IA génériques
        if not visual_elements:
            visual_elements.append("modern technology, digital innovation, business transformation")
        
        return visual_elements[:3]  # Max 3 éléments pour éviter surcharge
    
    def get_prompt_for_type(self, type_article: str, sujet: str) -> str:
        """
        Génère le prompt DALL-E complet pour un type d'article et sujet donné.
        
        V2 : Inclut des éléments visuels spécifiques extraits du sujet.
        
        Args:
            type_article: Type d'article (actualite, analyse, guide, opinion)
            sujet: Titre ou description du sujet
            
        Returns:
            Prompt complet pour DALL-E
        """
        adaptation = self.adaptations_type.get(type_article, "")
        visual_elements = self._extract_visual_keywords(sujet)
        visual_description = ", ".join(visual_elements)
        
        # Construire un prompt contextuel
        return f"""{self.prompt_base}

Visual elements to include: {visual_description}

Style adaptation: {adaptation}

The illustration should visually represent the concept: {sujet}

Important: Create an abstract, metaphorical representation - not a literal depiction. Focus on conveying the feeling and impact of the topic through bold shapes and limited colors."""
    
    def get_chart_config(self) -> Dict:
        """
        Retourne la configuration pour les graphiques QuickChart.
        """
        return {
            "backgroundColor": self.palette.fond,
            "colors": self.palette.to_list(),
            "font": {
                "family": "Inter, system-ui, sans-serif",
                "color": self.palette.texte
            },
            "title": {
                "fontSize": 18,
                "fontWeight": "bold",
                "color": self.palette.texte
            },
            "legend": {
                "position": "bottom",
                "color": self.palette.texte
            },
            "borderWidth": 0
        }


# Instance singleton
visual_identity = VisualIdentity()


# Test
if __name__ == "__main__":
    print("🎨 Identité Visuelle Prizm AI - V2")
    print("=" * 50)
    
    # Test extraction mots-clés
    test_sujets = [
        "Les agents IA autonomes deviennent la norme pour les PME",
        "Adoption de l'IA générative dans les entreprises françaises",
        "Transformation numérique et productivité des ETI"
    ]
    
    for sujet in test_sujets:
        print(f"\n📝 Sujet: {sujet[:50]}...")
        elements = visual_identity._extract_visual_keywords(sujet)
        print(f"   Éléments visuels: {elements}")
        prompt = visual_identity.get_prompt_for_type("actualite", sujet)
        print(f"   Prompt (extrait): {prompt[300:500]}...")
