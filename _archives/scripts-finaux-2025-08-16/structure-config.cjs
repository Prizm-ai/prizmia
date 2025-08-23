// structure-config.cjs
// Configuration UNIQUE de la structure - NE JAMAIS DUPLIQUER

const STRUCTURE_PRIZM = {
  base: './output',
  
  // Structure définitive - NE PAS MODIFIER
  dossiers: {
    veille: '01-veille',
    corpus: '02-corpus',
    factuels: '03-articles-factuels',
    conversationnels: '04-articles-conversationnels',
    finaux: '05-articles-finaux',
    rapports: '06-rapports',
    archives: '07-archives'
  },
  
  // Méthodes helper
  getPath: function(type) {
    return path.join(this.base, this.dossiers[type]);
  },
  
  // Pour la compatibilité avec l'existant
  getOutputDir: function(agent) {
    switch(agent) {
      case 'veille':
        return this.getPath('veille');
      case 'redacteurFactuel':
        return this.getPath('factuels');
      case 'styleConversationnel':
        return this.getPath('conversationnels');
      default:
        return this.base;
    }
  }
};

module.exports = STRUCTURE_PRIZM;