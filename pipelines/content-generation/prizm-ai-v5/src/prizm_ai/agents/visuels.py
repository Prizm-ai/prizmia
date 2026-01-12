"""
Agent Visuels V2 - Génération améliorée.

AMÉLIORATIONS V2 :
- Hero : Prompt contextuel avec éléments visuels IA/tech
- Charts : Uniquement si 2+ données comparables, sinon skip
- Meilleure extraction des statistiques
"""

import re
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime

from openai import AsyncOpenAI
import httpx

from prizm_ai.agents.base import BaseAgent
from prizm_ai.graph.state import GraphState, Visuels
from prizm_ai.config import settings, visual_identity


class VisuelsAgent(BaseAgent):
    """
    Agent de génération de visuels V2.
    
    Génère :
    - Image hero (DALL-E 3, style Flat Bold Editorial, contextuel IA/tech)
    - Graphiques (QuickChart) uniquement si données suffisantes
    """
    
    name = "VisuelsAgent"
    
    QUICKCHART_URL = "https://quickchart.io/chart"
    MIN_DATA_POINTS_FOR_CHART = 2  # Minimum de données pour générer un chart
    
    def __init__(self):
        super().__init__()
        self.openai = AsyncOpenAI(api_key=settings.openai_api_key)
        self.output_dir = settings.output_path / "visuels"
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    async def run(self, state: GraphState) -> GraphState:
        """Génère les visuels pour l'article."""
        state = self.log(state, "Génération des visuels (V2)...")
        
        sujet = state.get("sujet_selectionne", {})
        type_article = state.get("type_article", "actualite")
        article = state.get("article_revise") or state.get("article_brut", "")
        
        visuels = Visuels(hero=None, graphiques=[])
        
        try:
            # 1. Générer l'image hero
            titre = sujet.get("titre", "Article Prizm AI")
            hero = await self._generate_hero(titre, type_article)
            visuels["hero"] = hero
            state = self.log(state, f"✓ Image hero générée")
            
            # 2. Extraire et générer les graphiques (seulement si données suffisantes)
            data_points = self._extract_comparable_stats(article)
            
            if len(data_points) >= self.MIN_DATA_POINTS_FOR_CHART:
                chart = await self._generate_comparison_chart(data_points, titre)
                if chart:
                    visuels["graphiques"].append(chart)
                    state = self.log(state, f"✓ Graphique généré ({len(data_points)} données)")
            else:
                state = self.log(state, f"⏭ Charts skippés (seulement {len(data_points)} donnée(s))")
            
            state["visuels"] = visuels
            
        except Exception as e:
            state = self.error(state, f"Erreur visuels: {str(e)}")
        
        return state
    
    async def _generate_hero(self, titre: str, type_article: str) -> Dict[str, str]:
        """
        Génère l'image hero avec DALL-E.
        
        V2 : Utilise le prompt contextuel avec éléments visuels IA/tech.
        """
        # Construire le prompt avec l'identité visuelle V2
        prompt = visual_identity.get_prompt_for_type(type_article, titre)
        
        # Appel DALL-E
        response = await self.openai.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1792x1024",  # 16:9
            quality="standard",
            n=1
        )
        
        image_url = response.data[0].url
        
        # Télécharger l'image
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"hero-{timestamp}.png"
        filepath = self.output_dir / filename
        
        async with httpx.AsyncClient() as client:
            img_response = await client.get(image_url)
            filepath.write_bytes(img_response.content)
        
        return {
            "path": str(filepath),
            "prompt": prompt[:500],
            "alt": titre
        }
    
    def _extract_comparable_stats(self, article: str) -> List[Dict]:
        """
        Extrait les statistiques comparables de l'article.
        
        V2 : Cherche des pourcentages avec contexte pour créer des comparaisons.
        
        Returns:
            Liste de stats avec label et valeur
        """
        stats = []
        
        # Pattern pour pourcentages avec contexte
        # Ex: "73% des PME", "65% des organisations", etc.
        pattern = r'(\d+(?:,\d+)?)\s*%\s+(?:des?\s+)?([^.,\n]{5,40})'
        
        matches = re.findall(pattern, article, re.IGNORECASE)
        
        for value, context in matches:
            # Nettoyer le contexte
            context = context.strip()
            context = re.sub(r'\s+', ' ', context)
            
            # Éviter les doublons
            value_float = float(value.replace(',', '.'))
            
            # Vérifier que ce n'est pas une répétition
            is_duplicate = any(
                abs(s["value"] - value_float) < 1 and 
                s["label"][:10].lower() == context[:10].lower()
                for s in stats
            )
            
            if not is_duplicate and value_float <= 100:
                stats.append({
                    "value": value_float,
                    "label": self._clean_label(context),
                    "raw": f"{value}% {context}"
                })
        
        # Garder les 4 plus pertinentes (éviter surcharge)
        return stats[:4]
    
    def _clean_label(self, label: str) -> str:
        """Nettoie un label pour le graphique."""
        # Capitaliser
        label = label.strip().capitalize()
        
        # Tronquer intelligemment si trop long
        if len(label) > 35:
            # Couper au dernier espace avant 35 caractères
            label = label[:35].rsplit(' ', 1)[0] + "..."
        
        return label
    
    async def _generate_comparison_chart(
        self, 
        data_points: List[Dict], 
        titre_article: str
    ) -> Optional[Dict[str, str]]:
        """
        Génère un graphique de comparaison avec plusieurs barres.
        
        V2 : Chart horizontal avec titre, labels complets, palette Prizm.
        """
        try:
            palette = visual_identity.palette
            colors = [palette.principal, palette.secondaire, palette.accent, palette.gris]
            
            # Préparer les données
            labels = [d["label"] for d in data_points]
            values = [d["value"] for d in data_points]
            bar_colors = [colors[i % len(colors)] for i in range(len(data_points))]
            
            # Titre du graphique
            chart_title = "Statistiques clés"
            
            # Configuration QuickChart - Bar horizontal pour labels lisibles
            config = {
                "type": "horizontalBar",
                "data": {
                    "labels": labels,
                    "datasets": [{
                        "data": values,
                        "backgroundColor": bar_colors,
                        "borderWidth": 0
                    }]
                },
                "options": {
                    "plugins": {
                        "legend": {
                            "display": False
                        },
                        "title": {
                            "display": True,
                            "text": chart_title,
                            "font": {
                                "size": 16,
                                "weight": "bold"
                            },
                            "color": palette.texte
                        },
                        "datalabels": {
                            "display": True,
                            "anchor": "end",
                            "align": "right",
                            "formatter": "function(value) { return value + '%'; }",
                            "color": palette.texte,
                            "font": {
                                "weight": "bold"
                            }
                        }
                    },
                    "scales": {
                        "x": {
                            "beginAtZero": True,
                            "max": 100,
                            "grid": {
                                "display": True,
                                "color": "#E2E8F0"
                            },
                            "ticks": {
                                "callback": "function(value) { return value + '%'; }"
                            }
                        },
                        "y": {
                            "grid": {
                                "display": False
                            }
                        }
                    },
                    "indexAxis": "y"
                }
            }
            
            # Appel QuickChart
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.QUICKCHART_URL,
                    json={
                        "chart": config,
                        "width": 700,
                        "height": 400,
                        "backgroundColor": palette.fond,
                        "format": "png"
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
                    filename = f"chart-stats-{timestamp}.png"
                    filepath = self.output_dir / filename
                    filepath.write_bytes(response.content)
                    
                    return {
                        "path": str(filepath),
                        "type": "horizontalBar",
                        "data": str(data_points)
                    }
                else:
                    print(f"QuickChart error: {response.status_code} - {response.text[:200]}")
            
        except Exception as e:
            print(f"Erreur génération graphique: {e}")
        
        return None


# Test
if __name__ == "__main__":
    import asyncio
    
    async def test():
        print("🎨 Test VisuelsAgent V2")
        print("=" * 50)
        
        agent = VisuelsAgent()
        print(f"Output dir: {agent.output_dir}")
        
        # Test extraction données
        test_article = """
        73% des PME françaises utilisent déjà l'IA générative.
        65% des organisations ont adopté ces outils en 2024.
        Seulement 35% des dirigeants ont planifié des investissements.
        Le taux de satisfaction atteint 82% parmi les utilisateurs.
        """
        
        data = agent._extract_comparable_stats(test_article)
        print(f"\nDonnées extraites: {len(data)}")
        for d in data:
            print(f"  • {d['value']}% - {d['label']}")
        
        print("\n✓ Agent V2 initialisé")
    
    asyncio.run(test())
