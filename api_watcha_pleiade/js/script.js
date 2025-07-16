(function ($, Drupal, once) {
  "use strict";

  Drupal.behaviors.WatchaBlocksBehavior = {
    attach: function (context, settings) {
      setTimeout(function () {
        once(
          "WatchaBlocksBehavior",
          ".vertical-carousel-container",
          context
        ).forEach(function (rowElem) {
          const $row = $(rowElem);
          const $carousels = $row.find(".vertical-carousel");

          $carousels.each(function () {
            const $carousel = $(this);
            // Don't re-initialize if already initialized
            if ($carousel.hasClass("slick-initialized")) {
              return;
            }

            // Set overflow hidden if window width <= 768
            if (window.innerWidth <= 768) {
              $carousel.css("overflow", "hidden");
            } else {
              $carousel.css("overflow", "");
            }
            let $elem = $carousel.closest(".vertical-carousel-container");
            if (window.innerWidth > 768) {
              $elem.find("#slick-up").hide();
              $elem.find("#slick-down").hide();
            }

            if ($.fn.slick) {
              $carousel.slick({
                vertical: true,
                slidesToShow: 2,
                slidesToScroll: 1,
                arrows: false,
                infinite: false,
              });

              // Attach navigation arrows only once per carousel container
              $row.find("#slick-up").on("click", function () {
                $carousel.slick("slickPrev");
              });

              $row.find("#slick-down").on("click", function () {
                console.log("down");
                $carousel.slick("slickNext");
              });
            } else {
              console.warn("Le carrousel Slick n'est pas chargé.");
            }
          });

          
        });
      }, 2000);
    },
  };
})(jQuery, Drupal, once);
