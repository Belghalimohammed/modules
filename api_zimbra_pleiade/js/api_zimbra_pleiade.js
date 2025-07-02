(function (Drupal, once, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIzimbraDataHistoryBehavior = {
    attach: function (context, settings) {
      if (
        drupalSettings.path.isFront &&
        drupalSettings.api_zimbra_pleiade.field_zimbra_mail
      ) {
        once("APIzimbraDataHistoryBehavior", "#zimbra_block_mail_id", context).forEach(function () {
          // Optional: show spinner here if needed
          const xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/api_zimbra_pleiade/zimbra_mails_query"));
          xhr.responseType = "json";

          xhr.onload = function () {
            let mailListHTML = "";
            const donnees = xhr.response;

            const mailContainer = document.getElementById("zimbra_mail_list");
            
            if (donnees.userData.Body.SearchResponse.c) {
              for (let mail of donnees.userData.Body.SearchResponse.c) {
                const eArray = mail.e;
                const messageId = mail.m[0].id;
                const timestamp = mail.d / 1000;
                const date = new Date(timestamp * 1000);

                const sender = eArray[eArray.length - 1].p || eArray[eArray.length - 1].a;
                const subject = mail.su || "(Sans sujet)";
                const message = mail.fr || "";
                const time =
                  String(date.getHours()).padStart(2, "0") +
                  ":" +
                  String(date.getMinutes()).padStart(2, "0");
             
                mailListHTML += `
                  <a href="${donnees.domainEntry}modern/email/Inbox/message/${messageId}"
                     target="_blank"
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
            console.error("Error making AJAX call");
          };

          xhr.send();
        });
      }
    },
  };
})(Drupal, once, drupalSettings);