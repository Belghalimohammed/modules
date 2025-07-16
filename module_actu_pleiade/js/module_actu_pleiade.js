
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
           if (!localStorage.getItem("actu")) {
        localStorage.setItem("actu", "block");
      }
          const div = document.querySelector('.actualites');
          if (!div) return;

          var xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/module_actu_pleiade/actu_list"));
          xhr.responseType = "json";

          xhr.onload = function () {
            var blocActu = `<div id="carousel_actualites"></div>`;
            let itemsHTML = '';

            if (xhr.status === 200 && xhr.response && Array.isArray(xhr.response)) {
              const donnees = xhr.response;
              for (let actu of donnees) {
                if (!actu.title || !actu.view_node) continue;
                
                let collectivite = `<span class="tag_btn position-absolute w-auto p-2 text-uppercase">${escapeHtml(actu.collectivite)}</span>`;
                itemsHTML += `
                  <div>
                    <a href="${actu.view_node}" class="d-flex justify-content-center" target="_blank">
                      <div class="card" style="height: 250px; width: 250px;">
                        <img src="${actu.field_image}" class="card-img-top" alt="${escapeHtml(actu.title)}">
                        <div class="card-body d-flex flex-column" style="height:125px;padding:0.5rem;">
                          ${collectivite}
                          <h5 class="created_date w-auto">le ${escapeHtml(actu.created)}</h5>
                          <p class="card-title d-flex justify-content-start text-black" style="font-size:14px;overflow:hidden;margin-bottom:0;">${escapeHtml(actu.title)}</p>
                        </div>
                      </div>
                    </a>
                  </div>
                `;
              }

              div.innerHTML = blocActu;
              const carouselContainer = document.getElementById('carousel_actualites');
              if (carouselContainer) {
                carouselContainer.innerHTML = itemsHTML;
              }

              if ($.fn.slick) {
                const $carousel = $('#carousel_actualites');

                // 1. Initialiser le carrousel normalement.
                $carousel.slick({
                  slidesToShow: window.innerWidth < 768 ? 2 : 4,
                  slidesToScroll: 2,
                  arrows: true,
                  dots: true,
                  autoplay: true,
                  autoplaySpeed: 4000,
                  customPaging: (slider, i) => '<i class="fa-solid fa-circle"></i>',
                });
              
                let etatPrecedent = localStorage.getItem('actu');

                setInterval(() => {
                  const etatActuel = localStorage.getItem('actu');
                  
                  if (etatActuel === 'block' && etatPrecedent !== 'block') {
                    $carousel.slick('slickNext');
                  }

                  etatPrecedent = etatActuel;

                }, 200);

              } else {
                console.warn("Le carrousel Slick n'est pas chargé.");
              }
            } else {
              div.innerHTML = `...`;
              console.error("Réponse invalide pour les actualités.");
            }
          };

          xhr.onerror = () => console.error("Erreur AJAX");
          xhr.send();
        });
      }, 2000);
    }
  };
})(jQuery, Drupal, drupalSettings, once);