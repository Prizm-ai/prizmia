// agent-redacteur-factuel.js - Rédaction 100% basée sur sources vérifiées
require('dotenv').config({ path: '../config/.env' });
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const PRIZM_CONFIG = require('../config/prizm-config.cjs');

// Configuration
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const CONFIG = {
  MODEL: 'claude-3-5-sonnet-20241022',
  TEMPERATURE: 0.3, // Plus bas pour rester factuel
  MAX_TOKENS: 4000,
  MIN_WORDS: 1400,
  MAX_WORDS: 1600,
  CORPUS_DIR: 'prizm-output/02-corpus'
};

class AgentRedacteurFactuel {
  constructor() {
    this.corpus = null;
    this.sources = [];
    this.citations = [];
  }

  async extraireToutLeCorpus() {
    console.log('   📚 Extraction complète du corpus...');
    const allData = {
      citations: [],
      donnees: [],
      total: 0
    };
    
    if (!this.corpus || !this.corpus.sources) return allData;
    
    // Parcourir toutes les sources
    for (let i = 0; i < this.corpus.sources.length; i++) {
      const source = this.corpus.sources[i];
      
      // Extraire toutes les citations
      if (source.metadata && source.metadata.extraits) {
        source.metadata.extraits.forEach(extrait => {
          allData.citations.push({
            texte: extrait,
            source: source.metadata.nom,
            numero: i + 1
          });
        });
      }
      
      // Lire aussi le contenu du fichier source si disponible
      if (source.contenu) {
        // Extraire les citations du contenu
        const matches = source.contenu.match(/\* "([^"]+)"/g) || [];
        matches.forEach(match => {
          const citation = match.replace(/\* "|"/g, '');
          // Éviter les doublons
          if (!allData.citations.some(c => c.texte === citation)) {
            allData.citations.push({
              texte: citation,
              source: source.metadata.nom,
              numero: i + 1
            });
          }
        });
        
        // Extraire les données factuelles
        const donneesMatches = source.contenu.match(/- ([^\n]+)/g) || [];
        donneesMatches.forEach(donnee => {
          if (donnee.includes('%') || donnee.includes('€') || donnee.includes('millions')) {
            allData.donnees.push({
              texte: donnee.replace('- ', ''),
              source: source.metadata.nom,
              numero: i + 1
            });
          }
        });
      }
    }
    
    allData.total = allData.citations.length + allData.donnees.length;
    console.log(`   ✅ Extraction complète : ${allData.citations.length} citations, ${allData.donnees.length} données\n`);
    
    this.toutLeCorpus = allData;
    return allData;
  }

  async utiliserDonneesVariees(section) {
    if (!this.toutLeCorpus || this.toutLeCorpus.citations.length === 0) {
      await this.extraireToutLeCorpus();
    }
    
    // Sélectionner des citations non utilisées
    const citationsDisponibles = this.toutLeCorpus.citations.filter(c => 
      !this.citationsUtilisees || !this.citationsUtilisees.has(c.texte)
    );
    
    // Prendre 3-4 citations pour cette section
    const citationsSection = citationsDisponibles.slice(0, 4);
    
    // Marquer comme utilisées
    if (!this.citationsUtilisees) this.citationsUtilisees = new Set();
    citationsSection.forEach(c => this.citationsUtilisees.add(c.texte));
    
    return citationsSection;
  }


  // Système de tracking pour éviter les répétitions
  initializeTracking() {
    this.usedInformation = {
      statistics: new Set(),
      quotes: new Set(),
      concepts: new Set(),
      sources: new Map()
    };
    this.sectionFocus = [
      'état des lieux général',
      'freins et obstacles spécifiques',
      'solutions et initiatives',
      'perspectives et recommandations'
    ];
  }
  
  trackUsage(type, info) {
    if (type === 'statistic') {
      this.usedInformation.statistics.add(info);
    } else if (type === 'quote') {
      this.usedInformation.quotes.add(info);
    } else if (type === 'concept') {
      this.usedInformation.concepts.add(info);
    }
  }
  
  isAlreadyUsed(type, info) {
    return this.usedInformation[type + 's']?.has(info) || false;
  }
  
  getUnusedData(section) {
    // Retourner les données non utilisées pour cette section
    const allData = this.extractAllData();
    return allData.filter(d => !this.isAlreadyUsed(d.type, d.content));
  }


  async chargerCorpus(cheminCorpus) {
    console.log('\n📚 Chargement du corpus de sources...');
    
    try {
      // Charger les métadonnées
      const metadataPath = path.join(cheminCorpus, 'metadata.json');
      const metadata = JSON.parse(await PRIZM_CONFIG.utils.readFile(metadataPath));
      
      console.log(`   ✓ Sujet : ${metadata.titre}`);
      console.log(`   ✓ Sources : ${metadata.sources.length}`);
      console.log(`   ✓ Score qualité : ${metadata.scoreQualite.toFixed(2)}`);
      
      // Charger chaque source
      const sources = [];
      for (let i = 0; i < metadata.sources.length; i++) {
        const sourceFiles = await fs.readdir(cheminCorpus);
        const sourceFile = sourceFiles.find(f => f.startsWith(`source-${i + 1}-`));
        
        if (sourceFile) {
          const contenuSource = await fs.readFile(path.join(cheminCorpus, sourceFile), 'utf-8');
          sources.push({
            numero: i + 1,
            metadata: metadata.sources[i],
            contenu: contenuSource
          });
        }
      }
      
      this.corpus = {
        metadata,
        sources,
        synthese: metadata.synthese
      };
      
      console.log(`   ✓ Corpus chargé avec succès\n`);
      return true;
      
    } catch (error) {
      console.error(`❌ Erreur chargement corpus : ${error.message}`);
      return false;
    }
  }

  async genererPlanFactuel() {
    console.log('📋 Génération du plan basé sur les sources...\n');
    
    // Analyser les points clés du corpus
    const pointsCles = this.extrairePointsCles();
    
    // Créer un plan structuré
    const plan = {
      titre: this.corpus.metadata.titre,
      introduction: {
        accroche: this.corpus.synthese.convergences,
        contexte: this.extraireContexte(),
        annonce: "Analyse basée sur " + this.corpus.sources.length + " sources vérifiées"
      },
      sections: this.genererSections(pointsCles),
      conclusion: {
        synthese: this.corpus.synthese.anglePrizm,
        actions: this.extraireActions()
      }
    };
    
    console.log('   ✓ Plan structuré créé');
    console.log(`   ✓ ${plan.sections.length} sections identifiées\n`);
    
    return plan;
  }

  extrairePointsCles() {
    const points = [];
    
    this.corpus.sources.forEach(source => {
      // Extraire les citations
      const regexCitations = /\* "([^"]+)"/g;
      let match;
      while ((match = regexCitations.exec(source.contenu)) !== null) {
        points.push({
          type: 'citation',
          contenu: match[1],
          source: source.numero,
          sourceNom: source.metadata.nom
        });
      }
      
      // Extraire les données factuelles
      const regexDonnees = /- ([^-\n]+(?:\d+[%€M]|\d{4})[^-\n]+)/g;
      while ((match = regexDonnees.exec(source.contenu)) !== null) {
        points.push({
          type: 'donnee',
          contenu: match[1],
          source: source.numero,
          sourceNom: source.metadata.nom
        });
      }
    });
    
    return points;
  }

  extraireContexte() {
    // Synthétiser le contexte à partir des sources
    const citations = this.corpus.sources
      .flatMap(s => {
        const matches = s.contenu.match(/\* "([^"]+)"/g) || [];
        return matches.map(m => m.replace(/\* "|"/g, ''));
      })
      .slice(0, 2);
    
    return citations.join(' ');
  }

  genererSections(pointsCles) {
    // Grouper les points par thématiques
    const sections = [];
    
    // Section 1 : État des lieux (basé sur les données chiffrées)
    const donnees = pointsCles.filter(p => p.type === 'donnee');
    if (donnees.length > 0) {
      sections.push({
        titre: "État des lieux : les chiffres clés",
        points: donnees
      });
    }
    
    // Section 2 : Analyse des freins (basé sur les citations)
    const citationsFreins = pointsCles.filter(p => 
      p.type === 'citation' && 
      (p.contenu.includes('frein') || p.contenu.includes('difficulté') || p.contenu.includes('manque'))
    );
    if (citationsFreins.length > 0) {
      sections.push({
        titre: "Les obstacles identifiés",
        points: citationsFreins
      });
    }
    
    // Section 3 : Solutions et perspectives
    const citationsSolutions = pointsCles.filter(p => 
      p.type === 'citation' && 
      (p.contenu.includes('solution') || p.contenu.includes('accompagn') || p.contenu.includes('formation'))
    );
    if (citationsSolutions.length > 0) {
      sections.push({
        titre: "Leviers et solutions",
        points: citationsSolutions
      });
    }
    
    // Section 4 : Impact et bénéfices
    const citationsImpact = pointsCles.filter(p => 
      !citationsFreins.includes(p) && !citationsSolutions.includes(p)
    );
    if (citationsImpact.length > 0) {
      sections.push({
        titre: "Impact et opportunités",
        points: citationsImpact.slice(0, 5)
      });
    }
    
    return sections;
  }

  extraireActions() {
    // Extraire des actions concrètes basées sur les sources
    const actions = [];
    
    // Action basée sur la synthèse
    if (this.corpus.synthese.anglePrizm) {
      actions.push(this.corpus.synthese.anglePrizm);
    }
    
    // Actions basées sur les solutions identifiées
    this.corpus.sources.forEach(source => {
      if (source.contenu.includes('accompagnement')) {
        actions.push("Mettre en place un programme d'accompagnement personnalisé");
      }
      if (source.contenu.includes('formation')) {
        actions.push("Investir dans la formation des équipes à l'IA");
      }
    });
    
    return [...new Set(actions)].slice(0, 3); // Dédupliquer et limiter à 3
  }

  async genererArticle(plan) {
    console.log('✍️ Rédaction de l\'article basé sur les sources...\n');
    
    const sections = [];
    
    // Métadonnées
    const metadata = await this.genererMetadata(plan);
    sections.push(metadata);
    
    // Titre
    const titrePropre = typeof plan.titre === 'string' ? 
      plan.titre.split('\n')[0].split('###')[0].trim() : 
      'Article sans titre';
    sections.push(`# ${titrePropre}\n`);
    
    // Introduction
    const intro = await this.genererIntroduction(plan);
    sections.push(intro);
    
    // Sections principales
    for (const section of plan.sections) {
      const contenuSection = await this.genererSection(section);
      sections.push(contenuSection);
    }
    
    // Conclusion
    const conclusion = await this.genererConclusion(plan);
    sections.push(conclusion);
    
    // Assembler l'article
    const articleComplet = sections.join('\n\n');
    
    // Ajouter les références
    const references = this.genererReferences();
    
    return articleComplet + '\n\n' + references;
  }

  async genererMetadata(plan) {
    const date = new Date().toISOString().split('T')[0];
    
    // Nettoyer le titre pour éviter d'inclure tout le corpus
    const titrePropre = typeof plan.titre === 'string' ? 
      plan.titre.split('\n')[0].split('###')[0].trim() : 
      'Article sans titre';
    
    return `---
title: "${titrePropre} | Prizm AI"
description: "Analyse factuelle basée sur ${this.corpus.sources.length} sources vérifiées. ${plan.introduction.annonce}"
date: "${date}"
author: "Prizm AI"
categories: ["Analyse factuelle"]
tags: ["IA", "PME", "Sources vérifiées"]
image: "/images/analyse-factuelle.jpg"
featured: true
readingTime: "7 min"
sources: ${this.corpus.sources.length}
---`;
  }

  async genererIntroduction(plan) {
    // Extraire des données variées pour l'introduction
    const donneesVariees = await this.utiliserDonneesVariees({ titre: 'Introduction' });
    const citationsFormatees = donneesVariees.map(d => 
      `- ${d.texte} (Source : ${d.source})`
    ).join('\n');
    
    const prompt = `Tu es un rédacteur expert qui écrit UNIQUEMENT à partir de sources vérifiées.

Contexte : "${plan.titre}"

Sources disponibles :
${this.corpus.sources.map(s => `- ${s.metadata.nom} (${s.metadata.date})`).join('\n')}

Point clé de convergence : ${plan.introduction.accroche}

Écris une introduction de 150-200 mots qui :
1. Commence par une donnée factuelle issue des sources
2. Pose le contexte du sujet
3. Annonce ce que l'article va couvrir
4. Mentionne que l'analyse est basée sur ${this.corpus.sources.length} sources vérifiées

CONTRAINTES ABSOLUES :
- AUCUNE citation inventée
- AUCUNE donnée non présente dans les sources
- Style professionnel mais accessible
- Utiliser "on" (jamais nous/notre)`;

    try {
      const response = await axios.post(
        CLAUDE_API_URL,
        {
          model: CONFIG.MODEL,
          max_tokens: 500,
          temperature: CONFIG.TEMPERATURE,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      return response.data.content[0].text;
    } catch (error) {
      console.error('❌ Erreur génération introduction:', error.message);
      throw error;
    }
  }

  async genererSection(section) {
    console.log(`   → Génération : ${section.titre}`);
    
    // Extraire des données variées pour cette section
    const donneesVariees = await this.utiliserDonneesVariees(section);
    const citationsFormatees = donneesVariees.map(d => 
      `- ${d.texte} (Source : ${d.source})`
    ).join('\n');
    
    // Préparer les points factuels pour cette section
    const pointsFormates = section.points.map(p => {
      if (p.type === 'citation') {
        return `Citation de ${p.sourceNom} : "${p.contenu}"`;
      } else {
        return `Donnée factuelle (${p.sourceNom}) : ${p.contenu}`;
      }
    }).join('\n');
    
    const prompt = `Tu es un rédacteur expert qui écrit UNIQUEMENT à partir de sources vérifiées.

Section à écrire : "${section.titre}"

Points factuels à utiliser :
${citationsFormatees}

PLUS les points suivants :
${pointsFormates}

Écris cette section (400-450 mots) en :
1. Utilisant UNIQUEMENT les informations fournies ci-dessus
2. Citant les sources entre parenthèses : (Source : nom)
3. Développant et analysant les points sans inventer
4. Gardant un ton professionnel et factuel

Format : Commence par ## ${section.titre}

INTERDICTIONS ABSOLUES :
- Inventer des citations
- Ajouter des données non fournies
- Utiliser "nous/notre"
- Créer des exemples fictifs`;

    try {
      const response = await axios.post(
        CLAUDE_API_URL,
        {
          model: CONFIG.MODEL,
          max_tokens: 900,
          temperature: CONFIG.TEMPERATURE,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      return response.data.content[0].text;
    } catch (error) {
      console.error(`❌ Erreur génération section ${section.titre}:`, error.message);
      throw error;
    }
  }

  async genererSectionAvecLongueur(section, longueurMin = 350) {
    let tentatives = 0;
    let contenu = '';
    
    while (tentatives < 3) {
      contenu = await this.genererSection(section);
      const mots = contenu.split(/\s+/).length;
      
      if (mots >= longueurMin) {
        return contenu;
      }
      
      console.log(`   ⚠️  Section trop courte (${mots} mots), nouvelle tentative...`);
      tentatives++;
      
      // Ajouter une instruction de longueur au prompt
      section.promptAddition = `IMPORTANT : Cette section doit faire AU MINIMUM ${longueurMin} mots. Développez davantage chaque point.`;
    }
    
    return contenu;
  }


  async genererConclusion(plan) {
    const actionsFormatees = plan.conclusion.actions.map((a, i) => `${i + 1}. ${a}`).join('\n');
    
    const prompt = `Tu es un rédacteur expert qui conclut un article factuel.

Synthèse principale : ${plan.conclusion.synthese}

Actions identifiées dans les sources :
${actionsFormatees}

Écris une conclusion (200 mots) qui :
1. Rappelle les points clés factuels
2. Propose 3 actions concrètes basées sur les sources
3. Ouvre sur une perspective

Format :
## Ce qu'il faut retenir

[Synthèse]

### Actions concrètes
• **Action 1** : [Description détaillée]
• **Action 2** : [Description détaillée]
• **Action 3** : [Description détaillée]

CONTRAINTES : Rester 100% factuel, pas d'invention`;

    try {
      const response = await axios.post(
        CLAUDE_API_URL,
        {
          model: CONFIG.MODEL,
          max_tokens: 800,
          temperature: CONFIG.TEMPERATURE,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      return response.data.content[0].text;
    } catch (error) {
      console.error('❌ Erreur génération conclusion:', error.message);
      throw error;
    }
  }

  genererReferences() {
    let references = '## Sources et références\n\n';
    references += '*Cet article a été rédigé à partir de sources vérifiées :*\n\n';
    
    this.corpus.sources.forEach(source => {
      references += `${source.numero}. **${source.metadata.nom}** - ${source.metadata.type}\n`;
      references += `   - Date : ${source.metadata.date}\n`;
      references += `   - URL : ${source.metadata.url}\n`;
      references += `   - Fiabilité : ${source.metadata.fiabilite}/10\n\n`;
    });
    
    return references;
  }

  async sauvegarder(contenu, titre) {
    const date = new Date().toISOString().split('T')[0];
    const outputDir = PRIZM_CONFIG.agents.redacteurFactuel.outputDir();
    await fs.mkdir(outputDir, { recursive: true });
    
    const filename = `${date}-${titre.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 50)}-factuel.md`;
    const outputPath = path.join(outputDir, filename);
    
    await PRIZM_CONFIG.utils.writeFile(outputPath, contenu);
    console.log(`\n✅ Article factuel sauvegardé : ${outputPath}`);
    
    // Sauvegarder aussi un rapport
    const rapport = {
      timestamp: new Date().toISOString(),
      titre,
      nombreSources: this.corpus.sources.length,
      nombreMots: contenu.split(/\s+/).length,
      corpusUtilise: this.corpus.metadata
    };
    
    const rapportPath = path.join(outputDir, `rapport-${filename}.json`);
    await fs.writeFile(rapportPath, JSON.stringify(rapport, null, 2));
    
    return { outputPath, rapport };
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
📝 Agent Rédacteur Factuel - Prizm AI
=====================================

Génère des articles basés UNIQUEMENT sur des sources vérifiées.

Usage :
  node agent-redacteur-factuel.js <chemin-corpus>
  node agent-redacteur-factuel.js --list

Options :
  <chemin-corpus>  Chemin vers le dossier corpus d'un sujet
  --list          Liste les corpus disponibles
  --help          Affiche cette aide

Exemple :
  node agent-redacteur-factuel.js prizm-output/02-corpus/2025-07-29/[dossier-sujet]

Fonctionnement :
  1. Charge le corpus de sources vérifiées
  2. Extrait les citations et données factuelles
  3. Génère un plan basé sur les sources
  4. Rédige en citant systématiquement
  5. Ajoute les références complètes
    `);
    process.exit(0);
  }
  
  if (args[0] === '--list') {
    // Lister les corpus disponibles
    try {
      const dates = await fs.readdir(CONFIG.CORPUS_DIR);
      console.log('\n📚 Corpus disponibles :\n');
      
      for (const date of dates) {
        const datePath = path.join(CONFIG.CORPUS_DIR, date);
        const sujets = await fs.readdir(datePath);
        
        console.log(`📅 ${date} :`);
        for (const sujet of sujets) {
          const metadataPath = path.join(datePath, sujet, 'metadata.json');
          try {
            const metadata = JSON.parse(await PRIZM_CONFIG.utils.readFile(metadataPath));
            console.log(`   └─ ${sujet}`);
            console.log(`      ${metadata.titre}`);
          } catch (e) {
            // Ignorer si pas de metadata
          }
        }
        console.log('');
      }
    } catch (error) {
      console.error('❌ Erreur listing corpus:', error.message);
    }
    process.exit(0);
  }
  
  // Exécuter la rédaction
  const agent = new AgentRedacteurFactuel();
  
  try {
    console.log(`
🚀 AGENT RÉDACTEUR FACTUEL
==========================
`);
    
    // Charger le corpus
    const corpusCharge = await agent.chargerCorpus(args[0]);
    if (!corpusCharge) {
      throw new Error('Impossible de charger le corpus');
    }
    
    // Générer le plan
    const plan = await agent.genererPlanFactuel();
    
    // Générer l'article
    console.time('⏱️ Temps de rédaction');
    const article = await agent.genererArticle(plan);
    console.timeEnd('⏱️ Temps de rédaction');
    
    // Sauvegarder
    const resultat = await agent.sauvegarder(article, plan.titre);
    
    console.log(`\n📊 Statistiques :`);
    console.log(`   - Mots : ${resultat.rapport.nombreMots}`);
    console.log(`   - Sources utilisées : ${resultat.rapport.nombreSources}`);
    console.log(`   - Score qualité corpus : ${agent.corpus.metadata.scoreQualite.toFixed(2)}`);
    
  } catch (error) {
    console.error('\n❌ Erreur :', error.message);
    process.exit(1);
  }
}

// Export pour utilisation dans le pipeline
module.exports = AgentRedacteurFactuel;

// Lancer si exécuté directement
if (require.main === module) {
  main();
}