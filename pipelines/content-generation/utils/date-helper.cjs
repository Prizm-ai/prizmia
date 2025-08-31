// utils/date-helper.js - Utilitaires pour la gestion des dates et dossiers

const path = require('path');
const fs = require('fs').promises;

class DateHelper {
  // Obtenir le numéro de semaine
  static getWeekNumber(date = new Date()) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // Formater une date en YYYY-MM-DD
  static formatDate(date = new Date()) {
    return date.toISOString().split('T')[0];
  }

  // Obtenir le nom du mois en français
  static getMonthNameFr(date = new Date()) {
    return date.toLocaleDateString('fr-FR', { month: 'long' });
  }

  // Créer la structure de dossiers avec dates
  static async createDateBasedPaths(baseDir, date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const monthName = this.getMonthNameFr(date);
    const day = String(date.getDate()).padStart(2, '0');
    const week = this.getWeekNumber(date);
    
    const paths = {
      veille: path.join(baseDir, '01-veille', `${year}`, `${month}-${monthName}`, `${year}-${month}-${day}`),
      brouillons: path.join(baseDir, '02-brouillons', `${year}`, `semaine-${week}`),
      detection: path.join(baseDir, '03-detection', `${year}`, `${month}-${monthName}`),
      corrections: path.join(baseDir, '04-corrections', `${year}`, `${month}-${monthName}`),
      final: path.join(baseDir, '05-articles-finaux', `${year}`, `${month}-${monthName}`),
      rapports: path.join(baseDir, '06-rapports', `${year}`, `semaine-${week}`),
      archives: path.join(baseDir, '07-archives', `${year}`, `${month}-${monthName}`, `${year}-${month}-${day}`)
    };

    // Créer tous les dossiers
    for (const [key, folderPath] of Object.entries(paths)) {
      await fs.mkdir(folderPath, { recursive: true });
    }

    return paths;
  }

  // Obtenir le chemin pour un type spécifique
  static async getPathForType(baseDir, type, date = new Date()) {
    const paths = await this.createDateBasedPaths(baseDir, date);
    return paths[type] || null;
  }
}

module.exports = DateHelper;
