// Glossaire IA - Base de données des termes
// Cette base peut être remplacée par un appel API ou un fichier JSON externe

const glossaryTerms = [
    // Fondamentaux
    {
        id: 1,
        term: "Intelligence Artificielle (IA)",
        definition: "Ensemble de technologies permettant aux machines de simuler l'intelligence humaine, incluant l'apprentissage, le raisonnement et l'auto-correction.",
        category: "fondamentaux",
        difficulty: 1,
        example: "Siri, Alexa et les recommandations Netflix sont des exemples d'IA au quotidien.",
        related: ["Machine Learning", "Deep Learning", "AGI"],
        technical: "L'IA moderne repose principalement sur l'apprentissage automatique et les réseaux de neurones profonds."
    },
    {
        id: 2,
        term: "Machine Learning",
        definition: "Sous-domaine de l'IA où les machines apprennent à partir de données sans être explicitement programmées pour chaque tâche.",
        category: "machine-learning",
        difficulty: 2,
        example: "Un système de ML peut apprendre à reconnaître des chats dans des photos après avoir vu des milliers d'exemples.",
        related: ["Deep Learning", "Supervised Learning", "Neural Network"],
        technical: "Utilise des algorithmes statistiques pour identifier des patterns dans les données."
    },
    {
        id: 3,
        term: "Deep Learning",
        definition: "Technique de machine learning utilisant des réseaux de neurones artificiels à plusieurs couches pour traiter des données complexes.",
        category: "deep-learning",
        difficulty: 3,
        example: "La reconnaissance faciale de votre smartphone utilise le deep learning.",
        related: ["Neural Network", "CNN", "RNN", "Transformer"]
    },
    {
        id: 4,
        term: "Neural Network",
        definition: "Système informatique inspiré du cerveau humain, composé de nœuds interconnectés (neurones) organisés en couches.",
        category: "deep-learning",
        difficulty: 3,
        example: "Un réseau de neurones peut apprendre à jouer aux échecs en analysant des millions de parties.",
        related: ["Deep Learning", "Perceptron", "Backpropagation"]
    },
    {
        id: 5,
        term: "Algorithm",
        definition: "Ensemble d'instructions étape par étape pour résoudre un problème ou accomplir une tâche spécifique.",
        category: "fondamentaux",
        difficulty: 1,
        example: "L'algorithme de recherche Google classe les pages web selon leur pertinence.",
        related: ["Machine Learning", "Optimization"]
    },
    {
        id: 6,
        term: "Dataset",
        definition: "Collection structurée de données utilisée pour entraîner, valider et tester des modèles d'IA.",
        category: "data",
        difficulty: 1,
        example: "ImageNet est un dataset de millions d'images utilisé pour entraîner des modèles de vision.",
        related: ["Training Data", "Test Data", "Validation Data"]
    },
    {
        id: 7,
        term: "Model",
        definition: "Représentation mathématique d'un système apprise à partir de données, capable de faire des prédictions.",
        category: "fondamentaux",
        difficulty: 2,
        example: "GPT-4 est un modèle de langage capable de générer du texte.",
        related: ["Training", "Parameters", "Fine-tuning"]
    },
    {
        id: 8,
        term: "Training",
        definition: "Processus d'apprentissage où un modèle ajuste ses paramètres en analysant des données d'entraînement.",
        category: "machine-learning",
        difficulty: 2,
        example: "ChatGPT a été entraîné sur des milliards de pages web pendant des mois.",
        related: ["Dataset", "Epoch", "Gradient Descent"]
    },
    {
        id: 9,
        term: "Inference",
        definition: "Processus d'utilisation d'un modèle entraîné pour faire des prédictions sur de nouvelles données.",
        category: "technique",
        difficulty: 2,
        example: "Quand vous posez une question à ChatGPT, il fait de l'inférence pour générer une réponse.",
        related: ["Prediction", "Model", "Deployment"]
    },
    {
        id: 10,
        term: "Parameters",
        definition: "Valeurs internes ajustables d'un modèle qui sont apprises pendant l'entraînement.",
        category: "technique",
        difficulty: 3,
        example: "GPT-3 a 175 milliards de paramètres, ce qui détermine sa capacité.",
        related: ["Weights", "Bias", "Model"]
    },
    
    // NLP et IA Générative
    {
        id: 11,
        term: "Natural Language Processing (NLP)",
        definition: "Domaine de l'IA permettant aux machines de comprendre, interpréter et générer le langage humain.",
        category: "nlp",
        difficulty: 2,
        example: "Google Translate utilise le NLP pour traduire entre langues.",
        related: ["Tokenization", "Embedding", "Transformer"]
    },
    {
        id: 12,
        term: "Large Language Model (LLM)",
        definition: "Modèle d'IA massif entraîné sur d'énormes quantités de texte pour comprendre et générer du langage.",
        category: "generative",
        difficulty: 2,
        example: "ChatGPT, Claude et Gemini sont des LLMs populaires.",
        related: ["GPT", "Transformer", "Parameters"]
    },
    {
        id: 13,
        term: "GPT",
        definition: "Generative Pre-trained Transformer - Architecture de modèle développée par OpenAI pour la génération de texte.",
        category: "generative",
        difficulty: 2,
        example: "GPT-4 est la version actuelle utilisée dans ChatGPT Plus.",
        related: ["Transformer", "OpenAI", "LLM"]
    },
    {
        id: 14,
        term: "Prompt",
        definition: "Instruction ou question donnée à un modèle d'IA pour obtenir une réponse spécifique.",
        category: "generative",
        difficulty: 1,
        example: "\"Écris un email professionnel\" est un prompt simple.",
        related: ["Prompt Engineering", "Few-shot Learning", "Context"]
    },
    {
        id: 15,
        term: "Prompt Engineering",
        definition: "Art et science de créer des prompts efficaces pour obtenir les meilleurs résultats d'un modèle d'IA.",
        category: "generative",
        difficulty: 2,
        example: "Ajouter 'étape par étape' dans un prompt améliore souvent la qualité de la réponse.",
        related: ["Prompt", "Few-shot Learning", "Chain of Thought"]
    },
    {
        id: 16,
        term: "Token",
        definition: "Unité de base de texte traitée par un modèle de langage, généralement un mot ou partie de mot.",
        category: "nlp",
        difficulty: 2,
        example: "Le mot 'artificial' pourrait être divisé en 'arti' et 'ficial' comme tokens.",
        related: ["Tokenization", "Context Window", "Embedding"]
    },
    {
        id: 17,
        term: "Context Window",
        definition: "Nombre maximum de tokens qu'un modèle peut traiter en une seule fois.",
        category: "generative",
        difficulty: 2,
        example: "GPT-4 peut traiter jusqu'à 128 000 tokens, soit environ 100 pages de texte.",
        related: ["Token", "Memory", "Attention"]
    },
    {
        id: 18,
        term: "Hallucination",
        definition: "Tendance d'un modèle d'IA à générer des informations fausses ou inventées présentées comme vraies.",
        category: "generative",
        difficulty: 2,
        example: "Un chatbot pourrait inventer une citation qui n'existe pas.",
        related: ["Accuracy", "Grounding", "Fact-checking"]
    },
    {
        id: 19,
        term: "Fine-tuning",
        definition: "Processus d'adaptation d'un modèle pré-entraîné à une tâche spécifique avec des données supplémentaires.",
        category: "machine-learning",
        difficulty: 3,
        example: "Un modèle GPT peut être fine-tuné pour parler comme un expert médical.",
        related: ["Transfer Learning", "Training", "Domain Adaptation"]
    },
    {
        id: 20,
        term: "Embedding",
        definition: "Représentation numérique dense d'un mot, phrase ou concept dans un espace vectoriel.",
        category: "nlp",
        difficulty: 3,
        example: "Les mots 'chat' et 'félin' auraient des embeddings proches.",
        related: ["Vector", "Semantic Search", "Word2Vec"]
    },
    
    // Vision et autres modalités
    {
        id: 21,
        term: "Computer Vision",
        definition: "Domaine de l'IA permettant aux machines d'interpréter et comprendre le contenu visuel.",
        category: "computer-vision",
        difficulty: 2,
        example: "Les voitures autonomes utilisent la computer vision pour détecter les piétons.",
        related: ["CNN", "Object Detection", "Image Recognition"]
    },
    {
        id: 22,
        term: "CNN (Convolutional Neural Network)",
        definition: "Type de réseau de neurones spécialisé dans le traitement d'images et la reconnaissance visuelle.",
        category: "computer-vision",
        difficulty: 3,
        example: "Les filtres Instagram utilisent des CNNs pour appliquer des effets.",
        related: ["Computer Vision", "Neural Network", "Image Processing"]
    },
    {
        id: 23,
        term: "Object Detection",
        definition: "Capacité d'identifier et localiser des objets spécifiques dans une image ou vidéo.",
        category: "computer-vision",
        difficulty: 2,
        example: "La détection de visages dans l'appareil photo de votre téléphone.",
        related: ["Computer Vision", "YOLO", "Bounding Box"]
    },
    {
        id: 24,
        term: "Multimodal AI",
        definition: "IA capable de traiter et combiner plusieurs types de données (texte, image, audio, vidéo).",
        category: "generative",
        difficulty: 3,
        example: "GPT-4V peut analyser des images et répondre à des questions sur leur contenu.",
        related: ["CLIP", "Vision Transformer", "Cross-modal"]
    },
    
    // Concepts techniques
    {
        id: 25,
        term: "Transformer",
        definition: "Architecture de réseau de neurones révolutionnaire utilisant l'attention pour traiter des séquences.",
        category: "deep-learning",
        difficulty: 3,
        example: "BERT, GPT et la plupart des LLMs modernes utilisent l'architecture Transformer.",
        related: ["Attention", "BERT", "GPT"],
        technical: "Introduit dans 'Attention is All You Need' (2017), a révolutionné le NLP."
    },
    {
        id: 26,
        term: "Attention Mechanism",
        definition: "Technique permettant à un modèle de se concentrer sur les parties pertinentes de l'entrée.",
        category: "deep-learning",
        difficulty: 3,
        example: "Permet à un traducteur IA de lier les mots correspondants entre langues.",
        related: ["Transformer", "Self-Attention", "Cross-Attention"]
    },
    {
        id: 27,
        term: "Backpropagation",
        definition: "Algorithme fondamental pour entraîner les réseaux de neurones en propageant l'erreur en arrière.",
        category: "deep-learning",
        difficulty: 3,
        technical: "Calcule le gradient de la fonction de perte par rapport aux poids du réseau.",
        related: ["Gradient Descent", "Neural Network", "Training"]
    },
    {
        id: 28,
        term: "Gradient Descent",
        definition: "Méthode d'optimisation pour minimiser l'erreur en ajustant progressivement les paramètres.",
        category: "machine-learning",
        difficulty: 3,
        example: "Comme descendre une colline en suivant toujours la pente la plus forte.",
        related: ["Optimization", "Learning Rate", "Backpropagation"]
    },
    {
        id: 29,
        term: "Overfitting",
        definition: "Quand un modèle apprend trop bien les données d'entraînement et généralise mal.",
        category: "machine-learning",
        difficulty: 2,
        example: "Un modèle qui mémorise les réponses au lieu de comprendre les concepts.",
        related: ["Underfitting", "Regularization", "Validation"]
    },
    {
        id: 30,
        term: "Regularization",
        definition: "Techniques pour éviter le surapprentissage et améliorer la généralisation d'un modèle.",
        category: "machine-learning",
        difficulty: 3,
        example: "Dropout désactive aléatoirement des neurones pendant l'entraînement.",
        related: ["Overfitting", "Dropout", "L1/L2"]
    },
    
    // Éthique et société
    {
        id: 31,
        term: "AI Bias",
        definition: "Préjugés ou discriminations systématiques dans les décisions prises par des systèmes d'IA.",
        category: "ethique",
        difficulty: 2,
        example: "Un système de recrutement IA qui favorise injustement certains groupes.",
        related: ["Fairness", "Ethics", "Algorithmic Bias"]
    },
    {
        id: 32,
        term: "Explainable AI (XAI)",
        definition: "IA dont les décisions peuvent être comprises et expliquées par les humains.",
        category: "ethique",
        difficulty: 2,
        example: "Un système médical qui explique pourquoi il suggère un diagnostic.",
        related: ["Interpretability", "Black Box", "Transparency"]
    },
    {
        id: 33,
        term: "AGI (Artificial General Intelligence)",
        definition: "IA hypothétique avec des capacités intellectuelles égales ou supérieures à l'humain dans tous les domaines.",
        category: "recherche",
        difficulty: 2,
        example: "Contrairement à l'IA actuelle spécialisée, l'AGI pourrait tout apprendre comme un humain.",
        related: ["ASI", "Singularity", "Intelligence"]
    },
    {
        id: 34,
        term: "AI Safety",
        definition: "Domaine de recherche visant à s'assurer que les systèmes d'IA avancés restent bénéfiques et contrôlables.",
        category: "ethique",
        difficulty: 2,
        example: "Développer des mécanismes d'arrêt d'urgence pour les systèmes autonomes.",
        related: ["Alignment", "Control Problem", "Ethics"]
    },
    
    // Business et applications
    {
        id: 35,
        term: "AI as a Service (AIaaS)",
        definition: "Modèle commercial offrant des capacités d'IA via le cloud sans infrastructure propre.",
        category: "business",
        difficulty: 1,
        example: "OpenAI API, Google Cloud AI, AWS ML Services.",
        related: ["Cloud Computing", "API", "SaaS"]
    },
    {
        id: 36,
        term: "Chatbot",
        definition: "Programme IA capable de converser avec des humains en langage naturel.",
        category: "business",
        difficulty: 1,
        example: "Les assistants de support client sur les sites web.",
        related: ["Conversational AI", "NLP", "Virtual Assistant"]
    },
    {
        id: 37,
        term: "Recommendation System",
        definition: "Système IA qui suggère des contenus ou produits personnalisés selon les préférences utilisateur.",
        category: "business",
        difficulty: 2,
        example: "Les suggestions de Netflix ou les recommandations d'Amazon.",
        related: ["Collaborative Filtering", "Personalization", "Machine Learning"]
    },
    {
        id: 38,
        term: "Predictive Analytics",
        definition: "Utilisation de l'IA pour prédire des événements futurs basés sur des données historiques.",
        category: "business",
        difficulty: 2,
        example: "Prédire la demande de produits ou le risque de défaut de paiement.",
        related: ["Forecasting", "Time Series", "Data Mining"]
    },
    
    // Termes récents et tendances
    {
        id: 39,
        term: "RAG (Retrieval-Augmented Generation)",
        definition: "Technique combinant la recherche d'information et la génération de texte pour des réponses plus précises.",
        category: "generative",
        difficulty: 3,
        example: "Un chatbot qui consulte une base de données avant de répondre.",
        related: ["Vector Database", "Embedding", "LLM"]
    },
    {
        id: 40,
        term: "Agent IA",
        definition: "Système IA autonome capable de percevoir son environnement et d'agir pour atteindre des objectifs.",
        category: "recherche",
        difficulty: 2,
        example: "Un agent qui peut naviguer sur le web et accomplir des tâches pour vous.",
        related: ["AutoGPT", "ReAct", "Tool Use"]
    },
    {
        id: 41,
        term: "Zero-shot Learning",
        definition: "Capacité d'un modèle à effectuer une tâche sans avoir vu d'exemples spécifiques pendant l'entraînement.",
        category: "machine-learning",
        difficulty: 3,
        example: "GPT peut traduire vers des langues qu'il n'a jamais explicitement apprises.",
        related: ["Few-shot Learning", "Transfer Learning", "Generalization"]
    },
    {
        id: 42,
        term: "Few-shot Learning",
        definition: "Apprentissage à partir de très peu d'exemples, souvent donnés dans le prompt.",
        category: "machine-learning",
        difficulty: 3,
        example: "Donner 2-3 exemples de traduction avant de demander une nouvelle traduction.",
        related: ["Zero-shot Learning", "In-context Learning", "Prompt"]
    },
    {
        id: 43,
        term: "Chain of Thought",
        definition: "Technique de prompting encourageant le modèle à expliquer son raisonnement étape par étape.",
        category: "generative",
        difficulty: 2,
        example: "Ajouter 'Réfléchis étape par étape' améliore les réponses aux problèmes complexes.",
        related: ["Prompt Engineering", "Reasoning", "LLM"]
    },
    {
        id: 44,
        term: "Constitutional AI",
        definition: "Approche d'Anthropic pour entraîner des IA alignées sur des principes éthiques explicites.",
        category: "ethique",
        difficulty: 3,
        example: "Claude est entraîné pour être utile, honnête et inoffensif.",
        related: ["AI Safety", "Alignment", "RLHF"]
    },
    {
        id: 45,
        term: "RLHF (Reinforcement Learning from Human Feedback)",
        definition: "Technique d'entraînement utilisant les retours humains pour améliorer le comportement d'un modèle.",
        category: "machine-learning",
        difficulty: 3,
        example: "ChatGPT utilise RLHF pour apprendre à donner des réponses utiles et sûres.",
        related: ["Reinforcement Learning", "Fine-tuning", "Alignment"]
    }
];

// Faits intéressants pour la section "Le saviez-vous ?"
const funFacts = [
    "Le terme 'Intelligence Artificielle' a été inventé en 1956 lors de la conférence de Dartmouth.",
    "Le test de Turing, proposé en 1950, reste une référence pour évaluer l'intelligence des machines.",
    "GPT-3 a été entraîné sur environ 45 TB de données textuelles.",
    "Le premier chatbot, ELIZA, a été créé en 1966 au MIT.",
    "Deep Blue d'IBM a battu Garry Kasparov aux échecs en 1997, marquant l'histoire de l'IA.",
    "AlphaGo a battu le champion du monde de Go en 2016, un exploit jugé impossible 10 ans plus tôt.",
    "L'IA peut maintenant créer de la musique, de l'art et même écrire des romans.",
    "Un modèle d'IA moderne peut avoir plus de 1 trillion de paramètres.",
    "L'entraînement de GPT-3 a coûté environ 12 millions de dollars en puissance de calcul.",
    "Les réseaux de neurones sont inspirés du cerveau humain mais fonctionnent très différemment.",
    "L'IA est utilisée pour découvrir de nouveaux médicaments, réduisant le temps de recherche de plusieurs années.",
    "Certains modèles d'IA peuvent maintenant comprendre et générer du code informatique.",
    "Le marché mondial de l'IA devrait atteindre 1 500 milliards de dollars d'ici 2030.",
    "L'IA peut détecter certains cancers plus tôt et plus précisément que les médecins humains.",
    "Les voitures autonomes utilisent jusqu'à 40 capteurs différents pour percevoir leur environnement."
];