function renderMessagesPhone(notifications, options) {
  const { container, watchaBar, watchaUrl } = options;

  let mergedNotifications = Object.values(notifications);

  if (mergedNotifications.length === 0) {
    showEmptyMessage(container, watchaBar);
    return;
  }

  const $carousel = jQuery(container);
  if (!$carousel.hasClass("slick-initialized")) {
    console.warn("Slick not initialized on container, skipping update");
    return;
  }

  if (
    mergedNotifications.length.toString() !=
    sessionStorage.getItem("notificationsCount")
  )
    updateTabTitle(mergedNotifications.length, watchaBar);

  const currentSlide = $carousel.slick("slickCurrentSlide");

  const slickInstance = $carousel.slick("getSlick");
  for (let i = slickInstance.slideCount - 1; i >= 0; i--) {
    $carousel.slick("slickRemove", i);
  }

  mergedNotifications
    .sort((a, b) => b.timestamp - a.timestamp)
    .forEach((event) => {
      const card = createMessageCard({
        count: event.unread,
        avatarUrl: event.avatar_url,
        senderName: event.sender,
        subject:
          "[" +
          (event.room_name === "(no name)" ? event.sender : event.room_name) +
          "] " +
          (event.type === "invite" ? "Nouvelle invitation" : "Nouveau message"),
        message: event.message || "",
        time: formatTimestamp(event.timestamp),
        roomId: event.room_id,
        eventId: event.event_id,
        onClick: () => openRoomAndClean(event.room_id, watchaUrl),
      });

      const slideWrapper = document.createElement("div");
      slideWrapper.appendChild(card);

      $carousel.slick("slickAdd", slideWrapper);
    });
  const totalSlides = $carousel.slick("getSlick").slideCount;
  if (currentSlide < totalSlides) {
    $carousel.slick("slickGoTo", currentSlide);
  } else if (totalSlides > 0) {
    $carousel.slick("slickGoTo", totalSlides - 1);
  }

  container.dataset.empty = "1";
}

function renderMessages(notifications, options) {
 
  const { container, watchaBar, watchaUrl } = options;

  let mergedNotifications = Object.values(notifications);

  if (mergedNotifications.length === 0) {
    showEmptyMessage(container, watchaBar);
    return;
  }

  container.innerHTML = "";

  if (
    mergedNotifications.length.toString() !=
    sessionStorage.getItem("notificationsCount")
  )
    updateTabTitle(mergedNotifications.length, watchaBar);

  mergedNotifications
    .sort((b, a) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((event) => {
      displayMessageNoth(
        event.event_id,
        event.type,
        event.room_name === "(no name)" ? event.sender : event.room_name,
        event.unread,
        event.sender,
        event.avatar_url,
        formatTimestamp(event.timestamp),
        event.message || "",
        event.room_id,
        watchaBar,
        container,
        watchaUrl
      );
    });
}

function displayMessageNoth(
  eventId,
  type,
  roomName,
  count,
  senderName,
  avatarUrl,
  time,
  message,
  roomId,
  watchaBar,
  container,
  watchaUrl
) {
  const subject = `[${roomName}] ${
    type === "invite" ? "Nouvelle invitation" : "Nouveau message"
  }`;

  const card = createMessageCard({
    count,
    avatarUrl,
    senderName,
    subject,
    message,
    time,
    roomId,
    eventId,
    onClick: () => openRoomAndClean(roomId, watchaUrl),
  });

  container.dataset.empty = "1";
  container.prepend(card);
}

function createMessageCard({
  count,
  avatarUrl,
  senderName,
  subject,
  message,
  time,
  roomId,
  eventId,
  onClick,
}) {
  const card = document.createElement("div");
  card.className = "message-card";
  card.dataset.roomId = roomId;
  card.dataset.count = count;
  card.dataset.event = eventId;
  card.addEventListener("click", (e) => {
    e.preventDefault();
    onClick();
  });

  if (message.includes("<@")) {
    message = message.split(">")[2] || message;
  }

  const isMobile = window.innerWidth < 768;
  const avatarHTML = isMobile
    ? ""
    : `
    <div class="d-flex align-items-center profile-picture">
      <img src="${avatarUrl}" alt="avatar" class="profile-pic rounded-circle" width="50" height="50" />
    </div>`;

  card.innerHTML = `
    <a class="list-group-item d-flex flex-column gap-1 py-2 px-3 mail_content text-decoration-none text-dark" style="cursor: pointer;">
      <div class="d-flex justify-content-between align-items-center">
        ${avatarHTML}
        <div class="fw-bold">${senderName}</div>
        <div class="fw-semibold">${subject}</div>

            <small class="text-muted">${time}</small>
      </div>
      <div class="d-flex justify-content-between align-items-center">
        <div class="text-muted fs-6 text-truncate">${message}</div>
        <div class="d-flex justify-content-end">
          <span class="badge bg-primary">${count}</span>
        </div>
      </div>
    </a>`;

  return card;
}

function openRoomAndClean(roomId, watchaUrl) {
  window.open(`${watchaUrl}${roomId}`, "watchaTab");
}

function updateTabTitle(inc, watchaBar) {
  const newCount = inc;
  sessionStorage.setItem("notificationsCount", newCount.toString());

  const baseTitle =
    sessionStorage.getItem("baseTabTitle") || document.title.trim();
  document.title = newCount > 0 ? `[${newCount}] ${baseTitle}` : baseTitle;

  document.querySelectorAll(".noth-span").forEach((el) => el.remove());

  if (watchaBar && newCount > 0) {
    const badge = `
      <span class="noth-span">
        <span class="position-absolute start-75 translate-middle badge rounded-pill bg-danger">
          ${newCount}
        </span>
      </span>`;

    document
      .querySelector("#menu-category-territoirenumriqueouvertprod  span")
      ?.insertAdjacentHTML("beforeend", badge);
    watchaBar.insertAdjacentHTML("beforeend", badge);
    watchaBar.dataset.value1 = newCount.toString();
  }
}

function showEmptyMessage(container, watchaBar) {
  container.dataset.empty = "0";
  container.innerHTML = `
    <div class="d-flex justify-content-center">
      <h3 class="my-5">Aucun nouveau message</h3>
    </div>`;
  updateTabTitle(0, watchaBar);
}

function waitForSlick($carousel, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    (function check() {
      if ($carousel.hasClass("slick-initialized")) {
        resolve();
      } else if (Date.now() - start > timeout) {
        reject(new Error("Slick did not initialize in time."));
      } else {
        setTimeout(check, 100); // retry every 100ms
      }
    })();
  });
}

const myUltraLeanFilter = {
  presence: { not_types: ["*"] },
  account_data: { not_types: ["*"] },
  to_device: { not_types: ["*"] },

  room: {
    ephemeral: {
      not_types: ["*"],
    },

    state: {
      types: ["m.room.name", "m.room.member"],
      lazy_load_members: true,
    },

    timeline: {
      types: [
        "m.room.message",
        "m.room.redaction",
        "m.room.member",
        "m.room.name",
      ],
      limit: 20,
      unread_thread_notifications: true,
    },
    leave: {},
  },
};

function createFilterHash(filterDef) {
  const sortedJsonString = JSON.stringify(
    filterDef,
    Object.keys(filterDef).sort()
  );
  let hash = 0;
  for (let i = 0; i < sortedJsonString.length; i++) {
    const char = sortedJsonString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString();
}

async function getOrCreateFilter(userId, accessToken) {
  const filterDefinition = {
    presence: { not_types: ["*"] },
    account_data: { not_types: ["*"] },
    to_device: { not_types: ["*"] },
    room: {
      state: {
        types: ["m.room.name", "m.room.member"],
        lazy_load_members: true,
      },
      timeline: {
        types: [
          "m.room.message",
          "m.room.redaction",
          "m.room.member",
          "m.room.name",
        ],
        limit: 20,
        unread_thread_notifications: true,
      },
      leave: {},
      ephemeral: {
        types: ["*"],
      },
    },
  };

  const currentFilterHash = createFilterHash(filterDefinition);
  const savedFilterId = localStorage.getItem("myAppFilterId");
  const savedFilterHash = localStorage.getItem("myAppFilterHash");

  if (savedFilterId && savedFilterHash === currentFilterHash) {
    return savedFilterId;
  }

  const url = `${synapseServer}/_matrix/client/v3/user/${encodeURIComponent(
    userId
  )}/filter`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filterDefinition),
    });

    if (!res.ok) throw new Error(`Failed to create filter: ${res.status}`);
    const data = await res.json();
    const newFilterId = data.filter_id;

    localStorage.setItem("myAppFilterId", newFilterId);
    localStorage.setItem("myAppFilterHash", currentFilterHash);

    return newFilterId;
  } catch (err) {
    console.error("Could not create filter:", err);
    return null;
  }
}

window.createFilterHash = createFilterHash;
window.getOrCreateFilter = getOrCreateFilter;
window.myUltraLeanFilter = myUltraLeanFilter;
window.waitForSlick = waitForSlick;
window.renderMessages = renderMessages;
window.renderMessagesPhone = renderMessagesPhone;
window.updateTabTitle = updateTabTitle