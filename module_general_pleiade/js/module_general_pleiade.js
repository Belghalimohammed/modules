(function (Drupal, drupalSettings, once) {
  "use strict";

  Drupal.behaviors.ParamsGenBehavior = {
    attach: function (context, settings) {
      if (drupalSettings.module_general_pleiade) {
       
          once("ParamsGenBehavior", "body", context).forEach(function () {
           
            if (settings.module_general_pleiade.color_theme) {
              const newColorCode = settings.module_general_pleiade.color_theme;
              const root = document.documentElement;
              root.style.setProperty("--global-color", newColorCode);
              root.style.setProperty("--text-menu-color", newColorCode);
            }

            const container = document.getElementById("areaSortable");

            if (container && window.innerWidth > 768) {
              new Sortable(container, {
                animation: 150,
                draggable: ".sortable-items", 
                onEnd: function () {
                  const ids = Array.from(
                    container.querySelectorAll(".sortable-items")
                  ).map((el) => el.id);
                
                  const order = JSON.stringify(ids);

                    const formData = new FormData();
                  formData.append('var', 'field_dashboard_order');
                  formData.append('value', order);

                
                  fetch('/v1/api_user_pleiade/setVariablesValue', {
                    method: 'POST',
                    body: formData,
                   
                  })
                  .then(response => {
                    if (!response.ok) {
                   
                      throw new Error('Network response was not ok: ' + response.statusText);
                    }
                   
                    return response.json(); // or response.text()
                  })
                  .then(data => {
                  
                    console.log('Dashboard order saved successfully:', data);
                  })
                  .catch(error => {
                    
                    console.error('Error saving dashboard order:', error);
                  });
                },
              });
            }

          
          });

      }
    },
  };
})(Drupal, drupalSettings, once);
