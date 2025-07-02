(function ($, Drupal, once, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIMoodleBehavior = {
    attach: function (context, settings) {

      if (drupalSettings.path.isFront) {
        once("APIMoodleBehavior", "body", context).forEach(function () {

          var xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/api_moodle_pleiade/moodle_entities"));
          xhr.responseType = "json";
          xhr.onload = function () {
            if (xhr.status === 200) {

              var donnees = (xhr.response);
              const div = document.querySelector('#moodle_courses');
              var blocMoodle = ""
              if (donnees && div) {

                blocMoodle += '<div class="col-lg-12">\
                                <div>\
                                  <div class="card">\
                                    <div class="card-header rounded-top bg-white rounded-top">\
                                      <h4 class="card-title text-dark py-2">Autoformation</h4></div>\
                                        <div class="" id="carousel_elearning">\
                  '
                
                for (var i = 0; i < donnees.length; i++) {
                
                  

                    if (donnees[i].overviewfiles[0]) {
                      if (donnees[i].overviewfiles[0].fileurl) {
                        var imageurl = donnees[i].overviewfiles[0].fileurl
                      }
                    }
                    else {
                      var imageurl = "https://ecollectivites.fr/sites/default/files/inline-images/logo-ecollectivites.jpg"
                    }
                    if (donnees[i].fullname) {
                      var categoryCourse = donnees[i].fullname
                    }
                    else {
                      var categoryCourse = ""
                    }


                    if (i !== 0) {
                      blocMoodle +=
                        '<a target="_blank" href="https://preprod.ecollectivites.fr/moodle/course/view.php?id=' + donnees[i].id + '?authCAS=CAS">\
                        <div class="mt-3 d-flex justify-content-center">\
                          <div class="card d-flex align-items-center">\
                            <img src="'+ imageurl + '" class="card-img-top" alt="Course Image">\
                            <div class="card-body d-flex flex-column align-items-center">\
                              <h5 class="card-title d-flex justify-content-center">'+ categoryCourse + '</h5>\
                              <h5 class="tag_btn position-absolute w-auto p-2">' + donnees[i].categoryname + '</h5>\
                            </div>\
                          </div>\
                        </div>\
                        </a>';
                    }


                  
                }
                blocMoodle += "</div></div></div></div>";
              }
              else // if no notification
              {

              }
              var moodleCoursesElement = document.getElementById("moodle_courses");

              if (moodleCoursesElement) {
                // The element with the id "moodle_courses" exists
                moodleCoursesElement.innerHTML = blocMoodle;
              } else {
                // The element with the id "moodle_courses" doesn't exist
                console.error("Element with id 'moodle_courses' not found.");
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
            
              $('#carousel_elearning').slick({
                slidesToShow: 4,
                slidesToScroll: 3,
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