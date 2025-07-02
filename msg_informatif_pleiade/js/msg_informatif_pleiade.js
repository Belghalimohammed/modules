(function (Drupal, drupalSettings, once) {
        "use strict";
      
        Drupal.behaviors.APIalerteBlocksBehavior = {
          attach: function (context, settings) {
            // Fonction pour créer un élément div avec les classes CSS appropriées
            function createAlertDiv(message, importance) {
              const alertDiv = document.createElement('div');
              alertDiv.innerHTML  = message;
              alertDiv.classList.add('py-2', 'px-5', 'text-white', 'd-flex', 'align-items-center', 'justify-content-center');
      
              // Déterminer la classe CSS en fonction de l'importance du message
              switch (importance) {
                case "Informatif":
                  alertDiv.classList.add('bg-info');
                  break;
                case "Avertissement":
                  alertDiv.classList.add('bg-warning');
                  break;
                case "Attention":
                  alertDiv.classList.add('bg-danger');
                  break;
                default:
                  break;
              }
      
              return alertDiv;
            }
      
            // Fonction pour effectuer l'appel AJAX et afficher les messages d'alerte
            function fetchAndDisplayAlerts() {
              var xhr = new XMLHttpRequest();
              xhr.open("GET", Drupal.url("v1/msg_informatif_pleiade/message_fields"));
              xhr.responseType = "json";
      
              xhr.onload = function () {
                if (xhr.status === 200) {
                  var donnees = xhr.response;
                  const div_alert = document.querySelector('.message_avertissement');
      
                  // Vérifier s'il y a des données à afficher
                  if (donnees.length > 0) {
                    donnees.forEach(function (alerte) {
                      // Créer et ajouter chaque élément div d'alerte au conteneur approprié
                      const alertDiv = createAlertDiv(alerte.field_message_a_afficher, alerte.importance);
                      div_alert.appendChild(alertDiv);
                    });
                  }
                }
              };
      
              // Gérer les erreurs AJAX
              xhr.onerror = function () {
                console.log("Error making AJAX call");
              };
              xhr.onabort = function () {
                console.log("AJAX call aborted");
              };
              xhr.ontimeout = function () {
                console.log("AJAX call timed out");
              };
      
              // Envoyer la requête AJAX
              xhr.send();
            }
      
            // Appeler la fonction fetchAndDisplayAlerts une seule fois
            once("APIalerteBlocksBehavior", ".message_avertissement", context).forEach(fetchAndDisplayAlerts);
          }
        };
      })(Drupal, drupalSettings, once);
      