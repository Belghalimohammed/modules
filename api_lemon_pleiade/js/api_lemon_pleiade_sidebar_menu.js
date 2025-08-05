(function ($, Drupal, drupalSettings, once) {
  "use strict";

  Drupal.behaviors.APIlemonMenuBehavior = {
    attach: function (context, settings) {
      once("APIlemonMenuBehavior", "body", context).forEach((body) => {
        if (
          !drupalSettings.path.currentPath.includes("admin") &&
          drupalSettings.api_lemon_pleiade?.field_lemon_myapps_url &&
          drupalSettings.api_lemon_pleiade?.field_lemon_url
        ) {
          this.initializeMenu();
        }
      });
    },

    /**
     * Main function to fetch data, sort it, and build the menu.
     */
    async initializeMenu() {
      try {
        const [menuData, savedOrder] = await Promise.all([
          this.fetchMenuData(),
          this.fetchMenuOrder(),
        ]);

        if (!menuData || !menuData.myapplications) {
          console.error("Invalid data received from menu API.");
          window.location.href = "/user/logout";
          return;
        }

        const defaultSortOrder = [
          "Applications PROD",
          "Territoire Numérique Ouvert - Prod",
          "Sécurité",
          "Suite Territoriale Nationale",
          "Documentation",
          "Applications TEST",
          "Territoire Numérique Ouvert - Test",
        ];

        const finalSortOrder = savedOrder || defaultSortOrder;
      
        menuData.myapplications.sort((a, b) => {
          const indexA = finalSortOrder.indexOf(a.Category);
          const indexB = finalSortOrder.indexOf(b.Category);
          const finalIndexA = indexA === -1 ? Infinity : indexA;
          const finalIndexB = indexB === -1 ? Infinity : indexB;
          return finalIndexA - finalIndexB;
        });

        const menuContainer = document.getElementById("menuLemon");
        if (!menuContainer) {
          console.error("Menu container #menuLemon not found.");
          return;
        }

        const storedState = localStorage.getItem("menuOpen_");
        const shouldStartOpen = storedState === "true" || storedState === "1";

        const menuHtml = menuData.myapplications
          .map((categoryData, index) =>
            this.renderCategory(categoryData, index, shouldStartOpen)
          )
          .join("");

        menuContainer.innerHTML = menuHtml;
        this.attachEventListeners();

      } catch (error) {
        console.error("Failed to initialize the lemon menu:", error);
        window.location.href = "/user/logout";
      }
    },

    /**
     * Fetches the saved menu order from the backend.
     * Correctly handles an empty object `{}` as a "not found" response.
     * @returns {Promise<string[]|null>} A promise that resolves to the order array or null.
     */
    async fetchMenuOrder() {
      try {
        const formData = new FormData();
        formData.append('var', 'field_menu_order');

        const response = await fetch('/v1/api_user_pleiade/getVariablesValue', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          console.warn(`Could not fetch saved menu order (status: ${response.status}). Using default order.`);
          return null;
        }

        const data = await response.json();
        if (!data || Object.keys(data).length === 0 || !data) {
            return null;
        }

        try {
           const parsedOrder = JSON.parse(data);
           if (Array.isArray(parsedOrder) && parsedOrder.length > 0) {
             return parsedOrder;
           }
        } catch (e) {
            console.error("Could not parse saved menu order string from server:", data, e);
            return null; 
        }
        
        return null; 

      } catch (error) {
        console.error('Error fetching or parsing saved menu order:', error);
        return null; 
      }
    },

    /**
     * Fetches menu content from the API endpoint.
     */
    async fetchMenuData() {
      const response = await fetch(
        Drupal.url("v1/api_lemon_pleiade/lemon_myapps_query"), {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({}),
        }
      );
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      return response.json();
    },

    /**
     * Renders the HTML for a single category, wrapped in a sortable container.
     */
    renderCategory(categoryData, index, shouldStartOpen) {
      const category = categoryData.Category || "";
      const cleanId = `menu-category-${category.replace(/[^\w]/gi, "").toLowerCase()}`;
      
      const categoryIcons = {
        "E-administration": "fa-people-arrows",
        "Documents": "fa-folder-open",
        "Collaboratif": "fa-users",
        "Support et formation": "fa-circle-info",
        "Mes applications": "fa-star",
        "Territoire Numérique Ouvert - Prod": "fa-people-group",
        "Territoire Numérique Ouvert - Test": "fa-people-group",
        "Applications PROD": "fa-list",
        "Applications TEST": "fa-list",
        "Documentation": "fa-file",
        "Sécurité": "fa-shield-halved",
        "Nos services": "fa-handshake",
        "Suite Territoriale Nationale": "fa-boxes-packing",
      };

      const icon = categoryIcons[category] ? `<i class="fa-solid ${categoryIcons[category]}"></i>` : "";
      const pastilleHtml = {
        "Applications PROD": "<span class='pastille_apps_prod'></span>",
        "Collaboratif": "<span class='pastille_collab'></span>",
      }[category] || '';

      const applicationsHtml = categoryData.Applications
        .map((appData) => this.renderApplication(appData, category))
        .join("");

      return `
        <div class="sortable-item" id="${cleanId}" data-category-name="${category}">
          <div class="nav-small-cap has-arrow ${shouldStartOpen ? "" : "collapsed"} ${category === "E-Administration" ? "e_admin" : ""}" 
              data-bs-toggle="collapse" data-bs-target="#collapse${index}" 
              aria-expanded="${shouldStartOpen}" aria-controls="collapse${index}">
            ${icon}
            <span class="hide-menu d-flex align-items-center">${category}${pastilleHtml}</span>
          </div>
          <div id="collapse${index}" class="accordion-collapse collapse ${shouldStartOpen ? "show" : ""}" aria-labelledby="headingOne">
            <div class="accordion-body">${applicationsHtml}</div>
          </div>
        </div>
      `;
    },

    /**
     * Renders a single application.
     */
    renderApplication(appData, categoryName) {
      const appName = Object.keys(appData)[0];
      const app = appData[appName];
      const appId = app.AppTip?.replace(/[^\w]/gi, "").toLowerCase() || "";
      const iconApp = app.AppIcon ? `<i class="fa fa-solid fa-${app.AppIcon}"></i>` : `<img src="${app.AppLogo}"  style="width:25px;height:25px" />`;
      
      let targetAttr = "_blank";
      if (['Consulter nos solutions', 'Consulter nos formations', 'Consulter nos guides utilisateurs', 'Demander une visio'].includes(app.AppDesc)) {
        targetAttr = app.AppTip;
      }
      if (app.AppTip === "Watcha") {
        targetAttr = "watcha";
      }

      if (categoryName === "E-administration") {
        if (app.AppUri) {
          if (app.AppDesc === "Gestion des users/collectivités") {
            return `<a href="${app.AppUri}" target="_blank" class="sidebar-link"><span class="ps-2">${app.AppDesc}</span></a>`;
          } else {
            return `
              <a class="sidebar-link waves-effect waves-dark has-arrow" id="${appId}" data-text="${appName}" title="${app.AppDesc}" href="${app.AppUri}" aria-expanded="true" target="${targetAttr}" data-bs-toggle="collapse" data-bs-target="#collapse${app.AppTip}" aria-controls="collapse${app.AppTip}">
                ${iconApp}
                <span class="hide-menu px-2">${appName}</span>
              </a>`;
          }
        } else {
          return `
            <span class="sidebar-link waves-effect waves-dark has-arrow" id="${appId}" data-text="${appName}" title="${app.AppDesc}" aria-expanded="false" data-bs-toggle="collapse" data-bs-target="#collapse${appId}" aria-controls="collapse${app.AppTip}">
              ${iconApp}
              <span class="hide-menu px-2 d-flex align-items-center">${appName}<span id='pastille_${appId}'></span></span>
            </span>`;
        }
      } 
      else {
        const pastilleParapheur = app.AppTip === "i-Parapheur" ? '<span id="pastille_parapheur"></span>' : '';
        const innerHtml = `<span class="hide-menu px-2">${appName}${pastilleParapheur}</span>`;
        if (app.AppUri) {
          const isContextMenuItem = app.AppUri !== "https://parapheurv5.sitiv.fr/";
          const linkClass = `sidebar-link context-menu-item waves-effect waves-dark ${isContextMenuItem ? 'side-menu-item' : ''}`;
          return `
            <a class="${linkClass}" ${isContextMenuItem ? 'data-value1="0" data-value2="none"' : ''}  data-text="${appName}" id="${appId}" title="${app.AppDesc}" href="${app.AppUri}" target="${targetAttr}">
              ${iconApp}
              ${innerHtml}
            </a>`;
        } else {
          return `
            <span class="sidebar-link waves-effect waves-dark" id="${appId}" title="${app.AppDesc}"  data-text="${appName}">
              ${iconApp}
              ${innerHtml}
            </span>`;
        }
      }
    },
    
    /**
     * Attaches event listeners and initializes the sortable functionality.
     */
    attachEventListeners() {
      const modal = document.getElementById("addAppModal");
      if (modal) {
        const urlInput = modal.querySelector("#uriInputFavoris");
        const titleInput = modal.querySelector("#titleInputFavoris");
        document.querySelectorAll(".context-menu-item").forEach((el) => {
          el.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            const addAppModal = new bootstrap.Modal(modal);
            urlInput.value = el.href;
            titleInput.value = el.dataset.text;
          
            addAppModal.show();
          });
        });
      }

      const menuContainer = document.getElementById("menuLemon");
      if (menuContainer && typeof Sortable !== 'undefined') {
        new Sortable(menuContainer, {
          animation: 150,
          draggable: ".sortable-item",
          onEnd: (evt) => {
            const newOrder = Array.from(menuContainer.querySelectorAll(".sortable-item"))
              .map(el => el.dataset.categoryName);
         
            this.saveOrderToBackend(newOrder);
          },
        });
      }
    },

    /**
     * Helper function to save the order to the backend API.
     */
    async saveOrderToBackend(orderArray) {
      const orderString = JSON.stringify(orderArray);
      const formData = new FormData();
      formData.append('var', 'field_menu_order');
      formData.append('value', orderString);

      try {
        const response = await fetch('/v1/api_user_pleiade/setVariablesValue', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Network response was not ok: ' + response.statusText);
        }

        const data = await response.json();
      } catch (error) {
        console.error('Error saving menu order to backend:', error);
      }
    }
  };
})(jQuery, Drupal, drupalSettings, once);