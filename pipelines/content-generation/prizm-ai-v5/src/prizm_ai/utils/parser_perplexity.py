"""
Parser Multi-Stratégie pour réponses Perplexity (FUSION V4).

Porte le parser robuste de V4 (JavaScript) vers Python.
7 stratégies de parsing testées dans l'ordre de priorité.

Stratégies :
0. Mode Dirigé : Utilise directement le titre imposé
1. JSON : Parse la réponse comme JSON structuré
2. Novembre 2025 : ### Sujet X : Titre
3. Octobre 2025 : ## Sujet X : Titre  
4. Septembre 2025 : ## **Sujet X : Titre**
5. Été 2025 : ## X. Titre
6. Fallback Lignes : Parse ligne par ligne
7. Mode Brut : Dernier recours, agrège tout

Date : 12 janvier 2026
Version : 1.1 (Correction regex tirets)
"""

import re
import json
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field


@dataclass
class SourceParsee:
    """Structure d'une source parsée."""
    numero: int
    nom: str
    type: str
    url: str
    date: str
    fiabilite: int
    fiabilite_raison: str
    extraits: List[str] = field(default_factory=list)
    donnees: List[str] = field(default_factory=list)


@dataclass
class SujetParse:
    """Structure d'un sujet parsé."""
    numero: str
    titre: str
    sources: List[SourceParsee] = field(default_factory=list)
    extraits: List[str] = field(default_factory=list)
    donnees: List[str] = field(default_factory=list)
    contenu_brut: str = ""
    mode_generation: str = "AUTO"
    parse_echoue: bool = False


class ParserPerplexity:
    """
    Parser multi-stratégie pour réponses Perplexity.
    
    Teste 7 stratégies de parsing dans l'ordre jusqu'à trouver
    celle qui fonctionne. Garantit la robustesse face aux changements
    de format de Perplexity.
    """
    
    def __init__(self):
        self.strategie_utilisee: str = ""
    
    def parse(
        self, 
        contenu: str, 
        options: Optional[Dict[str, Any]] = None
    ) -> List[SujetParse]:
        """
        Point d'entrée : teste toutes les stratégies dans l'ordre.
        
        Args:
            contenu: Réponse brute de Perplexity
            options: Options de parsing (mode, titre_impose, etc.)
            
        Returns:
            Liste de sujets parsés
        """
        options = options or {}
        mode = options.get("mode", "AUTO")
        titre_impose = options.get("titre_impose")
        
        print("🔍 Parser multi-stratégie (7 stratégies)...\n")
        
        # Stratégie 0 : MODE DIRIGÉ (prioritaire)
        if mode == "DIRIGE" and titre_impose:
            print("🎯 Mode DIRIGÉ détecté → Parsing direct avec titre imposé\n")
            sujets = self._parse_mode_dirige(contenu, titre_impose)
            if sujets:
                self.strategie_utilisee = "mode_dirige"
                print(f"✅ Mode DIRIGÉ : {len(sujets[0].sources)} source(s) extraite(s)\n")
                return sujets
            print("⚠️ Mode DIRIGÉ mais aucune source trouvée → Fallback\n")
        
        # Stratégie 1 : JSON
        sujets = self._parse_json(contenu)
        if sujets:
            self.strategie_utilisee = "json"
            print(f"✅ Format JSON détecté : {len(sujets)} sujet(s)\n")
            return sujets
        
        # Stratégie 2 : Format NOVEMBRE 2025 (### Sujet X :)
        sujets = self._parse_novembre_2025(contenu)
        if sujets:
            self.strategie_utilisee = "novembre_2025"
            print(f"✅ Format novembre 2025 détecté : {len(sujets)} sujet(s)\n")
            return sujets
        
        # Stratégie 3 : Format OCTOBRE 2025 (## Sujet X :)
        sujets = self._parse_octobre_2025(contenu)
        if sujets:
            self.strategie_utilisee = "octobre_2025"
            print(f"✅ Format octobre 2025 détecté : {len(sujets)} sujet(s)\n")
            return sujets
        
        # Stratégie 4 : Format SEPTEMBRE 2025 (## **Sujet X :**)
        sujets = self._parse_septembre_2025(contenu)
        if sujets:
            self.strategie_utilisee = "septembre_2025"
            print(f"✅ Format septembre 2025 détecté : {len(sujets)} sujet(s)\n")
            return sujets
        
        # Stratégie 5 : Format ÉTÉ 2025 (## X. Titre)
        sujets = self._parse_ete_2025(contenu)
        if sujets:
            self.strategie_utilisee = "ete_2025"
            print(f"✅ Format été 2025 détecté : {len(sujets)} sujet(s)\n")
            return sujets
        
        # Stratégie 6 : Fallback ligne par ligne
        sujets = self._parse_fallback_lignes(contenu)
        if sujets:
            self.strategie_utilisee = "fallback_lignes"
            print(f"✅ Parsing ligne par ligne réussi : {len(sujets)} sujet(s)\n")
            return sujets
        
        # Stratégie 7 : Mode brut (dernier recours)
        self.strategie_utilisee = "brut"
        print("⚠️ Aucun format reconnu → Mode brut\n")
        return self._parse_brut(contenu)
    
    # -----------------
    # Stratégie 0 : Mode Dirigé
    # -----------------
    
    def _parse_mode_dirige(self, contenu: str, titre_impose: str) -> List[SujetParse]:
        """
        En mode dirigé, on ne cherche PAS de numéro de sujet.
        On utilise directement le titre imposé et on extrait les sources.
        """
        sources = self._extraire_sources(contenu)
        
        if not sources:
            return []
        
        tous_extraits = []
        toutes_donnees = []
        
        for source in sources:
            tous_extraits.extend(source.extraits)
            toutes_donnees.extend(source.donnees)
        
        sujet = SujetParse(
            numero="1",
            titre=titre_impose,
            sources=sources,
            extraits=tous_extraits,
            donnees=toutes_donnees,
            contenu_brut=contenu,
            mode_generation="DIRIGE"
        )
        
        return [sujet]
    
    # -----------------
    # Stratégie 1 : JSON
    # -----------------
    
    def _parse_json(self, contenu: str) -> List[SujetParse]:
        """Parse la réponse comme JSON structuré."""
        sujets = []
        cleaned = contenu.strip()
        
        if "```json" in cleaned:
            match = re.search(r'```json\s*([\s\S]*?)\s*```', cleaned)
            if match:
                cleaned = match.group(1)
        elif "```" in cleaned:
            match = re.search(r'```\s*([\s\S]*?)\s*```', cleaned)
            if match:
                cleaned = match.group(1)
        
        cleaned = cleaned.strip()
        
        try:
            data = json.loads(cleaned)
            
            if "sujets" in data:
                for i, s in enumerate(data["sujets"], 1):
                    sources = self._parse_sources_json(s.get("sources", []))
                    
                    tous_extraits = []
                    toutes_donnees = []
                    for src in sources:
                        tous_extraits.extend(src.extraits)
                        toutes_donnees.extend(src.donnees)
                    
                    sujet = SujetParse(
                        numero=str(i),
                        titre=s.get("titre", ""),
                        sources=sources,
                        extraits=tous_extraits,
                        donnees=toutes_donnees,
                        contenu_brut=json.dumps(s, ensure_ascii=False),
                        mode_generation="AUTO"
                    )
                    sujets.append(sujet)
                    
        except json.JSONDecodeError:
            return []
        
        return sujets
    
    def _parse_sources_json(self, sources_data: List[dict]) -> List[SourceParsee]:
        """Parse les sources depuis JSON."""
        sources = []
        
        for i, src in enumerate(sources_data, 1):
            extraits = src.get("citations_cles", src.get("extraits", []))
            donnees = src.get("donnees_chiffrees", src.get("donnees", []))
            analyse = src.get("analyse_detaillee", "")
            implications = src.get("implications_pme", "")
            
            if analyse:
                extraits.append(f"[ANALYSE] {analyse}")
            if implications:
                extraits.append(f"[IMPLICATIONS PME] {implications}")
            
            # Extraire fiabilité (peut être int ou string "7/10 (raison)")
            fiabilite, fiabilite_raison = self._parse_fiabilite(
                src.get("fiabilite", 5),
                src.get("fiabilite_raison", "")
            )
            
            source = SourceParsee(
                numero=i,
                nom=src.get("nom", ""),
                url=src.get("url", ""),
                type=src.get("type", "blog"),
                date=src.get("date", ""),
                fiabilite=fiabilite,
                fiabilite_raison=fiabilite_raison,
                extraits=extraits,
                donnees=donnees
            )
            sources.append(source)
        
        return sources
    
    def _parse_fiabilite(self, value, raison_existante: str = "") -> tuple:
        """
        Parse la fiabilité qui peut être:
        - Un int: 7
        - Une string: "7/10"
        - Une string avec raison: "7/10 (Blog spécialisé)"
        
        Returns:
            (fiabilite: int, raison: str)
        """
        if isinstance(value, int):
            return value, raison_existante
        
        if isinstance(value, (float, int)):
            return int(value), raison_existante
        
        # C'est une string
        value_str = str(value)
        
        # Extraire le nombre
        match = re.search(r'(\d+)', value_str)
        fiabilite = int(match.group(1)) if match else 5
        
        # Extraire la raison entre parenthèses si présente
        raison_match = re.search(r'\(([^)]+)\)', value_str)
        raison = raison_match.group(1) if raison_match else raison_existante
        
        return fiabilite, raison
    
    # -----------------
    # Stratégie 2 : Format Novembre 2025
    # -----------------
    
    def _parse_novembre_2025(self, contenu: str) -> List[SujetParse]:
        """Format: ### Sujet 1 : Titre"""
        sujets = []
        regex = re.compile(r'###\s+Sujet\s+(\d+)\s*:\s*(.+?)$', re.MULTILINE | re.IGNORECASE)
        
        matches = list(regex.finditer(contenu))
        
        for i, match in enumerate(matches):
            numero = match.group(1)
            titre = match.group(2).strip()
            debut = match.start()
            
            if i + 1 < len(matches):
                fin = matches[i + 1].start()
            else:
                fin = len(contenu)
            
            contenu_sujet = contenu[debut:fin]
            sources = self._extraire_sources(contenu_sujet)
            
            if sources:
                tous_extraits = []
                toutes_donnees = []
                for src in sources:
                    tous_extraits.extend(src.extraits)
                    toutes_donnees.extend(src.donnees)
                
                sujet = SujetParse(
                    numero=numero,
                    titre=titre,
                    sources=sources,
                    extraits=tous_extraits,
                    donnees=toutes_donnees,
                    contenu_brut=contenu_sujet
                )
                sujets.append(sujet)
        
        return sujets
    
    # -----------------
    # Stratégie 3 : Format Octobre 2025
    # -----------------
    
    def _parse_octobre_2025(self, contenu: str) -> List[SujetParse]:
        """Format: ## Sujet 1 : Titre"""
        sujets = []
        regex = re.compile(r'##\s+Sujet\s+(\d+)\s*:\s*(.+?)$', re.MULTILINE | re.IGNORECASE)
        
        matches = list(regex.finditer(contenu))
        
        for i, match in enumerate(matches):
            numero = match.group(1)
            titre = match.group(2).strip()
            debut = match.start()
            
            if i + 1 < len(matches):
                fin = matches[i + 1].start()
            else:
                fin = len(contenu)
            
            contenu_sujet = contenu[debut:fin]
            sources = self._extraire_sources(contenu_sujet)
            
            if sources:
                tous_extraits = []
                toutes_donnees = []
                for src in sources:
                    tous_extraits.extend(src.extraits)
                    toutes_donnees.extend(src.donnees)
                
                sujet = SujetParse(
                    numero=numero,
                    titre=titre,
                    sources=sources,
                    extraits=tous_extraits,
                    donnees=toutes_donnees,
                    contenu_brut=contenu_sujet
                )
                sujets.append(sujet)
        
        return sujets
    
    # -----------------
    # Stratégie 4 : Format Septembre 2025
    # -----------------
    
    def _parse_septembre_2025(self, contenu: str) -> List[SujetParse]:
        """Format: ## **Sujet 1 : Titre**"""
        sujets = []
        regex = re.compile(r'##\s+\*\*Sujet\s+(\d+)\s*:\s*([^*]+)\*\*', re.IGNORECASE)
        
        matches = list(regex.finditer(contenu))
        
        for i, match in enumerate(matches):
            numero = match.group(1)
            titre = match.group(2).strip()
            debut = match.start()
            
            if i + 1 < len(matches):
                fin = matches[i + 1].start()
            else:
                fin = len(contenu)
            
            contenu_sujet = contenu[debut:fin]
            sources = self._extraire_sources(contenu_sujet)
            
            if sources:
                tous_extraits = []
                toutes_donnees = []
                for src in sources:
                    tous_extraits.extend(src.extraits)
                    toutes_donnees.extend(src.donnees)
                
                sujet = SujetParse(
                    numero=numero,
                    titre=titre,
                    sources=sources,
                    extraits=tous_extraits,
                    donnees=toutes_donnees,
                    contenu_brut=contenu_sujet
                )
                sujets.append(sujet)
        
        return sujets
    
    # -----------------
    # Stratégie 5 : Format Été 2025
    # -----------------
    
    def _parse_ete_2025(self, contenu: str) -> List[SujetParse]:
        """Format: ## 1. Titre"""
        sujets = []
        regex = re.compile(r'##\s+(\d+)\.\s+(.+?)$', re.MULTILINE)
        
        matches = list(regex.finditer(contenu))
        
        for i, match in enumerate(matches):
            numero = match.group(1)
            titre = match.group(2).strip()
            debut = match.start()
            
            if i + 1 < len(matches):
                fin = matches[i + 1].start()
            else:
                fin = len(contenu)
            
            contenu_sujet = contenu[debut:fin]
            sources = self._extraire_sources(contenu_sujet)
            
            if sources:
                tous_extraits = []
                toutes_donnees = []
                for src in sources:
                    tous_extraits.extend(src.extraits)
                    toutes_donnees.extend(src.donnees)
                
                sujet = SujetParse(
                    numero=numero,
                    titre=titre,
                    sources=sources,
                    extraits=tous_extraits,
                    donnees=toutes_donnees,
                    contenu_brut=contenu_sujet
                )
                sujets.append(sujet)
        
        return sujets
    
    # -----------------
    # Stratégie 6 : Fallback Lignes
    # -----------------
    
    def _parse_fallback_lignes(self, contenu: str) -> List[SujetParse]:
        """Parse ligne par ligne (très permissif)."""
        lignes = contenu.split('\n')
        sujets = []
        sujet_actuel = None
        contenu_sujet = []
        
        for ligne in lignes:
            match = re.match(r'^#{1,3}\s+(?:sujet\s+)?(\d+)\D+(.+)', ligne, re.IGNORECASE)
            
            if match:
                if sujet_actuel and contenu_sujet:
                    contenu_str = '\n'.join(contenu_sujet)
                    sources = self._extraire_sources(contenu_str)
                    if sources:
                        sujet_actuel.sources = sources
                        sujet_actuel.contenu_brut = contenu_str
                        for src in sources:
                            sujet_actuel.extraits.extend(src.extraits)
                            sujet_actuel.donnees.extend(src.donnees)
                        sujets.append(sujet_actuel)
                
                sujet_actuel = SujetParse(
                    numero=match.group(1),
                    titre=match.group(2).strip()
                )
                contenu_sujet = [ligne]
            elif sujet_actuel:
                contenu_sujet.append(ligne)
        
        if sujet_actuel and contenu_sujet:
            contenu_str = '\n'.join(contenu_sujet)
            sources = self._extraire_sources(contenu_str)
            if sources:
                sujet_actuel.sources = sources
                sujet_actuel.contenu_brut = contenu_str
                for src in sources:
                    sujet_actuel.extraits.extend(src.extraits)
                    sujet_actuel.donnees.extend(src.donnees)
                sujets.append(sujet_actuel)
        
        return sujets
    
    # -----------------
    # Stratégie 7 : Mode Brut
    # -----------------
    
    def _parse_brut(self, contenu: str) -> List[SujetParse]:
        """Dernier recours : crée un sujet unique avec toutes les sources."""
        sources = self._extraire_sources(contenu)
        
        tous_extraits = []
        toutes_donnees = []
        
        for source in sources:
            tous_extraits.extend(source.extraits)
            toutes_donnees.extend(source.donnees)
        
        titre_detecte = "Veille complète (format non reconnu)"
        premieres_lignes = contenu[:500].split('\n')
        for ligne in premieres_lignes:
            ligne = ligne.strip()
            if ligne and 20 < len(ligne) < 150:
                titre_detecte = re.sub(r'^[#*\s]+', '', ligne).strip()
                break
        
        sujet = SujetParse(
            numero="1",
            titre=titre_detecte,
            sources=sources,
            extraits=tous_extraits,
            donnees=toutes_donnees,
            contenu_brut=contenu,
            parse_echoue=len(sources) == 0 or (len(tous_extraits) == 0 and len(toutes_donnees) == 0)
        )
        
        return [sujet]
    
    # -----------------
    # Extraction des sources (commun à toutes les stratégies)
    # -----------------
    
    def _extraire_sources(self, contenu: str) -> List[SourceParsee]:
        """
        Extrait les sources avec support des TROIS types de tirets.
        
        Format attendu :
        **Source 1** : [Nom] — [Type]  (ou - ou –)
        - URL : https://...
        - Fiabilité : X/10
        """
        sources = []
        
        # Regex avec support des trois types de tirets:
        # - tiret simple (U+002D)
        # – en-dash (U+2013)  
        # — em-dash (U+2014)
        regex = re.compile(
            r'\*\*Source\s+(\d+)\*\*\s*:\s*(.+?)\s*[-–—]\s*(.+?)$',
            re.MULTILINE | re.IGNORECASE
        )
        
        matches = list(regex.finditer(contenu))
        
        for i, match in enumerate(matches):
            numero = int(match.group(1))
            nom = match.group(2).strip()
            type_source = match.group(3).strip()
            debut = match.start()
            
            if i + 1 < len(matches):
                fin = matches[i + 1].start()
            else:
                fin_section = contenu[debut:].find('### Synthèse')
                if fin_section > 0:
                    fin = debut + fin_section
                else:
                    fin_section2 = contenu[debut:].find('### Sujet')
                    if fin_section2 > 0:
                        fin = debut + fin_section2
                    else:
                        fin = len(contenu)
            
            contenu_source = contenu[debut:fin]
            
            # Extraire URL
            url_match = re.search(r'[-–—]\s*URL\s*:\s*(.+?)$', contenu_source, re.MULTILINE | re.IGNORECASE)
            url = url_match.group(1).strip() if url_match else ""
            
            # Extraire date
            date_match = re.search(r'[-–—]\s*Date\s*:\s*(.+?)$', contenu_source, re.MULTILINE | re.IGNORECASE)
            date = date_match.group(1).strip() if date_match else ""
            
            # Extraire fiabilité
            fiab_match = re.search(r'[-–—]\s*Fiabilit[ée]\s*:\s*(\d+)/10', contenu_source, re.IGNORECASE)
            fiabilite = int(fiab_match.group(1)) if fiab_match else 5
            
            # Extraire raison fiabilité
            fiab_raison_match = re.search(r'Fiabilit[ée]\s*:\s*\d+/10\s*\(([^)]+)\)', contenu_source, re.IGNORECASE)
            fiabilite_raison = fiab_raison_match.group(1).strip() if fiab_raison_match else ""
            
            # Extraire extraits
            extraits = []
            extrait_regex = re.compile(r'^\s*[\*\-–—]\s*["""](.+?)["""]\s*$', re.MULTILINE)
            for extrait_match in extrait_regex.finditer(contenu_source):
                extraits.append(extrait_match.group(1).strip())
            
            # Extraire données
            donnees = []
            donnees_section = re.search(
                r'Donn[ée]es\s+factuelles\s*:(.+?)(?=\n\*\*|$)',
                contenu_source,
                re.IGNORECASE | re.DOTALL
            )
            if donnees_section:
                donnees_text = donnees_section.group(1)
                donnees_regex = re.compile(r'[-–—\*]\s*(.+?)$', re.MULTILINE)
                for donnee_match in donnees_regex.finditer(donnees_text):
                    donnee = donnee_match.group(1).strip()
                    if donnee and not donnee.startswith('"') and not donnee.startswith('*'):
                        donnees.append(donnee)
            
            source = SourceParsee(
                numero=numero,
                nom=nom,
                type=type_source,
                url=url,
                date=date,
                fiabilite=fiabilite,
                fiabilite_raison=fiabilite_raison,
                extraits=extraits,
                donnees=donnees
            )
            sources.append(source)
        
        return sources


# -----------------
# Test
# -----------------

if __name__ == "__main__":
    print("🔍 Test ParserPerplexity")
    print("=" * 40)
    
    parser = ParserPerplexity()
    
    # Test avec format réel Perplexity
    test_real = """### Sujet 1 : Test IA pour PME
**Source 1** : Bpifrance - Étude
- URL : https://bpifrance.fr/test
- Fiabilité : 9/10
**Source 2** : Les Echos - Article
- URL : https://lesechos.fr/test
- Fiabilité : 8/10
### Sujet 2 : Autre sujet
**Source 1** : INSEE - Rapport
- URL : https://insee.fr/test
- Fiabilité : 10/10
"""
    
    result = parser.parse(test_real)
    print(f"Stratégie utilisée: {parser.strategie_utilisee}")
    print(f"Sujets parsés: {len(result)}")
    for s in result:
        print(f"  - {s.titre} ({len(s.sources)} sources)")
    
    print("\n✅ Test terminé")
