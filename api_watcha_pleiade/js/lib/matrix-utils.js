import {
  showEmptyMessage,
  updateTabTitle,
  displayMessage,
  displayMessageNoth,
  displayInvitations,
} from "./message-handler.js";

const DEFAULT_AVATAR =
  "/sites/default/files/default_images/blank-profile-picture-gb0f9530de_640.png";

// ---------------- FETCH CONFIG ----------------

export async function fetchMatrixConfig() {
  const res = await fetch("/v1/api_watcha_pleiade/getConfig");
  if (res.status === 401) {
    window.location.href = Drupal.url("v1/api_watcha_pleiade/watcha_auth_flow");
    return null;
  }
  const { data } = await res.json();
  return data;
}

export async function fetchMatrixNotifications(user) {
  const res = await fetch(
    `/v1/api_watcha_pleiade/getNotifications?user=${user}`
  );

  if (res.status === 401) {
    window.location.href = Drupal.url("v1/api_watcha_pleiade/watcha_auth_flow");
    return null;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log("Stream complete");
      break;
    }
    const chunk = decoder.decode(value, { stream: true });
    console.log("Received chunk:", chunk);
    fullText += chunk;
  }

  // If the full response is JSON, parse it:
  try {
    return JSON.parse(fullText);
  } catch (err) {
    console.error("Failed to parse JSON:", err);
    return null;
  }
}

// ---------------- LIVE MESSAGE HANDLING ----------------

export async function handleLiveMessage(
  matrixClient,
  event,
  room,
  toStartOfTimeline,
  options
) {
  const { myUserId, container, watchaBar, watchaUrl, baseUrl } = options;
  const age = event.getLocalAge();

  if (
    toStartOfTimeline ||
    age === undefined ||
    age > 5000 ||
    event.getSender() === myUserId ||
    event.getType() !== "m.room.message"
  )
    return;

  if (container.dataset.empty === "0") container.innerHTML = "";

  await displayMessage(
    event,
    room,
    watchaUrl,
    container,
    baseUrl,
    watchaBar,
    matrixClient
  );
}

export function handleLiveInvitations(
  event,
  roomName,
  matrixClient,
  options,
  direct = false
) {
  const { container, watchaBar, watchaUrl } = options;
  updateTabTitle(1, watchaBar);
  displayInvitations(
    event,
    roomName,
    matrixClient,
    watchaUrl,
    container,
    watchaBar,
    direct
  );
}

// ---------------- UTILS ----------------

function parseLocalStorageJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    console.warn(`Invalid ${key} in localStorage`);
    return {};
  }
}

function formatTimestamp(timestamp, isSeconds = false) {
  const date = new Date(isSeconds ? timestamp * 1000 : timestamp);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ---------------- DISPLAY MESSAGES ----------------

export function renderMessages(notifications, options) {
  const { container, watchaBar, watchaUrl } = options;

  const storedCards = parseLocalStorageJson("messageCards");
  const deleted = parseLocalStorageJson("deletedMessages");

  const notificationArray = Object.values(notifications);
  const notificationMap = Object.fromEntries(
    notificationArray.map((item) => [item.room_id, item])
  );

  for (const roomId in storedCards) {
    const stored = storedCards[roomId];
    const existing = notificationMap[roomId];

    const parsedDate = new Date(
      `20${stored.time.split("/")[2].split(" ")[0]}-${
        stored.time.split("/")[1]
      }-${stored.time.split("/")[0]}T${stored.time.split(" ")[1]}`
    );

    const storedTime = parsedDate.getTime();
    const existingTime = existing ? new Date(existing.timestamp).getTime() : 0;

    if (!existing || storedTime > existingTime) {
      notificationMap[roomId] = {
        type: "m.room.message",
        room_name: stored.roomName || stored.senderName || "(no name)",
        unread: stored.count,
        sender: stored.senderName,
        avatar_url: stored.avatarUrl,
        timestamp: parsedDate.toISOString(),
        message: stored.message,
        room_id: stored.roomId,
      };
    }
  }

  let mergedNotifications = Object.values(notificationMap).filter((msg) => {
    const deletedTime = deleted[msg.room_id];
    const msgTime = new Date(msg.timestamp).getTime();
    return !deletedTime || msgTime > deletedTime;
  });

  if (mergedNotifications.length === 0) {
    showEmptyMessage(container, watchaBar);
    return;
  }

  container.innerHTML = "";
  updateTabTitle(mergedNotifications.length, watchaBar);

  const senders = {};
  const rooms = {};

  mergedNotifications.forEach((item) => {
    senders[item.sender_id || item.sender] = {
      sender: item.sender,
      avatar_url: item.avatar_url,
    };
    rooms[item.room_id] =
      item.room_name === "(no name)" ? item.sender : item.room_name;
  });

  window.senders = senders;
  window.rooms = rooms;

  const match =
    JSON.stringify(
      notificationArray.sort((a, b) => a.room_id.localeCompare(b.room_id))
    ) ===
    JSON.stringify(
      mergedNotifications.sort((a, b) => a.room_id.localeCompare(b.room_id))
    );

  if (match) {
    localStorage.setItem("deletedMessages", "{}");
    localStorage.setItem("messageCards", "{}");
  }

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

// ---------------- REMOVE ITEMS ----------------

export function removeItemsOnReceipt(
  container,
  roomId,
  watchaBar,
  deletedNoth,
  event = null,
  room = null
) {
  const card = container.querySelector(`[data-room-id="${roomId}"]`);
  if (!card) return;

  if (deletedNoth) {
    console.log(event, card.dataset.event);
    if (card.dataset.count > "1" && card.dataset.event === event) {
      const events = room.getLiveTimeline().getEvents();
      const lastMessage = [...events]
        .reverse()
        .find((e) => e.getType() === "m.room.message" && !e.isRedacted());

      if (lastMessage) {
        const content = lastMessage.getContent();
        card.querySelector("small.text-muted").textContent = formatTimestamp(
          lastMessage.event.origin_server_ts
        );
        card.querySelector(".text-truncate").textContent = content.body;
        card.dataset.count--;
        card.querySelector(".badge").textContent = card.dataset.count;
        return;
      }
    } else if (card.dataset.event !== event) {
      card.dataset.count--;
      card.querySelector(".badge").textContent = card.dataset.count;
      return;
    }
  }

  card.remove();

  updateTabTitle(-1, watchaBar);

  if (!container.querySelector(".message-card")) {
    showEmptyMessage(container, watchaBar);
  }

  const deleted = parseLocalStorageJson("deletedMessages");
  deleted[roomId] = Date.now();
  localStorage.setItem("deletedMessages", JSON.stringify(deleted));
}

export function updateItemsOnReceipt(
  container,
  roomId,
  newEvent,
  event = null,
) {
 
  const card = container.querySelector(`[data-room-id="${roomId}"]`);
   console.log(event,card.dataset.event)
  if (!card) return;
  

  if (card.dataset.event === event) {
    const content = newEvent.getContent();
    card.querySelector("small.text-muted").textContent = formatTimestamp(
      newEvent.event.origin_server_ts
    );
    card.querySelector(".text-truncate").textContent = content.body;
  }
}

// ---------------- SYNC FILTER ----------------

export const filter = {
  room: {
    include_leave: false,
    timeline: {
      limit: 1,
      types: ["m.room.message", "m.room.redaction", "m.room.name"],
      lazy_load_members: true,
    },
    state: {
      types: ["m.room.name"],
    },
    ephemeral: {
      types: ["m.receipt"],
    },
    account_data: { types: [] },
  },
  presence: { types: [] },
  account_data: { types: [] },
};
