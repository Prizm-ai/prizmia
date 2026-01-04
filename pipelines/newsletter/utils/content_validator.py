"""
Validateur de contenu pour la Newsletter AI PRIZM
Valide la qualitÃ©, l'authenticitÃ© et la conformitÃ© du contenu gÃ©nÃ©rÃ©
"""

import re
import json
from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass
from datetime import datetime
import logging
from urllib.parse import urlparse
import hashlib

logger = logging.getLogger(__name__)

@dataclass
class ValidationResult:
    """RÃ©sultat de validation d'un contenu"""
    is_valid: bool
    score: float  # Score de 0 Ã  100
    issues: List[str]
    warnings: List[str]
    suggestions: List[str]
    metadata: Dict[str, Any]

@dataclass
class ContentMetrics:
    """MÃ©triques de qualitÃ© du contenu"""
    readability_score: float
    uniqueness_score: float
    coherence_score: float
    factual_accuracy_score: float
    engagement_score: float
    overall_quality: float

class ContentValidator:
    """Validateur principal pour le contenu de newsletter"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # ParamÃ¨tres de validation
        self.min_word_count = self.config.get('min_word_count', 50)
        self.max_word_count = self.config.get('max_word_count', 2000)
        self.min_sentences = self.config.get('min_sentences', 3)
        self.max_sentences = self.config.get('max_sentences', 50)
        
        # Seuils de qualitÃ©
        self.min_quality_score = self.config.get('min_quality_score', 70.0)
        self.min_uniqueness_score = self.config.get('min_uniqueness_score', 80.0)
        
        # Mots interdits et expressions problÃ©matiques
        self.forbidden_words = set(self.config.get('forbidden_words', []))
        self.spam_patterns = self.config.get('spam_patterns', [])
        
        # Cache pour Ã©viter les doublons
        self.content_hashes = set()
        
        # Expressions communes Ã  Ã©viter (clichÃ©s)
        self.cliche_patterns = [
            r'(?i)rÃ©volution(?:naire)?',
            r'(?i)innovation(?:nt|ante)?',
            r'(?i)disrupt(?:if|ive|ion)',
            r'(?i)game[- ]?chang(?:er|ing)',
            r'(?i)sans prÃ©cÃ©dent',
            r'(?i)nouvelle Ã¨re',
            r'(?i)avenir radieux'
        ]
    
    def calculate_readability_score(self, text: str) -> float:
        """Calcule un score de lisibilitÃ© (inspirÃ© de Flesch-Kincaid)"""
        
        if not text.strip():
            return 0.0
            
        # Comptage des Ã©lÃ©ments
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        sentence_count = len(sentences)
        
        words = re.findall(r'\b\w+\b', text)
        word_count = len(words)
        
        if sentence_count == 0 or word_count == 0:
            return 0.0
        
        # Comptage des syllabes (approximation pour le franÃ§ais)
        syllable_count = 0
        for word in words:
            # Approximation simple pour le franÃ§ais
            vowels = 'aeiouyAEIOUY'
            syllables = 0
            prev_was_vowel = False
            
            for char in word:
                is_vowel = char in vowels
                if is_vowel and not prev_was_vowel:
                    syllables += 1
                prev_was_vowel = is_vowel
            
            # Au moins une syllabe par mot
            syllable_count += max(1, syllables)
        
        # Formule adaptÃ©e pour le franÃ§ais
        avg_sentence_length = word_count / sentence_count
        avg_syllables_per_word = syllable_count / word_count
        
        # Score sur 100 (plus c'est haut, plus c'est lisible)
        score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
        
        # Normalisation entre 0 et 100
        return max(0, min(100, score))
    
    def calculate_uniqueness_score(self, text: str) -> float:
        """Calcule un score d'unicitÃ© basÃ© sur le hash et les patterns"""
        
        if not text.strip():
            return 0.0
        
        # Hash du contenu pour dÃ©tecter les doublons exacts
        content_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
        
        if content_hash in self.content_hashes:
            return 0.0  # Contenu dupliquÃ©
        
        self.content_hashes.add(content_hash)
        
        # Analyse des clichÃ©s et expressions communes
        cliche_count = 0
        for pattern in self.cliche_patterns:
            matches = re.findall(pattern, text)
            cliche_count += len(matches)
        
        words = re.findall(r'\b\w+\b', text.lower())
        total_words = len(words)
        
        if total_words == 0:
            return 0.0
        
        # PÃ©nalitÃ© pour les clichÃ©s
        cliche_penalty = min(50, (cliche_count / total_words) * 100 * 10)
        
        # Score basÃ© sur la variÃ©tÃ© lexicale
        unique_words = len(set(words))
        lexical_diversity = (unique_words / total_words) * 100
        
        uniqueness_score = lexical_diversity - cliche_penalty
        return max(0, min(100, uniqueness_score))
    
    def calculate_coherence_score(self, text: str) -> float:
        """Calcule un score de cohÃ©rence textuelle"""
        
        if not text.strip():
            return 0.0
        
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if len(sentences) < 2:
            return 50.0  # Score neutre pour un texte trÃ¨s court
        
        # Analyse des connecteurs logiques
        connectors = [
            'mais', 'cependant', 'toutefois', 'nÃ©anmoins', 'pourtant',
            'donc', 'ainsi', 'par consÃ©quent', 'en effet', 'car',
            'de plus', 'Ã©galement', 'aussi', 'en outre', 'par ailleurs',
            'enfin', 'finalement', 'en conclusion', 'pour conclure'
        ]
        
        connector_count = 0
        for connector in connectors:
            connector_count += len(re.findall(rf'\b{re.escape(connector)}\b', text.lower()))
        
        # Score basÃ© sur la prÃ©sence de connecteurs
        connector_ratio = connector_count / len(sentences)
        connector_score = min(100, connector_ratio * 200)
        
        # Analyse de la longueur des phrases (cohÃ©rence structurelle)
        sentence_lengths = [len(s.split()) for s in sentences]
        avg_length = sum(sentence_lengths) / len(sentence_lengths)
        
        # Variance des longueurs (trop uniforme = moins naturel)
        variance = sum((length - avg_length) ** 2 for length in sentence_lengths) / len(sentence_lengths)
        variance_score = min(100, variance * 2)  # Favorise une certaine variÃ©tÃ©
        
        # Score final
        coherence = (connector_score * 0.6 + variance_score * 0.4)
        return max(0, min(100, coherence))
    
    def detect_potential_misinformation(self, text: str) -> List[str]:
        """DÃ©tecte les signes potentiels de dÃ©sinformation"""
        
        issues = []
        
        # Patterns suspects
        suspicious_patterns = [
            (r'(?i)\b(?:exclusif|rÃ©vÃ©lation|secret|cachÃ©)\b', 'Langage sensationnaliste dÃ©tectÃ©'),
            (r'(?i)\b(?:tous les|toutes les|jamais|toujours|impossible)\b', 'GÃ©nÃ©ralisation excessive'),
            (r'(?i)(?:selon des sources|on dit que|il paraÃ®t que)', 'Sources vagues ou non vÃ©rifiÃ©es'),
            (r'(?i)(?:\d+%|\d+\.\d+%)(?!\s*(?:de|du|des))', 'Statistiques sans contexte'),
            (r'(?i)(?:miracle|magique|incroyable|rÃ©volutionnaire)', 'Vocabulaire hyperbolique'),
        ]
        
        for pattern, message in suspicious_patterns:
            if re.search(pattern, text):
                issues.append(message)
        
        # VÃ©rification des majuscules excessives
        caps_ratio = sum(1 for c in text if c.isupper()) / len(text) if text else 0
        if caps_ratio > 0.1:
            issues.append('Usage excessif de majuscules dÃ©tectÃ©')
        
        return issues
    
    def check_spam_indicators(self, text: str) -> List[str]:
        """DÃ©tecte les indicateurs de spam"""
        
        spam_issues = []
        
        # Patterns de spam configurables
        for pattern in self.spam_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                spam_issues.append(f'Pattern de spam dÃ©tectÃ©: {pattern}')
        
        # RÃ©pÃ©titions excessives
        words = re.findall(r'\b\w+\b', text.lower())
        word_count = {}
        for word in words:
            if len(word) > 3:  # Ignore les mots courts
                word_count[word] = word_count.get(word, 0) + 1
        
        total_words = len(words)
        for word, count in word_count.items():
            if total_words > 0 and count / total_words > 0.05:  # Plus de 5% du texte
                spam_issues.append(f'RÃ©pÃ©tition excessive du mot: {word}')
        
        # Liens suspects (si prÃ©sents)
        links = re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', text)
        suspicious_domains = ['bit.ly', 'tinyurl.com', 't.co']
        
        for link in links:
            domain = urlparse(link).netloc
            if any(susp in domain for susp in suspicious_domains):
                spam_issues.append(f'Lien raccourci suspect: {domain}')
        
        return spam_issues
    
    def validate_structure(self, content: Dict[str, Any]) -> Tuple[List[str], List[str]]:
        """Valide la structure du contenu de newsletter"""
        
        issues = []
        warnings = []
        
        required_fields = ['title', 'content', 'summary']
        
        # VÃ©rification des champs obligatoires
        for field in required_fields:
            if not content.get(field):
                issues.append(f'Champ obligatoire manquant: {field}')
            elif not content[field].strip():
                issues.append(f'Champ vide: {field}')
        
        # Validation du titre
        title = content.get('title', '')
        if title:
            if len(title) < 10:
                warnings.append('Titre trop court (minimum recommandÃ©: 10 caractÃ¨res)')
            elif len(title) > 100:
                warnings.append('Titre trop long (maximum recommandÃ©: 100 caractÃ¨res)')
            
            if title.isupper():
                warnings.append('Titre entiÃ¨rement en majuscules')
        
        # Validation du contenu principal
        main_content = content.get('content', '')
        if main_content:
            word_count = len(re.findall(r'\b\w+\b', main_content))
            
            if word_count < self.min_word_count:
                issues.append(f'Contenu trop court: {word_count} mots (minimum: {self.min_word_count})')
            elif word_count > self.max_word_count:
                warnings.append(f'Contenu trÃ¨s long: {word_count} mots (maximum recommandÃ©: {self.max_word_count})')
        
        # Validation du rÃ©sumÃ©
        summary = content.get('summary', '')
        if summary and len(summary) > 300:
            warnings.append('RÃ©sumÃ© trop long (maximum recommandÃ©: 300 caractÃ¨res)')
        
        return issues, warnings
    
    def calculate_engagement_score(self, text: str) -> float:
        """Calcule un score d'engagement potentiel"""
        
        if not text.strip():
            return 0.0
        
        engagement_factors = 0
        
        # Questions (engagent le lecteur)
        question_count = len(re.findall(r'\?', text))
        engagement_factors += min(20, question_count * 5)
        
        # Mots d'action
        action_words = ['dÃ©couvrez', 'apprenez', 'explorez', 'comprenez', 'maÃ®trisez', 'rÃ©ussissez']
        for word in action_words:
            if word in text.lower():
                engagement_factors += 5
        
        # Personnalisation (vous, votre, etc.)
        personal_pronouns = len(re.findall(r'\b(?:vous|votre|vos)\b', text.lower()))
        engagement_factors += min(15, personal_pronouns * 2)
        
        # Ã‰motions positives
        positive_words = ['excellent', 'fantastique', 'remarquable', 'impressionnant', 'extraordinaire']
        for word in positive_words:
            if word in text.lower():
                engagement_factors += 3
        
        # Urgence/actualitÃ©
        urgency_words = ['maintenant', 'aujourd\'hui', 'rÃ©cemment', 'derniÃ¨rement', 'actuellement']
        for word in urgency_words:
            if word in text.lower():
                engagement_factors += 4
        
        return min(100, engagement_factors)
    
    def validate_content(self, content: Dict[str, Any]) -> ValidationResult:
        """Validation complÃ¨te d'un contenu"""
        
        issues = []
        warnings = []
        suggestions = []
        
        # Validation structurelle
        struct_issues, struct_warnings = self.validate_structure(content)
        issues.extend(struct_issues)
        warnings.extend(struct_warnings)
        
        # Si pas de contenu principal, arrÃªt de la validation
        main_text = content.get('content', '')
        if not main_text.strip():
            return ValidationResult(
                is_valid=False,
                score=0.0,
                issues=issues,
                warnings=warnings,
                suggestions=['Ajouter du contenu principal'],
                metadata={}
            )
        
        # Calcul des mÃ©triques de qualitÃ©
        readability = self.calculate_readability_score(main_text)
        uniqueness = self.calculate_uniqueness_score(main_text)
        coherence = self.calculate_coherence_score(main_text)
        engagement = self.calculate_engagement_score(main_text)
        
        # DÃ©tection de problÃ¨mes
        misinfo_issues = self.detect_potential_misinformation(main_text)
        spam_issues = self.check_spam_indicators(main_text)
        
        issues.extend(misinfo_issues)
        issues.extend(spam_issues)
        
        # VÃ©rification des mots interdits
        for word in self.forbidden_words:
            if re.search(rf'\b{re.escape(word)}\b', main_text, re.IGNORECASE):
                issues.append(f'Mot interdit dÃ©tectÃ©: {word}')
        
        # Score de prÃ©cision factuelle (basique)
        factual_accuracy = 85.0  # Score par dÃ©faut, peut Ãªtre amÃ©liorÃ© avec des vÃ©rifications externes
        if misinfo_issues:
            factual_accuracy -= len(misinfo_issues) * 10
        
        # Calcul du score global
        metrics = ContentMetrics(
            readability_score=readability,
            uniqueness_score=uniqueness,
            coherence_score=coherence,
            factual_accuracy_score=max(0, factual_accuracy),
            engagement_score=engagement,
            overall_quality=0  # Sera calculÃ© ci-dessous
        )
        
        # Score global pondÃ©rÃ©
        overall_score = (
            readability * 0.2 +
            uniqueness * 0.25 +
            coherence * 0.2 +
            metrics.factual_accuracy_score * 0.25 +
            engagement * 0.1
        )
        
        metrics.overall_quality = overall_score
        
        # GÃ©nÃ©ration de suggestions
        if readability < 60:
            suggestions.append('Simplifier les phrases pour amÃ©liorer la lisibilitÃ©')
        
        if uniqueness < 70:
            suggestions.append('Varier le vocabulaire et Ã©viter les clichÃ©s')
        
        if coherence < 60:
            suggestions.append('Ajouter des connecteurs logiques entre les idÃ©es')
        
        if engagement < 40:
            suggestions.append('Ajouter des questions ou des appels Ã  l\'action pour engager le lecteur')
        
        # DÃ©termination de la validitÃ©
        is_valid = (
            len(issues) == 0 and
            overall_score >= self.min_quality_score and
            uniqueness >= self.min_uniqueness_score
        )
        
        return ValidationResult(
            is_valid=is_valid,
            score=overall_score,
            issues=issues,
            warnings=warnings,
            suggestions=suggestions,
            metadata={
                'metrics': metrics,
                'word_count': len(re.findall(r'\b\w+\b', main_text)),
                'sentence_count': len(re.split(r'[.!?]+', main_text)),
                'validation_timestamp': datetime.now().isoformat()
            }
        )
    
    def validate_newsletter(self, newsletter_data: Dict[str, Any]) -> Dict[str, ValidationResult]:
        """Valide une newsletter complÃ¨te avec plusieurs sections"""
        
        results = {}
        
        # Validation de chaque section
        sections = ['header', 'main_articles', 'brief_news', 'footer']
        
        for section in sections:
            if section in newsletter_data:
                section_data = newsletter_data[section]
                
                if isinstance(section_data, list):
                    # Section avec plusieurs articles
                    for i, article in enumerate(section_data):
                        key = f"{section}_{i}"
                        results[key] = self.validate_content(article)
                else:
                    # Section unique
                    results[section] = self.validate_content(section_data)
        
        return results
    
    def generate_quality_report(self, validation_results: Dict[str, ValidationResult]) -> Dict[str, Any]:
        """GÃ©nÃ¨re un rapport de qualitÃ© global"""
        
        if not validation_results:
            return {'error': 'Aucun rÃ©sultat de validation fourni'}
        
        total_sections = len(validation_results)
        valid_sections = sum(1 for result in validation_results.values() if result.is_valid)
        
        avg_score = sum(result.score for result in validation_results.values()) / total_sections
        
        all_issues = []
        all_warnings = []
        all_suggestions = []
        
        for section, result in validation_results.items():
            all_issues.extend([f"[{section}] {issue}" for issue in result.issues])
            all_warnings.extend([f"[{section}] {warning}" for warning in result.warnings])
            all_suggestions.extend([f"[{section}] {suggestion}" for suggestion in result.suggestions])
        
        quality_level = 'Excellent' if avg_score >= 90 else \
                       'Bon' if avg_score >= 75 else \
                       'Moyen' if avg_score >= 60 else \
                       'Faible'
        
        return {
            'overall_quality': quality_level,
            'average_score': round(avg_score, 2),
            'sections_valid': f"{valid_sections}/{total_sections}",
            'validation_rate': round((valid_sections / total_sections) * 100, 1),
            'total_issues': len(all_issues),
            'total_warnings': len(all_warnings),
            'total_suggestions': len(all_suggestions),
            'issues': all_issues[:10],  # Top 10 des problÃ¨mes
            'warnings': all_warnings[:10],
            'suggestions': all_suggestions[:10],
            'timestamp': datetime.now().isoformat()
        }

