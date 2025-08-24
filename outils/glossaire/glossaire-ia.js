// Glossaire IA - JavaScript Principal

// État de l'application
let currentTerms = [...glossaryTerms];
let currentFilter = {
    search: '',
    letter: 'all',
    category: 'all'
};
let viewedTerms = new Set();

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeGlossary();
    loadUserData();
    renderTerms();
    initializeEventListeners();
    updateStats();
});

// Initialisation du glossaire
function initializeGlossary() {
    // Trier les termes par ordre alphabétique
    glossaryTerms.sort((a, b) => a.term.localeCompare(b.term));
    
    // Afficher un fait aléatoire
    newFunFact();
}

// Chargement des données utilisateur
function loadUserData() {
    const saved = localStorage.getItem('glossaryViewed');
    if (saved) {
        viewedTerms = new Set(JSON.parse(saved));
        document.getElementById('viewCount').textContent = viewedTerms.size;
    }
}

// Sauvegarde des données utilisateur
function saveUserData() {
    localStorage.setItem('glossaryViewed', JSON.stringify([...viewedTerms]));
}

// Initialisation des écouteurs d'événements
function initializeEventListeners() {
    // Recherche
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    
    searchInput.addEventListener('input', function(e) {
        currentFilter.search = e.target.value.toLowerCase();
        clearSearch.style.display = e.target.value ? 'block' : 'none';
        filterTerms();
    });
    
    clearSearch.addEventListener('click', function() {
        searchInput.value = '';
        currentFilter.search = '';
        this.style.display = 'none';
        filterTerms();
    });
    
    // Navigation alphabétique
    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.letter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter.letter = this.dataset.letter;
            filterTerms();
        });
    });
    
    // Filtres de catégorie
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter.category = this.dataset.category;
            filterTerms();
        });
    });
    
    // Terme aléatoire
    document.getElementById('randomTerm').addEventListener('click', function() {
        const randomIndex = Math.floor(Math.random() * glossaryTerms.length);
        showTermDetail(glossaryTerms[randomIndex]);
    });
    
    // Fermeture du modal au clic en dehors
    document.getElementById('termModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Raccourcis clavier
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
        if (e.key === '/' && !searchInput.matches(':focus')) {
            e.preventDefault();
            searchInput.focus();
        }
    });
}

// Filtrage des termes
function filterTerms() {
    currentTerms = glossaryTerms.filter(term => {
        // Filtre de recherche
        if (currentFilter.search) {
            const searchLower = currentFilter.search.toLowerCase();
            const termMatch = term.term.toLowerCase().includes(searchLower);
            const defMatch = term.definition.toLowerCase().includes(searchLower);
            const catMatch = term.category.toLowerCase().includes(searchLower);
            if (!termMatch && !defMatch && !catMatch) return false;
        }
        
        // Filtre alphabétique
        if (currentFilter.letter !== 'all') {
            if (!term.term.toUpperCase().startsWith(currentFilter.letter)) return false;
        }
        
        // Filtre de catégorie
        if (currentFilter.category !== 'all') {
            if (term.category !== currentFilter.category) return false;
        }
        
        return true;
    });
    
    renderTerms();
    updateResultsInfo();
}

// Affichage des termes
function renderTerms() {
    const grid = document.getElementById('termsGrid');
    const noResults = document.getElementById('noResults');
    
    if (currentTerms.length === 0) {
        grid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    noResults.style.display = 'none';
    
    grid.innerHTML = currentTerms.map(term => createTermCard(term)).join('');
    
    // Ajouter les écouteurs aux cartes
    document.querySelectorAll('.term-card').forEach(card => {
        card.addEventListener('click', function() {
            const termId = parseInt(this.dataset.termId);
            const term = glossaryTerms.find(t => t.id === termId);
            if (term) showTermDetail(term);
        });
    });
}

// Création d'une carte de terme
function createTermCard(term) {
    const isViewed = viewedTerms.has(term.id);
    const categoryLabels = {
        'fondamentaux': 'Fondamentaux',
        'machine-learning': 'ML',
        'deep-learning': 'Deep Learning',
        'nlp': 'NLP',
        'computer-vision': 'Vision',
        'generative': 'IA Générative',
        'ethique': 'Éthique',
        'business': 'Business',
        'technique': 'Technique',
        'data': 'Données',
        'recherche': 'Recherche'
    };
    
    return `
        <div class="term-card ${isViewed ? 'viewed' : ''}" data-term-id="${term.id}">
            <div class="term-header">
                <h3 class="term-title">${highlightSearch(term.term)}</h3>
                <span class="term-category">${categoryLabels[term.category] || term.category}</span>
            </div>
            <p class="term-definition">${highlightSearch(term.definition)}</p>
            <div class="term-meta">
                <div class="difficulty">
                    ${generateDifficulty(term.difficulty)}
                </div>
                <span class="view-more">Voir plus →</span>
            </div>
        </div>
    `;
}

// Génération des indicateurs de difficulté
function generateDifficulty(level) {
    let dots = '';
    for (let i = 1; i <= 3; i++) {
        dots += `<span class="difficulty-dot ${i <= level ? 'filled' : ''}"></span>`;
    }
    return dots;
}

// Mise en surbrillance de la recherche
function highlightSearch(text) {
    if (!currentFilter.search) return text;
    
    const regex = new RegExp(`(${currentFilter.search})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Affichage détaillé d'un terme
function showTermDetail(term) {
    const modal = document.getElementById('termModal');
    
    // Marquer comme vu
    viewedTerms.add(term.id);
    saveUserData();
    updateStats();
    
    // Remplir le modal
    document.getElementById('modalTitle').textContent = term.term;
    document.getElementById('modalDefinition').textContent = term.definition;
    
    // Catégorie
    const categoryLabels = {
        'fondamentaux': '🎯 Fondamentaux',
        'machine-learning': '🤖 Machine Learning',
        'deep-learning': '🧠 Deep Learning',
        'nlp': '💬 NLP',
        'computer-vision': '👁️ Vision',
        'generative': '🎨 IA Générative',
        'ethique': '⚖️ Éthique',
        'business': '💼 Business',
        'technique': '⚙️ Technique',
        'data': '📊 Données',
        'recherche': '🔬 Recherche'
    };
    document.getElementById('modalCategory').textContent = categoryLabels[term.category] || term.category;
    
    // Exemple
    const exampleSection = document.getElementById('exampleSection');
    if (term.example) {
        exampleSection.style.display = 'block';
        document.getElementById('modalExample').textContent = term.example;
    } else {
        exampleSection.style.display = 'none';
    }
    
    // Termes connexes
    const relatedSection = document.getElementById('relatedSection');
    if (term.related && term.related.length > 0) {
        relatedSection.style.display = 'block';
        document.getElementById('modalRelated').innerHTML = term.related.map(rel => 
            `<span class="related-term" onclick="searchTerm('${rel}')">${rel}</span>`
        ).join('');
    } else {
        relatedSection.style.display = 'none';
    }
    
    // Section technique
    const technicalSection = document.getElementById('technicalSection');
    if (term.technical) {
        technicalSection.style.display = 'block';
        document.getElementById('modalTechnical').textContent = term.technical;
    } else {
        technicalSection.style.display = 'none';
    }
    
    // Afficher le modal
    modal.style.display = 'flex';
    
    // Stocker le terme actuel pour les actions
    modal.dataset.currentTerm = JSON.stringify(term);
    
    // Analytics
    trackTermView(term);
}

// Fermeture du modal
function closeModal() {
    document.getElementById('termModal').style.display = 'none';
    renderTerms(); // Re-render pour montrer les termes vus
}

// Recherche d'un terme spécifique
function searchTerm(termName) {
    closeModal();
    const searchInput = document.getElementById('searchInput');
    searchInput.value = termName;
    currentFilter.search = termName.toLowerCase();
    document.getElementById('clearSearch').style.display = 'block';
    filterTerms();
}

// Afficher un terme spécifique (depuis les termes populaires)
function showTerm(termName) {
    const term = glossaryTerms.find(t => 
        t.term.toLowerCase().includes(termName.toLowerCase())
    );
    if (term) {
        showTermDetail(term);
    }
}

// Mise à jour des informations de résultats
function updateResultsInfo() {
    const resultsCount = document.getElementById('resultsCount');
    const total = glossaryTerms.length;
    const shown = currentTerms.length;
    
    if (currentFilter.search || currentFilter.letter !== 'all' || currentFilter.category !== 'all') {
        resultsCount.textContent = `${shown} résultat${shown > 1 ? 's' : ''} sur ${total}`;
    } else {
        resultsCount.textContent = `Affichage de tous les termes (${total})`;
    }
}

// Mise à jour des statistiques
function updateStats() {
    document.getElementById('totalTerms').textContent = glossaryTerms.length;
    document.getElementById('viewCount').textContent = viewedTerms.size;
    
    // Compter les catégories uniques
    const categories = new Set(glossaryTerms.map(t => t.category));
    document.getElementById('categoriesCount').textContent = categories.size;
}

// Réinitialisation des filtres
function resetFilters() {
    currentFilter = {
        search: '',
        letter: 'all',
        category: 'all'
    };
    
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').style.display = 'none';
    
    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.letter === 'all') btn.classList.add('active');
    });
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === 'all') btn.classList.add('active');
    });
    
    filterTerms();
}

// Actions du modal
function copyDefinition() {
    const modal = document.getElementById('termModal');
    const term = JSON.parse(modal.dataset.currentTerm);
    
    const text = `${term.term}: ${term.definition}`;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Définition copiée !', 'success');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Définition copiée !', 'success');
    });
}

function shareDefinition() {
    const modal = document.getElementById('termModal');
    const term = JSON.parse(modal.dataset.currentTerm);
    
    const shareData = {
        title: term.term,
        text: term.definition,
        url: window.location.href + '#' + term.id
    };
    
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => showToast('Partagé avec succès !', 'success'))
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    copyShareLink(term);
                }
            });
    } else {
        copyShareLink(term);
    }
}

function copyShareLink(term) {
    const url = window.location.href + '#' + term.id;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Lien copié !', 'success');
    });
}

function reportIssue() {
    const modal = document.getElementById('termModal');
    const term = JSON.parse(modal.dataset.currentTerm);
    
    // Ouvrir un email ou un formulaire
    const subject = encodeURIComponent(`Problème avec le terme: ${term.term}`);
    const body = encodeURIComponent(`Je signale un problème avec la définition de "${term.term}" (ID: ${term.id})\n\nProblème:\n`);
    
    window.location.href = `mailto:contact@prizmai.com?subject=${subject}&body=${body}`;
    showToast('Merci pour votre signalement', 'success');
}

// Suggestion de terme
function suggestTerm() {
    const subject = encodeURIComponent('Suggestion de nouveau terme pour le glossaire');
    const body = encodeURIComponent('Terme suggéré:\n\nDéfinition proposée:\n\nCatégorie:\n');
    
    window.location.href = `mailto:contact@prizmai.com?subject=${subject}&body=${body}`;
}

// Export du glossaire
function downloadGlossary(format) {
    if (format === 'json') {
        const dataStr = JSON.stringify(glossaryTerms, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'glossaire-ia-prizmai.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showToast('Glossaire téléchargé en JSON', 'success');
    } else if (format === 'pdf') {
        // Pour le PDF, on redirige vers une page d'impression stylée
        window.print();
        showToast('Utilisez l\'option "Enregistrer en PDF" dans la boîte de dialogue d\'impression', 'success');
    }
}

// Nouveau fait amusant
function newFunFact() {
    const factElement = document.getElementById('funFact');
    const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
    factElement.textContent = randomFact;
}

// Notifications toast
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Analytics (à adapter selon votre solution)
function trackTermView(term) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'view_term', {
            event_category: 'Glossary',
            event_label: term.term,
            value: term.id
        });
    }
    console.log(`Terme consulté: ${term.term}`);
}

// Chargement d'un terme depuis l'URL
window.addEventListener('load', function() {
    const hash = window.location.hash;
    if (hash) {
        const termId = parseInt(hash.substring(1));
        const term = glossaryTerms.find(t => t.id === termId);
        if (term) {
            setTimeout(() => showTermDetail(term), 500);
        }
    }
});