// utils/selection-manager.js - Gestionnaire de sélection des sujets

const fs = require('fs').promises;
const path = require('path');
const VeilleParser = require('./veille-parser');
const SujetScorer = require('./sujet-scorer.cjs');
const DateHelper = require('./date-helper');

class SelectionManager {
  constructor(config = {}) {
    this.parser = new VeilleParser();
    this.scorer = new SujetScorer();
    this.config = {
      nombreArticlesParSession: config.nombreArticlesParSession || 3,
      scoreMinimum: config.scoreMinimum || 7,
      diversite: config.diversite !== false,
      joursHistorique: config.joursHistorique || 7
    };
  }

  async selectWeeklyTopics(baseDir) {
    console.log('\n?? Sélection hebdomadaire des sujets\n');
    
    const veilleFiles = await this.getRecentVeilleFiles(baseDir);
    console.log(`?? ${veilleFiles.length} fichiers de veille trouvés\n`);
    
    if (veilleFiles.length === 0) {
      console.log('?? Aucun fichier de veille récent');
      return [];
    }
    
    const allResults = [];
    for (const file of veilleFiles) {
      const result = await this.parser.parseVeilleFile(file);
      if (result) allResults.push(result);
    }
    
    const allSujets = this.parser.consolidateSujets(allResults);
    console.log(`?? Total : ${allSujets.length} sujets extraits\n`);
    
    const sujetsScores = this.scorer.rankSujets(allSujets);
    const sujetsEligibles = sujetsScores.filter(s => s.score >= this.config.scoreMinimum);
    console.log(`? ${sujetsEligibles.length} sujets avec score >= ${this.config.scoreMinimum}\n`);
    
    const selection = this.scorer.selectTop(
      sujetsEligibles, 
      this.config.nombreArticlesParSession,
      this.config.diversite
    );
    
    const rapport = await this.generateSelectionReport(selection, allSujets);
    
    return {
      selection,
      rapport,
      stats: {
        totalSujets: allSujets.length,
        sujetsEligibles: sujetsEligibles.length,
        sujetsSelectionnes: selection.length
      }
    };
  }

  async getRecentVeilleFiles(baseDir) {
    const veilleDir = path.join(baseDir, '01-veille');
    const files = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.joursHistorique);
    
    async function scanDir(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.name.startsWith('veille-') && entry.name.endsWith('.md')) {
            const stats = await fs.stat(fullPath);
            if (stats.mtime >= cutoffDate) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.error(`Erreur scan ${dir}:`, error.message);
      }
    }
    
    await scanDir(veilleDir);
    return files.sort();
  }

  async generateSelectionReport(selection, allSujets) {
    const rapport = {
      date: new Date().toISOString(),
      semaine: DateHelper.getWeekNumber(),
      selection: selection.map(s => ({
        titre: s.titre,
        score: s.score,
        priorite: s.priorite,
        categorie: this.scorer.detecterCategorie(s),
        angle: s.angle,
        source: s.source
      })),
      statistiques: {
        totalAnalyse: allSujets.length,
        scoreMoyenSelection: selection.reduce((acc, s) => acc + s.score, 0) / selection.length
      }
    };
    
    const rapportDir = await DateHelper.getPathForType(path.dirname(path.dirname(__dirname)), 'rapports');
    const rapportPath = path.join(rapportDir, `selection-semaine-${rapport.semaine}.json`);
    await fs.writeFile(rapportPath, JSON.stringify(rapport, null, 2));
    
    return rapport;
  }

  async interactiveSelection(baseDir) {
    const result = await this.selectWeeklyTopics(baseDir);
    
    if (result.selection.length === 0) {
      console.log('? Aucun sujet sélectionnable');
      return null;
    }
    
    console.log('\n?? SÉLECTION FINALE :');
    console.log('-'.repeat(60));
    
    result.selection.forEach((sujet, index) => {
      const cat = this.scorer.detecterCategorie(sujet);
      console.log(`\n${index + 1}. [${cat.toUpperCase()}] ${sujet.titre}`);
      console.log(`   Score : ${sujet.score} | Priorité : ${sujet.priorite}`);
      console.log(`   Angle : ${sujet.angle ? sujet.angle.substring(0, 80) : 'N/A'}`);
    });
    
    console.log('\n-'.repeat(60));
    console.log(`\n?? Rapport sauvegardé : selection-semaine-${result.rapport.semaine}.json`);
    
    return result;
  }
}

module.exports = SelectionManager;
