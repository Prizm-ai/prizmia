"""
Agent Redaction V4 - Qualité éditoriale améliorée.

AMÉLIORATIONS V4 :
- Planification éditoriale AVANT rédaction (titres spécifiques, pas génériques)
- Contexte cumulé entre sections (anti-répétition)
- Prompts voix Prizm (coach/éducateur, pas académique)
- Actions concrètes avec timeline (cette semaine/ce mois/ce trimestre)
- Exemples concrets par section

Base : FUSION V4 (temperature 0.3, génération par sections, retry)
"""

import json
from datetime import datetime
from typing import List, Dict, Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage

from prizm_ai.agents.base import BaseAgent
from prizm_ai.graph.state import GraphState, est_contenu_utilise, marquer_contenu_utilise
from prizm_ai.config import settings, voix_prizm, get_template_prompt


class RedactionAgent(BaseAgent):
    """
    Agent de rédaction d'articles V4.
    
    Améliorations qualité éditoriale :
    - Plan éditorial généré par Claude avant rédaction
    - Contexte cumulé pour éviter répétitions
    - Prompts optimisés voix Prizm (coach, pas académique)
    - Actions concrètes avec timeline
    """
    
    name = "RedactionAgent"
    
    MOIS_FR = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ]
    
    def __init__(self):
        super().__init__()
        self.llm = ChatAnthropic(
            model=settings.default_model,
            api_key=settings.anthropic_api_key,
            temperature=settings.temperature_redaction,  # 0.3
            max_tokens=4000
        )
        # LLM plus créatif pour la planification
        self.llm_planning = ChatAnthropic(
            model=settings.default_model,
            api_key=settings.anthropic_api_key,
            temperature=0.5,  # Un peu plus créatif pour les titres
            max_tokens=2000
        )
    
    async def run(self, state: GraphState) -> GraphState:
        """Rédige l'article avec planification préalable."""
        state = self.log(state, f"Rédaction V4 (planification + anti-répétition)...")
        
        sujet = state.get("sujet_selectionne")
        type_article = state.get("type_article", "actualite")
        angle = state.get("angle", "")
        
        if not sujet:
            state = self.error(state, "Aucun sujet sélectionné")
            return state
        
        try:
            extraits = sujet.get("extraits", [])
            sources = sujet.get("sources", [])
            
            state = self.log(state, f"Extraits disponibles : {len(extraits)}")
            state = self.log(state, f"Sources fiables : {len(sources)}")
            
            # Filtrer les extraits non utilisés
            extraits_disponibles = self._filtrer_extraits_non_utilises(state, extraits)
            state = self.log(state, f"Extraits non utilisés : {len(extraits_disponibles)}/{len(extraits)}")
            
            # PHASE 1 : Générer le plan éditorial
            state = self.log(state, "  → Planification éditoriale...")
            plan = await self._generer_plan_editorial(
                sujet, extraits_disponibles, sources, type_article
            )
            state = self.log(state, f"    ✓ Plan : {plan['angle_principal'][:50]}...")
            
            # PHASE 2 : Générer l'article avec le plan
            article = await self._generer_article_structure(
                state, sujet, type_article, extraits_disponibles, sources, plan
            )
            
            state["article_brut"] = article
            state["article_revise"] = article
            state["revision_count"] = 0
            
            word_count = len(article.split())
            state = self.log(state, f"Article rédigé ({word_count} mots)")
            
        except Exception as e:
            state = self.error(state, f"Erreur rédaction: {str(e)}")
        
        return state
    
    # =========================================================================
    # PHASE 1 : PLANIFICATION ÉDITORIALE
    # =========================================================================
    
    async def _generer_plan_editorial(
        self,
        sujet: dict,
        extraits: list,
        sources: list,
        type_article: str
    ) -> Dict:
        """
        Génère un plan éditorial AVANT de rédiger.
        
        Returns:
            {
                "angle_principal": "...",
                "sections": [
                    {"titre": "...", "points_cles": [...], "extrait_ids": [...], "exemple_concret": "..."},
                    ...
                ],
                "conclusion_focus": "...",
                "action_semaine": "...",
                "action_mois": "...",
                "action_trimestre": "..."
            }
        """
        titre = sujet.get("titre", "")
        sources_noms = [s.get("nom", "") for s in sources if s.get("nom")]
        extraits_formatted = self._format_extraits_indexes(extraits)
        
        prompt = f"""Tu es le rédacteur en chef de Prizm AI, média expert IA pour dirigeants de PME/ETI.

SUJET : "{titre}"
TYPE : {type_article}

SOURCES DISPONIBLES :
{chr(10).join(f'- {s}' for s in sources_noms[:6])}

EXTRAITS DISPONIBLES (avec index) :
{extraits_formatted}

MISSION : Créer un plan éditorial en JSON pour un article de 2000 mots.

RÈGLES STRICTES :
1. Chaque extrait assigné à UNE SEULE section (pas de répétition)
2. Titres de sections = questions ou promesses (PAS "Impact et opportunités")
3. Un exemple concret PME par section
4. Structure narrative : problème → solution → action

RÉPONDS UNIQUEMENT EN JSON VALIDE :
{{
    "angle_principal": "[Angle différenciant en 1 phrase]",
    "sections": [
        {{
            "titre": "[Question ou promesse engageante]",
            "points_cles": ["[Point 1]", "[Point 2]"],
            "extrait_ids": [0, 1, 2],
            "exemple_concret": "[Situation PME concrète à développer]"
        }},
        {{
            "titre": "[Question ou promesse engageante]",
            "points_cles": ["[Point 1]", "[Point 2]"],
            "extrait_ids": [3, 4],
            "exemple_concret": "[Situation PME concrète à développer]"
        }},
        {{
            "titre": "[Question ou promesse engageante]",
            "points_cles": ["[Point 1]", "[Point 2]"],
            "extrait_ids": [5, 6],
            "exemple_concret": "[Situation PME concrète à développer]"
        }}
    ],
    "conclusion_focus": "[Message clé à retenir]",
    "action_semaine": "[Action faisable en <2h cette semaine]",
    "action_mois": "[Action faisable en <1 semaine ce mois]",
    "action_trimestre": "[Action structurante ce trimestre]"
}}

EXEMPLES DE BONS TITRES :
- "Pourquoi 73% des PME échouent à automatiser (et comment l'éviter)"
- "Le cas Durand Industrie : de 0 à 3 agents IA en 6 mois"
- "Ce que les ETI qui réussissent font différemment"

EXEMPLES DE MAUVAIS TITRES (à éviter) :
- "Impact et opportunités"
- "Leviers et solutions"
- "Perspectives et enjeux"
"""
        
        messages = [
            SystemMessage(content="Tu es un expert en stratégie éditoriale B2B. Réponds uniquement en JSON valide."),
            HumanMessage(content=prompt)
        ]
        
        response = await self.llm_planning.ainvoke(messages)
        
        # Parser le JSON
        try:
            # Nettoyer la réponse
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            plan = json.loads(content.strip())
            
            # Assigner les extraits réels aux sections
            for section in plan.get("sections", []):
                extrait_ids = section.get("extrait_ids", [])
                section["extraits"] = [
                    extraits[i] for i in extrait_ids 
                    if i < len(extraits)
                ]
            
            return plan
            
        except json.JSONDecodeError:
            # Fallback : plan par défaut amélioré
            return self._plan_fallback(extraits, sujet)
    
    def _plan_fallback(self, extraits: list, sujet: dict) -> Dict:
        """Plan de secours si le parsing JSON échoue."""
        titre = sujet.get("titre", "").lower()
        
        # Titres contextuels selon le sujet
        if "agent" in titre or "autonom" in titre:
            titres = [
                "Qu'est-ce qui change vraiment avec les agents autonomes ?",
                "Comment une PME peut démarrer concrètement",
                "Les erreurs à éviter (et ce que font les leaders)"
            ]
        elif "adoption" in titre or "pme" in titre:
            titres = [
                "Où en sont vraiment les PME françaises ?",
                "Ce qui freine (et comment débloquer)",
                "Le plan d'action des entreprises qui réussissent"
            ]
        else:
            titres = [
                "Pourquoi c'est un tournant pour les PME",
                "Comment en tirer parti concrètement",
                "Les prochaines étapes à planifier"
            ]
        
        n = len(extraits)
        tiers = max(1, n // 3)
        
        return {
            "angle_principal": f"Analyse pratique pour dirigeants de PME/ETI",
            "sections": [
                {
                    "titre": titres[0],
                    "points_cles": ["Contexte", "Données clés"],
                    "extraits": extraits[:tiers],
                    "exemple_concret": "PME industrielle de 50 salariés"
                },
                {
                    "titre": titres[1],
                    "points_cles": ["Méthode", "Outils"],
                    "extraits": extraits[tiers:tiers*2],
                    "exemple_concret": "Cabinet de conseil de 15 personnes"
                },
                {
                    "titre": titres[2],
                    "points_cles": ["Vision", "Actions"],
                    "extraits": extraits[tiers*2:],
                    "exemple_concret": "ETI en croissance"
                }
            ],
            "conclusion_focus": "Passer à l'action cette semaine",
            "action_semaine": "Identifier vos 3 tâches les plus répétitives",
            "action_mois": "Tester un outil sur un processus simple",
            "action_trimestre": "Déployer sur un processus critique"
        }
    
    def _format_extraits_indexes(self, extraits: list) -> str:
        """Formate les extraits avec leurs index pour le plan."""
        if not extraits:
            return "Aucun extrait disponible."
        
        output = []
        for i, e in enumerate(extraits):
            source = e.get("source_nom", "Source")
            contenu = e.get("contenu", "")[:100]
            type_e = e.get("type", "citation")
            output.append(f"[{i}] ({type_e}) {contenu}... ({source})")
        
        return "\n".join(output)
    
    # =========================================================================
    # PHASE 2 : GÉNÉRATION AVEC CONTEXTE CUMULÉ
    # =========================================================================
    
    async def _generer_article_structure(
        self,
        state: GraphState,
        sujet: dict,
        type_article: str,
        extraits: list,
        sources: list,
        plan: Dict
    ) -> str:
        """Génère l'article section par section avec contexte cumulé."""
        sections = []
        contexte_cumule = []  # Résumés des sections précédentes
        donnees_utilisees = []  # Données chiffrées déjà citées
        
        date_dynamique = self._get_date_dynamique()
        annee = datetime.now().year
        sources_noms = [s.get("nom", "") for s in sources if s.get("nom")]
        
        # 1. INTRODUCTION
        state = self.log(state, "  → Introduction...")
        intro = await self._generer_introduction(
            sujet=sujet,
            plan=plan,
            extraits=extraits[:4],
            sources_noms=sources_noms,
            date=date_dynamique,
            annee=annee
        )
        sections.append(intro)
        
        # Extraire les données utilisées dans l'intro
        donnees_intro = self._extraire_donnees_chiffrees(intro)
        donnees_utilisees.extend(donnees_intro)
        contexte_cumule.append(f"INTRO: {self._resumer_section(intro)}")
        state = self.log(state, f"    ✓ {len(intro.split())} mots")
        
        # 2. SECTIONS PRINCIPALES
        for i, section_plan in enumerate(plan.get("sections", [])):
            titre_section = section_plan.get("titre", f"Section {i+1}")
            state = self.log(state, f"  → {titre_section[:40]}...")
            
            section_content = await self._generer_section_v4(
                sujet=sujet,
                section_plan=section_plan,
                sources_noms=sources_noms,
                contexte_precedent=contexte_cumule,
                donnees_utilisees=donnees_utilisees,
                date=date_dynamique,
                annee=annee
            )
            sections.append(section_content)
            
            # Mettre à jour le contexte
            donnees_section = self._extraire_donnees_chiffrees(section_content)
            donnees_utilisees.extend(donnees_section)
            contexte_cumule.append(f"SECTION {i+1} ({titre_section}): {self._resumer_section(section_content)}")
            state = self.log(state, f"    ✓ {len(section_content.split())} mots")
        
        # 3. CONCLUSION
        state = self.log(state, "  → Conclusion...")
        conclusion = await self._generer_conclusion_v4(
            sujet=sujet,
            plan=plan,
            contexte_cumule=contexte_cumule,
            sources_noms=sources_noms
        )
        sections.append(conclusion)
        state = self.log(state, f"    ✓ {len(conclusion.split())} mots")
        
        # 4. SOURCES
        sources_section = self._generer_sources(sources)
        sections.append(sources_section)
        
        # 5. ASSEMBLER
        article = "\n\n".join(sections)
        article = self._generer_frontmatter(sujet) + article
        
        return article
    
    # =========================================================================
    # PROMPTS V4 - VOIX PRIZM (COACH/ÉDUCATEUR)
    # =========================================================================
    
    async def _generer_introduction(
        self,
        sujet: dict,
        plan: Dict,
        extraits: list,
        sources_noms: list,
        date: str,
        annee: int
    ) -> str:
        """Génère l'introduction avec prompt voix Prizm."""
        titre = sujet.get("titre", "")
        angle = plan.get("angle_principal", "")
        sections_titres = [s.get("titre", "") for s in plan.get("sections", [])]
        extraits_formatted = self._format_extraits_pour_section(extraits)
        
        prompt = f"""Tu es l'éducateur expert de Prizm AI. Rédige une introduction PERCUTANTE de 280 mots minimum.

SUJET : "{titre}"
ANGLE : {angle}

SOURCES ({annee}) : {', '.join(sources_noms[:4])}

EXTRAITS DISPONIBLES :
{extraits_formatted}

PLAN DE L'ARTICLE :
1. {sections_titres[0] if len(sections_titres) > 0 else 'Section 1'}
2. {sections_titres[1] if len(sections_titres) > 1 else 'Section 2'}
3. {sections_titres[2] if len(sections_titres) > 2 else 'Section 3'}

STRUCTURE OBLIGATOIRE :
1. **ACCROCHE** (1 phrase) : Donnée chiffrée surprenante OU question provocante
2. **CONTEXTE** (2-3 phrases) : Pourquoi c'est un tournant pour les PME françaises en {annee}
3. **PROMESSE** (2 phrases) : Ce que le lecteur va apprendre/pouvoir faire après lecture
4. **TRANSITION** : Question ou phrase qui ouvre vers la première section

STYLE PRIZM :
- Tutoyer le lecteur OU utiliser "vous" (PAS "on" ni "nous")
- Maximum UNE donnée chiffrée dans l'intro (garder les autres pour les sections)
- Ton direct et engageant, pas académique
- Format citation : (Nom source, 2026) - PAS de crochets [Source: X]

INTERDICTIONS :
- "Cet article explore..."
- "Nous allons voir..."
- "Dans un contexte de..."
- Listes à puces

Date de rédaction : {date}
"""
        
        messages = [
            SystemMessage(content=voix_prizm.system_prompt),
            HumanMessage(content=prompt)
        ]
        
        response = await self.llm.ainvoke(messages)
        return response.content
    
    async def _generer_section_v4(
        self,
        sujet: dict,
        section_plan: Dict,
        sources_noms: list,
        contexte_precedent: list,
        donnees_utilisees: list,
        date: str,
        annee: int
    ) -> str:
        """Génère une section avec contexte et anti-répétition."""
        titre = sujet.get("titre", "")
        titre_section = section_plan.get("titre", "Section")
        points_cles = section_plan.get("points_cles", [])
        exemple = section_plan.get("exemple_concret", "")
        extraits = section_plan.get("extraits", [])
        
        extraits_formatted = self._format_extraits_pour_section(extraits)
        contexte_str = "\n".join(contexte_precedent) if contexte_precedent else "Aucun"
        donnees_str = ", ".join(donnees_utilisees[:10]) if donnees_utilisees else "Aucune"
        
        prompt = f"""Tu es l'éducateur expert de Prizm AI. Rédige la section "{titre_section}" (550 mots minimum).

ARTICLE : "{titre}"

EXTRAITS À UTILISER (et SEULEMENT ceux-ci) :
{extraits_formatted}

POINTS CLÉS À COUVRIR :
{chr(10).join(f'- {p}' for p in points_cles)}

EXEMPLE CONCRET À DÉVELOPPER :
{exemple}

SOURCES AUTORISÉES : {', '.join(sources_noms[:5])}

---

⚠️ CONTEXTE DÉJÀ COUVERT (NE PAS RÉPÉTER) :
{contexte_str}

⚠️ DONNÉES DÉJÀ CITÉES (NE PAS RÉUTILISER) :
{donnees_str}

---

STRUCTURE OBLIGATOIRE :

## {titre_section}

[Paragraphe d'ouverture avec LA donnée clé de cette section - 3-4 phrases]

[Développement de l'exemple concret : situation → action → résultat - 1 paragraphe]

### [Sous-titre actionnable 1]
[2-3 phrases développées]

### [Sous-titre actionnable 2]
[2-3 phrases développées]

[Question engageante ou transition vers la suite]

STYLE PRIZM :
- Parler comme un consultant qui conseille un dirigeant
- Format citation : (Nom source, 2026) - PAS de crochets
- Exemple concret avec chiffres si possible
- Ton direct, pas de jargon inutile

INTERDICTIONS :
- Répéter les données listées ci-dessus
- Listes à puces de plus de 3 items
- "Voyons maintenant...", "Il est important de noter..."
- Paragraphes de plus de 5 phrases

Date : {date}
"""
        
        messages = [
            SystemMessage(content=voix_prizm.system_prompt),
            HumanMessage(content=prompt)
        ]
        
        # Retry si trop court
        for tentative in range(settings.max_retries_section):
            response = await self.llm.ainvoke(messages)
            contenu = response.content
            mots = len(contenu.split())
            
            if mots >= settings.longueur_section_min:
                return contenu
            
            # Ajouter instruction de développement
            messages.append(HumanMessage(
                content=f"La section fait {mots} mots, il en faut minimum {settings.longueur_section_min}. Développe davantage l'exemple concret et les sous-sections."
            ))
        
        return contenu
    
    async def _generer_conclusion_v4(
        self,
        sujet: dict,
        plan: Dict,
        contexte_cumule: list,
        sources_noms: list
    ) -> str:
        """Génère la conclusion avec actions concrètes timeline."""
        titre = sujet.get("titre", "")
        focus = plan.get("conclusion_focus", "")
        action_semaine = plan.get("action_semaine", "Identifier vos tâches répétitives")
        action_mois = plan.get("action_mois", "Tester un outil sur un processus")
        action_trimestre = plan.get("action_trimestre", "Déployer une solution")
        
        contexte_str = "\n".join(contexte_cumule)
        
        prompt = f"""Tu es l'éducateur expert de Prizm AI. Rédige une conclusion ACTIONNABLE de 320 mots minimum.

ARTICLE : "{titre}"

POINTS CLÉS COUVERTS :
{contexte_str}

MESSAGE CLÉ : {focus}

ACTIONS PRÉVUES :
- Cette semaine : {action_semaine}
- Ce mois-ci : {action_mois}
- Ce trimestre : {action_trimestre}

STRUCTURE OBLIGATOIRE :

## En résumé : [titre percutant - pas "Conclusion"]

[Synthèse en 3-4 phrases - PAS de répétition de données chiffrées, juste les insights clés]

### Cette semaine, vous pouvez...

• **{action_semaine}** : [Développer en 2 phrases - comment faire concrètement] → [Résultat attendu]

### Ce mois-ci, vous pouvez...

• **{action_mois}** : [Développer en 2 phrases - étapes concrètes] → [Résultat attendu]

### Ce trimestre, vous pouvez...

• **{action_trimestre}** : [Développer en 2 phrases - vision] → [Résultat attendu]

[Phrase de clôture motivante - 1-2 phrases, tourné vers l'action]

STYLE PRIZM :
- Ton coach/mentor, pas professoral
- Actions VRAIMENT faisables (pas "formez-vous à l'IA")
- Résultats concrets et mesurables

INTERDICTIONS :
- "N'hésitez pas à..."
- "Il est important de..."
- "En conclusion..."
- Répéter des données chiffrées de l'article
"""
        
        messages = [
            SystemMessage(content=voix_prizm.system_prompt),
            HumanMessage(content=prompt)
        ]
        
        response = await self.llm.ainvoke(messages)
        return response.content
    
    # =========================================================================
    # UTILITAIRES
    # =========================================================================
    
    def _resumer_section(self, contenu: str) -> str:
        """Résume une section en 2-3 phrases pour le contexte."""
        # Prendre les 2 premières phrases significatives
        phrases = contenu.replace('\n', ' ').split('.')
        phrases = [p.strip() for p in phrases if len(p.strip()) > 30]
        resume = '. '.join(phrases[:2]) + '.' if phrases else contenu[:200]
        return resume[:300]
    
    def _extraire_donnees_chiffrees(self, contenu: str) -> List[str]:
        """Extrait les données chiffrées d'un texte."""
        import re
        # Patterns : 73%, 2.5 milliards, 35% des PME, etc.
        patterns = [
            r'\d+%',
            r'\d+[\s,.]?\d*\s*(?:milliards?|millions?|milliers?)',
            r'\d+\s*(?:PME|ETI|entreprises|dirigeants)',
            r'\d+\s*(?:heures?|jours?|mois|ans?|semaines?)',
        ]
        
        donnees = []
        for pattern in patterns:
            matches = re.findall(pattern, contenu, re.IGNORECASE)
            donnees.extend(matches)
        
        return list(set(donnees))[:10]
    
    def _filtrer_extraits_non_utilises(self, state: GraphState, extraits: list) -> list:
        """Filtre les extraits déjà utilisés dans cette session."""
        return [
            e for e in extraits
            if not est_contenu_utilise(state, e.get("contenu", ""))
        ]
    
    def _get_date_dynamique(self) -> str:
        """Retourne la date formatée en français."""
        now = datetime.now()
        return f"{now.day} {self.MOIS_FR[now.month - 1]} {now.year}"
    
    def _format_extraits_pour_section(self, extraits: list) -> str:
        """Formate les extraits pour une section."""
        if not extraits:
            return "Aucun extrait disponible pour cette section."
        
        output = []
        for i, e in enumerate(extraits, 1):
            source = e.get("source_nom", "Source")
            contenu = e.get("contenu", "")
            type_e = e.get("type", "citation")
            
            # Format journalistique : (Source, 2026)
            if type_e == "citation":
                output.append(f'{i}. "{contenu}" (Source: {source})')
            else:
                output.append(f'{i}. {contenu} (Source: {source})')
        
        return "\n".join(output)
    
    def _generer_frontmatter(self, sujet: dict) -> str:
        """Génère le frontmatter YAML."""
        date = datetime.now().strftime("%Y-%m-%d")
        titre = sujet.get("titre", "Article")
        
        titre_lower = titre.lower()
        if "guide" in titre_lower or "méthode" in titre_lower or "comment" in titre_lower:
            category = "guides"
            emoji = "📚"
        elif "analyse" in titre_lower or "état" in titre_lower or "étude" in titre_lower:
            category = "analyses"
            emoji = "📊"
        else:
            category = "actualites"
            emoji = "🚀"
        
        return f"""---
title: "{titre}"
description: "Article Prizm AI : {titre}"
pubDate: {date}
author: "L'équipe Prizm AI"
emoji: "{emoji}"
category: "{category}"
featured: false
readingTime: "7 min"
---

"""

    def _generer_sources(self, sources: list) -> str:
        """Génère la section Sources."""
        if not sources:
            return ""
        
        output = ["## Sources", ""]
        
        for s in sources:
            nom = s.get("nom", "Source")
            url = s.get("url", "")
            if url:
                output.append(f"- [{nom}]({url})")
            else:
                output.append(f"- {nom}")
        
        output.append("")
        return "\n".join(output)
