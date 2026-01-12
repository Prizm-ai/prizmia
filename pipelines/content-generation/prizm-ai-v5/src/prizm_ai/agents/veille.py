"""
Agent Veille V3 - FUSION V4.

Utilise Perplexity API avec:
- Parser multi-stratégie robuste (7 stratégies)
- Mode AUTO et DIRIGE
- Évaluation fiabilité chaque source (1-10)
- Filtrage sources < 6/10
- Anti-répétition sujets (historique)
- Priorisation sources institutionnelles

FUSION V4 : Parser robuste + Mode dirigé + Historique
"""

import os
import json
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

import httpx

from prizm_ai.agents.base import BaseAgent
from prizm_ai.graph.state import GraphState, Sujet, Source, Extrait, slugify
from prizm_ai.config import settings
from prizm_ai.utils.parser_perplexity import ParserPerplexity


class VeilleAgent(BaseAgent):
    """
    Agent de veille IA avec scoring sources.
    
    FUSION V4 :
    - Parser multi-stratégie (7 stratégies pour robustesse)
    - Mode AUTO et DIRIGE
    - Anti-répétition via historique
    """
    
    name = "VeilleAgent"
    
    # Score minimum pour garder une source
    FIABILITE_MIN = 6
    
    # Sources institutionnelles à prioriser
    SOURCES_PRIORITAIRES = [
        "bpifrance", "france-num", "francenum", "insee", "gouvernement",
        "legifrance", "cnil", "anssi", "dgccrf", "dge.gouv", "economie.gouv",
        "les-echos", "lefigaro", "lemonde", "bfm", "reuters", "afp"
    ]
    
    # -----------------
    # Prompts (FUSION V4)
    # -----------------
    
    PROMPT_AUTO = """Tu es un expert en veille IA pour les PME françaises.

## MISSION

Identifie 3-4 sujets d'actualité IA des dernières 48h pertinents pour les PME françaises.
Pour chaque sujet, fournis une analyse APPROFONDIE avec 4-5 sources BIEN DÉVELOPPÉES.

## CRITÈRES DE SÉLECTION

1. **Récent** : Actualité < 48h
2. **Concret** : Impact mesurable pour entreprises
3. **Actionnable** : Les PME peuvent agir
4. **Sourcé** : 4-5 sources FIABLES et DÉTAILLÉES par sujet

## SOURCES À PRIVILÉGIER (fiabilité 8-10/10)

- **Études primaires** : Bpifrance Le Lab, France Num, INSEE, OCDE
- **Rapports officiels** : Gouvernement, CNIL, ANSSI, Commission européenne
- **Presse économique** : Les Échos, Le Figaro Économie, BFM Business
- **Agences** : AFP, Reuters

## FORMAT DE RÉPONSE

### Sujet 1 : [Titre accrocheur]

**Résumé** : [2-3 phrases]

**Source 1** : [Nom] — [Type: étude/rapport/article]
- URL : [URL complète]
- Date : [JJ/MM/AAAA]
- Fiabilité : [X/10] ([justification])
- Extraits clés :
  * "[Citation exacte 1]"
  * "[Citation exacte 2]"
- Données factuelles :
  - [Stat 1 avec contexte]
  - [Stat 2 avec contexte]

[Répéter pour 3-5 sources]

### Synthèse et angles
- **Convergences** : [Points communs]
- **Angle Prizm** : [Approche recommandée pour PME]

[Répéter pour 3-4 sujets]"""

    PROMPT_DIRIGE = """Tu es un expert en veille IA pour les PME françaises.

## MISSION

Réalise une veille approfondie sur le sujet suivant :
"{sujet}"

## OBJECTIFS

1. Collecter 4-5 sources vérifiables et récentes sur CE sujet précis
2. Extraire les informations les plus pertinentes pour les PME/ETI
3. Identifier les angles business et applications pratiques
4. Fournir des données chiffrées et exemples concrets

## ANGLE ÉDITORIAL

{angle}

## MOTS-CLÉS POUR LA RECHERCHE

{keywords}

## FORMAT DE RÉPONSE

**Source 1** : [Nom] — [Type: étude/rapport/article]
- URL : [URL complète]
- Date : [JJ/MM/AAAA]
- Fiabilité : [X/10] ([justification])
- Extraits clés :
  * "[Citation exacte 1]"
  * "[Citation exacte 2]"
- Données factuelles :
  - [Stat 1 avec contexte]
  - [Stat 2 avec contexte]

[Répéter pour 4-5 sources]

### Synthèse
- **Convergences** : [Points communs entre sources]
- **Angle Prizm** : [Approche recommandée pour article]"""

    def __init__(self):
        super().__init__()
        self.api_key = settings.perplexity_api_key
        self.api_url = "https://api.perplexity.ai/chat/completions"
        self.parser = ParserPerplexity()  # FUSION V4
        self.mode = "AUTO"
        self.sujet_impose = None
    
    async def run(self, state: GraphState) -> GraphState:
        """Exécute la veille IA avec scoring sources."""
        
        # FUSION V4 : Récupérer mode et sujet imposé
        self.mode = state.get("mode_veille", "AUTO")
        self.sujet_impose = state.get("sujet_impose")
        
        state = self.log(state, f"Démarrage veille IA (V3 - mode {self.mode})...")
        
        if self.mode == "DIRIGE" and self.sujet_impose:
            state = self.log(state, f"🎯 Sujet imposé : {self.sujet_impose.get('titre', '')[:50]}...")
        
        try:
            # 1. Construire le prompt
            prompt = self._build_prompt()
            
            # 2. Appel API Perplexity
            response_raw = await self._call_perplexity(prompt)
            state = self.log(state, f"Réponse Perplexity : {len(response_raw)} caractères")
            
            # 3. FUSION V4 : Parser avec multi-stratégie
            sujets_parses = self.parser.parse(
                response_raw,
                options={
                    "mode": self.mode,
                    "titre_impose": self.sujet_impose.get("titre") if self.sujet_impose else None
                }
            )
            
            state = self.log(state, f"Parser utilisé : {self.parser.strategie_utilisee}")
            state = self.log(state, f"Sujets parsés : {len(sujets_parses)}")
            
            if not sujets_parses:
                state = self.error(state, "Aucun sujet parsé depuis Perplexity")
                return state
            
            # 4. Convertir en format GraphState
            sujets = self._convertir_sujets(sujets_parses)
            
            # 5. FUSION V4 : Filtrer les sujets déjà traités
            historique = state.get("historique_sujets", [])
            sujets_nouveaux = self._filtrer_sujets_historique(sujets, historique, state)
            
            if not sujets_nouveaux:
                state = self.log(state, "⚠️ Tous les sujets ont déjà été traités")
                # En mode dirigé, on garde quand même le sujet
                if self.mode == "DIRIGE":
                    sujets_nouveaux = sujets
                    state = self.log(state, "Mode DIRIGÉ : sujet conservé malgré historique")
            
            # 6. Filtrer et enrichir les sources
            sujets_filtres = []
            total_sources_avant = 0
            total_sources_apres = 0
            
            for sujet in sujets_nouveaux:
                total_sources_avant += len(sujet.get("sources", []))
                sujet_filtre = self._filtrer_sources(sujet)
                
                if sujet_filtre["sources"] or self.mode == "DIRIGE":
                    total_sources_apres += len(sujet_filtre.get("sources", []))
                    sujets_filtres.append(sujet_filtre)
            
            state = self.log(
                state, 
                f"Filtrage : {total_sources_apres}/{total_sources_avant} sources (fiabilité >= {self.FIABILITE_MIN})"
            )
            
            if not sujets_filtres:
                state = self.error(state, "Aucun sujet avec sources fiables après filtrage")
                return state
            
            # 7. Extraire toutes les sources
            all_sources_urls = []
            for sujet in sujets_filtres:
                for source in sujet.get("sources", []):
                    if source.get("url"):
                        all_sources_urls.append(source["url"])
            
            # 8. Mettre à jour l'état
            state["sujets"] = sujets_filtres
            state["sources_brutes"] = list(set(all_sources_urls))
            
            # FUSION V4 : Ajouter les nouveaux sujets à l'historique
            for sujet in sujets_filtres:
                slug = slugify(sujet.get("titre", ""))
                if slug and slug not in state["historique_sujets"]:
                    state["historique_sujets"].append(slug)
            
            state = self.log(
                state, 
                f"✓ {len(sujets_filtres)} sujets, {len(state['sources_brutes'])} sources fiables"
            )
            
            # Détail par sujet
            for i, sujet in enumerate(sujets_filtres, 1):
                nb_sources = len(sujet.get("sources", []))
                nb_extraits = len(sujet.get("extraits", []))
                score_src = sujet.get("score_sources", 0)
                state = self.log(
                    state,
                    f"  {i}. {sujet['titre'][:50]}... ({nb_sources} src, {nb_extraits} extraits, fiab={score_src:.1f})"
                )
            
        except Exception as e:
            state = self.error(state, f"Erreur veille: {str(e)}")
        
        return state
    
    def _build_prompt(self) -> str:
        """Construit le prompt selon le mode (FUSION V4)."""
        if self.mode == "DIRIGE" and self.sujet_impose:
            return self.PROMPT_DIRIGE.format(
                sujet=self.sujet_impose.get("titre", ""),
                angle=self.sujet_impose.get("angle", "Approche pratique pour PME"),
                keywords=self.sujet_impose.get("keywords", "PME, IA, France, 2025")
            )
        return self.PROMPT_AUTO
    
    async def _call_perplexity(self, prompt: str) -> str:
        """Appelle l'API Perplexity."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # System message adapté au format markdown attendu
        system_content = "Expert veille IA pour PME/ETI françaises. Réponds avec des sources détaillées et structurées en markdown."
        
        payload = {
            "model": "sonar",
            "messages": [
                {
                    "role": "system",
                    "content": system_content
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.2,
            "max_tokens": 10000
        }
        
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                self.api_url,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    def _convertir_sujets(self, sujets_parses) -> List[Dict]:
        """Convertit les SujetParse en format GraphState."""
        sujets = []
        
        for sp in sujets_parses:
            sources_converted = []
            
            for src in sp.sources:
                source = Source(
                    nom=src.nom,
                    url=src.url,
                    type=src.type,
                    date=src.date,
                    fiabilite=src.fiabilite,
                    fiabilite_raison=src.fiabilite_raison,
                    extraits=src.extraits,
                    donnees=src.donnees
                )
                sources_converted.append(source)
            
            sujet = {
                "titre": sp.titre,
                "resume": "",
                "sources": sources_converted,
                "sources_urls": [s.url for s in sp.sources if s.url],
                "sources_noms": [s.nom for s in sp.sources if s.nom],
                "extraits": [],
                "angle_prizm": "",
                "score_pertinence": 5.0,
                "score_sources": 0.0,
                "date_detection": datetime.now().isoformat(),
                "mode_generation": sp.mode_generation
            }
            sujets.append(sujet)
        
        return sujets
    
    def _filtrer_sujets_historique(
        self, 
        sujets: List[Dict], 
        historique: List[str],
        state: GraphState
    ) -> List[Dict]:
        """Filtre les sujets déjà traités (FUSION V4)."""
        if not historique:
            return sujets
        
        sujets_nouveaux = []
        
        for sujet in sujets:
            slug = slugify(sujet.get("titre", ""))
            
            # Vérifier si un slug similaire existe (premiers 30 caractères)
            deja_traite = any(
                slug[:30] in h or h[:30] in slug
                for h in historique
            )
            
            if deja_traite:
                state = self.log(state, f"  ⏭️ Déjà traité : {sujet['titre'][:40]}...")
            else:
                sujets_nouveaux.append(sujet)
        
        return sujets_nouveaux
    
    def _filtrer_sources(self, sujet: Dict) -> Dict:
        """Filtre les sources par fiabilité et agrège les extraits."""
        sources_filtrees = []
        extraits_agreges = []
        
        for source in sujet.get("sources", []):
            fiabilite = source.get("fiabilite", 0)
            
            # Bonus pour sources institutionnelles
            nom_lower = source.get("nom", "").lower()
            url_lower = source.get("url", "").lower()
            
            is_prioritaire = any(
                prio in nom_lower or prio in url_lower 
                for prio in self.SOURCES_PRIORITAIRES
            )
            
            if is_prioritaire and fiabilite >= 5:
                fiabilite = min(fiabilite + 1, 10)
                source["fiabilite"] = fiabilite
                raison = source.get("fiabilite_raison", "")
                source["fiabilite_raison"] = f"{raison} [Source prioritaire]"
            
            # Filtrer par seuil
            if fiabilite >= self.FIABILITE_MIN:
                sources_filtrees.append(source)
                
                # Agréger extraits avec traçabilité
                for extrait in source.get("extraits", []):
                    extraits_agreges.append(Extrait(
                        type="citation",
                        contenu=extrait,
                        source_nom=source.get("nom", ""),
                        source_url=source.get("url", "")
                    ))
                
                for donnee in source.get("donnees", []):
                    extraits_agreges.append(Extrait(
                        type="donnee",
                        contenu=donnee,
                        source_nom=source.get("nom", ""),
                        source_url=source.get("url", "")
                    ))
        
        # Calculer score moyen sources
        if sources_filtrees:
            score_sources = sum(s.get("fiabilite", 0) for s in sources_filtrees) / len(sources_filtrees)
        else:
            score_sources = 0.0
        
        return {
            **sujet,
            "sources": sources_filtrees,
            "sources_urls": [s["url"] for s in sources_filtrees if s.get("url")],
            "sources_noms": [s["nom"] for s in sources_filtrees if s.get("nom")],
            "extraits": extraits_agreges,
            "score_sources": score_sources
        }


# -----------------
# Fonctions utilitaires pour l'historique (FUSION V4)
# -----------------

def charger_historique() -> List[str]:
    """Charge l'historique des sujets traités depuis le fichier JSON."""
    try:
        historique_path = settings.historique_path
        if historique_path.exists():
            with open(historique_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get("sujets", [])
    except Exception as e:
        print(f"⚠️ Erreur chargement historique : {e}")
    return []


def sauvegarder_historique(sujets: List[str]) -> None:
    """Sauvegarde l'historique des sujets traités."""
    try:
        historique_path = settings.historique_path
        historique_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(historique_path, 'w', encoding='utf-8') as f:
            json.dump({
                "sujets": sujets,
                "updated_at": datetime.now().isoformat()
            }, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ Erreur sauvegarde historique : {e}")
