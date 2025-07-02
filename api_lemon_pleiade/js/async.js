function loadScriptsInOrder(urls) {
    // Création d'une promesse chaînée pour charger chaque script séquentiellement
    let chain = Promise.resolve();
    
    urls.forEach(url => {
        // Pour chaque URL, étendre la chaîne avec une nouvelle promesse pour charger le script
        chain = chain.then(() => {
            return loadScript(url);
        });
    });

    // Retourner la promesse finale de la chaîne
    return chain;
}

// Fonction pour charger un script
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            console.log(`Le script ${url} a été chargé.`);
            resolve();
        };
        script.onerror = () => {
            console.error(`Erreur lors du chargement du script ${url}.`);
            reject();
        };
        document.head.appendChild(script);
    });
}

// Liste des URLs des scripts à charger dans l'ordre spécifié
const scriptUrls = [
    'modules/custom/api_lemon_pleiade/js/api_lemon_pleiade_sidebar_menu.js',
    'modules/custom/api_pastell_pleiade/js/api_pastell_menu.js',
    'modules/custom/datatable_pleiade/js/datatable_pleiade.js',
    'modules/custom/api_parapheur_pleiade/js/api_parapheur_pleiade.js'
    
];

// Charger les scripts dans l'ordre spécifié
loadScriptsInOrder(scriptUrls)
    .then(() => {
        console.log('Tous les scripts ont été chargés avec succès.');
    })
    .catch(error => {
        console.error('Erreur lors du chargement des scripts :', error);
    });
