(function (Drupal, drupalSettings, once) {
    "use strict";
    Drupal.behaviors.APIpastellEntitesBehavior = {
        attach: function (context, settings) {
            // if ((drupalSettings.path.isFront || drupalSettings.path.currentPath === 'lots/docs') && drupalSettings.api_pastell_pleiade.field_pastell_entities_url) {
                if (drupalSettings.api_pastell_pleiade.field_pastell_entities_url) {

                once("APIpastellEntitesBehavior", "#collectiviteChoice", context).forEach(
                    function () {
                        // le nom du groupe LDAP pour pastell doit etre renseigné dans l'admin
                        // prepare menu 
                        var linkEntitie = document.getElementById("collectiviteChoice");
                        // make ajax call
                        var xhr = new XMLHttpRequest();
                        xhr.open("GET", Drupal.url("v1/api_pastell_pleiade/pastell_entities_query"));
                        // Pastell pas en UTF8 :/
                        // xhr.overrideMimeType('text/xml; charset=iso-8859-1');
                        xhr.responseType = "json";
                        xhr.onload = function () {
                            
                            if (xhr.status === 200) {
                                
                                var donnees = xhr.response;
                                

                                // construct menu
                                if (donnees && donnees != 'null') {
                  
                                    donnees.forEach(function(value) {
                                        
                                
                                        var option = document.createElement("option");
                                        option.id = "entitie_number_" + value.id_e;
                                        option.className = "dropdown-item";
                                        option.value = value.id_e;
                                        option.text = unescape(value.denomination);
                                        linkEntitie.appendChild(option);
                                    
                                    })

                                }
                                else
                                {
                                    var select_choice = document.getElementById('coll_choice');
                                    select_choice.innerHTML = ""
                                }


                            }
                            else
                            {
                                var select_choice = document.getElementById('coll_choice');
                                select_choice.innerHTML = "<span>Erreur lors de la récupération des entités pastell, veuillez contacter l'administrateur système</span>"
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
                            xhr.onloadend = function () {

                                
                                if(document.getElementById('collectiviteChoice')){
                                    var array_value_select = [];
                                    for (var i = 0; i < document.getElementById('collectiviteChoice').length; i++) {
                                        array_value_select.push(document.getElementById('collectiviteChoice').options[i].value);
                                    }

                                    // Selected coll localStorage management
                                    if (!localStorage.getItem('collectivite_id') || localStorage.getItem('collectivite_id') == null || !array_value_select.includes(localStorage.getItem('collectivite_id'))) {
                                        var optionValue = document.getElementById('collectiviteChoice').value;
                                        // console.log('Optionvalue : ' + document.getElementById('collectiviteChoice').value);
                                        localStorage.setItem('collectivite_id', optionValue);
                                        // Now call document JS module function to get documents with our entity id

                                        Drupal.behaviors.APIpastellMenuBehavior.get_id_coll(optionValue);

                                    }
                                    else {
                                        // on refresh, set the previous selected collectivite from localstorage
                                        document.getElementById('collectiviteChoice').value = localStorage.getItem('collectivite_id');
                                        // Now call document JS module function to get documents with our entity id

                                        Drupal.behaviors.APIpastellMenuBehavior.get_id_coll(document.getElementById('collectiviteChoice').value);
                                    }
                                    // debug
                                    // console.log('Selected coll from Entites JS module = '+ document.getElementById('collectiviteChoice').value);
                                    if (!drupalSettings.api_pastell_pleiade) {
                                        localStorage.removeItem('collectivite_id');
                                        var element = document.getElementById('collectiviteChoice');
                                        if (element) {
                                            element.style.visibility = 'hidden !important';
                                        }
                                    }
                                }
                            }

                            if(document.getElementById('collectiviteChoice')){
                                // Monitor select menu change
                                document.addEventListener('input', function (event) {

                                    // Only run on our select menu
                                    if (event.target.id !== 'collectiviteChoice') return;

                                    // The selected value changed, update our localStore
                                    localStorage.setItem('collectivite_id', event.target.value);
                                    // debug
                                    console.log('Collectivité select change : ' + event.target.value);
                                    // Now call again document JS module function to get documents 
                                   
                                    Drupal.behaviors.APIpastellMenuBehavior.get_id_coll(event.target.value);
                                }, false);

                                
                                    
                                document.addEventListener('input', function (event) {
                                    if (drupalSettings.path.currentPath === 'lots/docs') {
                                        if (event.target.id !== 'collectiviteChoice') return;
                                        const currentUrl = new URL(window.location.href);
                                        currentUrl.searchParams.set('id_e', event.target.value);
                                        // Update the URL with the new parameter
                                        window.history.replaceState({}, document.title, currentUrl.toString());
                                        window.location.reload();
                                    }

                                }, false);
                            }
                            
                        };
                        xhr.send();
                    }); // end once
            } // fin only on frontpage 
        },
    };
})(Drupal, drupalSettings, once);
