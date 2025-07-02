(function (Drupal, $, drupalSettings) {
  "use strict";
  Drupal.behaviors.GLPIBehavior = {
    attach: function (context, settings) {
      // only on frontpage (desktop)
      if (drupalSettings.path.isFront) {
        once("DatatableBehavior", "body", context).forEach(function () {








	}); // end once
      }
    },
  };
})(Drupal, jQuery, drupalSettings);
