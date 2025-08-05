(function (Drupal, once, drupalSettings) {
  "use strict";

  Drupal.behaviors.APIzimbraFullAgendaBehavior = {
    attach: function (context, settings) {
      if (
        drupalSettings.path &&
        drupalSettings.path.currentPath &&
        drupalSettings.path.currentPath.includes("calendar") &&
        drupalSettings.api_zimbra_pleiade?.field_zimbra_agenda
      ) {
        once(
          "APIzimbraFullAgendaBehavior",
          "#zimbra_full_calendar",
          context
        ).forEach(function () {
          // Spinner
          const calendarEl = document.getElementById("zimbra_full_calendar");
          calendarEl.innerHTML = drupalSettings.api_lemon_pleiade.spinner;

          // Request
          const xhr = new XMLHttpRequest();
          xhr.open(
            "GET",
            Drupal.url("v1/api_zimbra_pleiade/zimbra_tasks_query")
          );
          xhr.responseType = "json";

          xhr.onload = function () {
            if (xhr.status === 200) {
              const donnees = xhr.response;
             
              if (!donnees || donnees === "0") {
                calendarEl.innerHTML = `
                  <div id="zimbra_agenda" class="col-lg-12">
                    <div>
                      <div class="card-header rounded-top bg-white border-bottom rounded-top">
                        <h4 class="card-title text-dark py-2"><span>Agenda du jour</span></h4>
                      </div>
                      <div class="card-body">
                        <h2>Erreur lors de la récupération de l'agenda</h2>
                      </div>
                    </div>
                  </div>`;
                return;
              }

              const events = [];
              const appts = donnees.userData.Body.SearchResponse.appt;
              document.cookie = "nbOfTasks=" + appts?.length;

              appts?.forEach((appt) => {
                const fbValue = appt.ptst;
                const colorMap = {
                  AC: "#008020",
                  DE: "#32acff",
                  NE: "#ff3b31",
                  WA: "#ffae3e",
                };
                const eventColor = colorMap[fbValue] || "#117ca0";

                const durationMs = appt.dur;
                const hours = Math.floor(durationMs / (1000 * 60 * 60))
                  .toString()
                  .padStart(2, "0");
                const minutes = Math.floor(
                  (durationMs % (1000 * 60 * 60)) / (1000 * 60)
                )
                  .toString()
                  .padStart(2, "0");

                appt.inst.forEach((instance) => {
                 
                  if (instance.ex && instance.ptst === "DE") return;
                  const startDate = new Date(instance.s);
                  const endDate = new Date(instance.s + appt.dur);
                  const link = instance.loc ? instance.loc : appt.loc;
                  const isLocationLink = link && link.includes("http");
                  const name = instance.name ? instance.name : appt.name;
                  const invId = instance.invId ?? appt.invId;
                  const dur = instance.dur ?? appt.dur;
                  events.push({
                    title: name,
                    isAllDay: appt.allDay,
                    start: startDate.toISOString(),
                    end: endDate.toISOString(),
                    duration: `${hours}:${minutes}`,
                    backgroundColor: eventColor,
                    url: `${donnees.domainEntry
                      }modern/calendar/event/details/${invId
                      }?utcRecurrenceId=${instance.ridZ}&start=${instance.s
                      }&end=${instance.s + dur}`,
                    hasLinkIcon: isLocationLink,
                    locationLink: link,
                  });
                });
              });

              // Calendar rendering
              const now = new Date();
              const calendar = new FullCalendar.Calendar(calendarEl, {
                timeZone: "local",
                locale: "fr",
                buttonText: {
                  today: "Cette semaine",
                },
                headerToolbar: {
                  left: "prev,next today",
                  center: "title",
                  right: false,
                },
                nowIndicator: true,
                expandRows: true,
                now: now,
                 scrollTime: '7:00:00',
                //slotMinTime: "08:00:00",
                //slotMaxTime: "20:00:00",
                initialView: "timeGridWeek",
                weekends: false,
                themeSystem: "bootstrap",
                eventContent: function (arg) {
                  const event = arg.event;
                  const props = event.extendedProps;

                  const wrapper = document.createElement("div");
                  wrapper.classList.add("fc-event-content");
                  wrapper.setAttribute("data-bs-toggle", "tooltip");
                  wrapper.setAttribute("data-bs-html", "true");
                  wrapper.setAttribute("data-bs-placement", "top");

                  const startTime = event.start.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const endTime = event.end
                    ? event.end.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "";

                  // Tooltip HTML content
                  const tooltipHTML = `
                    <div><strong>${event.title}</strong></div>
                    <div>${startTime} - ${endTime}</div>
                    ${props.hasLinkIcon
                                      ? '<div><i class="fa-solid fa-link"></i> Lien</div>'
                                      : ""
                                    }
                  `;
                  wrapper.setAttribute("title", tooltipHTML);

                  // Visible elements inside event
                  const title = document.createElement("div");
                  title.classList.add("text-truncate"); // Prevent overflow
                  title.innerText = event.title;
                  wrapper.appendChild(title);

                  if (!props.isAllDay) {
                    const time = document.createElement("div");
                    time.classList.add("text-truncate");
                    time.innerHTML = `<small>${startTime} - ${endTime}</small>`;
                    wrapper.appendChild(time);
                  }

                  if (props.hasLinkIcon) {
                    const linkIcon = document.createElement("a");
                     const match = props.locationLink.match(/https?:\/\/[^\s]+/);
                    linkIcon.href = match[0];
                    linkIcon.target = "zimbratask";
                    linkIcon.innerHTML =
                      '<i class="position-absolute top-0 end-0 fa-solid fa-video text-black ms-1"></i>';
                    linkIcon.addEventListener("click", (e) => {
                      e.stopPropagation(); // Prevent eventClick
                    });
                    wrapper.appendChild(linkIcon);
                  }

                  // Initialize Bootstrap tooltip
                  setTimeout(() => {
                    new bootstrap.Tooltip(wrapper);
                  }, 0);

                  return { domNodes: [wrapper] };
                },
                events: events,
                eventClick: function (event) {
                  if (event.event.url) {
                    event.jsEvent.preventDefault();
                  
                    window.open(event.event.url, "_blank");
                  }
                },
              });

              calendar.render();
              document.getElementById("spinner-history").style.display = "none";
            } else {
              calendarEl.innerHTML =
                "<h2>Erreur lors de la récupération de l'agenda</h2>";
            }
          };

          xhr.onerror = () => console.error("Erreur AJAX");
          xhr.send();
        });
      }
    },
  };
})(Drupal, once, drupalSettings);
