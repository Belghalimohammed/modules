(function ($, Drupal, drupalSettings, once) {
  "use strict";
  Drupal.behaviors.HumhubBlockBehavior = {
          attach: function (context, settings) {
                  // only on frontpage (desktop)
                  if (drupalSettings.path.isFront) {
                          setTimeout(function () {
                                  once("HumhubBlockBehavior", "body", context).forEach(
                                          function () {
                                                  // make ajax call
                                                  var xhr = new XMLHttpRequest();
                                                  xhr.open("GET", Drupal.url("v1/api_humhub_pleiade/humhub_query"));
                                                  xhr.responseType = "json";
                                                  xhr.onload = function () {
                                                          var bloc_humhub
                                                          if (xhr.status === 200) {
                                                                  var donnees = (xhr.response);
                                                                  if (donnees) {
                                                                          var donnees_spaces = donnees['spaces']
                                                                          var donnees_notif = donnees['notifs']
                                                                          var donnees_messages = donnees['messages']
                                                                    
                                                                          if (donnees_spaces && donnees_spaces.length > 6) {
                                                                            var overflow = 'overflow-y:scroll;'
                                                                          }
                                                                          function getContrastColor(hexcolor) {
                                                                            var r = parseInt(hexcolor.substr(0,2),16);
                                                                            var g = parseInt(hexcolor.substr(2,2),16);
                                                                            var b = parseInt(hexcolor.substr(4,2),16);
                                                                            var yiq = ((r*299)+(g*587)+(b*114))/1000;
                                                                            return (yiq >= 128) ? 'black' : 'white';
                                                                        }
                                                                          bloc_humhub = '\
                                                                          <div class="mb-2">\
                                                                                  <div class="card">\
                                                                                          <div class="card-header rounded-top bg-white rounded-top">\
                                                                                                  <h4 class="card-title text-dark py-2">\
                                                                                                          Réseau social des agents territoriaux</h4>\
                                                                                          </div>\
                                                                                  <div class="card-body pt-0 d-flex justify-content-between">\
                                                                          '
                                                                          bloc_humhub += '<div class="col-md-5 d-flex align-content-start  row" id="col1">\
                                                                          <h4 class="text-dark py-2">\
                                                                          Mes espaces</h4><div style="height:256px; '+ overflow + '" class="d-flex flex-wrap align-items-center justify-content-center">'
                                                                          if (donnees_spaces){
                                                                          if (donnees_spaces.length > 0) {

                                                                                  for (var i = 0; i < donnees_spaces.length; i++) {
                                                                                         
                                                                                          var color = donnees_spaces[i].color;
                                                                                          var text = donnees_spaces[i].name;
                                                                                          var url = donnees_spaces[i].url;
                                                                                          var imgUrl = drupalSettings.api_humhub_pleiade.humhub_url + donnees_spaces[i].imgUrl;
                                                                                      
                                                                                          if (donnees_spaces[i].imgUrl !== "/static/img/default_space.jpg") {
                                                                                              
                                                                                      
                                                                                              bloc_humhub += '\
                                                                                              <a href="'+ url + '" target="_blank" class="pb-2 px-2">\
                                                                                                  <div style="background-image: url('+ imgUrl +'); background-size: cover; opacity: 0.9;" class="square d-flex align-items-center justify-content-center">\
                                                                                                      <span style="width: 100%; background-color: #00000080; color: white;font-weight: 500;" class="px-2 fs-3 text-uppercase text-align-center">'+ text + '</span>\
                                                                                                  </div>\
                                                                                              </a>'
                                                                                          } else {
                                                                                              var textColor = getContrastColor(color);
                                                                                      
                                                                                              bloc_humhub += '\
                                                                                              <a href="'+ url + '" target="_blank" class="pb-2 px-2">\
                                                                                                  <div style="background-color: '+ color +'" class="square d-flex align-items-center justify-content-center">\
                                                                                                      <span style="width: 100%; background-color: #00000080; color: '+ textColor +';font-weight: 500;" class="px-2 fs-3 text-uppercase text-align-center">'+ text + '</span>\
                                                                                                  </div>\
                                                                                              </a>'
                                                                                          }
                                                                                      }
                                                                          }
                                                                          else {
                                                                                  bloc_humhub += '<h4 class="">Vous n\'avez rejoint aucun espace</h6><br><a href="'+ drupalSettings.api_humhub_pleiade.humhub_url + '/spaces">Rejoindre un espace</a>'
                                                                          }
                                                                        }
                                                                        else{
                                                                          bloc_humhub += '<h4 class="">Vous n\'avez rejoint aucun espace. <a href="'+ drupalSettings.api_humhub_pleiade.humhub_url + '/spaces">Je rejoins un espace</a></h6>'
                                                                        }

                                                                          bloc_humhub += '</div></div>'
                                                                          bloc_humhub += '<div class="col-md-7" id="col1">\
                                                                          <h4 class="text-dark py-2">\
                                                                                  Mes notifications</h4><div class="d-flex flex-column" style="height:256px; overflow-y:scroll;">'
                                                                          if (donnees['notifs'] && donnees['notifs'].results.length > 0) {
                                                                                  
                                                                                  for (var i = 0; i < donnees_notif.results.length; i++) {
                                                                                          var text = donnees_notif.results[i].output;
                                                                                          if (donnees_notif.results[i].output.includes("You were added to Space")) {
                                                                                              // Remplace "You were added to Space" par "Vous avez été ajouté à l'espace"
                                                                                              text = donnees_notif.results[i].output.replace("You were added to Space", "Vous avez été ajouté à l'espace");
                                                                                          }
                                                                                          if (donnees_notif.results[i].output.includes("created post")) {
                                                                                              // Remplace "You were added to Space" par "Vous avez été ajouté à l'espace"
                                                                                              text = donnees_notif.results[i].output.replace("created post", "a publié");
                                                                                          }
                                                                                          if (donnees_notif.results[i].output.includes(" and ")) {
                                                                                            // Remplace "You were added to Space" par "Vous avez été ajouté à l'espace"
                                                                                            text = donnees_notif.results[i].output.replace(" and ", " et ");
                                                                                          }
                                                                                          if (donnees_notif.results[i].output.includes("likes post")) {
                                                                                            // Remplace "You were added to Space" par "Vous avez été ajouté à l'espace"
                                                                                            text = donnees_notif.results[i].output.replace("likes post", "aime");
                                                                                          }
                                                                                          if (donnees_notif.results[i].output.includes("commented post")) {
                                                                                            // Remplace "You were added to Space" par "Vous avez été ajouté à l'espace"
                                                                                            text = donnees_notif.results[i].output.replace("commented post", "a commenté");
                                                                                          }
                                                                                          if (donnees_notif.results[i].output.includes("is now following you")) {
                                                                                            // Remplace "You were added to Space" par "Vous avez été ajouté à l'espace"
                                                                                            text = donnees_notif.results[i].output.replace("is now following you", "vous suit");
                                                                                          }
                                                                                          if (donnees_notif.results[i].output.includes("sent you a friend request")) {
                                                                                            // Remplace "You were added to Space" par "Vous avez été ajouté à l'espace"
                                                                                            text = donnees_notif.results[i].output.replace("sent you a friend request", "vous a envoyé une demande d'amis");
                                                                                          }
                                                                                          if (donnees_notif.results[i].output.includes("invited you to the space")) {
                                                                                            // Remplace "You were added to Space" par "Vous avez été ajouté à l'espace"
                                                                                            text = donnees_notif.results[i].output.replace("invited you to the space", "vous a invité à rejoindre");
                                                                                          }
                                                                                          if (donnees_notif.results[i].output.includes("accepted your invite for the space")) {
                                                                                            // Remplace "You were added to Space" par "Vous avez été ajouté à l'espace"
                                                                                            text = donnees_notif.results[i].output.replace("accepted your invite for the space", "a accepté de rejoindre");
                                                                                          }
                                                                                          if (donnees_notif.results[i].output.includes("mentioned you in comment")) {
                                                                                            // Remplace "You were added to Space" par "Vous avez été ajouté à l'espace"
                                                                                            text = donnees_notif.results[i].output.replace("mentioned you in comment", "vous a mentionné : ");
                                                                                          }
                                                                                          var date = donnees_notif.results[i].createdAt;
                                                                                          var formattedDate = new Date(date); // Créer un objet de date
                                                                                          var day = formattedDate.getDate();
                                                                                          var month = formattedDate.getMonth() + 1; // Les mois sont indexés à partir de 0, donc ajouter 1
                                                                                          var year = formattedDate.getFullYear();
                                                                                          var hours = formattedDate.getHours();
                                                                                          var minutes = formattedDate.getMinutes();
                                                                                          // Formater la date et l'heure
                                                                                          var formattedString = day + '/' + (month < 10 ? '0' : '') + month + '/' + year + ' ' + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
                                                                                          bloc_humhub += '\
                                                                                          <a target="_blank" href="'+ drupalSettings.api_humhub_pleiade.humhub_url +'/notification/overview" class="">\
                                                                                                  <div class="d-flex justify-content-start align-items-start">\
                                                                                                          <span class="pt-1 col-md-2 fs-2">'+ formattedString + '</span>\
                                                                                                          <span>'+ text + '</span>\
                                                                                                  </div>\
                                                                                          </a><hr>\
                                                                                          '
                                                                                  }

                                                                          }
                                                                          if (donnees['messages'] && donnees['messages'].results.length > 0) {
                                                                            var number_notif = donnees_messages.results[0].isUnread;
                                                                                  
                                                                                          var href = drupalSettings.api_humhub_pleiade.humhub_url + '/mail/mail/index';

                                                                                          if (donnees_messages.results[0].isUnread == 1) {
                                                                                            bloc_humhub += '\
                                                                                            <div class="">\
                                                                                                    <div class="d-flex justify-content-start align-items-start">\
                                                                                                    <span class="pt-1 col-md-2 fs-2"></span>\
                                                                                                            <a href="'+ href + '" target="_blank">Vous avez '+ number_notif +' nouveau message privé</a>\
                                                                                                    </div>\
                                                                                            </div><hr>\
                                    '
                                                                                          } 
                                                                                          else if (donnees_messages.results[0].isUnread > 1) {
                                                                                                        bloc_humhub += '\
                                                                                                        <div class="">\
                                                                                                                <div class="d-flex justify-content-start align-items-start">\
                                                                                                                <span class="pt-1 col-md-2 fs-2"></span>\
                                                                                                                        <a href="'+ href + '" target="_blank">Vous avez '+ number_notif +' nouveaux messages privés</a>\
                                                                                                                </div>\
                                                                                                        </div><hr>\
                                                '
                                                                                          } 
                                                                                          else 
                                                                                          {
                                                                                            bloc_humhub += '\
                                                                                                  <div class="">\
                                                                                                          <div class="d-flex justify-content-start align-items-center">\
                                                                                                          <span class="col-md-2 fs-2"></span>\
                                                                                                                  <a href="'+ href + '" target="_blank">Vous n\'avez pas de nouveau message privé</a>\
                                                                                                          </div>\
                                                                                                  </div><hr>'
                                                                                          }
                                                                                          
                                                                                  

                                                                          }
                                                                          else if((donnees['messages'].results.length = 0) && (donnees['notifs'].results.length = 0)) {
                                                                                  bloc_humhub += '<h6 class="col-md-2">Aucune notification</h6>'

                                                                          }
                                                                          bloc_humhub += '</div></div>'
                                                                          bloc_humhub += ''
                                                                                          "\
                                                                                          </div>\
                                                                                  </div>\
                                                                          </div>\
                                                                          ";
                                                                  }
                                                                  else
                                                                  {
                                                                          bloc_humhub = '\
                                                                          <div class="mb-2">\
                                                                                  <div class="card">\
                                                                                          <div class="card-header rounded-top bg-white rounded-top">\
                                                                                                  <h4 class="card-title text-dark py-2">\
                                                                                                          Réseau Social des agents territoriaux</h4>\
                                                                                          </div>\
                                                                                          <div class="card-body pt-0 d-flex justify-content-between">\
                                                                                          '+ donnees +'\
                                                                                          </div>\
                                                                                  </div>\
                                                                          </div>\
                                                                          '    
                                                                  }


                                                                  document.getElementById("humhub_block").innerHTML = bloc_humhub;

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
                                                          }
                                                  };
                                                  xhr.send();
                                          }); // end once
                          }, 2000); // 1000 millisecondes = 1 seconde
                  }
          },
  };
})(jQuery, Drupal, drupalSettings, once);
