const DEFAULT_AVATAR = "/sites/default/files/default_images/blank-profile-picture-gb0f9530de_640.png";

export function showEmptyMessage(container, watchaBar) {
  container.dataset.empty = "0";
  container.innerHTML = `
    <div class="d-flex justify-content-center">
      <h3 class="my-5">Aucun nouveau message</h3>
    </div>`;
  updateTabTitle(0, watchaBar);
}

export function updateTabTitle(inc, watchaBar) {
  const currentCount = parseInt(sessionStorage.getItem("notificationsCount")) || 0;
  const newCount = Math.max(0, currentCount + inc);
  sessionStorage.setItem("notificationsCount", newCount.toString());

  const baseTitle = sessionStorage.getItem("baseTabTitle") || document.title.trim();
  document.title = newCount > 0 ? `[${newCount}] ${baseTitle}` : baseTitle;

  document.querySelectorAll(".noth-span").forEach(el => el.remove());

  if (watchaBar && newCount > 0) {
    const badge = `
      <span class="noth-span">
        <span class="position-absolute start-75 translate-middle badge rounded-pill bg-danger">
          ${newCount}
        </span>
      </span>`;

    document.querySelector("#territoirenumriqueouvertprod > span")?.insertAdjacentHTML("beforeend", badge);
    watchaBar.insertAdjacentHTML("beforeend", badge);
    watchaBar.dataset.value1 = newCount.toString();
  }
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

function parseEventContent(eventType, content, senderName, roomName) {
  let message = "", subject = "";

  switch (eventType) {
    case "m.room.message":
      message = content.body || "[Message vide]";
      subject = `[${roomName}] Nouveau message`;
      break;
    case "m.reaction":
      message = `Réaction: ${content?.["m.relates_to"]?.key || "?"}`;
      subject = `[${roomName}] Nouvelle réaction`;
      break;
    case "m.sticker":
      message = "Sticker envoyé";
      subject = `[${roomName}] Sticker ajouté`;
      break;
    case "m.room.member":
      subject = `[${roomName}] Nouvelle invitation`;
      break;
    default:
      message = JSON.stringify(content).slice(0, 100);
      subject = `[${roomName}] Nouvel événement`;
  }

  return { message, subject };
}

function createMessageCard({ count, avatarUrl, senderName, subject, message, time, roomId, eventId, onClick }) {
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
  const avatarHTML = isMobile ? "" : `
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

function parseLocalStorage(key, fallback = {}) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    console.warn(`Invalid JSON in localStorage for key "${key}", resetting...`);
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

export async function displayMessage(event, room, watchaUrl, container, baseUrl, watchaBar, matrixClient) {
  const content = event.getContent();
  const senderMxid = event.getSender();
  const rawTs = event?.localTimestamp || Date.now();
  const time = formatTimestamp(rawTs);

  // Sender info
  let senderName, avatarUrl;
  if (window.senders?.[senderMxid]) {
    const info = window.senders[senderMxid];
    senderName = info.sender;
    avatarUrl = info.avatar_url?.startsWith("mxc://")
      ? matrixClient.mxcUrlToHttp(info.avatar_url, 96, 96, "crop")
      : info.avatar_url || DEFAULT_AVATAR;
  } else {
    const profile = await matrixClient.getProfileInfo(senderMxid);
    senderName = profile.displayname || senderMxid;
    avatarUrl = profile.avatar_url
      ? matrixClient.mxcUrlToHttp(profile.avatar_url, 96, 96, "crop")
      : DEFAULT_AVATAR;
  }

  // Room name
  let roomName = window.rooms?.[room.roomId];
  if (!roomName) {
    const roomObj = matrixClient.getRoom(room.roomId);
    roomName = roomObj?.name || roomObj?.roomId || "Salle inconnue";
    roomName = roomName === "Empty room" ? senderName : roomName;
  }

  const { message, subject } = parseEventContent(event.getType(), content, senderName, roomName);

  const existing = container.querySelector(`[data-room-id="${room.roomId}"]`);
  const count = existing ? parseInt(existing.dataset.count) + 1 : 1;

  if (existing) existing.remove();
  else updateTabTitle(1, watchaBar);

  const card = createMessageCard({
    count,
    avatarUrl,
    senderName,
    subject,
    message,
    time,
    roomId: room.roomId,
    eventId: event.getId(),
    onClick: () => openRoomAndClean(room.roomId, watchaUrl),
  });

  container.dataset.empty = "1";
  container.prepend(card);

  // LocalStorage updates
  const messageCards = parseLocalStorage("messageCards");
  messageCards[room.roomId] = {
    count,
    avatarUrl,
    senderName,
    subject,
    message,
    time,
    roomId: room.roomId,
    eventId: event.getId(),
    roomName,
  };
  localStorage.setItem("messageCards", JSON.stringify(messageCards));

  const deleted = parseLocalStorage("deletedMessages");
  delete deleted[room.roomId];
  localStorage.setItem("deletedMessages", JSON.stringify(deleted));

}

export function displayMessageNoth(eventId,type, roomName, count, senderName, avatarUrl, time, message, roomId, watchaBar, container, watchaUrl) {
  const subject = `[${roomName}] ${type === "invite" ? "Nouvelle invitation" : "Nouveau message"}`;

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

export async function displayInvitations(event, roomName, matrixClient, watchaUrl, container, watchaBar, direct) {
  const senderMxid = event.getSender();
  const rawTs = event?.localTimestamp || Date.now();
  const time = formatTimestamp(rawTs);
  const roomId = event.event.room_id;

  let senderName, avatarUrl;
  if (window.senders?.[senderMxid]) {
    const info = window.senders[senderMxid];
    senderName = info.sender;
    avatarUrl = info.avatar_url
      ? matrixClient.mxcUrlToHttp(info.avatar_url, 96, 96, "crop")
      : DEFAULT_AVATAR;
  } else {
    const profile = await matrixClient.getProfileInfo(senderMxid);
    senderName = profile.displayname || senderMxid;
    avatarUrl = profile.avatar_url
      ? matrixClient.mxcUrlToHttp(profile.avatar_url, 96, 96, "crop")
      : DEFAULT_AVATAR;
  }

  if (direct) roomName = "direct";

  const subject = `[${roomName}] Nouvelle invitation`;

  const card = createMessageCard({
    count: 1,
    avatarUrl,
    senderName,
    subject,
    message: "",
    time,
    roomId,
    eventId: rawTs,
    onClick: () => openRoomAndClean(roomId, watchaUrl),
  });

  container.dataset.empty = "1";
  container.prepend(card);

  const messageCards = parseLocalStorage("messageCards");
  messageCards[roomId] = {
    count: 1,
    avatarUrl,
    senderName,
    subject,
    message: "",
    time,
    roomId,
    eventId: rawTs,
    roomName,
  };
  localStorage.setItem("messageCards", JSON.stringify(messageCards));
}