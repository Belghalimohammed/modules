(function (Drupal, once, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIUserInfoBehavior = {
    attach: function (context, settings) {
      // Load on front page only,
      // ajout diminution and augmentation de la taille de la police
      
      if (drupalSettings.path.isFront) {
        once("APIUserInfoBehavior", "body", context).forEach(function () {
          
          
          
          
          // //Change couleur bouton blocs current
          // // Get the container element
          // document.addEventListener("DOMContentLoaded", () => {
          //   const activeLink = document.querySelector("[data-slide='1']");
          //   activeLink.classList.add("active");
          // })
          // var btnContainer = document.getElementById("link_slider");

          // // Get all buttons with class="btn" inside the container
          // var btns = btnContainer.getElementsByClassName("link_slide");

          // // Loop through the buttons and add the active class to the current/clicked button
          // for (var i = 0; i < btns.length; i++) {
          //   btns[i].addEventListener("click", function() {
          //     var current = document.getElementsByClassName("active");

          //     // If there's no active class
          //     if (current.length > 0) {
          //       current[0].className = current[0].className.replace(" active", "");
          //     }

          //     // Add the active class to the current/clicked button
          //     this.className += " active";
          //   });
          // }
          
          // // get the relevant elements
          // const linkSlider = document.getElementById("link_slider");
          // const links = linkSlider.querySelectorAll(".link_slide");

          // // get the elements with the "prev-arrow" and "next-arrow" classes
          // const prevArrow = document.querySelector(".slick-prev");
          // const nextArrow = document.querySelector(".slick-next");

          // // add a click event listener to the prev-arrow element
          // prevArrow.addEventListener("click", () => {
          //   // find the currently active link
          //   const activeLink = linkSlider.querySelector(".active");

          //   // get the index of the active link
          //   const activeIndex = Array.prototype.indexOf.call(links, activeLink);

          //   // calculate the index of the previous link
          //   let prevIndex = activeIndex === 0 ? links.length - 1 : activeIndex - 1;

          //   // check if the current active link's data-slide attribute is "1"
          //   // and set prevIndex to 2 (i.e., the index of the "Documents Pastell" link)
          //   if (activeLink.getAttribute("data-slide") === "1") {
          //     prevIndex = 2;
          //   }

          //   // remove the active class from the currently active link
          //   activeLink.classList.remove("active");

          //   // add the active class to the previous link
          //   links[prevIndex].classList.add("active");
          // });

          // // add a click event listener to the next-arrow element
          // nextArrow.addEventListener("click", () => {
          //   // find the currently active link
          //   const activeLink = linkSlider.querySelector(".active");
          
          //   // get the index of the active link
          //   const activeIndex = Array.prototype.indexOf.call(links, activeLink);
          
          //   // calculate the index of the next link
          //   let nextIndex = activeIndex === links.length - 1 ? 0 : activeIndex + 1;
          
          //   // check if the current active link's data-slide attribute is "3"
          //   // and set nextIndex to 0 (i.e., the index of the "Accueil" link)
          //   if (activeLink.getAttribute("data-slide") === "3") {
          //     nextIndex = 0;
          //   }
          
          //   // remove the active class from the currently active link
          //   activeLink.classList.remove("active");
          
          //   // add the active class to the next link
          //   links[nextIndex].classList.add("active");
          // });

          

          // Augmenter la taille des polices
          var increaseBtn = document.getElementById("increase-btn");
          var decreaseBtn = document.getElementById("decrease-btn");

          // Fonctions pour l'affichage du menu étendu et sa checkbox
          function toggleAccordion() {
            const extendedMenu = localStorage.getItem('extended_menu');
            if (extendedMenu !== null) {
              const input = document.querySelector('input[name="extended_menu"]');
              input.setAttribute('checked', 'checked');
              
              const accordionCollapses = document.querySelectorAll('.accordion-collapse');
              for (let i = 0; i < accordionCollapses.length; i++) {
                accordionCollapses[i].classList.toggle('show');
              }
            }
          }
          
          function handleCheckboxChange() {
            const checkbox = document.querySelector('input[name="extended_menu"]');
            const accordionCollapses = document.querySelectorAll('.accordion-collapse');
            if (checkbox.checked) {
              localStorage.setItem('extended_menu', true);
              for (let i = 0; i < accordionCollapses.length; i++) {
                accordionCollapses[i].classList.add('show');
              }
            } else {
              localStorage.removeItem('extended_menu');
              for (let i = 0; i < accordionCollapses.length; i++) {
                accordionCollapses[i].classList.remove('show');
              }
            }
          }
          window.addEventListener('load', toggleAccordion);
          const checkbox = document.querySelector('input[name="extended_menu"]');
          checkbox.addEventListener('change', handleCheckboxChange);

          
          // Add event listeners to the buttons
          increaseBtn.addEventListener("click", function() { 
              var el = document.body;
              var style = window.getComputedStyle(el, null).getPropertyValue('font-size');
              var style_up = window.getComputedStyle(increaseBtn, null).getPropertyValue('font-size');
              var fontSize = parseFloat(style); 
              var fontSizeUp = parseFloat(style_up); 
              console.log(style_up)
              el.style.fontSize = (fontSize + 3) + 'px';
              increaseBtn.style.fontSize = (fontSizeUp + 3) + 'px';
              decreaseBtn.style.fontSize = (fontSize + 3) + 'px';
          });
          decreaseBtn.addEventListener("click", function() {
            var el = document.body;
            var style = window.getComputedStyle(el, null).getPropertyValue('font-size');
            var style_down = window.getComputedStyle(decreaseBtn, null).getPropertyValue('font-size');
            var style_up = window.getComputedStyle(increaseBtn, null).getPropertyValue('font-size');
            var fontSize = parseFloat(style); 
            var fontSizeDown = parseFloat(style_down); 
            var fontSizeUp = parseFloat(style_up); 
            console.log(fontSize)
            el.style.fontSize = (fontSize - 3) + 'px';
            decreaseBtn.style.fontSize = (fontSizeDown - 3) + 'px';
            increaseBtn.style.fontSize = (fontSizeUp - 3) + 'px';
          });
          var xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/api_user_pleiade/notification_query"));
          xhr.responseType = "json";
          xhr.onload = function () {
            if (xhr.status === 200) {
              var donnees = xhr.response;
              const div = document.querySelector('#notification_alert');
              if(donnees && div){  
                console.log(donnees)
                window.onload = function() {
                  var displayNotif = document.getElementById("notification_alert"); // replace "myDiv" with the actual id of your div
                  displayNotif.style.display = "block";
                }
                var svg_bell = document.querySelector('.alert_popup svg'); // if notifictation hide svg bell 
                if(svg_bell)
                {
                  svg_bell.style.display = "none";
                }
                const div_alert = document.querySelector('.alert_popup'); // add svg with red point
                if(div_alert)
                {
                  div_alert.classList.add("notification_scale");
                  div_alert.innerHTML += '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="25" height="25" viewBox="0 0 24 24" fill="none"stroke="currentColor" stroke-width="2" xml:space="preserve" style="cursor: pointer;"><defs></defs><g transform="matrix(1 0 0 1 12 12)"  ><g style=""><g transform="matrix(1 0 0 1 0 -2.5)"  ><path style="stroke: #1f3889; stroke-width: 2; stroke-dasharray: none; stroke-linecap: round; stroke-dashoffset: 0; stroke-linejoin: round; stroke-miterlimit: 4; fill: none; fill-rule: nonzero; opacity: 1;"  transform=" translate(-12, -9.5)" d="M 18 8 A 6 6 0 0 0 6 8 c 0 7 -3 9 -3 9 h 18 s -3 -2 -3 -9" stroke-linecap="round" /></g><g transform="matrix(1 0 0 1 0 9.5)"  ><path style="stroke: #1f3889; stroke-width: 2; stroke-dasharray: none; stroke-linecap: round; stroke-dashoffset: 0; stroke-linejoin: round; stroke-miterlimit: 4; fill: none; fill-rule: nonzero; opacity: 1;"  transform=" translate(-12, -21.5)" d="M 13.73 21 a 2 2 0 0 1 -3.46 0" stroke-linecap="round" /></g></g></g><g transform="matrix(0.07 0 0 0.07 19.5 3.33)"  ><circle style="stroke: rgb(255,0,0); stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,0,0); fill-rule: nonzero; opacity: 1;" vector-effect="non-scaling-stroke"  cx="0" cy="0" r="40" /></g></svg>';
                }
                for (var i = 0; i < donnees.length; i++) {
                  console.log(donnees);
                  const timestamp =  donnees[i].created_date; // example timestamp
                  const date = new Date(timestamp * 1000); // convert timestamp to Date object
                  const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
                  const dateStr = date.toLocaleDateString('fr-FR', options); // format date as French string

                  div.innerHTML += '<div class="dropdown-item" id="notifications_alert">\
                  <span class="d-flex my-1 text-decoration-underline text-uppercase fw-bolder">'+ donnees[i].nom_de_l_applicatif +'</span>\
                  '+ donnees[i].body +'\
                  <span class="d-flex my-1 "> Le '+ dateStr +'</span>\
                  </div>\
                  <div class="dropdown-divider"></div>';
                }
              }
              else // if no notification
              {
                div.innerHTML += '<div class="dropdown-item" >\
                <div class="d-flex justify-content-center">Aucune nouvelle notification</div>';
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
            // feather icons
            feather.replace();
            
          };

          xhr.send();
        }); // fin once function



        
        //ajout guide interactif
        if(document.querySelector('#menuPastell').innerHTML === ""){
          document.querySelector('#menuPastell').remove
        }
        document.getElementById("interactive_guid").addEventListener("click", function(){ 
          introJs().setOptions({
            showProgress: true,
            showBullets: false,
            steps: [{
              intro: "Bienvenue sur le guide interactif du Bureau Virtuel Pléiade"
            }, {
              element: document.querySelector('#menuTestLemon2'),
              intro: "En cliquant sur les menus, vous pouvez ici accéder à vos différents applicatifs."
            }, 
            {
              element: document.querySelector('#collectiviteChoice'),
              intro: "Si vous appartenez à plusieurs entitées, vous pouvez choisir celle que vous souhaitez ici. "
            }, 
            {
              element: document.querySelector('.box-accessibility'),
              intro: "Si vous avez des problèmes de vue, Vous pouvez augmenter la police ou la diminuer ici. "
            }, 
            {
              element: document.querySelector('.alert_popup'),
              intro: "Si vous avez des notifications, elles apparaîtront ici. "
            }, 
            {
              element: document.querySelector('.user_card'),
              intro: "Si vous avez besoin d'accéder à votre profil, voir votre historique de connexion, ou simplement vous déconnecter, cliquez ici."
            }, 
            {
              element: document.querySelector('.service-panel-toggle'),
              intro: "Si vous voulez personnaliser votre bureau, cliquez ici.",
              position: 'left'
            },
            {
              element: document.querySelector('#sntch_button'),
              intro: "Une interrogation ? Notre assistant virtuel est à votre service."
            }]
          }).start();
        });
      }
    },
  };
})(Drupal, once, drupalSettings);
