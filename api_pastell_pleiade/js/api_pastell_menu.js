(function (Drupal, $, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIpastellMenuBehavior = {};
  Drupal.behaviors.APIpastellMenuBehavior.get_id_coll = function (id_e) {
    setTimeout(function () {
      if (drupalSettings.api_pastell_pleiade.field_pastell_flux_url) {

        var url_pastell = drupalSettings.api_pastell_pleiade.field_pastell_url
        
        function getCookie(name) {
          // Récupérer tous les cookies
          const cookies = document.cookie.split(';');

          // Parcourir chaque cookie
          for (let cookie of cookies) {
            // Diviser le nom et la valeur du cookie
            const [cookieName, cookieValue] = cookie.split('=');

            // Supprimer les espaces blancs avant et après le nom du cookie
            const trimmedCookieName = cookieName.trim();

            // Vérifier si le nom du cookie correspond à celui recherché
            if (trimmedCookieName === name) {
              // Retourner la valeur du cookie
              return cookieValue;
            }
          }

          // Retourner null si le cookie n'est pas trouvé
          return null;
        }

        const userGroupsTempstore = decodeURIComponent(getCookie('groups'));
        
       
        var xhr = new XMLHttpRequest();
        xhr.open("GET", Drupal.url("v1/api_pastell_pleiade/pastell_flux_query"));
        xhr.responseType = "json";
        xhr.onload = function () {
          if (xhr.status === 200) {
            var menu_a_remplir = ""
            var response = xhr.response;
            var menu_actes = document.getElementById('actes'),
              menu_convocations = document.getElementById('convocations'),
              menu_doc_a_signer = document.getElementById('signature_electronique'),
              menu_helios = document.getElementById('flux_financier');
            var aDelete = document.querySelectorAll('.sub_menu_eadmin');
            for (var i = 0; i < aDelete.length; i++) {
              aDelete[i].parentNode.removeChild(aDelete[i]);
            }
            for (var key in response) {

              var item = response[key];

              var itemName = item.nom;
              
              switch (itemName) {
                
                case 'Actes':
                  var nouvelElement = document.createElement('div');
                  nouvelElement.classList.add('sub_menu_eadmin');
                  nouvelElement.classList.add('collapse');
                  nouvelElement.setAttribute('id', 'collapseactes');

                  if (userGroupsTempstore.includes('pastell-actes')) {
                    menu_a_remplir = '\
                        <a class="waves-effect waves-dark" title="Télétransmettre un acte" target="_blank" href="' + url_pastell + '/Document/new?id_e=' + id_e + '&type=' + key + '" aria-expanded="false">\
                            <span class="hide-menu px-2">Télétransmettre un acte</span>\
                        </a>';
                    if (drupalSettings.path.isFront) {
                      menu_a_remplir += '\
                        <span class="waves-effect waves-dark" id="voir_actes" title="Voir les actes" target="_blank" aria-expanded="false">\
                            <span class="hide-menu px-2">Voir les actes</span>\
                        </span>'
                    }
                    else {
                      menu_a_remplir += '\
                        <a class="waves-effect waves-dark" href="/node?goToDatatable=true&type=acte" id="voir_actes" title="Voir les actes" aria-expanded="false">\
                            <span class="hide-menu px-2">Voir les actes</span>\
                        </a>'
                    }
                  }
                  if (userGroupsTempstore.includes('webactes')) {
                    menu_a_remplir += '\
                          <a class="waves-effect waves-dark" title="Gérer les actes" target="_blank" href="https://www.libriciel.fr/logiciels/webactes/" aria-expanded="false">\
                            <span class="hide-menu px-2">Gérer les actes</span>\
                          </a>'
                  }
                  if (userGroupsTempstore.includes('publicationdesactes')) {
                    menu_a_remplir += '\
                          <span class="waves-effect waves-dark" id="voir_actes" title="Publier les actes" target="_blank" href="https://services.megalis.bretagne.bzh/actualite/publication-des-actes-nouvelle-fonctionnalite/" aria-expanded="false">\
                              <span class="hide-menu px-2">Publier les actes</span>\
                          </span>';
                  }
                  nouvelElement.innerHTML = menu_a_remplir
                  if (menu_actes && !document.getElementById('collapseactes')) {
                    menu_actes.insertAdjacentElement('afterend', nouvelElement);
                  }

                  break;

                case 'Convocation':
                  
                  var nouvelElement = document.createElement('div');
                  nouvelElement.classList.add('sub_menu_eadmin');
                  nouvelElement.classList.add('collapse');
                  nouvelElement.setAttribute('id', 'collapseconvocations');
                  if (userGroupsTempstore.includes('pastell-convocations')) {
                    menu_a_remplir = '\
                        <a class=" waves-effect waves-dark" title="Envoyer une convocation" target="_blank" href="' + url_pastell + '/Document/new?id_e=' + id_e + '&type=' + key + '" aria-expanded="false">\
                        <span class="hide-menu px-2">Envoyer une convocation</span></a>'
                    if (drupalSettings.path.isFront) {
                      menu_a_remplir += '\
                          <span class="waves-effect waves-dark" id="voir_convocs" title="Voir les convocations" target="_blank"  aria-expanded="false">\
                          <span class="hide-menu px-2">Voir les convocations</span></span>'
                    }
                    else {
                      menu_a_remplir += '\
                          <a class="waves-effect waves-dark" href="/node?goToDatatable=true&type=convoc" id="voir_convocs" title="Voir les convocations"  aria-expanded="false">\
                          <span class="hide-menu px-2">Voir les convocations</span></a>'
                    }
                    menu_a_remplir += '\
                          <a class="waves-effect waves-dark" target="_blank" href="' + url_pastell + '/MailSec/annuaire?id_e=' + id_e + '" id="voir_convocs" title="Annuaire des convocations"  aria-expanded="false">\
                          <span class="hide-menu px-2">Annuaire des convocations</span></a>'
                  }
                  nouvelElement.innerHTML = menu_a_remplir
                  if (menu_convocations && !document.getElementById('collapseconvocations')) {
                    menu_convocations.insertAdjacentElement('afterend', nouvelElement);
                    
                  }

                  break;

                case 'Helios':


                  var nouvelElement = document.createElement('div');
                  nouvelElement.classList.add('sub_menu_eadmin');
                  nouvelElement.classList.add('collapse');
                  nouvelElement.setAttribute('id', 'collapseflux_financier');
                  if (userGroupsTempstore.includes('pastell-helios')) {
                    menu_a_remplir = '\
                        <a class="waves-effect waves-dark" title="Télétransmettre un flux Hélios" target="_blank" href="' + url_pastell + '/Document/new?id_e=' + id_e + '&type=' + key + '" aria-expanded="false">\
                        <span class="hide-menu px-2">Télétransmettre un flux Hélios</span></a>'
                    if (drupalSettings.path.isFront) {
                      menu_a_remplir += '\
                            <span class=" waves-effect waves-dark" id="voir_helios" title="Voir les flux Hélios" target="_blank" aria-expanded="false">\
                            <span class="hide-menu px-2">Voir les flux Hélios</span></span>'
                      if (userGroupsTempstore.includes('pastell-chorus')) {
                        menu_a_remplir += '\
                              <span class=" waves-effect waves-dark" id="voir_chorus_pro" title="Voir les flux Hélios" target="_blank" aria-expanded="false">\
                              <span class="hide-menu px-2">Voir les flux Chorus pro</span></span>';
                      }
                    }
                    else {
                      menu_a_remplir += '\
                        <a class=" waves-effect waves-dark" href="/node?goToDatatable=true&type=helios" id="voir_helios" title="Voir les flux Hélios" aria-expanded="false">\
                        <span class="hide-menu px-2">Voir les flux Hélios</span></a>'
                      if (userGroupsTempstore.includes('pastell-chorus')) {
                        menu_a_remplir += '\
                            <a class="waves-effect waves-dark" href="/node?goToDatatable=true&type=chorus" id="voir_chorus_pro" title="Voir les flux Hélios" aria-expanded="false">\
                            <span class="hide-menu px-2">Voir les flux Chorus pro</span></a>';
                      }

                    }
                  }
                  nouvelElement.innerHTML = menu_a_remplir
                  if (menu_helios && !document.getElementById('collapseflux_financier')) {
                    menu_helios.insertAdjacentElement('afterend', nouvelElement);
                  }

                  break;
                case 'Document à faire signer':
                  menu_a_remplir = ''
                  var nouvelElement = document.createElement('div');
                  nouvelElement.classList.add('sub_menu_eadmin');
                  nouvelElement.classList.add('collapse');
                  nouvelElement.setAttribute('id', 'collapsesignature_electronique');

                  if (userGroupsTempstore.includes('pastell-docasigner')) {

                    menu_a_remplir = '\
                        <a class="waves-effect waves-dark" title="Envoyer un document au parapheur" target="_blank" href="' + url_pastell + '/Document/new?id_e=' + id_e + '&type=' + key + '" aria-expanded="false">\
                        <span class="hide-menu px-2">Envoyer un document au parapheur</span></a>'
                    if (userGroupsTempstore.includes('pastell-doclots')) {
                      menu_a_remplir += '\
                                <a class="waves-effect waves-dark" title="Envoyer en lots au parapheur" href="/lots/docs?id_e=' + id_e + '" aria-expanded="false">\
                                <span class="hide-menu px-2">Envoyer en lots au parapheur</span></a>'
                    }
                  }
                  if (userGroupsTempstore.includes('parapheur85b') || 
                  userGroupsTempstore.includes('parapheur72')|| 
                  userGroupsTempstore.includes('parapheur53')|| 
                  userGroupsTempstore.includes('parapheur44')|| 
                  userGroupsTempstore.includes('parapheur49')|| 
                  userGroupsTempstore.includes('parapheur')) {
                    var a_traiter = ''
                    if (localStorage.getItem('docs_parapheur') !== '0') {
                      
                      a_traiter = '(' + localStorage.getItem('docs_parapheur') + ')'
                    }
                    else {
                      a_traiter = ''
                    }
                    var url_parapheur = ""
                    var departement = decodeURIComponent(getCookie('departement'));
                              
                                if (departement == '85b'){
                                    url_parapheur =  drupalSettings.api_parapheur_pleiade.field_parapheur_url + '85.ecollectivites.fr'
                                }
                                else if(departement == '85' || departement == 'null'){
                                    url_parapheur =  drupalSettings.api_parapheur_pleiade.field_parapheur_url + '.ecollectivites.fr'
                                }
                                else{
                                    url_parapheur =  drupalSettings.api_parapheur_pleiade.field_parapheur_url + departement +'.ecollectivites.fr'
                                }
                    menu_a_remplir += '\
                        <a class="waves-effect waves-dark" title="Signer/viser sur le parapheur" target="_blank" href="'+ url_parapheur +'" aria-expanded="false">\
                        <span class="hide-menu px-2">Signer/viser sur le parapheur <span id="a_traiter">'+ a_traiter + '</span></span></a>'
                  }
                  if (userGroupsTempstore.includes('pastell-docasigner') && drupalSettings.path.isFront) {
                    menu_a_remplir += '\
                        <span id="voir_docs" class="waves-effect waves-dark" title="Voir les documents à faire signer" target="_blank" aria-expanded="false">\
                        <span class="hide-menu px-2">Voir les documents à faire signer</span></span>';
                  }
                  else if (userGroupsTempstore.includes('pastell-docasigner') && !drupalSettings.path.isFront) {
                    menu_a_remplir += '\
                        <a id="voir_docs" href="/node?goToDatatable=true&type=parapheur" class="waves-effect waves-dark" title=Voir les documents à faire signer" aria-expanded="false">\
                        <span class="hide-menu px-2">Voir les documents à faire signer</span></a>';
                  }

                  nouvelElement.innerHTML = menu_a_remplir
                  
                  if (menu_doc_a_signer ) {
                    menu_doc_a_signer.insertAdjacentElement('afterend', nouvelElement);
                  }

                  break;
              }

              menu_a_remplir += '</div></div>';

             
            }
          }
        }
        xhr.send();


      } // fin only on frontpage 
    }, 2000);
  }

})(Drupal, jQuery, drupalSettings);
