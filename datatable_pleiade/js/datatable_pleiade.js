(function (Drupal, $, drupalSettings) {
  "use strict";
  Drupal.behaviors.DatatableDocBehavior = {
    attach: function (context, settings) {
            setTimeout(function () {
      once("DatatableDocBehavior", "body", context).forEach(function () {
     

        // Get the previously selected value from localStorage
        if (localStorage.getItem("collectivite_id")) {
          var previousValue = localStorage.getItem("collectivite_id");
        }
        if (drupalSettings.api_pastell_pleiade) {
          var pastell_url = drupalSettings.api_pastell_pleiade.field_pastell_url;
        }
        function reloadDataTable(previousValue) {
          // Now call again document JS module function to get documents

          var xhr = new XMLHttpRequest();
          if (previousValue == undefined) {
            previousValue = ''
          }
          xhr.open("GET",
            Drupal.url("v1/datatable_pleiade/documents_recents?id_e=" + previousValue));

          xhr.responseType = "json";
          xhr.onload = function () {
            if (xhr.status === 200) {

              var donnees = xhr.response;
              var ErrorActeCounts = 0, ErrorHeliosCounts = 0, ErrorConvocCounts = 0, ErrorDocsCounts = 0, etat, titre, type;
              if (donnees && donnees != '0') {
                var donnees = donnees.docs
                var document_coll =
                  '\
                      <div class="col-lg-12" id="pastell_block"> \
                      <div class="mb-2">\
                        <div class="card close mb-0">\
                          <div class="card-header close-icon d-flex align-items-center rounded-top bg-white rounded-top">\
                            <h4 class="card-title text-dark py-2">\
                              Activités récentes<span></span>\
                            </h4>\
                            <button type="button" class="btn btn-secondary reload-btn" id="reloadDatatable">\
                            <i class="fa-solid fa-rotate"></i>\
                            </button>\
                          </div>\
                          <div class="card-body close-div">\
                            <table class="table table-striped" id="tablealldocs">\
                              <thead>\
                                <tr>\
				  <th scope="col">Application</th>\
                                  <th scope="col">Titre</th>\
                                  <th scope="col">Type</th>\
                                  <th scope="col">Date</th>\
                                  <th scope="col">Statut</th>\
                                  <th scope="col">Actions</th>\
                                  </tr>\
                              </thead>\
                              <tbody>';
                for (var i = 0; i < donnees.length; i++) {
                  if (
                    donnees[i].type === "Nextcloud" &&
                    donnees[i].titre &&
                    donnees[i].creation &&
                    donnees[i].fileUrl
                  ) {
                    var titre = donnees[i].titre;
                    var type = "Notification"; // Assuming 'Nextcloud' is the type for this item
                    var objectDate = donnees[i].creation;

                    var etat =
                      '<span class="badge py-2 px-4 bg-primary">' +
                      donnees[i].status +
                      "</span>";
                    var lien_nc_detail =
                      '<a target="_blank" href="' +
                      donnees[i].fileUrl +
                      '"><i class="fa fa-2x fa-eye" aria-hidden="true"></i></a>';
			var document_row =
                      "\
                              <tr>\
				<td>" +
			donnees[i].type +
		      "</td>\
				<td>" +
                      titre +
                      "</td>\
                                <td>" +
                      type +
                      "</td>\
                                <td>" +
                      objectDate +
                      "</td>\
                                <td>" +
                      etat +
                      "</td>\
                                <td><div class='d-flex justify-content-around align-items-center'>" +
                      lien_nc_detail +
                      "</div></td>\
                                </tr>\
                              ";

                    document_coll += document_row;
                  } else if (
                    donnees[i].type === "Parapheur" &&
                    donnees[i].titre &&
                    donnees[i].creation &&
                    donnees[i].fileUrl
                  ) {
                    var titre = donnees[i].titre;
                    var objectDate = donnees[i].creation;
                    var etat =
                      '<span class="badge py-2 px-4 bg-danger">' +
                      donnees[i].status +
                      "</span>";
                    var lien_detail =
                      '<a target="_blank" href="' +
                      donnees[i].fileUrl +
                      '"><i class="fa fa-2x fa-signature" aria-hidden="true"></i></a>';
                    var document_row =
                      "\
                              <tr>\
				<td>" +
			donnees[i].type +
		      "</td>\
                                <td>" +
                      titre +
                      "</td>\
                                <td>" +
                      donnees[i].type_dossier  +
                      "</td>\
                                <td>" +
                      objectDate +
                      "</td>\
                                <td>" +
                      etat +
                      "</td>\
                                <td><div class='d-flex justify-content-around align-items-center'>" +
                      lien_detail +
                      "</div></td>\
                                </tr>\
                              ";

                    document_coll += document_row;
                  } else if (donnees[i].type !== "Nextcloud") {

                    //TODO voir pour les différents états des documents
                    var lien_pastell_edition, lien_pastell_supp, supp_yes = false, edit_yes = false;
                    var objectDate = donnees[i].last_action_date
                    var titre_doc = donnees[i].titre;
                    var type_doc = donnees[i].type;
                    var last_etat = donnees[i].last_action_display;
                    var download_doc = ""
                    switch (titre_doc) {
                      case null:
                      case "":
                        titre = "Sans titre";
                        break;

                      default:
                        titre = donnees[i].titre;
                    }
                    switch (last_etat) {
                      case "creation":
                        etat =
                          '<span class="badge py-2 px-4 bg-white text-dark border border-info">Créé</span>';
                        supp_yes = true
                        edit_yes = true
                        break;

                      case "send-ged":
                        etat =
                          '<span class="badge py-2 px-4 bg-success">Versé en GED</span>';
                        break;

                      case "send-cdg":
                        etat =
                          '<span class="badge py-2 px-4 bg-success">Transmis au CDG</span>';
                        break;

                      case "termine":
                        etat =
                          '<span class="badge py-2 px-4 bg-success">Traitement terminé</span>';
                        if (donnees[i].last_type.includes("actes")) {
                          download_doc =
                            '<a target="_blank" href="' +
                            pastell_url +
                            "Document/RecuperationFichier?id_d=" +
                            donnees[i].id_d +
                            "&id_e=" +
                            donnees[i].id_e +
                            '&field=acte_tamponne&num=0"><i class="fa fa-2x fa-download" aria-hidden="true"></i></a>';
                        }
                        supp_yes = true
                        edit_yes = false
                        break;

                      case "info-tdt":
                        etat =
                          '<span class="badge py-2 px-4 bg-success">Traitement terminé</span>';
                        supp_yes = true
                        edit_yes = true
                        break;

                      case "acquiter-tdt":
                        etat =
                          '<span class="badge py-2 px-4 bg-success">Acquité</span>';
                        supp_yes = true
                        edit_yes = true
                        break;

                      case "document-transmis-tdt":
                        etat =
                          '<span class="badge py-2 px-4 bg-success">Transmis au TDT</span>';
                        break;

                      case "reception-partielle":
                        etat =
                          '<span class="badge py-2 px-4 bg-warning">Envoyé</span>';
                        supp_yes = true
                        break;

                      case "recu-iparapheur":
                        etat =
                          '<span class="badge py-2 px-4 bg-warning">Signature récupérée</span>';
                        if (donnees[i].last_type == "document-a-signer") {
                          download_doc =
                            '<a target="_blank" href="' +
                            pastell_url +
                            "Document/RecuperationFichier?id_d=" +
                            donnees[i].id_d +
                            "&id_e=" +
                            donnees[i].id_e +
                            '&field=document&num=0"><i class="fa fa-2x fa-download" aria-hidden="true"></i></a>';

                        }
                        supp_yes = true
                        edit_yes = true
                        break;

                      case "envoi-mail":
                        etat =
                          '<span class="badge py-2 px-4 bg-warning">En cours d\'envoi</span>';
                        edit_yes = false
                        supp_yes = false
                        break;

                      case "envoi":
                        etat =
                          '<span class="badge py-2 px-4 bg-warning">En cours d\'envoi</span>';
                        edit_yes = false
                        supp_yes = false
                        break;

                      case "prepare-tdt":
                        etat =
                          '<span class="badge py-2 px-4 bg-warning">En cours d\'envoi</span>';
                        edit_yes = false
                        supp_yes = false
                        break;

                      case "reception":
                        etat =
                          '<span class="badge py-2 px-4 bg-warning">Envoyé</span>';
                        break;

                      case "recu-iparapheur-etat":
                        etat =
                          '<span class="badge py-2 px-4 bg-warning">Signature récupérée</span>';
                        if (donnees[i].last_type == "document-a-signer") {
                          download_doc =
                            '<a target="_blank" href="' +
                            pastell_url +
                            "Document/RecuperationFichier?id_d=" +
                            donnees[i].id_d +
                            "&id_e=" +
                            donnees[i].id_e +
                            '&field=document&num=0"><i class="fa fa-2x fa-download" aria-hidden="true"></i></a>';
                        }
                        supp_yes = true
                        break;

                      case "etat_ack=Acquittement+KO":
                        etat =
                          '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Un fichier de reponse PES est disponible</span>';
                        if (donnees[i].last_type.includes("helios")) {
                          ErrorHeliosCounts++;
                        }
                        supp_yes = true
                        break;
                      case "etat_ack=Acquittement+OK":
                        etat =
                          '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Un fichier de reponse PES est disponible</span>';
                        if (donnees[i].last_type.includes("helios")) {
                          ErrorHeliosCounts++;
                        }
                        break;
                      case "rejet-iparapheur":
                        etat =
                          '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Signature refusée</span>';
                        if (donnees[i].last_type.includes("helios")) {
                          ErrorHeliosCounts++;
                        }
                        else if (donnees[i].last_type.includes("convocation")) {
                          ErrorConvocCounts++;
                        }
                        if (donnees[i].last_type == "document-a-signer") {
                          ErrorDocsCounts++;
                        }
                        supp_yes = true
                        break;
                      case "error-ged":
                        etat =
                          '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Erreur irrécupérable lors du dépôt</span>';
                        if (donnees[i].last_type == "document-a-signer") {
                          ErrorDocsCounts++;
                        }
                        supp_yes = true
                        break;

                      case "remord-iparapheur":
                        etat =
                          '<span class="badge py-2 px-4 bg-danger">Droit de remord</span>';
                        supp_yes = true
                        break;


                      case "annuler-tdt":
                        etat =
                          '<span class="badge py-2 px-4 bg-secondary">Annulé</span>';
                        supp_yes = false
                        edit_yes = false
                        break;

                      case "tdt-error":
                        etat =
                          '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Erreur sur le TdT</span>';
                        if (donnees[i].last_type.includes("helios")) {
                          ErrorHeliosCounts++;
                        }
                        else if (donnees[i].last_type.includes("actes")) {
                          ErrorActeCounts++;
                        }
                        supp_yes = true
                        break;

                      case "erreur-verif-tdt":
                        etat =
                          '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Erreur lors de la vérification du statut de l\'acte </span>';
                        if (donnees[i].last_type.includes("actes")) {
                          ErrorActeCounts++;
                        }
                        supp_yes = true
                        break;

                      case "send-tdt-erreur":
                        etat =
                          '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Erreur lors de l\'envoi des données au TdT</span>';
                        if (donnees[i].last_type.includes("actes")) {
                          ErrorActeCounts++;
                        }

                        supp_yes = true

                        break;

                      case "erreur-verif-iparapheur":

                        etat =
                          '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Erreur lors de la vérification du statut de signature</span>';
                        if (donnees[i].last_type.includes("convocation")) {
                          ErrorConvocCounts++;
                        }
                        if (donnees[i].last_type == "document-a-signer") {

                          ErrorDocsCounts++;
                        }
                        if (donnees[i].last_type.includes("actes")) {
                          ErrorActeCounts++;
                        }
                        if (donnees[i].last_type.includes("helios")) {
                          ErrorHeliosCounts++;
                        }
                        supp_yes = true

                        break;

                      case "annulation-tdt":
                        etat =
                          '<span class="badge py-2 px-4 bg-danger">Annulé</span>';
                        supp_yes = true
                        edit_yes = false
                        break;

                      case "fatal-error":
                        etat =
                          '<span class="badge py-2 px-4 bg-danger">Erreur</span>';
                        supp_yes = true

                        break;

                      case "modification":
                        etat =
                          '<span class="badge py-2 px-4 bg-primary">En cours de rédaction</span>';
                        supp_yes = true
                        edit_yes = true

                        break;

                      case "send-iparapheur":
                        etat =
                          '<span class="badge py-2 px-4 bg-primary">Envoyé au parapheur</span>';
                        supp_yes = false
                        edit_yes = false
                        break;

                      default:
                        etat = '<span class="badge py-2 px-4 bg-secondary">' + last_etat + '</span>';
                    }

                    var lien_pastell_edition = "", lien_pastell_supp = "";
                    var lien_pastell_detail =
                      '<a target="_blank" href="' +
                      pastell_url +
                      "Document/detail?id_d=" +
                      donnees[i].id_d +
                      "&id_e=" +
                      donnees[i].id_e +
                      '"><i class="fa fa-2x fa-eye" aria-hidden="true"></i></a>';
                    if (
                      edit_yes === true
                    ) {

                      lien_pastell_edition =
                        '<a class="d-flex" target="_blank" href="' +
                        pastell_url +
                        "Document/edition?id_d=" +
                        donnees[i].id_d +
                        "&id_e=" +
                        donnees[i].id_e +
                        '"><i class="fa fa-2x fa-pencil-square" aria-hidden="true"></i></a>';
                    }
                    if (
                      supp_yes === true
                    ) {
                      lien_pastell_supp =
                        '<a target="_blank" href="' +
                        pastell_url +
                        "Document/warning?id_d=" +
                        donnees[i].id_d +
                        "&id_e=" +
                        donnees[i].id_e +
                        '&action=supression"><i class="fa fa-2x fa-trash" aria-hidden="true"></i></a>';
                    }

                    document_coll +=
                      "\
                          <tr>\
                            <td>" +
                      titre.substring(0, 60) +
                      "</td>\
                            <td>" +
                      type_doc +
                      "</td>\
                            <td>" +
                      objectDate +
                      "</td>\
                            <td>" +
                      etat +
                      "</td>\
                            <td><div class='action_rapides d-flex justify-content-around align-items-center'>" +
                      download_doc +
                      lien_pastell_detail +
                      lien_pastell_edition +
                      lien_pastell_supp +
                      "</div></td>\
                                </tr>\
                          ";
                  }
                }
/*                var TotalErrors = ErrorActeCounts + ErrorHeliosCounts + ErrorConvocCounts + ErrorDocsCounts
                var Errors = { TotalErrors, ErrorActeCounts, ErrorHeliosCounts, ErrorConvocCounts, ErrorDocsCounts }
                localStorage.setItem('errors', JSON.stringify(Errors))
*/
                document_coll +=
                  '\
                              </tbody>\
                            </table>\
                            <div id="go_to_pastell" class="w-auto mt-3 py-2"></div>\
                          </div>\
                        </div>\
                      </div>\
                    </div>\
                    ';

                if (drupalSettings.path.isFront && document.getElementById("document_recent_id")) {
                  document.getElementById("document_recent_id").innerHTML =
                    document_coll;
                } 
              }
              else {
                var document_coll =
                  '\
                      <div class="col-lg-12" id="pastell_block"> \
                      <div class="mb-2">\
                        <div class="card mb-0">\
                          <div class="card-header d-flex align-items-center rounded-top bg-white rounded-top">\
                            <h4 class="card-title text-dark py-2">\
                              Activités récentes<span></span>\
                            </h4>\
                            <button type="button" class="btn btn-secondary reload-btn" id="reloadDatatable">\
                            <i class="fa-solid fa-rotate"></i>\
                            </button>\
                          </div>\
                          <div class="card-body">\
                            <h5>Aucun document disponible</h5>\
                          </div>\
                        </div>\
                      </div>\
                    </div>\
                    ';
                if (drupalSettings.path.isFront && document.getElementById("document_recent_id")) {
                  document.getElementById("document_recent_id").innerHTML =
                    document_coll;
                }
              }
            }
          };
          xhr.onerror = function () {
            console.error("Error making AJAX call");
          };
          xhr.onabort = function () {
            console.error("AJAX call aborted");
          };
          xhr.ontimeout = function () {
            console.error("AJAX call timed out");
          };
          xhr.onloadend = function () {
            // Datatables effect on doc list
            var table = $("#tablealldocs").DataTable({
		autoWidth: false,
		aoColumnDefs: [
		{ width: '35%', target: 1 },
		],
              columns: [
        	{ data: "application" },
	        { data: "titre" },
                { data: "type" },
                { data: "objectDate" },
                { data: "etat" },
                { data: "actions" },
              ],
              order: [[2, "desc"]],
              paging: false,
              scrollY: 320,
              // scrollCollapse: true,
              language: {
                url: "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/French.json",
                search: "_INPUT_",
                searchPlaceholder: "Rechercher...",
                emptyTable: 'Aucun document à afficher dans les 50 derniers documents'

              },
              search: {
                search: ''
              },
              responsive: true,
              lengthMenu: [
                [5, 10, 25],
                [5, 10, 25],
              ],

            }); 
          };

          xhr.send();
        }

        var reloadButton = document.createElement('button');
        reloadButton.type = "button";
        reloadButton.className = "btn btn-secondary reload-btn";
        reloadButton.id = "reloadDatatable";
        reloadButton.innerHTML = '<i class="fa-solid fa-rotate"></i>';

        // Ajoutez le bouton au DOM
        document.querySelector('#document_recent_id')?.appendChild(reloadButton);

          reloadDataTable()
       
      }); // end once

            }, 2000);


    },

  };
})(Drupal, jQuery, drupalSettings);
