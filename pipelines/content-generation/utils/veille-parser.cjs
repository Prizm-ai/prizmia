// veille-parser-fixed.js - Parser universel corrigé v4
const fs = require('fs').promises;
const path = require('path');

class VeilleParserFixed {
  async parseVeilleFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Détecter le format du fichier
      if (content.includes('### Sources vérifiées')) {
        // Format v4 avec sources enrichies
        return this.parseFormatV4(filePath, content);
      } else if (content.includes('## 1.') || content.includes('## 2.')) {
        // Format v3 avec ## N.
        return this.parseFormatV3(filePath, content);
      } else if (content.includes('**1.') || content.includes('**2.')) {
        // Format v1/v2 avec **N.
        return this.parseFormatV1(filePath, content);
      } else {
        console.warn(`Format non reconnu pour ${filePath}`);
        return {
          fichier: path.basename(filePath),
          date: this.extractDateFromFilename(filePath),
          nombreSujets: 0,
          sujets: []
        };
      }
    } catch (error) {
      console.error(`Erreur parsing ${filePath}:`, error.message);
      return null;
    }
  }

  // Parser pour format v4 (avec sources vérifiées)
  parseFormatV4(filePath, content) {
    const sujets = [];
    
    // Regex adaptée pour le format v4
    const regexSujet = /## (\d+)\. (.+?)(?=\n## \d+\.|$)/gs;
    
    let match;
    while ((match = regexSujet.exec(content)) !== null) {
      const numero = parseInt(match[1]);
      const titre = match[2].trim();
      const startIndex = match.index;
      
      // Trouver la fin de ce sujet
      const nextMatch = regexSujet.exec(content);
      const endIndex = nextMatch ? nextMatch.index : content.length;
      regexSujet.lastIndex = nextMatch ? nextMatch.index : content.length;
      
      const contenuSujet = content.substring(startIndex, endIndex);
      
      // Extraire les informations du sujet
      const sujet = {
        numero,
        titre,
        description: '',
        sources: [],
        priorite: 'Moyenne',
        impact: '',
        angle: '',
        date: new Date()
      };
      
      // Extraire les sources vérifiées
      const sourcesMatch = contenuSujet.match(/\*\*Sources vérifiées\*\* : (\d+) sources.*?\n(.*?)(?=\n\*\*|$)/s);
      if (sourcesMatch) {
        const nbSources = parseInt(sourcesMatch[1]);
        const textesSources = sourcesMatch[2];
        
        // Extraire chaque source
        const regexSource = /\*\*Source \d+\*\* : (.+)/g;
        let sourceMatch;
        while ((sourceMatch = regexSource.exec(textesSources)) !== null) {
          sujet.sources.push(sourceMatch[1].trim());
        }
      }
      
      // Extraire les données clés
      const donneesMatch = contenuSujet.match(/\*\*Données clés\*\* :\s*\n((?:- .+\n?)+)/);
      if (donneesMatch) {
        sujet.description = donneesMatch[1].replace(/^- /gm, '').trim();
      }
      
      // Extraire l'angle Prizm
      const angleMatch = contenuSujet.match(/\*\*Angle Prizm\*\* : (.+)/);
      if (angleMatch) {
        sujet.angle = angleMatch[1].trim();
      }
      
      // Si pas de description, utiliser le début du contenu
      if (!sujet.description && contenuSujet.length > 200) {
        const lignes = contenuSujet.split('\n').filter(l => l.trim() && !l.startsWith('#'));
        sujet.description = lignes.slice(0, 3).join(' ').substring(0, 200);
      }
      
      // Déterminer la priorité basée sur le contenu
      this.determinerPriorite(sujet);
      
      sujets.push(sujet);
    }
    
    return {
      fichier: path.basename(filePath),
      date: this.extractDateFromFilename(filePath),
      nombreSujets: sujets.length,
      sujets: sujets
    };
  }

  // Parser pour format v3 (## N. titre)
  parseFormatV3(filePath, content) {
    const sujets = [];
    
    // Pour le format v3, chercher d'abord la structure exacte
    // Certains formats v3 ont une structure différente
    if (content.includes('### 🏷️')) {
      // Format v3 avec tags et structure spéciale
      return this.parseFormatV3Tagged(filePath, content);
    }
    
    // Format v3 standard
    const sections = content.split(/## \d+\.\s+/);
    
    sections.forEach((section, index) => {
      if (index === 0 || !section.trim()) return;
      
      const lines = section.split('\n').filter(l => l.trim());
      if (lines.length === 0) return;
      
      // Extraire le titre (première ligne)
      const titre = lines[0].replace(/\[.*?\]\s*/, '').trim();
      
      const sujet = {
        numero: index,
        titre: titre,
        description: '',
        sources: [],
        priorite: 'Moyenne',
        impact: '',
        angle: '',
        date: new Date()
      };
      
      // Parser le contenu structuré
      let currentSection = '';
      lines.forEach((line, lineIndex) => {
        if (lineIndex === 0) return;
        
        if (line.startsWith('**Résumé**')) {
          currentSection = 'resume';
        } else if (line.startsWith('**Impact business**')) {
          currentSection = 'impact';
        } else if (line.startsWith('**Pour qui**')) {
          currentSection = 'pourqui';
        } else if (line.startsWith('**Angle Prizm**')) {
          currentSection = 'angle';
        } else if (line.startsWith('**Sources**')) {
          currentSection = 'sources';
        } else if (line.startsWith('**Priorité**')) {
          currentSection = 'priorite';
        } else if (currentSection && !line.startsWith('**')) {
          const cleanLine = line.replace(/^[:\s-]+/, '').trim();
          
          switch (currentSection) {
            case 'resume':
              sujet.description += cleanLine + ' ';
              break;
            case 'impact':
              sujet.impact = cleanLine;
              break;
            case 'angle':
              sujet.angle = cleanLine.replace(/^["']+|["']+$/g, '');
              break;
            case 'sources':
              if (cleanLine.startsWith('[') || cleanLine.includes('](')) {
                sujet.sources.push(cleanLine);
              }
              break;
            case 'priorite':
              sujet.priorite = cleanLine.replace(/[\[\]]/g, '');
              break;
          }
        }
      });
      
      sujet.description = sujet.description.trim();
      
      if (!sujet.description && sujet.impact) {
        sujet.description = sujet.impact;
      }
      
      this.determinerPriorite(sujet);
      
      if (sujet.titre && (sujet.description || sujet.impact)) {
        sujets.push(sujet);
      }
    });
    
    return {
      fichier: path.basename(filePath),
      date: this.extractDateFromFilename(filePath),
      nombreSujets: sujets.length,
      sujets: sujets
    };
  }

  // Parser pour format v3 avec tags
  parseFormatV3Tagged(filePath, content) {
    const sujets = [];
    
    // Extraire chaque section avec tag
    const sections = content.split(/### 🏷️/);
    
    sections.forEach((section, index) => {
      if (index === 0) return; // Skip header
      
      const lines = section.split('\n').filter(l => l.trim());
      if (lines.length < 3) return;
      
      // La première ligne contient la catégorie
      const categorie = lines[0].trim();
      
      // Chercher les sujets dans cette section (format ## N.)
      const regexSujet = /## (\d+)\. (.+)/;
      
      for (let i = 1; i < lines.length; i++) {
        const match = lines[i].match(regexSujet);
        if (match) {
          const sujet = {
            numero: parseInt(match[1]),
            titre: match[2].trim(),
            description: '',
            sources: [],
            priorite: 'Moyenne',
            categorie: categorie,
            date: new Date()
          };
          
          // Collecter les lignes suivantes comme description
          for (let j = i + 1; j < lines.length && !lines[j].match(regexSujet); j++) {
            if (!lines[j].startsWith('#')) {
              sujet.description += lines[j] + ' ';
            }
          }
          
          sujet.description = sujet.description.trim();
          this.determinerPriorite(sujet);
          
          if (sujet.titre && sujet.description) {
            sujets.push(sujet);
          }
        }
      }
    });
    
    return {
      fichier: path.basename(filePath),
      date: this.extractDateFromFilename(filePath),
      nombreSujets: sujets.length,
      sujets: sujets
    };
  }

  // Parser pour format v1/v2 (**N. titre)
  parseFormatV1(filePath, content) {
    const sujets = [];
    const sections = content.split(/\*\*\d+\.\s+/);
    
    sections.forEach((section, index) => {
      if (index === 0 || !section.trim()) return;
      
      const lines = section.split('\n').filter(l => l.trim());
      if (lines.length === 0) return;
      
      const titleMatch = lines[0].match(/^([^*]+)/);
      const titre = titleMatch ? titleMatch[1].trim() : lines[0].trim();
      
      const sujet = {
        numero: index,
        titre: titre,
        description: '',
        sources: [],
        priorite: 'Moyenne',
        impact: '',
        angle: '',
        date: new Date()
      };
      
      lines.forEach((line, lineIndex) => {
        if (lineIndex === 0) return;
        const cleanLine = line.trim();
        
        if (cleanLine.includes('Impact business')) {
          sujet.impact = cleanLine.replace(/^[-*\s]*\*?Impact business[^:]*:?\*?\s*/i, '');
        } else if (cleanLine.includes('Pour qui')) {
          sujet.pourQui = cleanLine.replace(/^[-*\s]*\*?Pour qui[^:]*:?\*?\s*/i, '');
        } else if (cleanLine.includes('Angle Prizm')) {
          sujet.angle = cleanLine.replace(/^[-*\s]*\*?Angle Prizm[^:]*:?\*?\s*/i, '');
        } else if (cleanLine.includes('Sources')) {
          const sourcesText = cleanLine.replace(/^[-*\s]*\*?Sources[^:]*:?\*?\s*/i, '');
          sujet.sources = sourcesText.split(',').map(s => s.trim());
        }
      });
      
      if (!sujet.description && sujet.impact) {
        sujet.description = sujet.impact;
      }
      
      this.determinerPriorite(sujet);
      
      if (sujet.titre && (sujet.description || sujet.impact)) {
        sujets.push(sujet);
      }
    });
    
    return {
      fichier: path.basename(filePath),
      date: this.extractDateFromFilename(filePath),
      nombreSujets: sujets.length,
      sujets: sujets
    };
  }

  determinerPriorite(sujet) {
    if (sujet.priorite && sujet.priorite !== 'Moyenne') return;
    
    const texteComplet = (sujet.titre + ' ' + sujet.impact + ' ' + sujet.angle).toLowerCase();
    if (texteComplet.includes('roi') || texteComplet.includes('économi') || texteComplet.includes('coût')) {
      sujet.priorite = 'Haute';
    } else if (texteComplet.includes('conformité') || texteComplet.includes('réglement')) {
      sujet.priorite = 'Haute';
    }
  }
  
  extractDateFromFilename(filePath) {
    const filename = path.basename(filePath);
    const match = filename.match(/veille-(\d{4}-\d{2}-\d{2})/);
    return match ? new Date(match[1]) : new Date();
  }
  
  async parseAllVeilleFiles(folderPath) {
    try {
      const files = await fs.readdir(folderPath);
      const veilleFiles = files.filter(f => f.startsWith('veille-') && f.endsWith('.md'));
      
      console.log(`\n📄 Fichiers à analyser : ${veilleFiles.join(', ')}\n`);
      
      const results = [];
      for (const file of veilleFiles) {
        const result = await this.parseVeilleFile(path.join(folderPath, file));
        if (result) {
          console.log(`✓ ${file} : ${result.nombreSujets} sujets extraits`);
          results.push(result);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Erreur lecture dossier:', error.message);
      return [];
    }
  }
  
  consolidateSujets(veilleResults) {
    const allSujets = [];
    
    veilleResults.forEach(result => {
      result.sujets.forEach(sujet => {
        allSujets.push({
          ...sujet,
          source: result.fichier,
          dateVeille: result.date
        });
      });
    });
    
    return allSujets;
  }
}

module.exports = VeilleParserFixed;
