let myUserId, myAccessToken, synapseServer, watchaUrl;
let watchaBar, container;
let nextBatch = null;
let myFilterId = null;
let render = false;
const globalNotifications = {};
const eventIdToRoomMap = {};
const roomInfoCache = {};
const userProfileCache = {};
const DEFAULT_AVATAR_URL =
  "/sites/default/files/default_images/blank-profile-picture-gb0f9530de_640.png";

async function fetchMatrixConfig() {
  const res = await fetch("/v1/api_watcha_pleiade/getConfig");
  if (res.status === 401) {
    window.location.href = Drupal.url("v1/api_watcha_pleiade/watcha_auth_flow");
    return null;
  }
  const { data } = await res.json();
  return data;
}

async function initMatrixClient() {
  try {
    const config = await fetchMatrixConfig();
    if (!config) return;

    ({ myUserId, myAccessToken, synapseServer, synapseServerApi, watchaUrl } =
      config);
    if (myUserId == null)
      window.location.href = Drupal.url(
        "v1/api_watcha_pleiade/watcha_auth_flow"
      );
    if (window.innerWidth < 768) {
      const $carousel = jQuery(container);
      try {
        await waitForSlick($carousel);
      } catch (e) {
        console.error("Slick not ready:", e.message);
        return;
      }
    }

    startSyncLoop(container, watchaBar, watchaUrl, myUserId);
  } catch (err) {
    console.error("Matrix initialization error:", err);
  }
}

function waitForElementsAndStart() {
  const observer = new MutationObserver(() => {
    const refs = {
      container: document.getElementById("watcha_block_id"),
      watchaBar: document.getElementById("watcha"),
    };

    if (Object.values(refs).every(Boolean)) {
      ({ container, watchaBar } = refs);

      observer.disconnect();
      if (refs.container) {
        sessionStorage.setItem("notificationsCount", "0");
        initMatrixClient(render);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
if (!localStorage.getItem("watcha")) {
  localStorage.setItem("watcha", "block");
}
if (localStorage.getItem("watcha") === "block") {
  render = true;
  waitForElementsAndStart();
} else {
  render = false;
  waitForElementsAndStart();
  const storageCheckInterval = setInterval(() => {
    if (localStorage.getItem("watcha") === "block") {
      clearInterval(storageCheckInterval);
      render = true;
      if (
        document.getElementById("watcha_block_id") &&
        document.getElementById("watcha")
      ) {
        container = document.getElementById("watcha_block_id");
        watchaBar = document.getElementById("watcha");
        sessionStorage.setItem("notificationsCount", "0");
        render = true;
        if (window.innerWidth > 768) {
          renderMessages(globalNotifications, {
            container,
            watchaBar,
            watchaUrl,
            myUserId,
          });
        } else {
          renderMessagesPhone(globalNotifications, {
            container,
            watchaBar,
            watchaUrl,
            myUserId,
          });
        }
        // initMatrixClient();
      } else {
        // waitForElementsAndStart();
      }
    }
  }, 200);
}
async function startSyncLoop(container, watchaBar, watchaUrl, myUserId) {
  try {
    myFilterId = await getOrCreateFilter(myUserId, myAccessToken);
    if (!myFilterId) {
      throw new Error("Could not get a filter ID. Sync cannot start.");
    }

    const initUrl = `${synapseServer}/_matrix/client/v3/sync?filter=${myFilterId}`;

    const initialRes = await fetch(initUrl, {
      headers: {
        Authorization: `Bearer ${myAccessToken}`,
      },
    });

    if (!initialRes.ok) {
      window.location.href = Drupal.url(
        "v1/api_watcha_pleiade/watcha_auth_flow"
      );
    }

    const initialData = await initialRes.json();
    nextBatch = initialData.next_batch;
    if (render) {
      let notifications = await handleSyncResponse(initialData, true);
      if (window.innerWidth > 768) {
        renderMessages(notifications, {
          container,
          watchaBar,
          watchaUrl,
          myUserId,
        });
      } else {
        renderMessagesPhone(notifications, {
          container,
          watchaBar,
          watchaUrl,
          myUserId,
        });
      }
    } else {
      let notifications = await handleSyncResponse(initialData, true);
      let mergedNotifications = Object.values(notifications);
      updateTabTitle(mergedNotifications.length, watchaBar);
    }

    await syncLoop(container, watchaBar, watchaUrl, myUserId);
  } catch (err) {
    console.error("Sync loop error:", err.message);
  }
}

async function syncLoop(container, watchaBar, watchaUrl, myUserId) {
  let sinceToken = nextBatch;

  while (true) {
    try {
      if (!sinceToken) {
        console.error("Sync loop cannot continue without a 'since' token.");
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      const syncTimeout = 30000;
      const url = `${synapseServer}/_matrix/client/v3/sync?filter=${myFilterId}&since=${sinceToken}&timeout=${syncTimeout}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${myAccessToken}`,
        },
      });

      if (!res.ok) {
        console.error(`Sync request failed with status: ${res.status}`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      const data = await res.json();

      sinceToken = data.next_batch;

      if (render) {
        const notifications = await handleSyncResponse(data, false);

        if (window.innerWidth > 768) {
          renderMessages(notifications, {
            container,
            watchaBar,
            watchaUrl,
            myUserId,
          });
        } else {
          renderMessagesPhone(notifications, {
            container,
            watchaBar,
            watchaUrl,
            myUserId,
          });
        }
      } else {
        let notifications = await handleSyncResponse(data, true);
        let mergedNotifications = Object.values(notifications);
        updateTabTitle(mergedNotifications.length, watchaBar);
      }
    } catch (err) {
      console.error("Sync loop network error:", err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

function getMxcUrl(mxcUrl) {
  if (!mxcUrl) return null;
  if (!mxcUrl.startsWith("mxc")) return DEFAULT_AVATAR_URL;
  const mediaId = mxcUrl.replace("mxc://", "");
  return `${synapseServer}/_matrix/media/v3/download/${mediaId}`;
}

function processTimelineInOnePass(timelineEvents, myUserId) {
  const result = {
    lastMessage: null,
    editsMap: {},
    redactedEventIds: new Set(),
  };

  for (let i = timelineEvents.length - 1; i >= 0; i--) {
    const event = timelineEvents[i];

    if (event.type === "m.room.redaction" && event.redacts) {
      result.redactedEventIds.add(event.redacts);
      continue;
    }

    if (
      event.type === "m.room.message" &&
      event.content?.["m.relates_to"]?.rel_type === "m.replace"
    ) {
      const targetId = event.content["m.relates_to"].event_id;
      if (!result.editsMap[targetId]) {
        result.editsMap[targetId] = event.content;
      }
    }

    if (
      !result.lastMessage &&
      event.type === "m.room.message" &&
      event.sender !== myUserId
    ) {
      const rel = event.content?.["m.relates_to"]?.rel_type;
      if (rel !== "m.thread" && rel !== "m.replace") {
        result.lastMessage = event;
      }
    }
  }
  return result;
}

async function fetchMissingUserProfiles(userIds, accessToken) {
  const profilesToFetch = Array.from(userIds).map((userId) => {
    const url = `${synapseServer}/_matrix/client/v3/profile/${encodeURIComponent(
      userId
    )}`;
    return fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => ({ userId, profile }))
      .catch((err) => {
        console.warn(`Failed to fetch profile for ${userId}:`, err.message);
        return { userId, profile: null };
      });
  });

  const results = await Promise.all(profilesToFetch);

  for (const { userId, profile } of results) {
    if (profile) {
      userProfileCache[userId] = {
        displayname: profile.displayname,
        avatar_url: profile.avatar_url || DEFAULT_AVATAR_URL,
      };
    } else {
      userProfileCache[userId] = {
        displayname: userId,
        avatar_url: DEFAULT_AVATAR_URL,
      };
    }
  }
}

async function handleSyncResponse(data, isInitial = false) {
  const joinedRooms = data.rooms?.join ?? {};
  const leavedRooms = data.rooms?.leave ?? {};
  const inviteRooms = data.rooms?.invite ?? {};

  for (const roomId in leavedRooms) {
    delete globalNotifications[roomId];
  }

  const roomsToFormat = [];
  const profilesToFetch = new Set();

  for (const [roomId, roomData] of Object.entries(joinedRooms)) {
    const notifCount = roomData.unread_notifications?.notification_count ?? 0;

    const stateEvents =
      [...roomData.state?.events, ...roomData.timeline?.events] ?? [];
    for (const event of stateEvents) {
      if (event.type === "m.room.name") {
        roomInfoCache[roomId] = { name: event.content?.name ?? roomId };
      }
      if (event.type === "m.room.member") {
        if (event.content?.displayname || event.content?.avatar_url) {
          userProfileCache[event.state_key] = {
            displayname: event.content.displayname,
            avatar_url: event.content.avatar_url || DEFAULT_AVATAR_URL,
          };
        }
        if (!userProfileCache[event.state_key]) {
          profilesToFetch.add(event.state_key);
        }
      }
    }

    if (notifCount === 0) {
      //&& globalNotifications[roomId]?.type !== "invite"
      delete globalNotifications[roomId];

      continue;
    }

    const timelineData = processTimelineInOnePass(
      roomData.timeline?.events ?? [],
      myUserId
    );

    if (
      timelineData.lastMessage &&
      !userProfileCache[timelineData.lastMessage.sender]
    ) {
      profilesToFetch.add(timelineData.lastMessage.sender);
    }

    roomsToFormat.push({ roomId, roomData, timelineData, notifCount });
  }

  if (profilesToFetch.size > 0) {
    await fetchMissingUserProfiles(profilesToFetch, myAccessToken);
  }

  for (const { roomId, roomData, timelineData, notifCount } of roomsToFormat) {
    const { lastMessage, editsMap, redactedEventIds } = timelineData;
    const roomName = roomInfoCache[roomId]?.name ?? roomId;
    const currentNotif = globalNotifications[roomId];
    const currentLastId = currentNotif?.event_id;

    if (currentNotif) {
      if (redactedEventIds.has(currentLastId)) {
        currentNotif.message = "message supprimé";
      } else if (editsMap[currentLastId]) {
        currentNotif.message =
          editsMap[currentLastId]["m.new_content"]?.body ??
          currentNotif.message;
      }
      currentNotif.unread = notifCount;
    }

    if (lastMessage && lastMessage.event_id !== currentLastId) {
      const senderId = lastMessage.sender;
      const senderData = userProfileCache[senderId] || {
        displayname: senderId,
        avatar_url: DEFAULT_AVATAR_URL,
      };

      globalNotifications[roomId] = {
        type: "unread",
        room_id: roomId,
        room_name: roomName === roomId ? "direct" : roomName,
        unread: notifCount,
        message: lastMessage.content?.body ?? "",
        sender: senderData.displayname ?? senderId,
        avatar_url: getMxcUrl(senderData.avatar_url),
        sender_id: senderId,
        timestamp: lastMessage.origin_server_ts,
        event_id: lastMessage.event_id,
      };
      eventIdToRoomMap[lastMessage.event_id] = roomId;
    }
  }

  for (const [roomId, inviteData] of Object.entries(inviteRooms)) {
    if (globalNotifications[roomId]?.type === "invite") continue;

    let roomName = "Invite";
    let inviterId = null;
    let timestamp = null;

    for (const event of inviteData.invite_state?.events ?? []) {
      if (
        event.type === "m.room.member" &&
        event.content?.membership === "invite" &&
        event.state_key === myUserId
      ) {
        inviterId = event.sender;
        timestamp = event.origin_server_ts;
        break;
      }
    }

    if (!inviterId) continue;

    let inviterDisplayName = inviterId;
    let inviterAvatarUrl = DEFAULT_AVATAR_URL;
    for (const event of inviteData.invite_state?.events ?? []) {
      if (event.type === "m.room.name") {
        roomName = event.content?.name ?? roomName;
        roomInfoCache[roomId] = { name: roomName };
      }
      if (event.type === "m.room.member" && event.state_key === inviterId) {
        inviterDisplayName = event.content?.displayname ?? inviterId;
        inviterAvatarUrl = event.content?.avatar_url || DEFAULT_AVATAR_URL;
      }
    }

    globalNotifications[roomId] = {
      type: "invite",
      room_id: roomId,
      room_name: roomName,
      sender: inviterDisplayName,
      avatar_url: getMxcUrl(inviterAvatarUrl),
      sender_id: inviterId,
      timestamp,
      unread: 1,
    };
  }

  return { ...globalNotifications };
}
