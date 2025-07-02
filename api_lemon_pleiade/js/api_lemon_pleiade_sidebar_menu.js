(function ($, Drupal, drupalSettings, once) {
  "use strict";
  Drupal.behaviors.APIlemonMenuBehavior = {
    attach: function (context, settings) {
      if (
        !drupalSettings.path.currentPath.includes("admin") &&
        drupalSettings.api_lemon_pleiade.field_lemon_myapps_url &&
        drupalSettings.api_lemon_pleiade.field_lemon_url
      ) {
        once("APIlemonMenuBehavior", "body", context).forEach(function () {
          const getCookie = (name) => {
            const cookies = document.cookie.split(";");
            for (let cookie of cookies) {
              const [cookieName, cookieValue] = cookie.split("=");
              if (cookieName.trim() === name)
                return decodeURIComponent(cookieValue);
            }
            return null;
          };
          const shouldStartOpen =
            localStorage.getItem("menuOpen_") === "true" ||
            localStorage.getItem("menuOpen_") == 1;

          //  document.getElementById("collapse10").classList.remove( !shouldStartOpen ? "show"  : ""  )
          const categoryIcons = {
            "E-administration": "fa-people-arrows",
            Documents: "fa-folder-open",
            Collaboratif: "fa-users",
            "Support et formation": "fa-circle-info",
            "Mes applications": "fa-star",
            "Territoire Numérique Ouvert - Prod": "fa-people-group",
            "Territoire Numérique Ouvert - Test": "fa-people-group",
            "Applications PROD": "fa-list",
            "Applications TEST": "fa-list",
            Documentation: "fa-file",
            Sécurité: "fa-shield-halved",
            "Nos services": "fa-handshake",
            "Suite Territoriale Nationale": "fa-boxes-packing",
          };

          const xhr = new XMLHttpRequest();
          xhr.open(
            "POST",
            Drupal.url("v1/api_lemon_pleiade/lemon_myapps_query")
          );
          xhr.setRequestHeader("Content-Type", "application/json");

          xhr.onload = function () {
            if (xhr.status !== 200)
              return (window.location.href = "/user/logout");
            const data = JSON.parse(xhr.responseText);
            if (!data || !data.myapplications)
              return (window.location.href = "/user/logout");

            let menuHtml = "";
            data.myapplications.forEach((categoryData, i) => {
              const category = categoryData.Category || "";
              const cleanId = category.replace(/[^\w]/gi, "").toLowerCase();
              const icon = categoryIcons[category]
                ? `<i class="fa-solid ${categoryIcons[category]}"></i>`
                : "";

              menuHtml += `
                <div id="${cleanId}" class="nav-small-cap has-arrow ${
                shouldStartOpen ? "" : "collapsed"
              } ${category === "E-Administration" ? "e_admin" : ""}" 
                    data-bs-toggle="collapse" data-bs-target="#collapse${i}" aria-expanded="${
                shouldStartOpen ? "true" : "false"
              }" aria-controls="collapse${i}">
                  ${icon}
                  <span class="hide-menu d-flex align-items-center">
                    ${category}
                    ${
                      category === "Applications PROD"
                        ? "<span class='pastille_apps_prod'></span>"
                        : ""
                    }
                    ${
                      category === "Collaboratif"
                        ? "<span class='pastille_collab'></span>"
                        : ""
                    }
                  </span>
                </div>
                <div id="collapse${i}" class="accordion-collapse collapse ${
                shouldStartOpen ? "show" : ""
              }" aria-labelledby="headingOne">
                  <div class="accordion-body">`;

              categoryData.Applications.forEach((appData) => {
                const app = Object.values(appData)[0];
                const first = Object.keys(appData)[0];
                if (app.AppDesc == "administrateur") {
                  appData[first + "administrateur"] = appData[first];
                }
                const appId =
                  app.AppTip?.replace(/[^\w]/gi, "").toLowerCase() || "";
                const iconApp =
                  app.AppIcon && !/\.(png|jpg|jpeg|gif)$/i.test(app.AppIcon)
                    ? `<i class="fa fa-solid fa-${app.AppIcon}"></i>`
                    : "";

                let targetAttr = "_blank";
                if (
                  [
                    "Consulter nos solutions",
                    "Consulter nos formations",
                    "Consulter nos guides utilisateurs",
                    "Demander une visio",
                  ].includes(app.AppDesc)
                ) {
                  targetAttr = "";
                }
                if (app.AppTip === "Watcha") {
                  targetAttr = "watchaTab";
                }

                if (category === "E-administration") {
                  if (app.AppUri) {
                    if (app.AppDesc === "Gestion des users/collectivités") {
                      menuHtml += `<a href="${app.AppUri}" target="_blank" class="sidebar-link"><span class="ps-2">${app.AppDesc}</span></a>`;
                    } else {
                      menuHtml += `
                        <a class="sidebar-link waves-effect waves-dark has-arrow" id="${appId}" title="${
                        app.AppDesc
                      }" href="${
                        app.AppUri
                      }" aria-expanded="true" target="${targetAttr}" data-bs-toggle="collapse" data-bs-target="#collapse${
                        app.AppTip
                      }" aria-controls="collapse${app.AppTip}">
                          ${iconApp}
                          <span class="hide-menu px-2">${
                            Object.keys(appData)[0]
                          }</span>
                        </a>`;
                    }
                  } else {
                    menuHtml += `
                      <span class="sidebar-link waves-effect waves-dark has-arrow" id="${appId}" title="${
                      app.AppDesc
                    }" aria-expanded="false" data-bs-toggle="collapse" data-bs-target="#collapse${appId}" aria-controls="collapse${
                      app.AppTip
                    }">
                        ${iconApp}
                        <span class="hide-menu px-2 d-flex align-items-center">${
                          Object.keys(appData)[0]
                        }<span id='pastille_${appId}'></span></span>
                      </span>`;
                  }
                } else {
                  if (app.AppUri === "https://parapheurv5.sitiv.fr/") {
                    menuHtml += `
                      <a class="side-menu-item sidebar-link waves-effect waves-dark" id="${appId}" title="${
                      app.AppDesc
                    }" href="${app.AppUri}" target="${targetAttr}">
                        ${iconApp}
                        <span class="hide-menu px-2">${
                          Object.keys(appData)[0]
                        }${
                      app.AppTip === "i-Parapheur"
                        ? '<span id="pastille_parapheur"></span>'
                        : ""
                    }</span>
                      </a>`;
                  } else if (app.AppUri) {
                    menuHtml += `
                      <a class="side-menu-item position-relative sidebar-link waves-effect waves-dark" data-value1="0" data-value2="none" id="${appId}" title="${
                      app.AppDesc
                    }" href="${app.AppUri}" target="${targetAttr}">
                        ${iconApp}
                        <span class="hide-menu px-2">${
                          Object.keys(appData)[0]
                        }</span>
                      </a>`;
                  } else {
                    menuHtml += `
                      <span class="sidebar-link waves-effect waves-dark" id="${appId}" title="${
                      app.AppDesc
                    }">
                        ${iconApp}
                        <span class="hide-menu px-2">${
                          Object.keys(appData)[0]
                        }</span>
                      </span>`;
                  }
                }
              });

              menuHtml += "</div></div>";
            });

            document.getElementById("menuLemon").innerHTML += menuHtml;
            const modal = document.getElementById("addAppModal");
            const urlInput = modal.querySelector("#uriInputFavoris");
            const titleInput = modal.querySelector("#titleInputFavoris");
            // === ADDITION: Context menu on app elements ===
            document.querySelectorAll(".side-menu-item").forEach((el) => {
              el.addEventListener("contextmenu", (event) => {
                event.preventDefault();

                const addAppModal = new bootstrap.Modal(modal);

                urlInput.value = el.href;
                titleInput.value = el.id;
                addAppModal.show();
              });
            });
          };

          xhr.send(JSON.stringify({}));
        });
      }

      $(document).ready(function () {
        setTimeout(function () {
          // optional enhancements here
        }, 500);
      });
    },
  };
})(jQuery, Drupal, drupalSettings, once);
