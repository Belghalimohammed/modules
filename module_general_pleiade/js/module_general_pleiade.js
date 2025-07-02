(function (Drupal, drupalSettings, once) {
  "use strict";

  Drupal.behaviors.ParamsGenBehavior = {
    attach: function (context, settings) {
      if (drupalSettings.module_general_pleiade) {
       
          once("ParamsGenBehavior", "body", context).forEach(function () {
            // Get cookie by name
            function getCookie(name) {
              const cookies = document.cookie.split(";");
              for (let cookie of cookies) {
                const [cookieName, cookieValue] = cookie.split("=");
                if (cookieName.trim() === name) {
                  return cookieValue;
                }
              }
              return null;
            }

            // Apply custom color theme
            if (settings.module_general_pleiade.color_theme) {
              const newColorCode = settings.module_general_pleiade.color_theme;
              const root = document.documentElement;
              root.style.setProperty("--global-color", newColorCode);
              root.style.setProperty("--text-menu-color", newColorCode);
            }

            const container = document.getElementById("areaSortable");

            if (container ) { //&& window.innerWidth > 768
              new Sortable(container, {
                animation: 150,
                draggable: ".sortable-items", // Only these are sortable
                onEnd: function () {
                  const ids = Array.from(
                    container.querySelectorAll(".sortable-items")
                  ).map((el) => el.id);
                  localStorage.setItem("dashboard_order", JSON.stringify(ids));
                  const order = JSON.stringify(ids);

                  document.cookie =
                    "dashboard_order=" + encodeURIComponent(order) + "; path=/";
                },
              });
            }

            // Scroll to top
            //  window.scrollTo(0, 0);
          });

      }
    },
  };
})(Drupal, drupalSettings, once);
