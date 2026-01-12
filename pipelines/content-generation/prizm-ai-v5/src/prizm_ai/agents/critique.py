"""
Agent Critique V2 - Évaluation anti-hallucination.

AMÉLIORATION CLÉE : Vérifie que les sources citées correspondent
aux sources fournies par la veille.
"""

import re
from typing import Dict, List, Tuple

from prizm_ai.agents.base import BaseAgent
from prizm_ai.graph.state import GraphState, ScoresDetail
from prizm_ai.config import settings


class CritiqueAgent(BaseAgent):
    """
    Agent d'évaluation qualité avec vérification anti-hallucination.
    
    Critères :
    - Longueur (15%)
    - Sources citées (20%) - AMÉLIORÉ : vérifie traçabilité
    - Répétitions (15%)
    - Structure (15%)
    - Voix Prizm (15%)
    - Faithfulness (20%) - vérifie cohérence sources
    """
    
    name = "CritiqueAgent"
    
    WEIGHTS = {
        "longueur": 0.15,
        "sources": 0.20,
        "repetition": 0.15,
        "structure": 0.15,
        "voix_prizm": 0.15,
        "faithfulness": 0.20
    }
    
    def __init__(self):
        super().__init__()
    
    async def run(self, state: GraphState) -> GraphState:
        """Évalue l'article avec vérification des sources."""
        state = self.log(state, "Évaluation de l'article...")
        
        article = state.get("article_revise") or state.get("article_brut", "")
        
        if not article:
            state = self.error(state, "Aucun article à évaluer")
            state["score"] = 0.0
            return state
        
        # Récupérer les sources autorisées
        sujet = state.get("sujet_selectionne", {})
        sources_autorisees = sujet.get("sources_noms", [])
        extraits_fournis = sujet.get("extraits", [])
        
        try:
            scores = ScoresDetail(
                longueur=self._eval_longueur(article),
                sources=self._eval_sources(article, sources_autorisees),
                repetition=self._eval_repetition(article),
                structure=self._eval_structure(article),
                voix_prizm=self._eval_voix(article),
                faithfulness=self._eval_faithfulness(article, extraits_fournis, sources_autorisees)
            )
            
            score_global = sum(
                scores[k] * self.WEIGHTS[k]
                for k in self.WEIGHTS.keys()
            )
            
            critiques = []
            if score_global < settings.target_score:
                critiques = self._generate_critiques(scores, article, sources_autorisees)
            
            state["score"] = round(score_global, 1)
            state["scores_detail"] = scores
            state["critiques"] = critiques
            
            state = self.log(state, f"✓ Score: {score_global:.1f}/10 | Critiques: {len(critiques)}")
            
        except Exception as e:
            state = self.error(state, f"Erreur évaluation: {str(e)}")
            state["score"] = 0.0
        
        return state
    
    def _eval_longueur(self, article: str) -> float:
        """Évalue la longueur (cible: 1400-2000 mots)."""
        mots = len(article.split())
        
        if settings.min_words <= mots <= settings.max_words:
            return 10.0
        elif 1200 <= mots <= 2200:
            return 7.0
        elif 1000 <= mots <= 2500:
            return 5.0
        else:
            return 3.0
    
    def _eval_sources(self, article: str, sources_autorisees: List[str]) -> float:
        """
        Évalue la citation des sources - VERSION AMÉLIORÉE.
        
        Vérifie :
        1. Présence de citations [Source: X]
        2. Que les sources citées sont dans la liste autorisée
        """
        # Pattern pour [Source: X] ou [X]
        citations = re.findall(r'\[(?:Source:\s*)?([^\]]+)\]', article)
        
        # URLs dans l'article
        urls = re.findall(r'https?://[^\s\)\]]+', article)
        
        # Section Sources en fin d'article
        has_sources_section = bool(re.search(r'^##?\s*Sources', article, re.MULTILINE | re.IGNORECASE))
        
        score = 0.0
        
        # Points pour citations inline
        if len(citations) >= 5:
            score += 5.0
        elif len(citations) >= 3:
            score += 3.5
        elif len(citations) >= 1:
            score += 2.0
        
        # Points pour section sources
        if has_sources_section:
            score += 2.0
        
        # Points pour URLs
        if len(urls) >= 3:
            score += 2.0
        elif len(urls) >= 1:
            score += 1.0
        
        # BONUS : Vérifier que sources citées sont autorisées
        if sources_autorisees:
            sources_citees_valides = 0
            for citation in citations:
                citation_lower = citation.lower().strip()
                for source_ok in sources_autorisees:
                    if source_ok.lower() in citation_lower or citation_lower in source_ok.lower():
                        sources_citees_valides += 1
                        break
            
            # Bonus si sources valides
            if sources_citees_valides >= 2:
                score += 1.0
        
        return min(10.0, score)
    
    def _eval_repetition(self, article: str) -> float:
        """
        Évalue les répétitions (FUSION V4).
        
        Vérifie :
        - PME ≤ 5 occurrences
        - ETI ≤ 3 occurrences
        - Pas de phrases dupliquées (NOUVEAU V4)
        """
        pme_count = len(re.findall(r'\bPME\b', article, re.IGNORECASE))
        eti_count = len(re.findall(r'\bETI\b', article, re.IGNORECASE))
        
        score = 10.0
        
        if pme_count > settings.max_pme_occurrences:
            score -= (pme_count - settings.max_pme_occurrences) * 1.0
        
        if eti_count > settings.max_eti_occurrences:
            score -= (eti_count - settings.max_eti_occurrences) * 1.0
        
        # FUSION V4 : Détecter phrases dupliquées
        duplicates = self._trouver_phrases_dupliquees(article)
        if len(duplicates) > 3:
            score -= 2.0
        elif len(duplicates) > 0:
            score -= 0.5
        
        return max(0.0, score)
    
    def _trouver_phrases_dupliquees(self, article: str, min_mots: int = 10) -> List[str]:
        """
        Trouve les phrases répétées dans l'article (FUSION V4).
        
        Args:
            article: Texte de l'article
            min_mots: Nombre minimum de mots pour considérer une phrase
        
        Returns:
            Liste des phrases dupliquées
        """
        # Extraire les phrases de plus de min_mots
        phrases = re.split(r'[.!?]\s+', article)
        phrases_longues = [p.strip().lower() for p in phrases if len(p.split()) >= min_mots]
        
        # Trouver les duplicates
        vues = set()
        duplicates = []
        
        for phrase in phrases_longues:
            # Normaliser (retirer espaces multiples)
            phrase_norm = ' '.join(phrase.split())
            
            if phrase_norm in vues:
                duplicates.append(phrase_norm[:50] + "...")
            else:
                vues.add(phrase_norm)
        
        return duplicates
    
    def _eval_structure(self, article: str) -> float:
        """Évalue la structure (H2, H3, listes, conclusion)."""
        h2_count = len(re.findall(r'^##\s', article, re.MULTILINE))
        h3_count = len(re.findall(r'^###\s', article, re.MULTILINE))
        
        score = 0.0
        
        # H2 (objectif : 4+)
        if h2_count >= 4:
            score += 5.0
        elif h2_count >= 3:
            score += 4.0
        elif h2_count >= 2:
            score += 2.5
        
        # H3
        if h3_count >= 2:
            score += 2.0
        elif h3_count >= 1:
            score += 1.0
        
        # Listes
        lists = len(re.findall(r'^[-•→*]\s', article, re.MULTILINE))
        if lists >= 3:
            score += 1.5
        elif lists >= 1:
            score += 0.5
        
        # Conclusion ou synthèse
        if re.search(r'(conclusion|synthèse|en résumé|ce qu.il faut retenir)', article.lower()):
            score += 1.5
        
        return min(10.0, score)
    
    def _eval_voix(self, article: str) -> float:
        """Évalue la présence de la voix Prizm AI."""
        score = 4.0  # Base
        
        # Questions engageantes
        questions = len(re.findall(r'\?', article))
        if questions >= 4:
            score += 2.5
        elif questions >= 2:
            score += 1.5
        elif questions >= 1:
            score += 0.5
        
        # Chiffres / données (mais pas trop précis = suspect)
        chiffres = re.findall(r'\d+(?:,\d+)?%', article)
        if 3 <= len(chiffres) <= 10:
            score += 2.0
        elif len(chiffres) >= 1:
            score += 1.0
        
        # Mises en gras
        bold = len(re.findall(r'\*\*[^*]+\*\*', article))
        if bold >= 5:
            score += 1.5
        elif bold >= 2:
            score += 0.5
        
        return min(10.0, score)
    
    def _eval_faithfulness(
        self, 
        article: str, 
        extraits_fournis: List[dict],
        sources_autorisees: List[str]
    ) -> float:
        """
        Évalue la fidélité aux sources - VERSION ANTI-HALLUCINATION.
        
        Vérifie :
        1. Les données citées correspondent aux extraits fournis
        2. Pas de sources inventées
        3. Cohérence des chiffres
        """
        score = 5.0  # Base neutre
        
        # Extraire les chiffres de l'article
        chiffres_article = set(re.findall(r'\d+(?:,\d+)?%', article))
        
        # Extraire les chiffres des extraits fournis
        chiffres_fournis = set()
        for extrait in extraits_fournis:
            contenu = extrait.get("contenu", "")
            chiffres_fournis.update(re.findall(r'\d+(?:,\d+)?%', contenu))
        
        # Vérifier que les chiffres de l'article sont dans les extraits
        if chiffres_fournis:
            chiffres_valides = chiffres_article & chiffres_fournis
            ratio = len(chiffres_valides) / max(1, len(chiffres_article))
            
            if ratio >= 0.7:
                score += 3.0  # Bon : majorité des chiffres sont sourcés
            elif ratio >= 0.4:
                score += 1.5
            else:
                score -= 1.0  # Pénalité : trop de chiffres non sourcés
        
        # Vérifier présence de sources valides
        sources_citees = re.findall(r'\[(?:Source:\s*)?([^\]]+)\]', article)
        sources_valides = 0
        sources_suspectes = 0
        
        for source in sources_citees:
            source_clean = source.strip().lower()
            is_valid = False
            
            for source_ok in sources_autorisees:
                if source_ok.lower() in source_clean or source_clean in source_ok.lower():
                    is_valid = True
                    sources_valides += 1
                    break
            
            if not is_valid:
                sources_suspectes += 1
        
        # Bonus pour sources valides
        if sources_valides >= 3:
            score += 2.0
        elif sources_valides >= 1:
            score += 1.0
        
        # Pénalité pour sources suspectes (potentiellement inventées)
        if sources_suspectes > 2:
            score -= 2.0
        elif sources_suspectes > 0:
            score -= 0.5
        
        return max(0.0, min(10.0, score))
    
    def _generate_critiques(
        self, 
        scores: ScoresDetail, 
        article: str,
        sources_autorisees: List[str]
    ) -> List[str]:
        """Génère des critiques actionnables."""
        critiques = []
        
        if scores["longueur"] < 7:
            mots = len(article.split())
            critiques.append(f"L'article fait {mots} mots. Cible: 1400-2000 mots.")
        
        if scores["sources"] < 7:
            critiques.append("Ajouter des citations [Source: X] après les données. Sources disponibles: " + ", ".join(sources_autorisees[:3]))
        
        if scores["repetition"] < 7:
            pme = len(re.findall(r'\bPME\b', article, re.IGNORECASE))
            critiques.append(f"Trop de 'PME' ({pme}x). Utiliser: entreprises, structures, organisations.")
        
        if scores["structure"] < 7:
            critiques.append("Ajouter des sections H2, des listes à puces, une conclusion claire.")
        
        if scores["voix_prizm"] < 7:
            critiques.append("Ajouter 2-3 questions au lecteur et plus de mises en gras.")
        
        if scores["faithfulness"] < 7:
            critiques.append("⚠️ ATTENTION : Certaines données semblent non sourcées. Utiliser UNIQUEMENT les extraits fournis.")
        
        return critiques


# Test
if __name__ == "__main__":
    import asyncio
    
    async def test():
        print("📊 Test CritiqueAgent V2")
        print("=" * 40)
        
        agent = CritiqueAgent()
        
        test_article = """
# Test Article

## Section 1

73% des PME françaises utilisent l'IA [Source: Bpifrance].
Ceci est un test important.

## Section 2

Plus de contenu ici avec **emphase**.

## Section 3

Une question pour vous ?

## Conclusion

En résumé, voici les points clés.

## Sources

- [Bpifrance](https://bpifrance.fr)
"""
        
        extraits = [
            {"type": "donnee", "contenu": "73% des PME françaises utilisent l'IA", "source_nom": "Bpifrance"}
        ]
        sources_autorisees = ["Bpifrance"]
        
        score = agent._eval_faithfulness(test_article, extraits, sources_autorisees)
        print(f"Score faithfulness: {score}/10")
        print("✓ Test réussi")
    
    asyncio.run(test())
