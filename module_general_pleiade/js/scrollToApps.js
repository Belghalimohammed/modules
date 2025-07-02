// Vérifie si le paramètre 'scrollToField' est présent dans l'URL
var urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('scrollToField') && urlParams.get('scrollToField') === 'true') {
    // Récupérer la division cible
    var targetDiv = document.getElementById("edit-field-url-application-0-uri--description");
    if (targetDiv) {
        // Faire défiler la page jusqu'à la division cible
        targetDiv.scrollIntoView({ behavior: 'smooth' });
    } else {
        console.error("La division avec l'ID 'field-url-application-values' n'a pas été trouvée.");
    }
}
