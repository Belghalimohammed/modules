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
      if (!localStorage.getItem("zimbra")) {
        localStorage.setItem("zimbra", "block");
      }
      if (
        drupalSettings.path.isFront &&
        drupalSettings.api_zimbra_pleiade.field_zimbra_mail
      ) {
        once(
          "APIzimbraDataHistoryBehavior",
          "#zimbra_block_mail_id",
          context
        ).forEach(function (block) {
          const mailContainer = document.getElementById("zimbra_mail_list");
          if (!mailContainer) return;

          // --- 1. La logique principale est isolée dans une fonction ---
          const fetchAndDisplayMails = function () {
            const xhr = new XMLHttpRequest();
            xhr.open(
              "GET",
              Drupal.url("v1/api_zimbra_pleiade/zimbra_mails_query")
            );
            xhr.responseType = "json";

            xhr.onload = function () {
              let mailListHTML = "";
              const donnees = xhr.response;

              if (
                donnees &&
                donnees.userData &&
                donnees.userData.Body.SearchResponse.m
              ) {
                for (let mail of donnees.userData.Body.SearchResponse.m) {
                  const eArray = mail.e;
                  const messageId = mail.id;
                  const sender =
                    eArray[eArray.length - 1].p || eArray[eArray.length - 1].a;
                  const subject = mail.su || "(Sans sujet)";
                  const message = mail.fr || "";
                  const formatTimestamp = (timestamp) =>
                    new Date(parseInt(timestamp)).toLocaleString();
                  const time = formatTimestamp(mail.d);

                  mailListHTML += `
                    <a href="${donnees.domainEntry}modern/email/Inbox/message/${messageId}"
                       target="zimbramail"
                       class="list-group-item d-flex flex-column gap-1 py-2 px-3 mail_content text-decoration-none text-dark"
                       mail-expe="${sender}">
                      <div class="d-flex justify-content-between align-items-center">
                        <div class="fw-bold">${sender}</div>
                        <small class="text-muted">${time}</small>
                      </div>
                      <div class="fw-semibold">${subject}</div>
                      <div class="text-muted small text-truncate">${message.substring(0, 130)}...</div>
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
              mailContainer.innerHTML = `<div class="alert alert-danger">Erreur lors du chargement des mails.</div>`;
            };

            xhr.send();
          };

          // --- 2. ADD EVENT LISTENER FOR ITEM REMOVAL (EVENT DELEGATION) ---
          // This listener is attached to the container once.
          mailContainer.addEventListener('click', function(event) {
            // Find the closest ancestor which is a mail item (.mail_content)
            const mailItem = event.target.closest('.mail_content');

            // If a mail item was actually clicked
            if (mailItem) {
              // Prevent the link from navigating to a new page
            
              
              // Remove the clicked mail item from the DOM
              mailItem.remove();
            }
          });

          document.getElementById("reloadZimbraMail").addEventListener(
            "click",
            function (e) {
              e.preventDefault();
              fetchAndDisplayMails();
            }
          );
          
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