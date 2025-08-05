(function (Drupal, once, drupalSettings) {
  "use strict";

  Drupal.behaviors.APIzimbraAgendaBehavior = {
    attach: function (context, settings) {
      const isFront = drupalSettings.path.isFront;
      const agendaEnabled =
        drupalSettings.api_zimbra_pleiade.field_zimbra_agenda;
      if (!localStorage.getItem("zimbra")) {
        localStorage.setItem("zimbra", "block");
      }
      if (isFront && agendaEnabled) {
        once(
          "APIzimbraAgendaBehavior",
          "#zimbra_block_agenda_id",
          context
        ).forEach(function () {
          const initializeAgenda = function () {
            const agendaEl = document.getElementById("zimbra_block_agenda_id");

            agendaEl.innerHTML =
              window.innerWidth < 768
                ? `
              <div class="calendar-scroll-buttons text-center mb-2">
                <i class="fa-solid fa-chevron-up slick-arrow " id="scroll-up"></i>
              </div>
              <div id="zimbra-fullcalendar"></div>
               <div class="calendar-scroll-buttons text-center mb-2">
                <i class="fa-solid fa-chevron-down slick-arrow " id="scroll-down" ></i>
              </div>
            `
                : ` <div id="zimbra-fullcalendar"></div>`;

            const calendarTarget = document.getElementById(
              "zimbra-fullcalendar"
            );
            if (!calendarTarget) return;

            const xhr = new XMLHttpRequest();
            xhr.open(
              "GET",
              Drupal.url("v1/api_zimbra_pleiade/zimbra_tasks_query")
            );
            xhr.responseType = "json";

            xhr.onload = function () {
              if (xhr.status !== 200) return;

              const data = xhr.response;
              const appts = data?.userData?.Body?.SearchResponse?.appt || [];
              document.cookie = "nbOfTasks=" + appts.length;

              const events = [];

              appts.forEach((appt) => {
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
                    url: `${
                      data.domainEntry
                    }modern/calendar/event/details/${invId}?utcRecurrenceId=${
                      instance.ridZ
                    }&start=${instance.s}&end=${instance.s + dur}`,
                    hasLinkIcon: isLocationLink,
                    locationLink: link,
                  });
                });
              });

              const currentDate = new Date();
              const calendar = new FullCalendar.Calendar(calendarTarget, {
                timeZone: "local",
                locale: "fr",
                customButtons: {
                  EventButton: {
                    text: "",
                    click: () => (window.location.href = "/calendar"),
                  },
                },
                viewDidMount: function () {
                  const button = document.querySelector(
                    ".fc-EventButton-button"
                  );
                  if (button) {
                    button.addEventListener("contextmenu", function (e) {
                      e.preventDefault();
                      window.open("/calendar", "_blank");
                    });
                  }
                },
                height: 400,
                headerToolbar: {
                  start: "title",
                  today: false,
                  right: "prev,next EventButton",
                },
                nowIndicator: true,
                now: currentDate,
                initialView: "timeGridDay",
                themeSystem: "bootstrap",
                slotLabelInterval: "01:00:00",
                scrollTime: "09:00:00",
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
                  const tooltipHTML = `
                    <div><strong>${event.title}</strong></div>
                    <div>${startTime} - ${endTime}</div>
                    ${
                      props.hasLinkIcon
                        ? '<div><i class="fa-solid fa-video"></i> Lien</div>'
                        : ""
                    }
                  `;
                  wrapper.setAttribute("title", tooltipHTML);
                  const title = document.createElement("div");
                  title.classList.add("text-truncate");
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
                    linkIcon.href = match ? match[0] : "#";
                    linkIcon.target = "_blank";
                    linkIcon.innerHTML =
                      '<i class="position-absolute top-0 end-0 fa-solid fa-video text-black ms-1"></i>';
                    linkIcon.addEventListener("click", (e) =>
                      e.stopPropagation()
                    );
                    wrapper.appendChild(linkIcon);
                  }
                  setTimeout(() => new bootstrap.Tooltip(wrapper), 0);
                  return { domNodes: [wrapper] };
                },
                events: events,
                eventClick: function (event) {
                  if (event.event.url) {
                    event.jsEvent.preventDefault();
                    window.open(event.event.url, "zimbratask");
                  }
                },
              });
              calendar.render();

              const scrollContainer =
                calendarTarget.querySelector(".fc-scroller-liquid-absolute") ||
                calendarTarget.querySelector(".fc-timegrid-body");
              const scrollUp = document.getElementById("scroll-up");
              const scrollDown = document.getElementById("scroll-down");
              if (scrollContainer && scrollDown && scrollUp) {
                scrollUp.addEventListener(
                  "click",
                  () => (scrollContainer.scrollTop -= 100)
                );
                scrollDown.addEventListener(
                  "click",
                  () => (scrollContainer.scrollTop += 100)
                );
              }
              if (window.innerWidth < 768) {
                const scroller = document.getElementsByClassName(
                  "fc-scroller-liquid-absolute"
                )[0];
                if (scroller) scroller.style.overflow = "hidden";
              }
            };

            xhr.onerror = () => console.log("Erreur AJAX");
            xhr.onloadend = () => {
              const button = document.querySelector(".fc-EventButton-button");
              if (button)
                button.innerHTML = '<i class="fa fa-calendar-week"></i>';
            };

            xhr.send();
          };

           document.getElementById("reloadZimbraMail").addEventListener(
            "click",
            function (e) {
              e.preventDefault();
              initializeAgenda();
            }
          );

          if (localStorage.getItem("zimbra") === "block") {
            initializeAgenda();
          } else {
            const pollInterval = setInterval(() => {
              if (localStorage.getItem("zimbra") === "block") {
                clearInterval(pollInterval);
                initializeAgenda();
              }
            }, 200);
          }
        });
      }
    },
  };
})(Drupal, once, drupalSettings);
