// Guide du Débutant - JavaScript

// Variables globales
let currentSection = 'intro';
const sections = ['intro', 'comprendre', 'applications', 'commencer', 'futur'];

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initProgressBar();
    trackReading();
    initAnalytics();
    loadUserProgress();
});

// Navigation entre sections
function initNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            showSection(targetSection);
            
            // Mise à jour de l'URL sans recharger la page
            history.pushState(null, null, `#${targetSection}`);
        });
    });
    
    // Gestion du bouton retour du navigateur
    window.addEventListener('popstate', function() {
        const hash = window.location.hash.slice(1) || 'intro';
        showSection(hash);
    });
    
    // Charger la section depuis l'URL si présente
    const initialSection = window.location.hash.slice(1) || 'intro';
    showSection(initialSection);
}

// Afficher une section spécifique
function showSection(sectionId) {
    // Cacher toutes les sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Désactiver tous les onglets
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Afficher la section demandée
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
        
        // Activer l'onglet correspondant
        const targetTab = document.querySelector(`.nav-tab[data-section="${sectionId}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Mettre à jour la barre de progression
        updateProgressBar();
        
        // Scroll vers le haut de la page
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Sauvegarder la progression
        saveUserProgress();
        
        // Analytics
        trackSectionView(sectionId);
    }
}

// Barre de progression
function initProgressBar() {
    updateProgressBar();
}

function updateProgressBar() {
    const currentIndex = sections.indexOf(currentSection);
    const progress = ((currentIndex + 1) / sections.length) * 100;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

// Tracking du temps de lecture
function trackReading() {
    let startTime = Date.now();
    let totalReadingTime = 0;
    
    // Enregistrer le temps passé sur chaque section
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            totalReadingTime += Date.now() - startTime;
            console.log(`Temps de lecture total: ${Math.round(totalReadingTime / 1000)} secondes`);
        } else {
            startTime = Date.now();
        }
    });
    
    // Enregistrer avant de quitter la page
    window.addEventListener('beforeunload', function() {
        totalReadingTime += Date.now() - startTime;
        localStorage.setItem('guideReadingTime', totalReadingTime);
    });
}

// Sauvegarde de la progression utilisateur
function saveUserProgress() {
    const progress = {
        currentSection: currentSection,
        sectionsVisited: getSectionsVisited(),
        lastVisit: new Date().toISOString(),
        completionPercentage: calculateCompletion()
    };
    
    localStorage.setItem('guideProgress', JSON.stringify(progress));
}

function loadUserProgress() {
    const savedProgress = localStorage.getItem('guideProgress');
    
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        
        // Afficher un message de bienvenue si c'est une revisite
        const lastVisit = new Date(progress.lastVisit);
        const daysSinceLastVisit = Math.floor((new Date() - lastVisit) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastVisit > 0 && daysSinceLastVisit < 30) {
            showWelcomeBack(progress.currentSection);
        }
    } else {
        // Première visite
        showFirstTimeMessage();
    }
}

function getSectionsVisited() {
    const visited = JSON.parse(localStorage.getItem('sectionsVisited') || '[]');
    if (!visited.includes(currentSection)) {
        visited.push(currentSection);
        localStorage.setItem('sectionsVisited', JSON.stringify(visited));
    }
    return visited;
}

function calculateCompletion() {
    const visited = getSectionsVisited();
    return Math.round((visited.length / sections.length) * 100);
}

// Messages personnalisés
function showWelcomeBack(lastSection) {
    const message = document.createElement('div');
    message.className = 'welcome-message';
    message.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: var(--primary-color); 
                    color: white; padding: 15px 20px; border-radius: 10px; z-index: 1000;
                    animation: slideIn 0.5s ease;">
            👋 Bon retour ! Voulez-vous reprendre où vous en étiez ?
            <button onclick="showSection('${lastSection}')" 
                    style="margin-left: 10px; background: white; color: var(--primary-color); 
                           border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer;">
                Reprendre
            </button>
            <button onclick="this.parentElement.remove()" 
                    style="margin-left: 5px; background: transparent; color: white; 
                           border: 1px solid white; padding: 5px 15px; border-radius: 5px; cursor: pointer;">
                Fermer
            </button>
        </div>
    `;
    document.body.appendChild(message);
    
    // Auto-fermeture après 10 secondes
    setTimeout(() => {
        if (message.parentElement) {
            message.remove();
        }
    }, 10000);
}

function showFirstTimeMessage() {
    console.log('Bienvenue sur le Guide du Débutant IA !');
    // Pourrait afficher un tutoriel ou des tips
}

// Fonction de partage
function shareGuide() {
    const shareData = {
        title: 'Guide du Débutant IA - Prizm AI',
        text: 'Découvrez l\'Intelligence Artificielle en 5 minutes avec ce guide simple et pratique !',
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => {
                console.log('Guide partagé avec succès');
                trackEvent('share', 'guide', 'native');
            })
            .catch((error) => console.log('Erreur de partage:', error));
    } else {
        // Fallback : copier le lien
        copyToClipboard(window.location.href);
        showNotification('Lien copié ! Vous pouvez le partager.');
        trackEvent('share', 'guide', 'clipboard');
    }
}

// Utilitaires
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--success-color);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 1000;
        animation: slideUp 0.5s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Analytics (à adapter selon votre solution)
function initAnalytics() {
    // Si Google Analytics est installé
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_title: 'Guide du Débutant IA',
            page_path: '/outils/guide-debutant'
        });
    }
}

function trackSectionView(sectionId) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'view_section', {
            event_category: 'Guide',
            event_label: sectionId,
            value: sections.indexOf(sectionId) + 1
        });
    }
    
    // Tracking personnalisé
    console.log(`Section vue: ${sectionId}`);
}

function trackEvent(action, category, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label
        });
    }
}

// Animations CSS supplémentaires
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translate(-50%, 100%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Raccourcis clavier
document.addEventListener('keydown', function(e) {
    const currentIndex = sections.indexOf(currentSection);
    
    // Flèche droite : section suivante
    if (e.key === 'ArrowRight' && currentIndex < sections.length - 1) {
        showSection(sections[currentIndex + 1]);
    }
    
    // Flèche gauche : section précédente
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
        showSection(sections[currentIndex - 1]);
    }
    
    // Échap : retour à la boîte à outils
    if (e.key === 'Escape') {
        window.location.href = '/outils';
    }
});

// Détection de la fin de lecture
window.addEventListener('scroll', function() {
    const scrollPercentage = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
    
    if (scrollPercentage > 0.95 && currentSection === 'futur') {
        // L'utilisateur a terminé le guide
        if (!localStorage.getItem('guideCompleted')) {
            localStorage.setItem('guideCompleted', 'true');
            trackEvent('complete', 'guide', 'full_read');
            
            // Optionnel : afficher un badge ou une récompense
            setTimeout(() => {
                showNotification('🎉 Félicitations ! Vous avez terminé le guide !');
            }, 1000);
        }
    }
});