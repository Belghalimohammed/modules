(function ($, Drupal, drupalSettings, once) {
  "use strict";

  function escapeHtml(text) {
    if (!text) return '';
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
  }

  Drupal.behaviors.ActuBlocksBehavior = {
    attach: function (context, settings) {
      setTimeout(function () {
        once("ActuBlocksBehavior", ".actualites", context).forEach(function () {
          const div = document.querySelector('.actualites');
          if (!div) return;

       

          var xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/module_actu_pleiade/actu_list"));
          xhr.responseType = "json";

          xhr.onload = function () {
            var blocActu = `
             
            `;

            if (xhr.status === 200 && xhr.response && Array.isArray(xhr.response)) {
              const donnees = xhr.response;
              for (let actu of donnees) {
                if (!actu.title || !actu.view_node) continue;
                let collectivite = '';
                let tag = '';
                if (Array.isArray(actu.field_tags)) {
                  tag = `<span class="tag_btn position-absolute w-auto p-2 text-uppercase">${escapeHtml(actu.field_tags.join(', '))}</span>`;
                } else if (actu.field_tags) {
                  tag = `<span class="tag_btn position-absolute w-auto p-2 text-uppercase">${escapeHtml(actu.field_tags)}</span>`;
                }
                collectivite = `<span class="tag_btn position-absolute w-auto p-2 text-uppercase" style="  margin-top: 50px;">${escapeHtml(actu.collectivite)}</span>`;
                blocActu += `
                  <a href="${actu.view_node}" class="d-flex  justify-content-center" target="_blank">
                    <div class="card" style="height: 300px; width: 250px;">
                      <img src="${actu.field_image}" class="card-img-top" alt="${escapeHtml(actu.title)}">
                      <div class="card-body d-flex flex-column">
                        ${tag}
                        ${collectivite}
                        <h5 class="created_date w-auto">le ${escapeHtml(actu.created)}</h5>
                        <h5 class="card-title d-flex justify-content-start text-black">${escapeHtml(actu.title)}</h5>
                      </div>
                    </div>
                  </a>
                `;
              }

            
              div.innerHTML = blocActu;

              if ($.fn.slick) {
                $('#carousel_actualites').slick({
                  slidesToShow: window.innerWidth < 768 ? 2 : 4,
                  slidesToScroll: 2,
                  arrows: true,
                  dots: true,
                  autoplay: true,
                  autoplaySpeed: 4000,
                  customPaging: function (slider, i) {
                    return '<i class="fa-solid fa-circle"></i>';
                  },
                });
              } else {
                console.warn("Le carrousel Slick n'est pas chargé.");
              }
            } else {
              div.innerHTML = `
                <div class="col-lg-12">
                  <div class="card">
                    <div class="card-body">
                      <h5>Erreur lors de la récupération des actus... Veuillez contacter l'administrateur</h5>
                    </div>
                  </div>
                </div>
              `;
              console.error("Réponse invalide pour les actualités.");
            }
          };

          xhr.onerror = function () {
            console.error("Erreur AJAX");
          };
          xhr.onabort = function () {
            console.warn("Requête AJAX annulée");
          };
          xhr.ontimeout = function () {
            console.warn("Délai d'attente AJAX dépassé");
          };

          xhr.send();
        });
      }, 2000);
    }
  };
})(jQuery, Drupal, drupalSettings, once);