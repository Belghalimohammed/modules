(function (Drupal, once, drupalSettings) {
  "use strict";

  /**
   * Comportement Drupal pour afficher l'historique des emails Zimbra.
   *
   * Ce comportement ATTEND que la clé 'zimbra' dans le localStorage soit
   * définie sur 'block' avant de lancer la récupération des données.
   */
  Drupal.behaviors.APIzimbraDataHistoryBehavior = {
    attach: function (context, settings) {
      // Les conditions initiales restent les mêmes
      if (!localStorage.getItem("zimbra")) {
        localStorage.setItem("zimbra", "block");
      }
      if (
        drupalSettings.path.isFront &&
        drupalSettings.api_zimbra_pleiade.field_zimbra_mail
      ) {
        // 'once' garantit que la logique d'attente n'est initialisée qu'une seule fois par élément.
        once(
          "APIzimbraDataHistoryBehavior",
          "#zimbra_block_mail_id",
          context
        ).forEach(function () {
          // --- 1. La logique principale est isolée dans une fonction ---
          const fetchAndDisplayMails = function () {
            // Optional: show spinner here if needed
            const xhr = new XMLHttpRequest();
            xhr.open(
              "GET",
              Drupal.url("v1/api_zimbra_pleiade/zimbra_mails_query")
            );
            xhr.responseType = "json";

            xhr.onload = function () {
              let mailListHTML = "";
              const donnees = xhr.response;
              const mailContainer = document.getElementById("zimbra_mail_list");

              if (!mailContainer) return; // Sécurité si l'élément a disparu

              if (
                donnees &&
                donnees.userData &&
                donnees.userData.Body.SearchResponse.c
              ) {
                console.log(
                  "Mails reçus :: ",
                  donnees.userData.Body.SearchResponse.c.length
                );
                for (let mail of donnees.userData.Body.SearchResponse.c) {
                  const eArray = mail.e;
                  const messageId = mail.m[0].id;
                  const sender =
                    eArray[eArray.length - 1].p || eArray[eArray.length - 1].a;
                  const subject = mail.su || "(Sans sujet)";
                  const message = mail.fr || "";

                  // NOTE : Assurez-vous que la fonction formatTimestamp est disponible dans votre code.
                  // Voici un exemple si ce n'est pas le cas :
                  const formatTimestamp = (timestamp) =>
                    new Date(parseInt(timestamp)).toLocaleString();
                  const time = formatTimestamp(mail.d);

                  mailListHTML += `
                    <a href="${
                      donnees.domainEntry
                    }modern/email/Inbox/message/${messageId}"
                       target="_blank"
                       class="list-group-item d-flex flex-column gap-1 py-2 px-3 mail_content text-decoration-none text-dark"
                       mail-expe="${sender}">
                      <div class="d-flex justify-content-between align-items-center">
                        <div class="fw-bold">${sender}</div>
                        <small class="text-muted">${time}</small>
                      </div>
                      <div class="fw-semibold">${subject}</div>
                      <div class="text-muted small text-truncate">${message.substring(
                        0,
                        130
                      )}...</div>
                    </a>
                  `;
                }
              } else {
                mailListHTML = `
                  <div class="d-flex justify-content-center my-5">
                    <h5>Aucun nouveau mail</h5>
                  </div>
                `;
              }
              mailContainer.innerHTML = mailListHTML;
            };

            xhr.onerror = function () {
              console.error("Erreur lors de l'appel AJAX");
            };

            xhr.send();
          };

          if (localStorage.getItem("zimbra") === "block") {
            fetchAndDisplayMails();
          } else {
            const pollInterval = setInterval(() => {
              if (localStorage.getItem("zimbra") === "block") {
                clearInterval(pollInterval);
                fetchAndDisplayMails();
              }
            }, 200);
          }
        });
      }
    },
  };
})(Drupal, once, drupalSettings);
