/**
 * AGENT RÉDACTEUR FACTUEL V2 - OPTIMISÉ ET CORRIGÉ
 * 
 * Améliorations par rapport à la V1 :
 * - Date dynamique dans tous les prompts
 * - Longueur cible 1500-1700 mots  
 * - Sections plus longues (500-600 mots)
 * - Validation et retry automatique
 * - Format API Claude correct
 * 
 * Date : 16 août 2025
 * Modèle : Claude 3.5 Sonnet (dernière version)
 */

require('dotenv').config({ path: './config/.env' });
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration API
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// Configuration optimisée
const CONFIG = {
  MODEL: 'claude-3-5-sonnet-20241022',
  TEMPERATURE: 0.3,
  MAX_TOKENS: 4000,
  
  // Longueurs cibles OPTIMISÉES
  LONGUEUR: {
    MIN: 1500,
    CIBLE: 1600,
    MAX: 1700,
    
    // Par section
    INTRODUCTION: { MIN: 200, CIBLE: 250 },
    SECTION: { MIN: 500, CIBLE: 550 },
    CONCLUSION: { MIN: 250, CIBLE: 300 }
  },
  
  // Répertoires
  CORPUS_DIR: './output/02-corpus',
  OUTPUT_DIR: './output/03-articles-factuels',
  
  // Retry
  MAX_RETRIES: 3
};

/**
 * Helpers pour la date dynamique
 */
function getCurrentDateForPrompt() {
  const now = new Date();
  const mois = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  return `${now.getDate()} ${mois[now.getMonth()]} ${now.getFullYear()}`;
}

function getCurrentYear() {
  return new Date().getFullYear();
}

/**
 * Classe principale de l'agent rédacteur V2
 */
class AgentRedacteurFactuelV2 {
  constructor() {
    this.corpus = null;
    this.sources = [];
    this.dateActuelle = getCurrentDateForPrompt();
    this.anneeActuelle = getCurrentYear();
    this.stats = {
      tentatives: 0,
      motsTotaux: 0,
      sections: []
    };
  }

  /**
   * Charger un corpus depuis un dossier
   */
  async chargerCorpus(corpusPath) {
    console.log('📚 Chargement du corpus...\n');
    
    try {
      // Si c'est un chemin relatif simple
      if (!corpusPath.includes('/') && !corpusPath.includes('\\')) {
        const dirs = await fs.readdir(CONFIG.CORPUS_DIR);
        for (const dir of dirs) {
          const sujets = await fs.readdir(path.join(CONFIG.CORPUS_DIR, dir));
          for (const sujet of sujets) {
            if (sujet.includes(corpusPath)) {
              corpusPath = path.join(CONFIG.CORPUS_DIR, dir, sujet);
              break;
            }
          }
        }
      }
      
      // Charger metadata
      const metadataPath = path.join(corpusPath, 'metadata.json');
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      
      // Charger toutes les sources
      const sources = [];
      for (let i = 1; i <= metadata.sources.length; i++) {
        const sourcePath = path.join(corpusPath, `source-${i}-*.md`);
        const files = await fs.readdir(corpusPath);
        const sourceFile = files.find(f => f.startsWith(`source-${i}-`));
        
        if (sourceFile) {
          const contenu = await fs.readFile(path.join(corpusPath, sourceFile), 'utf-8');
          sources.push({
            numero: i,
            metadata: metadata.sources[i - 1],
            contenu
          });
        }
      }
      
      this.corpus = {
        metadata,
        sources,
        synthese: metadata.synthese,
        titre: metadata.titre
      };
      
      console.log(`   ✅ Corpus chargé : ${this.corpus.titre}`);
      console.log(`   ✅ ${sources.length} sources disponibles`);
      console.log(`   📅 Date système : ${this.dateActuelle}\n`);
      
      return true;
      
    } catch (error) {
      console.error(`❌ Erreur chargement corpus : ${error.message}`);
      return false;
    }
  }

  /**
   * Générer le plan de l'article basé sur les sources
   */
  async genererPlan() {
    console.log('📋 Génération du plan structuré...\n');
    
    // Extraire les points clés
    const pointsCles = this.extrairePointsCles();
    
    // Créer un plan avec 3-4 sections principales
    const plan = {
      titre: this.corpus.titre,
      introduction: {
        accroche: this.corpus.synthese?.convergences || '',
        contexte: this.extraireContexte(),
        annonce: `Cette analyse s'appuie sur ${this.corpus.sources.length} sources professionnelles récentes`
      },
      sections: this.genererSections(pointsCles),
      conclusion: {
        synthese: this.corpus.synthese?.anglePrizm || '',
        actions: this.extraireActions()
      }
    };
    
    console.log(`   ✅ Plan créé avec ${plan.sections.length} sections\n`);
    return plan;
  }

  /**
   * Extraire les points clés du corpus
   */
  extrairePointsCles() {
    const points = [];
    
    this.corpus.sources.forEach(source => {
      // Extraire citations
      const citations = source.contenu.match(/\* "([^"]+)"/g) || [];
      citations.forEach(citation => {
        points.push({
          type: 'citation',
          contenu: citation.replace(/\* "|"/g, ''),
          source: source.numero,
          sourceNom: source.metadata.nom
        });
      });
      
      // Extraire données factuelles
      const donnees = source.contenu.match(/- ([^-\n]*\d+[%€M][^-\n]*)/g) || [];
      donnees.forEach(donnee => {
        points.push({
          type: 'donnee',
          contenu: donnee.replace(/^- /, ''),
          source: source.numero,
          sourceNom: source.metadata.nom
        });
      });
    });
    
    return points;
  }

  /**
   * Générer les sections basées sur les points
   */
  genererSections(pointsCles) {
    const sections = [];
    
    // Grouper par thématiques (3-4 sections max pour atteindre 1600 mots)
    if (pointsCles.filter(p => p.type === 'donnee').length > 3) {
      sections.push({
        titre: "Impact et opportunités",
        points: pointsCles.filter(p => p.type === 'donnee').slice(0, 8)
      });
    }
    
    if (pointsCles.filter(p => p.type === 'citation').length > 3) {
      sections.push({
        titre: "Leviers et solutions",
        points: pointsCles.filter(p => p.type === 'citation').slice(0, 8)
      });
    }
    
    // Section additionnelle si besoin
    if (sections.length < 3) {
      sections.push({
        titre: sections.length === 0 ? "Analyse détaillée" : 
               sections.length === 1 ? "Perspectives et enjeux" : "Les obstacles identifiés",
        points: pointsCles.slice(8, 16)
      });
    }
    
    return sections;
  }

  /**
   * Extraire le contexte depuis les sources
   */
  extraireContexte() {
    const premieresCitations = this.corpus.sources
      .flatMap(s => {
        const matches = s.contenu.match(/\* "([^"]+)"/g) || [];
        return matches.map(m => m.replace(/\* "|"/g, ''));
      })
      .slice(0, 2)
      .join(' ');
    
    return premieresCitations || "Analyse approfondie du sujet";
  }

  /**
   * Extraire les actions recommandées
   */
  extraireActions() {
    const actions = [];
    
    // Chercher les recommandations dans les sources
    this.corpus.sources.forEach(source => {
      const recommendations = source.contenu.match(/recommand[^.]+\./gi) || [];
      recommendations.forEach(rec => {
        if (rec.length > 20 && rec.length < 200) {
          actions.push(rec);
        }
      });
    });
    
    // Si pas assez d'actions, en créer basées sur les données
    if (actions.length < 3) {
      actions.push("Évaluer l'impact des solutions présentées sur votre organisation");
      actions.push("Identifier les quick wins applicables immédiatement");
      actions.push("Planifier une stratégie d'implémentation progressive");
    }
    
    return actions.slice(0, 3);
  }

  /**
   * Générer l'introduction avec longueur optimisée
   */
  async genererIntroduction(plan) {
    console.log('   → Génération introduction (250 mots visés)...');
    
    const prompt = `Tu es un rédacteur expert en IA et transformation digitale.

Sujet : "${plan.titre}"

Sources disponibles (toutes de ${this.anneeActuelle}, donc actuelles) :
${this.corpus.sources.map(s => `- ${s.metadata.nom} (${s.metadata.date})`).join('\n')}

Point de convergence : ${plan.introduction.accroche}

MISSION : Rédiger une introduction de 250 mots MINIMUM qui :
1. Commence par une donnée factuelle marquante issue des sources
2. Pose le contexte et les enjeux pour les PME/ETI
3. Annonce clairement ce que l'article va couvrir
4. Mentionne que l'analyse s'appuie sur ${this.corpus.sources.length} sources vérifiées

CONTRAINTES ABSOLUES :
- MINIMUM 250 mots (développer les idées)
- Aucune invention de données
- Style professionnel mais accessible
- Utiliser "on" ou la voix passive (jamais nous/notre)
- Citer au moins 2 données chiffrées des sources`;

    try {
      const response = await axios.post(
        CLAUDE_API_URL,
        {
          model: CONFIG.MODEL,
          max_tokens: 800,
          temperature: CONFIG.TEMPERATURE,
          system: `Date actuelle : ${this.dateActuelle}. Tu traites des sources de ${this.anneeActuelle} qui sont donc actuelles, non futures.`,
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
      
      const intro = response.data.content[0].text;
      const mots = intro.split(/\s+/).length;
      console.log(`      ✅ Introduction générée : ${mots} mots`);
      
      return intro;
      
    } catch (error) {
      console.error('❌ Erreur génération introduction:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Générer une section avec longueur optimisée
   */
  async genererSection(section, numeroSection) {
    console.log(`   → Génération section ${numeroSection} : ${section.titre} (550 mots visés)...`);
    
    // Préparer les points factuels
    const pointsFormates = section.points
      .map(p => {
        if (p.type === 'citation') {
          return `• Citation (${p.sourceNom}) : "${p.contenu}"`;
        } else {
          return `• Donnée (${p.sourceNom}) : ${p.contenu}`;
        }
      })
      .join('\n');
    
    const prompt = `Tu es un rédacteur expert.

Section à rédiger : "${section.titre}"

Points factuels à utiliser (sources de ${this.anneeActuelle}, donc actuelles) :
${pointsFormates}

MISSION : Rédiger cette section en 550 mots MINIMUM en :
1. Utilisant TOUS les points fournis
2. Développant et analysant chaque point (pas juste les lister)
3. Créant des transitions fluides entre les idées
4. Citant systématiquement les sources : (Source : nom)
5. Apportant une analyse de valeur, pas juste une compilation

FORMAT :
## ${section.titre}

[Contenu développé de 550+ mots]

CONTRAINTES :
- MINIMUM 550 mots (développer, analyser, connecter les idées)
- AUCUNE invention de données
- TOUTES les informations doivent venir des points fournis
- Style professionnel et analytique`;

    let tentatives = 0;
    let contenu = '';
    let motsSuffisants = false;
    
    while (tentatives < CONFIG.MAX_RETRIES && !motsSuffisants) {
      try {
        const response = await axios.post(
          CLAUDE_API_URL,
          {
            model: CONFIG.MODEL,
            max_tokens: 1500,
            temperature: CONFIG.TEMPERATURE,
            system: `Date : ${this.dateActuelle}. Les sources de ${this.anneeActuelle} sont actuelles. Objectif de longueur critique : 550+ mots par section.`,
            messages: [
              {
                role: 'user',
                content: prompt + (tentatives > 0 ? '\n\nIMPORTANT : La section précédente était trop courte. Développez davantage chaque point, ajoutez de l\'analyse et des transitions.' : '')
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
        
        contenu = response.data.content[0].text;
        const mots = contenu.split(/\s+/).length;
        
        if (mots >= CONFIG.LONGUEUR.SECTION.MIN) {
          motsSuffisants = true;
          console.log(`      ✅ Section générée : ${mots} mots`);
        } else {
          console.log(`      ⚠️ Section trop courte (${mots} mots), nouvelle tentative...`);
        }
        
        tentatives++;
        
      } catch (error) {
        console.error(`❌ Erreur génération section:`, error.response?.data || error.message);
        throw error;
      }
    }
    
    return contenu;
  }

  /**
   * Générer la conclusion avec longueur optimisée
   */
  async genererConclusion(plan) {
    console.log('   → Génération conclusion (300 mots visés)...');
    
    const actionsFormatees = plan.conclusion.actions
      .slice(0, 3)
      .map((a, i) => `${i + 1}. ${a}`)
      .join('\n');
    
    const prompt = `Tu es un rédacteur expert.

Article : "${plan.titre}"
Synthèse : ${plan.conclusion.synthese}

Actions identifiées :
${actionsFormatees}

MISSION : Rédiger une conclusion de 300 mots MINIMUM qui :
1. Synthétise les points clés de manière percutante
2. Propose 3 actions concrètes et détaillées
3. Ouvre sur une perspective d'avenir
4. Motive à l'action

FORMAT :
## Ce qu'il faut retenir

[Paragraphe de synthèse - 100 mots]

[Paragraphe de transition vers l'action - 50 mots]

### Actions concrètes
• **Action 1** : [Description détaillée en 2-3 phrases]
• **Action 2** : [Description détaillée en 2-3 phrases]
• **Action 3** : [Description détaillée en 2-3 phrases]

[Paragraphe de perspective et motivation - 50 mots]

CONTRAINTES :
- MINIMUM 300 mots au total
- Rester factuel et actionnable
- Pas d'invention, mais de la synthèse`;

    try {
      const response = await axios.post(
        CLAUDE_API_URL,
        {
          model: CONFIG.MODEL,
          max_tokens: 1000,
          temperature: CONFIG.TEMPERATURE,
          system: `Date : ${this.dateActuelle}. Nous sommes en ${this.anneeActuelle}. Objectif : conclusion percutante de 300+ mots.`,
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
      
      const conclusion = response.data.content[0].text;
      const mots = conclusion.split(/\s+/).length;
      console.log(`      ✅ Conclusion générée : ${mots} mots`);
      
      return conclusion;
      
    } catch (error) {
      console.error('❌ Erreur génération conclusion:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Générer les références
   */
  genererReferences() {
    let references = '## Sources et références\n\n';
    references += `*Cet article a été rédigé à partir de sources vérifiées :*\n\n`;
    
    this.corpus.sources.forEach(source => {
      references += `${source.numero}. **${source.metadata.nom}** - ${source.metadata.type || 'Article'}\n`;
      references += `   - Date : ${source.metadata.date}\n`;
      references += `   - URL : ${source.metadata.url}\n`;
      references += `   - Fiabilité : ${source.metadata.fiabilite}/10\n\n`;
    });
    
    return references;
  }

  /**
   * Générer les métadonnées
   */
  genererMetadata(plan, stats) {
    const date = new Date().toISOString().split('T')[0];
    const readingTime = Math.ceil(stats.motsTotaux / 250) + ' min';
    
    // Déterminer la catégorie
    let category = 'actualites';
    const titre = plan.titre.toLowerCase();
    if (titre.includes('guide') || titre.includes('méthode') || titre.includes('comment')) {
      category = 'guides';
    } else if (titre.includes('analyse') || titre.includes('état des lieux')) {
      category = 'analyses';
    }
    
    return `---
title: "${plan.titre}"
description: "${this.getDescription(plan, category)}"
pubDate: ${date}
author: "L'équipe Prizm AI"
emoji: "${this.getEmoji(category)}"
category: "${category}"
featured: false
readingTime: "${readingTime}"
---\n\n`;
  }

  /**
   * Obtenir une description selon la catégorie
   */
  getDescription(plan, category) {
    const prefixes = {
      'actualites': 'Actualité IA pour les entreprises',
      'guides': 'Guide pratique pour les PME et ETI',
      'analyses': 'Analyse approfondie'
    };
    return `${prefixes[category]} : ${plan.titre}`;
  }

  /**
   * Obtenir un emoji selon la catégorie
   */
  getEmoji(category) {
    const emojis = {
      'actualites': '🚀',
      'guides': '📚',
      'analyses': '📊'
    };
    return emojis[category] || '📰';
  }

  /**
   * Assembler l'article complet
   */
  async genererArticle() {
    console.log('✍️ GÉNÉRATION DE L\'ARTICLE FACTUEL V2');
    console.log('=' .repeat(60));
    
    const debut = Date.now();
    
    try {
      // 1. Générer le plan
      const plan = await this.genererPlan();
      
      // 2. Générer les sections
      const sections = [];
      
      // Introduction
      const intro = await this.genererIntroduction(plan);
      sections.push(intro);
      
      // Sections principales
      for (let i = 0; i < plan.sections.length; i++) {
        const section = await this.genererSection(plan.sections[i], i + 1);
        sections.push(section);
        this.stats.sections.push({
          titre: plan.sections[i].titre,
          mots: section.split(/\s+/).length
        });
      }
      
      // Conclusion
      const conclusion = await this.genererConclusion(plan);
      sections.push(conclusion);
      
      // 3. Assembler
      const contenuArticle = sections.join('\n\n');
      this.stats.motsTotaux = contenuArticle.split(/\s+/).length;
      
      // 4. Ajouter métadonnées et références
      const metadata = this.genererMetadata(plan, this.stats);
      const references = this.genererReferences();
      
      const articleComplet = metadata + `# ${plan.titre}\n\n` + contenuArticle + '\n\n' + references;
      
      // 5. Validation finale
      console.log('\n📊 STATISTIQUES DE L\'ARTICLE :');
      console.log(`   - Longueur totale : ${this.stats.motsTotaux} mots`);
      console.log(`   - Objectif : ${CONFIG.LONGUEUR.MIN}-${CONFIG.LONGUEUR.MAX} mots`);
      console.log(`   - Statut : ${this.stats.motsTotaux >= CONFIG.LONGUEUR.MIN ? '✅ Objectif atteint' : '⚠️ Trop court'}`);
      console.log(`   - Sections : ${plan.sections.length}`);
      console.log(`   - Temps : ${Math.round((Date.now() - debut) / 1000)}s`);
      
      return {
        article: articleComplet,
        stats: this.stats,
        plan: plan
      };
      
    } catch (error) {
      console.error('❌ Erreur génération article:', error.message);
      throw error;
    }
  }

  /**
   * Sauvegarder l'article
   */
  async sauvegarder(article) {
    // Créer le nom de fichier
    const date = new Date().toISOString().split('T')[0];
    const titre = this.corpus.titre
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Retirer les accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60);
    
    const filename = `${date}-${titre}-factuel.md`;
    const outputPath = path.join(CONFIG.OUTPUT_DIR, filename);
    
    // Créer le dossier si nécessaire
    await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
    
    // Sauvegarder avec encodage UTF-8 BOM pour Windows
    const BOM = '\uFEFF';
    await fs.writeFile(outputPath, BOM + article, 'utf-8');
    
    console.log(`\n✅ Article sauvegardé : ${filename}`);
    console.log(`📁 Chemin : ${outputPath}`);
    
    return outputPath;
  }
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
AGENT RÉDACTEUR FACTUEL V2 - OPTIMISÉ

Usage:
  node agent-redacteur-factuel.cjs <chemin-corpus>
  node agent-redacteur-factuel.cjs --list

Options:
  <chemin-corpus>  Chemin vers le dossier du corpus
  --list          Lister les corpus disponibles
  --help          Afficher cette aide

Exemples:
  node agent-redacteur-factuel.cjs "./output/02-corpus/2025-08-16/1-ia-generative"
  node agent-redacteur-factuel.cjs "ia-generative"
`);
    process.exit(0);
  }
  
  if (args[0] === '--list') {
    console.log('\n📚 CORPUS DISPONIBLES :\n');
    const dirs = await fs.readdir(CONFIG.CORPUS_DIR);
    for (const dir of dirs) {
      console.log(`📅 ${dir}/`);
      const sujets = await fs.readdir(path.join(CONFIG.CORPUS_DIR, dir));
      for (const sujet of sujets) {
        console.log(`   └── ${sujet}`);
      }
    }
    process.exit(0);
  }
  
  // Créer l'agent et générer l'article
  const agent = new AgentRedacteurFactuelV2();
  
  // Charger le corpus
  const corpusLoaded = await agent.chargerCorpus(args[0]);
  if (!corpusLoaded) {
    console.error('❌ Impossible de charger le corpus');
    process.exit(1);
  }
  
  // Générer l'article
  const { article, stats } = await agent.genererArticle();
  
  // Sauvegarder
  await agent.sauvegarder(article);
  
  console.log('\n🎉 Génération terminée avec succès !');
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

// Exporter pour utilisation dans le pipeline
module.exports = AgentRedacteurFactuelV2;