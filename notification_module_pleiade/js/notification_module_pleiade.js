(function (Drupal, drupalSettings, once) {
  "use strict";
  Drupal.behaviors.APInotificationBlocksBehavior = {
    attach: function (context, settings) {
      // only on frontpage (desktop)
      
        once( "APInotificationBlocksBehavior", "body", context ).forEach(function () {
          // make ajax call
          var xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/notification_module_pleiade/notification_fields"));
          xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
          xhr.responseType = "json"; 
          xhr.onload = function () {
            if (xhr.status === 200) {
              var donnees = xhr.response;
              
              const div = document.querySelector("#notification_alert");
              if (donnees.length > 0 && div) {
               
                const div_alert = document.querySelector(".alert_popup"); // add svg with red point
                
                if (div_alert) {
                  div_alert.classList.add("notification_scale");
                  div_alert.innerHTML +=
                    '<span class="position-absolute start-75 translate-middle fs-2 px-1 text-white rounded-pill bg-danger">'+ donnees.length +'</span>';
                }
                for (var i = 0; i < donnees.length; i++) {
                  var date_creation = donnees[i].creation_date;
                  var minutesAgo = Math.floor((Date.now() / 1000 - date_creation) / 60); // Calculate minutes ago
                  var notification;
                  
                  if (minutesAgo <= 1) {
                    notification = "Maintenant";
                  } else if (minutesAgo <= 60) {
                    notification = "Il y a " + minutesAgo + " minutes";
                  } else if (minutesAgo <= 1440) { // 1440 minutes = 24 hours
                    var hoursAgo = Math.floor(minutesAgo / 60);
                    notification = "Il y a " + hoursAgo + " heure" + (hoursAgo > 1 ? "s" : "");
                  } else {
                    var daysAgo = Math.floor(minutesAgo / 1440);
                    notification = "Il y a " + daysAgo + " jour" + (daysAgo > 1 ? "s" : "");
                  }
                  div.innerHTML += '<div class="dropdown-item" id="notifications_alert">\
                  <span class="application">' + donnees[i].application + '</span>\
                  <span class="body">' + donnees[i].field_description + '</span>\
                  <span class="date_creation">' + notification + '</span>\
                </div>\
                <div class="dropdown-divider"></div>';

                }
              } // if no notification
              else {
                var displayNotif = document.getElementById("notification_alert"); 
                  displayNotif.classList.remove("show");
                div.innerHTML +=
                  '<div class="dropdown-item" id="emptyNoth">\
                              <h6 class="d-flex justify-content-center">Aucune nouvelle notification</h6>';
              }
            }
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
          };
          xhr.send();
        }); // end once
      
    },
  };
})(Drupal, drupalSettings, once);
