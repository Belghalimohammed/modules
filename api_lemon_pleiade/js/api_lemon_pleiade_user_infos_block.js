(function (Drupal, drupalSettings) {
    "use strict";
    Drupal.behaviors.APIlemonUserInfosBehavior = {
      attach: function (context, settings) {
        // only on frontpage (desktop)
        if (
          drupalSettings.api_lemon_pleiade.field_lemon_myapps_url &&
          drupalSettings.api_lemon_pleiade.field_lemon_url
        ) {
          once("APIlemonUserInfosBehavior", "#user_infos_block", context).forEach(
            function () {
              // show spinner while ajax is loading
              document.getElementById("user_infos_block").innerHTML =
                drupalSettings.api_lemon_pleiade.spinner;
              // make ajax call
              var xhr = new XMLHttpRequest();
              xhr.open(
                "POST",
                Drupal.url("v1/api_lemon_pleiade/lemon_session_query")
              );
              xhr.setRequestHeader(
                "Content-Type",
                "application/x-www-form-urlencoded"
              );
              xhr.responseType = "json";
              xhr.onload = function () {
                
                if (xhr.status === 200) {
                  var donnees = xhr.response;
                  
                  if(donnees != 'aucune donnée'){
                  var cn = donnees.cn;
                    var mail = donnees.mail;
                    var blocLemon;
                    blocLemon =
                      '\
                    <div class="">\
                        <img src="' +
                      donnees.user_picture_url +
                      '" alt="user" class="rounded-circle" width="60" height="60" style="object-fit: cover;"/>\
                      </div>\
                      <div class="ms-2">\
                        <h4 id="drupal-username" class="mb-0 text-white">' +
                      cn +
                      '</h4>\
                        <p class="mb-0">' +
                      mail +
                      "</p>\
                      </div>";
                    document.getElementById("user_infos_block").innerHTML =
                      blocLemon;
                    document.getElementById("img_user").innerHTML =
                      '<img src="'+donnees.user_picture_url +'" alt="user" width="55" height="55" class=" object-fit-cover profile-pic rounded-circle"/>'
                  }
                  else
                  {
                    blocLemon = '<h4 class="mb-0 text-white">Erreur lors de la récupération des informations utilisateur</h4>'
                    document.getElementById("user_infos_block").innerHTML =
                      blocLemon;
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
              xhr.onloadend = function () {};
              xhr.send();
            }
          ); // end once
        } // fin only on frontpage
      },
    };
  })(Drupal, drupalSettings);