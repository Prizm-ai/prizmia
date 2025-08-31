// utils/sujet-scorer.js - Module de scoring et sélection des sujets

class SujetScorer {
  constructor() {
    // Poids des différents critères
    this.weights = {
      roi: 3,          // ROI mentionné
      cible: 2,        // PME/ETI ciblées
      sources: 2,      // Nombre de sources
      priorite: 3,     // Priorité haute
      actualite: 2,    // Fraîcheur < 3 jours
      actionnable: 3,  // Cas pratique/outil
      innovation: 1    // Nouveauté technologique
    };
  }

  // Calculer le score d'un sujet
  calculateScore(sujet) {
    let score = 0;
    const details = {};

    // Analyser le texte du sujet
    const texte = (sujet.titre + ' ' + sujet.description).toLowerCase();

    // Critère 1 : ROI et aspects financiers
    if (texte.match(/roi|retour sur investissement|économi|coût|budget|rentab|gain/)) {
      score += this.weights.roi;
      details.roi = true;
    }

    // Critère 2 : Cible PME/ETI
    if (texte.match(/pme|eti|petite|moyenne|entreprise/)) {
      score += this.weights.cible;
      details.ciblePME = true;
    }

    // Critère 3 : Nombre de sources
    const nbSources = sujet.sources ? sujet.sources.length : 0;
    if (nbSources >= 3) {
      score += this.weights.sources;
      details.sourcesMultiples = true;
    } else if (nbSources >= 2) {
      score += this.weights.sources * 0.5;
    }

    // Critère 4 : Priorité
    if (sujet.priorite === 'Haute') {
      score += this.weights.priorite;
    } else if (sujet.priorite === 'Moyenne') {
      score += this.weights.priorite * 0.5;
    }

    // Critère 5 : Actualité (moins de 3 jours)
    if (sujet.date) {
      const dateArticle = new Date(sujet.date);
      const joursEcoules = (new Date() - dateArticle) / (1000 * 60 * 60 * 24);
      if (joursEcoules <= 3) {
        score += this.weights.actualite;
        details.recent = true;
      }
    }

    // Critère 6 : Actionnable
    if (texte.match(/guide|tutoriel|comment|étape|méthode|outil|solution|cas pratique/)) {
      score += this.weights.actionnable;
      details.actionnable = true;
    }

    // Critère 7 : Innovation
    if (texte.match(/nouveau|lancement|annonce|innovation|révolution/)) {
      score += this.weights.innovation;
      details.innovant = true;
    }

    return {
      ...sujet,
      score: Math.round(score * 10) / 10, // Arrondir à 1 décimale
      scoreMax: Object.values(this.weights).reduce((a, b) => a + b, 0),
      details,
      timestamp: new Date().toISOString()
    };
  }

  // Classer une liste de sujets
  rankSujets(sujets) {
    return sujets
      .map(sujet => this.calculateScore(sujet))
      .sort((a, b) => b.score - a.score);
  }

  // Sélectionner les meilleurs sujets
  selectTop(sujets, nombre = 5, critereDiversite = true) {
    const sujetsScores = this.rankSujets(sujets);
    
    if (!critereDiversite) {
      return sujetsScores.slice(0, nombre);
    }

    // Sélection avec diversité
    const selected = [];
    const categories = new Set();
    
    for (const sujet of sujetsScores) {
      // Extraire une catégorie approximative
      const categorie = this.detecterCategorie(sujet);
      
      // Éviter trop de sujets dans la même catégorie
      if (!categories.has(categorie) || selected.length < nombre / 2) {
        selected.push(sujet);
        categories.add(categorie);
        
        if (selected.length >= nombre) break;
      }
    }

    // Compléter si nécessaire
    if (selected.length < nombre) {
      for (const sujet of sujetsScores) {
        if (!selected.includes(sujet)) {
          selected.push(sujet);
          if (selected.length >= nombre) break;
        }
      }
    }

    return selected;
  }

  // Détecter la catégorie d'un sujet
  detecterCategorie(sujet) {
    const texte = (sujet.titre + ' ' + sujet.description).toLowerCase();
    
    if (texte.match(/finance|budget|coût|subvention|aide/)) return 'finance';
    if (texte.match(/outil|solution|plateforme|logiciel|app/)) return 'outil';
    if (texte.match(/réglementation|loi|juridique|conformité/)) return 'reglementation';
    if (texte.match(/formation|compétence|talent|rh/)) return 'rh';
    if (texte.match(/cas|exemple|retour|expérience|témoignage/)) return 'cas-usage';
    if (texte.match(/étude|rapport|analyse|tendance/)) return 'analyse';
    
    return 'general';
  }

  // Générer un rapport de scoring
  generateReport(sujets) {
    const scored = this.rankSujets(sujets);
    
    return {
      date: new Date().toISOString(),
      totalSujets: sujets.length,
      scoreMax: Object.values(this.weights).reduce((a, b) => a + b, 0),
      distribution: {
        excellent: scored.filter(s => s.score >= 10).length,
        bon: scored.filter(s => s.score >= 7 && s.score < 10).length,
        moyen: scored.filter(s => s.score >= 5 && s.score < 7).length,
        faible: scored.filter(s => s.score < 5).length
      },
      top5: scored.slice(0, 5).map(s => ({
        titre: s.titre,
        score: s.score,
        details: s.details
      })),
      categories: this.analyserCategories(scored)
    };
  }

  // Analyser la distribution des catégories
  analyserCategories(sujets) {
    const categories = {};
    
    sujets.forEach(sujet => {
      const cat = this.detecterCategorie(sujet);
      categories[cat] = (categories[cat] || 0) + 1;
    });
    
    return categories;
  }
}

module.exports = SujetScorer;
