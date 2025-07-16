(function (Drupal, once, drupalSettings) {
  "use strict";

  Drupal.behaviors.GLPIUnifiedBehavior = {
    attach: function (context) {
      const isFront = drupalSettings.path && drupalSettings.path.isFront;
      const hasTarget = document.getElementById("glpi_tickets_id");
      const glpiUrl = drupalSettings.api_glpi_pleiade?.glpi_url;

      if (!hasTarget || !glpiUrl) return;

      once("GLPIUnifiedBehavior", "body", context).forEach(() => {
        fetch(Drupal.url("v1/api_glpi_pleiade/glpi_list_tickets"))
          .then((response) => {
            if (!response.ok) throw new Error("Erreur API GLPI");
            return response.json();
          })
          .then((data) => renderTickets(data, isFront))
          .catch((error) => {
            console.error("Erreur GLPI:", error);
            document.getElementById("glpi_tickets_id").innerHTML =
              `<div class="alert alert-danger">Erreur de chargement des tickets GLPI</div>`;
          });
      });
    },
  };

  function renderTickets(data, isFront) {
    const container = document.getElementById("glpi_tickets_id");
    const glpiUrl = drupalSettings.api_glpi_pleiade.glpi_url;
    const userMail = data.usermail;
    const tickets = Object.entries(data).filter(([key]) => key !== "usermail");

    if (tickets.length === 0) {
      container.innerHTML = `
        <div class="card shadow-sm close">
          <div class="card-header bg-white close-icon">
            <h4 class="text-dark py-2">Derniers tickets GLPI</h4>
          </div>
          <div class="card-body close-div">
            <h5>Aucun ticket GLPI en cours</h5>
          </div>
        </div>`;
      return;
    }

    let tableRows = "";
    let c=0;
    tickets.forEach(([_, ticket]) => {
      const title = ticket.name || "Titre manquant";
      const openDate = formatDate(ticket.date || "");
      const modifDate = formatDate(ticket.date_mod || "");
      const statusText = getStatusText(ticket.status);
      const urgencyText = getUrgencyText(ticket.urgency);
      const priorityText = getPriorityText(ticket.priority);
      const actors = getUserRoles(ticket.newData, userMail);
      if(actors == "Rôle manquant") return;

      
      c++;
      const ticketUrl = `${glpiUrl}/index.php?redirect=ticket_${ticket.id}`;

      if ([statusText, urgencyText, priorityText].includes("Valeur invalide")) return;

      tableRows += `
        <tr>
          <td>${title}</td>
          <td>${statusText}</td>
          <td>${openDate}</td>
          <td>${modifDate}</td>
          <td>${urgencyText}</td>
          <td>${priorityText}</td>
          <td>${actors}</td>
          <td><a href="${ticketUrl}" target="_blank"><i class="fa-solid fa-magnifying-glass"></i></a></td>
        </tr>`;
    });
 console.log("count:::",c)
    container.innerHTML = `
      <div class="card close" style="margin:0px;height:100%">
        <div class="card-header bg-white ">
          <h4 class="text-dark py-2 close-icon">${isFront ? "Derniers tickets GLPI" : "Mes derniers tickets GLPI"}</h4>
        </div>
        <div class="card-body close-div">
          <table class="table table-striped" id="glpi_table">
            <thead>
              <tr>
                <th>Nom du ticket</th>
                <th>Statut</th>
                <th>Date d'ouverture</th>
                <th>Dernière modification</th>
                <th>Urgence</th>
                <th>Priorité</th>
                <th>Je suis</th>
                <th></th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>`;

    new DataTable("#glpi_table", {
      paging: !isFront,
      scrollY: isFront ? 320 : null,
      language: {
        url: "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/French.json",
        search: "_INPUT_",
        searchPlaceholder: "Rechercher...",
        emptyTable: "Aucun document à afficher",
      },
      search: {
        search: "",
      },
      order: [[3, "desc"]],
      columnDefs: [
        { targets: [0], orderData: [0, 1] },
        { targets: [1], orderData: [1, 0] },
        { targets: [4], orderData: [4, 0] },
      ],
    });
  }

  function formatDate(input) {
    if (!input) return "Date manquante";
    const [datePart, timePart] = input.split(" ");
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }

  function getUserRoles(data, userMail) {
    if (!Array.isArray(data)) return "Rôle manquant";
    const roles = data
      .filter((item) => item.users_id === userMail)
      .map((item) => {
        switch (item.type) {
          case 1: return "Demandeur du ticket";
          case 2: return "Responsable du ticket";
          case 3: return "Observateur du ticket";
          default: return "Rôle inconnu";
        }
      });
    return roles.length ? roles.join(", ") : "Rôle manquant";
  }

  function getStatusText(code) {
    const statuses = {
      1: "Nouveau",
      2: "En cours (attribué)",
      3: "En cours (planifié)",
      4: "En attente",
    };
    return statuses[code] || "Valeur invalide";
  }

  function getUrgencyText(code) {
    const urgencies = {
      2: "Basse",
      3: "Moyenne",
      4: "Haute",
    };
    return urgencies[code] || "Valeur invalide";
  }

  function getPriorityText(code) {
    const priorities = {
      2: "Basse",
      3: "Moyenne",
      4: "Haute",
      5: "Très Haute",
      6: "Majeure",
    };
    return priorities[code] || "Valeur invalide";
  }
})(Drupal, once, drupalSettings);