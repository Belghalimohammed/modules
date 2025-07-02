(function ($, Drupal, once, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIUerGuideBehavior = {
    attach: function (context, settings) {

      if (drupalSettings.path.isFront) {
        once("APIUerGuideBehavior", "body", context).forEach(function () {

          var xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/guide_utilisateur_pleiade/get_guide"));
          xhr.responseType = "json";
          xhr.onload = function () {
            if (xhr.status === 200) {

              var donnees = (xhr.response);
              const div = document.querySelector('#guide_utilisateur');
              var blocUserGuide = ""
              if (donnees && div) {
                blocUserGuide += '<div class="col-lg-12">\
                                  <div class="card">\
                                    <div class="card-header rounded-top bg-white rounded-top">\
                                      <h4 class="card-title text-dark py-2">Guides utilisateurs</h4>\
                                    </div>\
                                        <div class="" id="carousel_guide_user">\
                  '
                
                for (var i = 0; i < donnees.length; i++) {
                    if(donnees[i].type){
                      var type =  donnees[i].type.toUpperCase()
                    }
                    else{
                      var type = 'AUCUN TYPE'
                    }
                 
                      blocUserGuide +=
                      '<a target="_blank" href="' + donnees[i].url + '">\
                        <div class="mt-3 d-flex justify-content-center">\
                          <div class="card d-flex align-items-center">\
                            <img src="'+ donnees[i].image +'" class="card-img-top" alt="Course Image">\
                            <div class="card-body d-flex flex-column align-items-center">\
                              <h5 class="card-title d-flex justify-content-center fs-5">'+ donnees[i].title + '</h5>\
                              <h4>' + donnees[i].sub_title + '</h4>\
                              <h5 class="tag_btn position-absolute w-auto p-2">' + type + '</h5>\
                            </div>\
                          </div>\
                        </div>\
                      </a>';
                      
                }
                blocUserGuide += "</div></div></div>";
              }
              if (div) {
                
                div.innerHTML = blocUserGuide;
              }
            }
          };
          xhr.onerror = function () {
            console.log("Error making AJAX call");
          };
          xhr.onabort = function () {
            console.log("AJAX call aborted");
          };
          xhr.ontimeout = function () {
            console.log("AJAX call timed out");
          };
          xhr.onloadend = function () {
            
              $('#carousel_guide_user').slick({
                slidesToShow: 4,
                slidesToScroll: 1,
                arrows: true,
                dots: true,
                customPaging: function (slider, i) {
                  // this example would render "tabs" with titles
                  return '<i class="fa-solid fa-circle"></i>';
                },

              });
          };

          xhr.send();
        });
      }
    }
  }
})(jQuery, Drupal, once, drupalSettings);