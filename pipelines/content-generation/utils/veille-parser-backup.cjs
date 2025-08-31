// utils/veille-parser.js - Parser universel v3

const fs = require('fs').promises;
const path = require('path');

class VeilleParser {
  async parseVeilleFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Détecter le format du fichier
      if (content.includes('**1.') || content.includes('**2.')) {
        // Format v1/v2 avec **N.
        return this.parseFormatV1(filePath, content);
      } else if (content.includes('## 1.') || content.includes('## 2.')) {
        // Format v3 avec ## N.
        return this.parseFormatV3(filePath, content);
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

  // Parser pour format v3 (## N. titre)
  parseFormatV3(filePath, content) {
    const sujets = [];
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

module.exports = VeilleParser;
