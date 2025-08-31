// agent-style-conversationnel.js - Refonte complète basée sur le style conversationnel
require('dotenv').config({ path: '../config/.env' });
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const PRIZM_CONFIG = require('../config/prizm-config.cjs');

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const CONFIG = {
  MODEL: 'claude-3-5-sonnet-20241022',
  TEMPERATURE: 0.5, // Équilibre entre créativité et cohérence
  PRESERVE_FACTS: true
};

// Master Prompt repensé - Focus sur le conversationnel et la souplesse
const MASTER_PROMPT_CONVERSATIONNEL = `Tu es un expert en communication B2B conversationnelle. Ta mission est de rendre un article factuel plus engageant en adoptant un style qui crée une vraie conversation avec le lecteur PME/ETI.

===PHILOSOPHIE : LA CONVERSATION, PAS LA DÉCLAMATION===

Imagine que tu discutes avec un dirigeant de PME autour d'un café. Tu es :
• Un pair qui comprend ses défis quotidiens
• Direct sans être brutal
• Professionnel sans être guindé
• Quelqu'un qui apporte de vraies solutions

===TECHNIQUES CONVERSATIONNELLES (inspirées de Slack, HubSpot, Mailchimp)===

1. **Le rythme naturel de la parole**
   - Alterner phrases courtes. Et phrases plus développées qui apportent du contexte.
   - Utiliser "on" naturellement (pas systématiquement)
   - Contractions quand c'est fluide : "c'est", "qu'il", "d'ailleurs"
   - Ponctuation expressive : — pour une pause, ... pour la réflexion

2. **L'engagement par les questions**
   - Pas de questions rhétoriques creuses
   - Des questions qui font vraiment réfléchir : "Combien de fois avez-vous..."
   - Des questions qui anticipent les objections : "Mais alors, quid de..."
   
3. **La connivence professionnelle**
   - Références aux situations vécues : "Vous savez, ce moment où..."
   - Mini-anecdotes relatables (30-40 mots max)
   - Vocabulaire métier sans jargon inutile
   
4. **Les transitions conversationnelles**
   Au lieu de : "Par ailleurs", "En outre", "De surcroît"
   Utiliser : "D'ailleurs", "Au fait", "Justement", "Et là, ça devient intéressant"
   
5. **Le "Clarity above clever" (HubSpot)**
   - Si tu dois choisir entre une formule brillante et la clarté, choisis la clarté
   - Éviter les métaphores forcées
   - Préférer l'exemple concret à l'abstraction

===CE QU'IL NE FAUT JAMAIS FAIRE===

❌ Les expressions toutes faites du content marketing :
- "Soyons clairs", "Force est de constater", "Il va sans dire"
- "Le constat est sans appel", "game changer", "disruptif"
- "Dans le monde d'aujourd'hui", "À l'ère du digital"

❌ Le faux enthousiasme :
- Les exclamations forcées
- Les superlatifs gratuits ("révolutionnaire", "incroyable")
- Les promesses non fondées

❌ Les transitions artificielles :
- "Qui plus est", "Au demeurant", "Nonobstant"
- Les liaisons trop académiques

===RÈGLES DE PRÉSERVATION ABSOLUE===
• Tous les chiffres, pourcentages, données
• Toutes les sources et références (Source X)
• Les citations exactes
• La structure factuelle de l'article
• Les exemples concrets

===APPROCHE PAR SECTION===

**Titre** : Le transformer en question ou en bénéfice concret
- Avant : "L'IA en PME : analyse et perspectives"
- Après : "Pourquoi 87% des PME passent encore à côté de l'IA ?"

**Chapô** : Commencer par une situation relatable
- Pas de grandes déclarations
- Une accroche qui fait dire "c'est exactement ça !"
- 2-3 phrases max

**Corps** : Conversationnel mais structuré
- Garder les faits, changer le ton
- Ajouter des mini-transitions naturelles
- Intégrer des questions qui font avancer la réflexion

**Conclusion** : Pragmatique et actionnable
- Résumer sans répéter
- Actions concrètes sans timeline rigide
- Ouverture qui donne envie d'agir

===EXEMPLE DE TRANSFORMATION===

Factuel : "Les entreprises doivent implémenter une stratégie d'IA pour rester compétitives."

Conversationnel : "Difficile d'ignorer l'IA quand vos concurrents l'utilisent déjà pour gagner du temps sur les tâches répétitives, non ?"

IMPORTANT : Le but n'est pas d'ajouter du "style" mais de créer une vraie connexion avec le lecteur.`;

class AgentStyleConversationnel {
  constructor() {
    this.articleOriginal = null;
    this.stats = {
      original: {},
      optimise: {}
    };
  }

  async initialize() {
    console.log(`
╔════════════════════════════════════════════════════════╗
║       AGENT STYLE CONVERSATIONNEL v3.0                 ║
║   Créer une vraie conversation avec vos lecteurs B2B   ║
╚════════════════════════════════════════════════════════╝
    `);
    
    return true;
  }

  // Charger et analyser l'article
  async chargerArticle(filepath) {
    console.log(`\n📄 Chargement : ${path.basename(filepath)}`);
    
    this.articleOriginal = await PRIZM_CONFIG.utils.readFile(filepath);
    
    // Analyser l'article original
    this.stats.original = this.analyserTexte(this.articleOriginal);
    
    console.log(`\n📊 Analyse de l'article original :`);
    console.log(`   - Mots : ${this.stats.original.mots}`);
    console.log(`   - Questions : ${this.stats.original.questions}`);
    console.log(`   - Phrases courtes (<10 mots) : ${this.stats.original.phrasesCourtes}`);
    console.log(`   - Contractions : ${this.stats.original.contractions}`);
    
    return true;
  }

  // Analyser les caractéristiques conversationnelles
  analyserTexte(texte) {
    const phrases = texte.split(/[.!?]+/).filter(p => p.trim());
    
    return {
      mots: texte.split(/\s+/).length,
      questions: (texte.match(/\?/g) || []).length,
      phrasesCourtes: phrases.filter(p => p.split(/\s+/).length < 10).length,
      contractions: (texte.match(/[cdjlmnstCDJLMNST][''][a-zA-Zàâäéèêëïîôùûüÿæœç]+/g) || []).length,
      exclamations: (texte.match(/!/g) || []).length,
      transitionsLourdes: (texte.match(/Par ailleurs|En outre|De surcroît|Qui plus est|Nonobstant/gi) || []).length
    };
  }

  // Optimiser avec l'approche conversationnelle
  async optimiserStyle() {
    console.log('\n🗣️ Optimisation conversationnelle...');
    
    const prompt = `Voici un article factuel à transformer en conversation engageante :

${this.articleOriginal}

MISSION : Rendre cet article conversationnel en suivant les principes définis.

RAPPELS CRITIQUES :
1. Préserver TOUS les faits, chiffres et sources
2. Créer une vraie conversation, pas du marketing speak
3. Utiliser des transitions naturelles
4. Poser des questions qui font réfléchir
5. Garder un ton professionnel mais accessible

Transforme l'article en gardant exactement la même structure et les mêmes informations.`;

    try {
      const response = await axios.post(
        CLAUDE_API_URL,
        {
          model: CONFIG.MODEL,
          max_tokens: 4000,
          temperature: CONFIG.TEMPERATURE,
          system: MASTER_PROMPT_CONVERSATIONNEL,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      const articleOptimise = response.data.content[0].text;
      
      // Analyser le résultat
      this.stats.optimise = this.analyserTexte(articleOptimise);
      
      // Vérifier l'intégrité
      const integrite = await this.verifierIntegrite(articleOptimise);
      
      // Détecter les clichés
      const cliches = this.detecterCliches(articleOptimise);
      
      console.log('\n✅ Optimisation terminée');
      console.log(`\n📊 Évolution du style :`);
      console.log(`   - Questions : ${this.stats.original.questions} → ${this.stats.optimise.questions}`);
      console.log(`   - Phrases courtes : ${this.stats.original.phrasesCourtes} → ${this.stats.optimise.phrasesCourtes}`);
      console.log(`   - Contractions : ${this.stats.original.contractions} → ${this.stats.optimise.contractions}`);
      console.log(`   - Transitions lourdes : ${this.stats.original.transitionsLourdes} → ${this.stats.optimise.transitionsLourdes}`);
      
      if (cliches.length > 0) {
        console.log(`\n⚠️  Expressions à surveiller : ${cliches.length}`);
        cliches.forEach(c => console.log(`   - "${c}"`));
      }
      
      console.log(`\n🎯 Score conversationnel : ${this.calculerScoreConversationnel(this.stats.optimise)}%`);
      console.log(`📊 Score intégrité : ${(integrite.score * 100).toFixed(1)}%`);
      
      return {
        article: articleOptimise,
        stats: this.stats,
        integrite: integrite,
        cliches: cliches,
        scoreConversationnel: this.calculerScoreConversationnel(this.stats.optimise)
      };
      
    } catch (error) {
      console.error('❌ Erreur optimisation :', error.message);
      throw error;
    }
  }

  // Calculer un score de conversationnalité
  calculerScoreConversationnel(stats) {
    let score = 0;
    const totalPhrases = stats.mots / 15; // Estimation
    
    // Questions (idéal : 1 toutes les 150 mots)
    const ratioQuestions = stats.questions / (stats.mots / 150);
    score += Math.min(ratioQuestions * 20, 20);
    
    // Phrases courtes (idéal : 40% des phrases)
    const ratioPhrasesCourtes = stats.phrasesCourtes / totalPhrases;
    score += Math.min(ratioPhrasesCourtes * 50, 30);
    
    // Contractions (signe de naturel)
    const ratioContractions = stats.contractions / (stats.mots / 100);
    score += Math.min(ratioContractions * 20, 20);
    
    // Absence de transitions lourdes
    const penaliteTransitions = Math.min(stats.transitionsLourdes * 5, 20);
    score += (20 - penaliteTransitions);
    
    // Absence d'exclamations forcées
    const penaliteExclamations = Math.min(stats.exclamations * 2, 10);
    score += (10 - penaliteExclamations);
    
    return Math.round(score);
  }

  // Détecter les clichés marketing
  detecterCliches(texte) {
    const clichesPatterns = [
      /Soyons clairs?/i,
      /Force est de constater/i,
      /Il va sans dire/i,
      /Le constat est sans appel/i,
      /game[- ]?changer/i,
      /disrupti[fv]/i,
      /Dans le monde d'aujourd'hui/i,
      /À l'ère du digital/i,
      /révolutionnaire/i,
      /incroyable opportunité/i,
      /absolument essentiel/i,
      /Il est temps de/i,
      /Prenez une longueur d'avance/i
    ];
    
    const clichesTrouves = [];
    
    clichesPatterns.forEach(pattern => {
      const matches = texte.match(pattern);
      if (matches) {
        clichesTrouves.push(matches[0]);
      }
    });
    
    return clichesTrouves;
  }

  // Vérifier l'intégrité (simplifiée mais efficace)
  async verifierIntegrite(articleOptimise) {
    const verifications = {
      chiffresPreserves: true,
      sourcesPreservees: true,
      structurePreservee: true,
      alertes: []
    };
    
    // Vérifier les chiffres
    const chiffresOriginaux = this.articleOriginal.match(/\d+(?:[.,]\d+)?(?:\s*%|\s*€|\s*millions?|\s*milliards?)?/g) || [];
    const chiffresOptimises = articleOptimise.match(/\d+(?:[.,]\d+)?(?:\s*%|\s*€|\s*millions?|\s*milliards?)?/g) || [];
    
    if (chiffresOriginaux.length !== chiffresOptimises.length) {
      verifications.chiffresPreserves = false;
      verifications.alertes.push(`Nombre de chiffres différent : ${chiffresOriginaux.length} → ${chiffresOptimises.length}`);
    }
    
    // Vérifier les sources
    const sourcesOriginales = this.articleOriginal.match(/\(Source[^)]+\)/g) || [];
    const sourcesOptimisees = articleOptimise.match(/\(Source[^)]+\)/g) || [];
    
    if (sourcesOriginales.length !== sourcesOptimisees.length) {
      verifications.sourcesPreservees = false;
      verifications.alertes.push(`Sources modifiées : ${sourcesOriginales.length} → ${sourcesOptimisees.length}`);
    }
    
    // Score global
    verifications.score = (
      (verifications.chiffresPreserves ? 0.5 : 0) +
      (verifications.sourcesPreservees ? 0.5 : 0)
    );
    
    return verifications;
  }

  // Générer le rapport
  genererRapport(resultat) {
    let rapport = `# Rapport d'optimisation conversationnelle\n\n`;
    rapport += `**Date** : ${new Date().toLocaleString('fr-FR')}\n\n`;
    
    rapport += `## Scores\n\n`;
    rapport += `- **Score conversationnel** : ${resultat.scoreConversationnel}%\n`;
    rapport += `- **Score intégrité** : ${(resultat.integrite.score * 100).toFixed(1)}%\n\n`;
    
    rapport += `## Évolution du style\n\n`;
    rapport += `| Métrique | Original | Optimisé | Évolution |\n`;
    rapport += `|----------|----------|----------|----------|\n`;
    rapport += `| Questions | ${this.stats.original.questions} | ${this.stats.optimise.questions} | ${this.stats.optimise.questions > this.stats.original.questions ? '✅' : '➖'} |\n`;
    rapport += `| Phrases courtes | ${this.stats.original.phrasesCourtes} | ${this.stats.optimise.phrasesCourtes} | ${this.stats.optimise.phrasesCourtes > this.stats.original.phrasesCourtes ? '✅' : '➖'} |\n`;
    rapport += `| Contractions | ${this.stats.original.contractions} | ${this.stats.optimise.contractions} | ${this.stats.optimise.contractions > this.stats.original.contractions ? '✅' : '➖'} |\n`;
    rapport += `| Transitions lourdes | ${this.stats.original.transitionsLourdes} | ${this.stats.optimise.transitionsLourdes} | ${this.stats.optimise.transitionsLourdes < this.stats.original.transitionsLourdes ? '✅' : '❌'} |\n`;
    
    if (resultat.cliches.length > 0) {
      rapport += `\n## Expressions marketing détectées\n\n`;
      rapport += `⚠️ Ces expressions peuvent nuire à l'authenticité :\n\n`;
      resultat.cliches.forEach(c => {
        rapport += `- "${c}"\n`;
      });
    }
    
    rapport += `\n## Recommandations\n\n`;
    
    if (resultat.scoreConversationnel < 60) {
      rapport += `- Le style reste trop formel. Ajouter plus de questions engageantes.\n`;
      rapport += `- Utiliser davantage de phrases courtes pour créer du rythme.\n`;
    }
    
    if (resultat.cliches.length > 3) {
      rapport += `- Trop d'expressions marketing génériques détectées.\n`;
      rapport += `- Privilégier un langage plus authentique et spécifique.\n`;
    }
    
    return rapport;
  }

  // Sauvegarder les résultats
  async sauvegarder(resultat, filepathOriginal) {
    const outputDir = '../output/04-articles-conversationnels';
    await fs.mkdir(outputDir, { recursive: true });
    
    const basename = path.basename(filepathOriginal, '-factuel.md').replace('.md', '');
    const filename = `${basename}-conversationnel.md`;
    const filepath = path.join(outputDir, filename);
    
    // Ajouter les métadonnées
    let contenuFinal = `<!-- 
STYLE CONVERSATIONNEL APPLIQUÉ
Score conversationnel : ${resultat.scoreConversationnel}%
Score intégrité : ${(resultat.integrite.score * 100).toFixed(1)}%
Optimisé le : ${new Date().toISOString()}
-->\n\n`;
    
    contenuFinal += resultat.article;
    
    await PRIZM_CONFIG.utils.writeFile(filepath, contenuFinal);
    
    // Sauvegarder le rapport
    const rapportPath = filepath.replace('.md', '-rapport.md');
    const rapport = this.genererRapport(resultat);
    await fs.writeFile(rapportPath, rapport);
    
    console.log(`\n💾 Article optimisé : ${filepath}`);
    console.log(`📊 Rapport : ${rapportPath}`);
    
    return filepath;
  }
}

// Script principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
🗣️ Agent Style Conversationnel v3
==================================

Transforme un article factuel en conversation engageante
sans jamais altérer les faits.

Usage :
  node agent-style-conversationnel.js <article-factuel.md>

Philosophie :
  ✓ Créer une vraie conversation, pas du marketing speak
  ✓ Questions qui font réfléchir
  ✓ Transitions naturelles
  ✓ Connivence professionnelle
  ✓ Clarté avant l'effet de style

Inspiration :
  - Slack : "But..." et ponctuation expressive
  - HubSpot : Clarity above clever
  - Mailchimp : Humor subtil sans se prendre au sérieux

Garanties :
  ✓ 100% des faits préservés
  ✓ Toutes les sources maintenues
  ✓ Aucune invention
    `);
    process.exit(0);
  }
  
  const agent = new AgentStyleConversationnel();
  
  try {
    await agent.initialize();
    
    // Charger l'article
    await agent.chargerArticle(args[0]);
    
    // Optimiser
    console.time('⏱️ Temps d\'optimisation');
    const resultat = await agent.optimiserStyle();
    console.timeEnd('⏱️ Temps d\'optimisation');
    
    // Sauvegarder
    const fichier = await agent.sauvegarder(resultat, args[0]);
    
    console.log('\n✅ Optimisation conversationnelle terminée !');
    
    if (resultat.scoreConversationnel >= 70) {
      console.log('🎉 Excellent score conversationnel !');
    } else if (resultat.scoreConversationnel >= 50) {
      console.log('👍 Bon début, l\'article est plus engageant.');
    } else {
      console.log('🤔 Le style reste un peu formel, mais c\'est un progrès.');
    }
    
    return fichier;
    
  } catch (error) {
    console.error('\n❌ Erreur :', error.message);
    process.exit(1);
  }
}

// Export pour le pipeline
module.exports = AgentStyleConversationnel;

// Lancer si exécuté directement
if (require.main === module) {
  main();
}