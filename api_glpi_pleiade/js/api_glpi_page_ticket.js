(function (Drupal, once, $, drupalSettings) {
  "use strict";

  Drupal.behaviors.GLPIUnifiedBehavior = {
    attach: function (context) {
      const container = document.getElementById("glpi_tickets_id");
      if (!container) return;

      once("GLPIUnifiedBehavior", container, context).forEach((el) => {
        const glpiUrl = drupalSettings.api_glpi_pleiade?.glpi_url;
        const isFront = drupalSettings.path?.isFront;
        if (!glpiUrl) return;

        // --- Définition de l'ordre pour le tri ---
        const statusOrder = { "Nouveau": 1, "En cours (attribué)": 2, "En cours (planifié)": 3, "En attente": 4 };
        const urgencyOrder = { 'Basse': 2, 'Moyenne': 3, 'Haute': 4 };
        const priorityOrder = { 'Basse': 2, 'Moyenne': 3, 'Haute': 4, 'Très Haute': 5, 'Majeure': 6 };

        // --- Fonction de filtre personnalisée ---
        $.fn.dataTable.ext.search.pop(); 
        $.fn.dataTable.ext.search.push(
            function(settings, data, dataIndex) {
                if (settings.nTable.id !== 'glpi_table') return true;

                const selectedStatus = $('#glpi-status-filter').val();
                const selectedUrgency = $('#glpi-urgency-filter').val();
                const selectedPriority = $('#glpi-priority-filter').val();
                const selectedRole = $('#glpi-role-filter').val();

                const cellStatus = data[1] || '';
                const cellUrgency = data[4] || '';
                const cellPriority = data[5] || '';
                const cellRoles = data[6] || '';
                
                const statusMatch = !selectedStatus || cellStatus === selectedStatus;
                const urgencyMatch = !selectedUrgency || cellUrgency === selectedUrgency;
                const priorityMatch = !selectedPriority || cellPriority === selectedPriority;
                
                let roleMatch = true;
                if (selectedRole) {
                    const rolesArray = cellRoles.split(',').map(role => role.trim());
                    roleMatch = rolesArray.includes(selectedRole);
                }
                
                return statusMatch && urgencyMatch && priorityMatch && roleMatch;
            }
        );

        function loadAndRenderTickets() {
          if ($.fn.DataTable.isDataTable("#glpi_table")) {
            $('#glpi_table').DataTable().destroy();
          }
          el.innerHTML = `<div class="card shadow-sm"><div class="card-body">Chargement des tickets...</div></div>`;

          fetch(Drupal.url("v1/api_glpi_pleiade/glpi_list_tickets"))
            .then((response) => response.json())
            .then((data) => renderTickets(data, isFront, glpiUrl, el))
            .catch((error) => {
              console.error("Erreur GLPI:", error);
              el.innerHTML = `<div class="alert alert-danger">Erreur de chargement des tickets GLPI.</div>`;
            });
        }

        function renderTickets(data, isFront, glpiUrl, container) {
          if (!data || data.length === 0) {
            container.innerHTML = `
              <div class="card shadow-sm close">
                <div class="card-header close-icon rounded-top bg-white border-bottom rounded-top d-flex ">
                  <h4 class="card-title text-dark py-2 mb-0">Derniers tickets GLPI</h4>
                  <button type="button" class="btn btn-secondary reload-btn" id="reloadGlpi"><i class="fa-solid fa-rotate"></i></button>
                </div>
                <div class="card-body close-div"><h5>Aucun ticket GLPI en cours</h5></div>
              </div>`;
            return;
          }

          let tableRows = "";
          data.forEach(ticket => {
            const ticketUrl = `${glpiUrl}/front/ticket.form.php?id=${ticket.id}`;
            tableRows += `
              <tr>
                <td>${ticket.name}</td><td>${ticket.status}</td><td>${ticket.start_date}</td><td>${ticket.last_modification_date}</td>
                <td>${ticket.urgency}</td><td>${ticket.priority}</td><td>${ticket.roles}</td>
                <td><a href="${ticketUrl}" target="glpiticket"><i class="fa-solid fa-magnifying-glass"></i></a></td>
              </tr>`;
          });

          // --- NOUVEAU : Extraire les options de filtre existantes à partir des données ---
          const existingStatus = [...new Set(data.map(t => t.status).filter(Boolean))].sort((a, b) => (statusOrder[a] || 99) - (statusOrder[b] || 99));
          const existingUrgency = [...new Set(data.map(t => t.urgency).filter(Boolean))].sort((a, b) => (urgencyOrder[a] || 99) - (urgencyOrder[b] || 99));
          const existingPriority = [...new Set(data.map(t => t.priority).filter(Boolean))].sort((a, b) => (priorityOrder[a] || 99) - (priorityOrder[b] || 99));
          const existingRoles = [...new Set(data.flatMap(t => t.roles ? t.roles.split(',').map(r => r.trim()) : []).filter(Boolean))].sort();

          const createFilter = (id, label, options) => {
              if (options.length === 0) return ''; // Ne pas afficher le filtre s'il n'y a pas d'options
              let opts = `<option value="">-- ${label} --</option>`;
              options.forEach(opt => { opts += `<option value="${opt}">${opt}</option>`; });
              return `
                <div class="glpi-filter-container me-2">
                    <select class="form-select form-select-sm" id="${id}" title="${label}">
                        ${opts}
                    </select>
                </div>`;
          };
          
          const filtersHtml = `
            <div class="d-flex flex-wrap align-items-center">
                ${createFilter('glpi-status-filter', 'Filtrer par statut', existingStatus)}
                ${createFilter('glpi-urgency-filter', 'Filtrer par urgence', existingUrgency)}
                ${createFilter('glpi-priority-filter', 'Filtrer par priorité', existingPriority)}
                ${createFilter('glpi-role-filter', 'Filtrer par rôle', existingRoles)}
            </div>
          `;

          container.innerHTML = `
            <div class="card close" style="height: 100%;">
              <div class="card-header close-icon rounded-top bg-white border-bottom rounded-top d-flex">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h4 class="card-title text-dark py-2 mb-0">${isFront ? "Derniers tickets GLPI" : "Mes derniers tickets GLPI"}</h4>
                    <button type="button" class="btn btn-secondary reload-btn" id="reloadGlpi"><i class="fa-solid fa-rotate"></i></button>
                </div>
              </div>
              <div class="card-body close-div">
               ${filtersHtml}
                <table class="table table-striped" id="glpi_table">
                   <thead>
                    <tr>
                      <th>Nom du ticket</th><th>Statut</th><th>Date d'ouverture</th><th>Dernière modification</th>
                      <th>Urgence</th><th>Priorité</th><th>Je suis</th><th></th>
                    </tr>
                  </thead>
                  <tbody>${tableRows}</tbody>
                </table>
              </div>
            </div>`;

          const table = new DataTable("#glpi_table", {
            paging: !isFront,
            scrollY: isFront ? 320 : null,
            language: { url: "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/French.json", search: "_INPUT_", searchPlaceholder: "Rechercher...", emptyTable: "Aucun document à afficher" },
            order: [[2, "desc"]],
            columnDefs: [ 
              { targets: 1, render: function (data, type, row) { if (type === 'sort') { return statusOrder[data] || 99; } return data; } },
              { targets: 4, render: function (data, type, row) { if (type === 'sort') { return urgencyOrder[data] || 99; } return data; } },
              { targets: 5, render: function (data, type, row) { if (type === 'sort') { return priorityOrder[data] || 99; } return data; } },
              { targets: 6, render: function (data, type, row) { if (type === 'sort') { if (!data || typeof data !== 'string') { return 0; } return data.split(',').length - 1; } return data; } }
            ]
          });
       
          $('#glpi-status-filter, #glpi-urgency-filter, #glpi-priority-filter, #glpi-role-filter').on('change', function () {
            table.draw();
          });
        }

        el.addEventListener('click', function (event) {
          if (event.target.closest('#reloadGlpi')) {
            loadAndRenderTickets();
          }
        });

        loadAndRenderTickets();
      });
    },
  };
})(Drupal, once, jQuery, drupalSettings);