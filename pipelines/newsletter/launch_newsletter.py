#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 LANCEUR NEWSLETTER PRIZM AI
===============================
Script principal pour générer la newsletter multi-agents
"""

import os
import sys
from datetime import datetime

def main():
    print("🚀 LANCEMENT NEWSLETTER PRIZM AI")
    print("=" * 40)
    print(f"📅 Date: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print()
    
    try:
        # Import des modules
        print("📦 Chargement des modules...")
        from agents.orchestrator import Orchestrator
        print("✓ Orchestrator chargé")
        
        # Création de l'orchestrator
        orchestrator = Orchestrator()
        print("✓ Orchestrator initialisé")
        print()
        
        # Génération de la newsletter
        print("🤖 Génération de la newsletter en cours...")
        print("-" * 40)
        
        resultat = orchestrator.generer_newsletter_complete()
        
        print()
        print("=" * 40)
        print("🎉 NEWSLETTER GÉNÉRÉE AVEC SUCCÈS !")
        print("=" * 40)
        
        # Affichage du résultat
        if resultat:
            print("📄 Contenu généré:")
            print("-" * 20)
            print(resultat[:500] + "..." if len(resultat) > 500 else resultat)
        
        # Recherche des fichiers de sortie
        print()
        print("📁 Fichiers générés:")
        
        # Chercher les fichiers HTML récents
        for file in os.listdir('.'):
            if file.endswith('.html') and 'newsletter' in file.lower():
                print(f"  ✓ {file}")
        
        # Chercher les previews
        for file in os.listdir('.'):
            if file.startswith('preview_') and file.endswith('.html'):
                print(f"  ✓ {file}")
                
        print()
        print("🌐 Pour voir le résultat, ouvrez les fichiers HTML générés")
        print("🔗 Blog: https://prizm-ai.netlify.app/")
        
    except ImportError as e:
        print(f"❌ Erreur d'import: {e}")
        print("💡 Vérifiez que tous les modules sont présents")
        return 1
        
    except Exception as e:
        print(f"❌ Erreur lors de la génération: {e}")
        print("💡 Vérifiez la configuration des agents")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())