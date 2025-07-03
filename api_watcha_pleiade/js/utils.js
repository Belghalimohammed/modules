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
window.renderMessages = renderMessages;
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
      .querySelector("#territoirenumriqueouvertprod > span")
      ?.insertAdjacentHTML("beforeend", badge);
    watchaBar.insertAdjacentHTML("beforeend", badge);
    watchaBar.dataset.value1 = newCount.toString();
  }
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
        ${!isMobile ? `<small class="text-muted">${time}</small>` : ""}
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

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
