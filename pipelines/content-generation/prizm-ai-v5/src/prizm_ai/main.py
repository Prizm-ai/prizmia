"""
Point d'entrée principal de Prizm AI V5.

Exécute le workflow LangGraph complet pour générer et publier un article.

FUSION V4 : Ajout mode dirigé (--dirige, --titre, --angle, --keywords)
            et historique anti-répétition des sujets.
"""

import asyncio
import sys
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, List

from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

from prizm_ai.graph import create_workflow, create_initial_state, GraphState
from prizm_ai.config import settings


console = Console()


# -----------------
# FUSION V4 : Gestion historique anti-répétition
# -----------------

def charger_historique() -> List[str]:
    """
    Charge l'historique des sujets déjà traités (FUSION V4).
    
    Returns:
        Liste des slugs des sujets déjà traités
    """
    historique_path = settings.historique_path
    
    if not historique_path.exists():
        return []
    
    try:
        data = json.loads(historique_path.read_text(encoding="utf-8"))
        return data.get("sujets_traites", [])
    except (json.JSONDecodeError, IOError) as e:
        console.print(f"[yellow]⚠️ Erreur lecture historique: {e}[/yellow]")
        return []


def sauvegarder_historique(sujets: List[str]) -> None:
    """
    Sauvegarde l'historique des sujets traités (FUSION V4).
    
    Args:
        sujets: Liste des slugs à sauvegarder
    """
    historique_path = settings.historique_path
    
    # Créer le dossier parent si nécessaire
    historique_path.parent.mkdir(parents=True, exist_ok=True)
    
    data = {
        "derniere_maj": datetime.now().isoformat(),
        "sujets_traites": sujets
    }
    
    try:
        historique_path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False),
            encoding="utf-8"
        )
    except IOError as e:
        console.print(f"[yellow]⚠️ Erreur sauvegarde historique: {e}[/yellow]")


def ajouter_a_historique(slug: str, historique: List[str]) -> List[str]:
    """
    Ajoute un slug à l'historique s'il n'existe pas (FUSION V4).
    
    Args:
        slug: Slug du sujet traité
        historique: Historique actuel
    
    Returns:
        Historique mis à jour
    """
    if slug and slug not in historique:
        historique.append(slug)
    return historique


async def run_pipeline(
    verbose: bool = False,
    mode_dirige: bool = False,
    titre: Optional[str] = None,
    angle: Optional[str] = None,
    keywords: Optional[str] = None
) -> GraphState:
    """
    Exécute le pipeline complet (FUSION V4).
    
    Args:
        verbose: Afficher les détails
        mode_dirige: Activer le mode dirigé
        titre: Titre du sujet (requis si mode_dirige)
        angle: Angle éditorial
        keywords: Mots-clés pour la recherche
        
    Returns:
        État final du workflow
    """
    # Affichage du mode
    mode_label = "DIRIGÉ" if mode_dirige else "AUTO"
    
    console.print(Panel.fit(
        f"[bold blue]🚀 PRIZM AI V5[/bold blue]\n"
        f"Pipeline de génération d'articles B2B\n"
        f"[dim]Mode: {mode_label}[/dim]",
        border_style="blue"
    ))
    
    # Vérifier la configuration
    console.print("\n[dim]Vérification configuration...[/dim]")
    
    if not settings.anthropic_api_key:
        console.print("[red]❌ ANTHROPIC_API_KEY manquante[/red]")
        sys.exit(1)
    
    if not settings.perplexity_api_key:
        console.print("[red]❌ PERPLEXITY_API_KEY manquante[/red]")
        sys.exit(1)
    
    console.print("[green]✓ Configuration OK[/green]\n")
    
    # FUSION V4 : Charger l'historique
    historique = charger_historique()
    console.print(f"[dim]Historique: {len(historique)} sujets déjà traités[/dim]")
    
    # FUSION V4 : Préparer le sujet imposé si mode dirigé
    sujet_impose = None
    if mode_dirige and titre:
        sujet_impose = {
            "titre": titre,
            "angle": angle or "Approche pratique pour PME/ETI",
            "keywords": keywords or "PME, ETI, IA, France, 2025",
            "category": "actualites"
        }
        console.print(f"[cyan]🎯 Sujet imposé: {titre}[/cyan]")
    
    # Créer le workflow
    workflow = create_workflow()
    initial_state = create_initial_state(
        mode_veille="DIRIGE" if mode_dirige else "AUTO",
        sujet_impose=sujet_impose,
        historique_sujets=historique
    )
    
    console.print(f"[dim]Session: {initial_state['session_id']}[/dim]\n")
    
    # Exécuter avec affichage progression
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        
        task = progress.add_task("Démarrage...", total=None)
        
        # Exécuter le workflow
        final_state = None
        
        async for event in workflow.astream(initial_state):
            # Récupérer le nom du nœud exécuté
            node_name = list(event.keys())[0]
            
            # Mapping des noms pour affichage
            display_names = {
                "veille": "🔍 Veille IA...",
                "analyse": "🎯 Analyse des sujets...",
                "redaction": "✍️  Rédaction article...",
                "critique": "📊 Évaluation qualité...",
                "revision": "🔄 Révision...",
                "visuels": "🎨 Génération visuels...",
                "publish": "🚀 Publication...",
                "reject": "❌ Rejet article",
                "no_subject": "⚠️  Aucun sujet trouvé"
            }
            
            display = display_names.get(node_name, node_name)
            progress.update(task, description=display)
            
            # Stocker l'état
            final_state = event[node_name]
            
            # Afficher le score si disponible
            if node_name == "critique" and verbose:
                score = final_state.get("score", 0)
                console.print(f"   [dim]Score: {score}/10[/dim]")
    
    # Afficher le résumé
    console.print("\n")
    display_summary(final_state)
    
    # Sauvegarder le rapport
    save_report(final_state)
    
    # FUSION V4 : Mettre à jour l'historique si sujet traité
    sujet_traite = final_state.get("sujet_selectionne", {})
    if sujet_traite and sujet_traite.get("titre"):
        from prizm_ai.graph.state import slugify
        slug = slugify(sujet_traite["titre"])
        historique_maj = ajouter_a_historique(slug, historique)
        sauvegarder_historique(historique_maj)
        console.print(f"[dim]Historique mis à jour: {len(historique_maj)} sujets[/dim]")
    
    return final_state


def display_summary(state: GraphState):
    """Affiche le résumé de la session."""
    
    # Gestion du cas où state est None
    if not state:
        console.print("[red]❌ Aucun état retourné par le pipeline[/red]")
        return
    
    table = Table(title="📊 Résumé Session", border_style="blue")
    table.add_column("Métrique", style="cyan")
    table.add_column("Valeur", style="white")
    
    sujet = state.get("sujet_selectionne") or {}
    
    table.add_row("Sujet", sujet.get("titre", "N/A")[:50] if sujet else "Aucun sujet")
    table.add_row("Type", state.get("type_article", "N/A"))
    table.add_row("Score", f"{state.get('score', 0)}/10")
    table.add_row("Révisions", str(state.get("revision_count", 0)))
    table.add_row("Publié", "✓" if state.get("published") else "✗")
    
    if state.get("url"):
        table.add_row("URL", state["url"])
    
    console.print(table)
    
    # Erreurs
    errors = state.get("errors", [])
    if errors:
        console.print("\n[red]Erreurs:[/red]")
        for err in errors:
            console.print(f"  • {err}")
    
    # Logs (si verbose)
    if settings.debug:
        logs = state.get("logs", [])
        if logs:
            console.print("\n[dim]Logs:[/dim]")
            for log in logs[-10:]:  # Derniers 10
                console.print(f"  {log}")


def save_report(state: GraphState):
    """Sauvegarde le rapport de session."""
    import json
    
    report_dir = settings.output_path / "reports"
    report_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    report_path = report_dir / f"session-{timestamp}.json"
    
    # Préparer le rapport
    report = {
        "session_id": state.get("session_id"),
        "timestamp": datetime.now().isoformat(),
        "sujet": state.get("sujet_selectionne", {}),
        "type_article": state.get("type_article"),
        "score": state.get("score"),
        "scores_detail": state.get("scores_detail", {}),
        "revision_count": state.get("revision_count"),
        "published": state.get("published"),
        "url": state.get("url"),
        "filepath": state.get("filepath"),
        "errors": state.get("errors", []),
        "logs": state.get("logs", [])
    }
    
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    console.print(f"\n[dim]Rapport: {report_path}[/dim]")


def main():
    """
    Point d'entrée CLI (FUSION V4).
    
    Arguments ajoutés :
    - --dirige : Active le mode dirigé
    - --titre : Titre du sujet (requis avec --dirige)
    - --angle : Angle éditorial
    - --keywords : Mots-clés pour la recherche
    """
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Prizm AI V5 - Génération d'articles B2B",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples:
  # Mode automatique (défaut)
  python -m prizm_ai.main
  
  # Mode dirigé (imposer un sujet)
  python -m prizm_ai.main --dirige --titre "IA générative pour PME en 2025"
  
  # Mode dirigé avec angle et mots-clés
  python -m prizm_ai.main --dirige \\
    --titre "Comparatif outils IA" \\
    --angle "Focus coûts et ROI" \\
    --keywords "PME, outils IA, budget, ROI"
"""
    )
    
    # Arguments existants
    parser.add_argument("--verbose", "-v", action="store_true", help="Mode verbeux")
    parser.add_argument("--test", "-t", action="store_true", help="Mode test (sans publication)")
    
    # FUSION V4 : Arguments mode dirigé
    parser.add_argument("--dirige", action="store_true", help="Mode dirigé (imposer un sujet)")
    parser.add_argument("--titre", type=str, help="Titre du sujet (requis avec --dirige)")
    parser.add_argument("--angle", type=str, help="Angle éditorial pour le sujet")
    parser.add_argument("--keywords", type=str, help="Mots-clés pour la recherche Perplexity")
    
    args = parser.parse_args()
    
    # Validation mode dirigé
    if args.dirige and not args.titre:
        parser.error("--titre est requis avec --dirige")
    
    if args.verbose:
        settings.debug = True
    
    # Exécuter le pipeline
    asyncio.run(run_pipeline(
        verbose=args.verbose,
        mode_dirige=args.dirige,
        titre=args.titre,
        angle=args.angle,
        keywords=args.keywords
    ))


def test_run():
    """Point d'entrée pour les tests."""
    console.print("[yellow]Mode test - Vérification configuration[/yellow]\n")
    
    console.print("Configuration:")
    console.print(f"  Anthropic: {'✓' if settings.anthropic_api_key else '✗'}")
    console.print(f"  OpenAI: {'✓' if settings.openai_api_key else '✗'}")
    console.print(f"  Perplexity: {'✓' if settings.perplexity_api_key else '✗'}")
    console.print(f"  LangSmith: {'✓' if settings.langchain_api_key else '✗ (optionnel)'}")
    console.print(f"\nChemins:")
    console.print(f"  Blog: {settings.blog_path}")
    console.print(f"  Images: {settings.images_path}")
    console.print(f"  Valid: {'✓' if settings.validate_paths() else '✗'}")


if __name__ == "__main__":
    main()
