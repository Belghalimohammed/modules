(function (Drupal, drupalSettings, once) {
    "use strict";
    Drupal.behaviors.APIparapheurEntitesBehavior = {
        attach: function (context, settings) {
            setTimeout(function () {
               
                
                once("APIparapheurEntitesBehavior", "body", context).forEach(
                    function () {
function getCookie(name) {
                            // Récupérer tous les cookies
                            const cookies = document.cookie.split(';');

                            // Parcourir chaque cookie
                            for (let cookie of cookies) {
                                // Diviser le nom et la valeur du cookie
                                const [cookieName, cookieValue] = cookie.split('=');

                                // Supprimer les espaces blancs avant et après le nom du cookie
                                const trimmedCookieName = cookieName.trim();

                                // Vérifier si le nom du cookie correspond à celui recherché
                                if (trimmedCookieName === name) {
                                    // Retourner la valeur du cookie
                                    return cookieValue;
                                }
                            }

                            // Retourner null si le cookie n'est pas trouvé
                            return null;
                        }
                       
                        
                        
                        const cookieGroups = decodeURIComponent(getCookie('groups'));

                        if (cookieGroups.includes('parapheur')) {
                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", Drupal.url("v1/api_parapheur_pleiade/parapheur_entities_query"));
                            xhr.responseType = "json";
                                xhr.onload = function () {
                                	if (xhr.status === 200) {
                                    		var donnees = xhr.response;
						if(donnees > 0 ){
							var pastille_app_prod = document.querySelector(".pastille_apps_prod");
							var pastille_parapheur = document.querySelector("#pastille_parapheur");
							pastille_app_prod.innerHTML = '<span class="position-absolute start-75 translate-middle badge rounded-pill bg-danger">' + donnees + '</span>'
 							pastille_parapheur.innerHTML = '<span class="position-absolute start-75 translate-middle badge rounded-pill bg-danger">' + donnees + '</span>'						
						}
					}
                                };
                                xhr.onerror = function () {
                                    console.error("Error making AJAX call");
                                };
                                xhr.onabort = function () {
                                    console.error("AJAX call aborted");
                                };
                                xhr.ontimeout = function () {
                                    console.error("AJAX call timed out");
                                };
                                xhr.onloadend = function () {

                                };
                                 xhr.send();
                            };
                           
                        });
                        
            }, 2900); // 1000 millisecondes = 1 seconde
        },
    };
})(Drupal, drupalSettings, once);
