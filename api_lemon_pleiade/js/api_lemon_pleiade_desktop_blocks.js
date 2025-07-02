(function (Drupal, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIlemonHomeBlocksBehavior = {
    attach: function (context, settings) {
      // only on frontpage (desktop)
      if (drupalSettings.path.isFront && drupalSettings.api_lemon_pleiade.field_lemon_myapps_url && drupalSettings.api_lemon_pleiade.field_lemon_url ) {
        once("APIlemonHomeBlocksBehavior", "#lemon_block_id", context).forEach(
          function () {
            // show spinner while ajax is loading
            document.getElementById("lemon_block_id").innerHTML = drupalSettings.api_lemon_pleiade.spinner;
            // make ajax call
            var xhr = new XMLHttpRequest();
            xhr.open("POST", Drupal.url("v1/api_lemon_pleiade/lemon_myapps_query"));
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.responseType = "json";
            xhr.onload = function () {
              if (xhr.status === 200) {
                
                var donnees = xhr.response;
                var blocLemon = "";

                for (var i = 0; i < donnees.myapplications.length; i++) {
                  var id = "row-" + i;
                  blocLemon +=
                    `<div class="col-lg-12"><div><div class="card mb-2">\
                    <div class="card-header rounded-top bg-white border-bottom rounded-top">\
                    <h4 class="card-title text-dark py-2">` +
                    donnees.myapplications[i].Category +
                    `<span></span></h4></div><div class="card-body"><div class="row" id="${id}">`;
                
                  for (var f = 0; f < donnees.myapplications[i].Applications.length; f++) {
                    const temp = Object.values(donnees.myapplications[i].Applications[f]);
                    const appTitle = Object.keys(donnees.myapplications[i].Applications[f]);
                    const appDesc = temp[0].AppDesc;
                    const appLogo = temp[0].AppLogo;
                    const appUri = temp[0].AppUri;
                    var widthBlock = ''
                    let logoHTML = ''
                    if(appLogo){
                      widthBlock = 'w-75'
                      if (appLogo.endsWith('.png') || appLogo.endsWith('.jpg') || appLogo.endsWith('.jpeg') || appLogo.endsWith('.gif')) {
                        const appLogoURL = drupalSettings.api_lemon_pleiade.field_lemon_url + "/static/common/apps/" + appLogo;
                        
                        logoHTML = `<div class="w-25 d-flex justify-content-end px-2"><img src="${appLogoURL}" alt="App Logo" class="app-logo"></div>`;
                      } else {
                        logoHTML = `<div class="w-25 d-flex justify-content-end px-2"><i class="fa fa-3x fa-solid fa-${appLogo}"></i></div>`;
                      }
                    }
                    else
                    {
                      widthBlock = 'w-100'
                    }
                
                    blocLemon +=
                      `<div class="col-md-4 my-3"><a target="_blank" class="border-dark text-center" title="${appDesc}" href="${appUri}">` +
                      `<div id="block_appli_lemon" class="col-12 py-3 h-100 shadow-sm align-items-center d-flex justify-content-center">` +
                      logoHTML +
                      `<div class="px-3 ${widthBlock}"><h5 class="card-title">${appTitle}</h5>` +
                      `<p class="text-muted">${appDesc}</p></div>` +
                      `</div></a></div>`;
                  }
                
                  blocLemon += "</div></div></div></div></div></div>";
                }
                
                document.getElementById("lemon_block_id").innerHTML = blocLemon;
                
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
            };
            xhr.send();
          }); // end once
      } // fin only on frontpage 
    },
  };
})(Drupal, drupalSettings);
