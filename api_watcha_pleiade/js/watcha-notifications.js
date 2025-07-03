

let myUserId, myAccessToken, synapseServer, watchaUrl;
let watchaBar, container;
let nextBatch = null;
const globalNotifications = {};
const eventIdToRoomMap = {};
const roomInfoCache = {};
const userProfileCache = {};

async function fetchMatrixConfig() {
  const res = await fetch("/v1/api_watcha_pleiade/getConfig");
  if (res.status === 401) {
    window.location.href = Drupal.url("v1/api_watcha_pleiade/watcha_auth_flow");
    return null;
  }
  const { data } = await res.json();
  return data;
}
// ---------------- MAIN INIT ----------------

async function initMatrixClient() {
  try {
    const config = await fetchMatrixConfig();
    if (!config) return;

    ({ myUserId, myAccessToken, synapseServer, synapseServerApi, watchaUrl } =
      config);

    startSyncLoop(container, watchaBar, watchaUrl, myUserId);
  } catch (err) {
    console.error("Matrix initialization error:", err);
  }
}

// ---------------- DOM READY ----------------

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
        initMatrixClient();
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener("DOMContentLoaded", waitForElementsAndStart);

async function startSyncLoop(container, watchaBar, watchaUrl, myUserId) {
  try {
    // Step 1: Initial sync with full filter
    const initUrl = `${synapseServer}/_matrix/client/v3/sync?filter=%7B%22room%22%3A%7B%22timeline%22%3A%7B%22unread_thread_notifications%22%3Atrue%2C%22limit%22%3A20%7D%2C%22state%22%3A%7B%22lazy_load_members%22%3Atrue%7D%7D%7D&full_state=false`;

    console.log("go");
    const initialRes = await fetch(initUrl, {
      headers: {
        Authorization: `Bearer ${myAccessToken}`,
      },
    });

    if (!initialRes.ok) {
      throw new Error("Initial sync failed");
    }

    const initialData = await initialRes.json();
    console.log("done")
    nextBatch = initialData.next_batch;
    renderMessages(await handleSyncResponse(initialData, true), {
      container,
      watchaBar,
      watchaUrl,

      myUserId,
    });
    // Step 2: Continue syncing every 30 seconds with filter=0
    setInterval(() => {
      syncWithFilter0(container, watchaBar, watchaUrl, myUserId);
    }, 500);
  } catch (err) {
    console.error("Sync loop error:", err.message);
  }
}

async function syncWithFilter0(container, watchaBar, watchaUrl, myUserId) {
  if (!nextBatch) return;

  const url = `${synapseServer}/_matrix/client/v3/sync?filter=%7B%22room%22%3A%7B%22timeline%22%3A%7B%22unread_thread_notifications%22%3Atrue%2C%22limit%22%3A20%7D%2C%22state%22%3A%7B%22lazy_load_members%22%3Atrue%7D%7D%7D&full_state=false&since=${nextBatch}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${myAccessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error("Sync with filter=0 failed");
    }

    const data = await res.json();
    nextBatch = data.next_batch;
    renderMessages(await handleSyncResponse(data, false), {
      container,
      watchaBar,
      watchaUrl,

      myUserId,
    });
  } catch (err) {
    console.error("Sync error:", err.message);
  }
}

function getMxcUrl(mxcUrl) {
  if (!mxcUrl) return null;
  const mediaId = mxcUrl.replace("mxc://", "");
  return `${synapseServer}/_matrix/media/v3/download/${mediaId}`;
}

async function handleSyncResponse(data, isInitial = false) {
  const joinedRooms = data.rooms?.join ?? {};
  const inviteRooms = data.rooms?.invite ?? {};

  for (const [roomId, roomData] of Object.entries(joinedRooms)) {
    const notifCount = roomData.unread_notifications?.notification_count ?? 0;
    const stateEvents = roomData.state?.events ?? [];
      if (isInitial) {
      for (const event of stateEvents) {
        if (event.type === "m.room.name") {
          roomInfoCache[roomId] = {
            name: event.content?.name ?? roomId,
          };
        }

         if (event.type === "m.room.member") {
          const userId = event.state_key;
          const displayname = event.content?.displayname;
          const avatar_url = event.content?.avatar_url;

          userProfileCache[userId] = { displayname, avatar_url };
        }
      }

       
    }

 
    if (notifCount === 0) {
      delete globalNotifications[roomId];
      continue;
    }

    // --- Get room name ---
    let roomName = roomInfoCache[roomId]?.name ?? roomId;
    

  

    if (!roomInfoCache[roomId]) {
      for (const event of roomData.timeline?.events ?? []) {
        if (event.type === "m.room.name") {
          roomInfoCache[roomId] = {
            name: event.content?.name ?? roomId,
          };
        }
      }
    }

    roomName = roomInfoCache[roomId]?.name ?? roomId;

    const timelineEvents = roomData.timeline?.events ?? [];

    // --- Populate member and name caches during initial sync ---
   

    for (const event of timelineEvents) {
      if (event.type === "m.room.member") {
        const userId = event.state_key;
        const displayname = event.content?.displayname;
        const avatar_url = event.content?.avatar_url;

        userProfileCache[userId] = { displayname, avatar_url };
      }
    }

    // --- Collect edits and deletions ---
    const redactedEventIds = new Set();
    const editsMap = {};

    for (const event of timelineEvents) {
      if (event.type === "m.room.redaction" && event.redacts) {
        redactedEventIds.add(event.redacts);
      }
      if (
        event.type === "m.room.message" &&
        event.content?.["m.relates_to"]?.rel_type === "m.replace"
      ) {
        const targetId = event.content["m.relates_to"].event_id;
        editsMap[targetId] = event.content;
      }
    }

    const events = timelineEvents.slice().reverse();
    let newLastMessage = null;

    for (const event of events) {
      if (event.type !== "m.room.message") continue;
      if (event.sender === myUserId) continue;

      const rel = event.content?.["m.relates_to"]?.rel_type;
      if (rel === "m.thread" || rel === "m.replace") continue;

      newLastMessage = event;
      break;
    }

    const currentNotif = globalNotifications[roomId];
    const currentLastId = currentNotif?.event_id;

    // --- Update deleted or edited message ---
    if (currentLastId) {
      if (redactedEventIds.has(currentLastId)) {
        currentNotif.message = "deleted";
        currentNotif.unread = Math.max(0, currentNotif.unread - 1);
      } else if (editsMap[currentLastId]) {
        const newBody = editsMap[currentLastId]["m.new_content"]?.body;
        if (newBody) {
          currentNotif.message = newBody;
        }
      }
    }

    // --- Set new message if changed ---
    if (newLastMessage && newLastMessage.event_id !== currentLastId) {
      const senderId = newLastMessage.sender;
      let body = newLastMessage.content?.body ?? "";

      // --- Get sender data from cache or fetch ---
      let senderData = userProfileCache[senderId];

      if (!senderData) {
        try {
          const profileRes = await fetch(
            `${synapseServer}/_matrix/client/v3/profile/${encodeURIComponent(
              senderId
            )}`,
            {
              headers: { Authorization: `Bearer ${myAccessToken}` },
            }
          );
          if (profileRes.ok) {
            const profile = await profileRes.json();
            senderData = {
              displayname: profile.displayname,
              avatar_url: profile.avatar_url,
            };
            userProfileCache[senderId] = senderData;
          } else {
            senderData = { displayname: senderId };
          }
        } catch (err) {
          console.warn(`Failed to fetch profile for ${senderId}:`, err.message);
          senderData = { displayname: senderId };
        }
      }

      const displayName = senderData.displayname ?? senderId;
      const avatarUrl = getMxcUrl(senderData.avatar_url);

      globalNotifications[roomId] = {
        type: "unread",
        room_id: roomId,
        room_name: roomName === roomId ? "direct" : roomName,
        unread: notifCount,
        message: body,
        sender: displayName,
        avatar_url: avatarUrl,
        sender_id: senderId,
        timestamp: newLastMessage.origin_server_ts,
        event_id: newLastMessage.event_id,
      };

      eventIdToRoomMap[newLastMessage.event_id] = roomId;
    }
  }

  // --- Handle invites ---
  for (const [roomId, inviteData] of Object.entries(inviteRooms)) {
    let roomName = "Invite";
    let inviter = null;
    let timestamp = null;

    for (const event of inviteData.invite_state?.events ?? []) {
      if (event.type === "m.room.name") {
        roomName = event.content?.name ?? roomName;
      }
      if (event.type === "m.room.member" && event.sender) {
        inviter = event.sender;
        timestamp = event.origin_server_ts;
      }
    }

    let displayName = inviter;
    let avatarUrl = null;

    for (const event of inviteData.invite_state?.events ?? []) {
      if (event.type === "m.room.member" && event.state_key === inviter) {
        displayName = event.content?.displayname ?? inviter;
        avatarUrl = getMxcUrl(event.content?.avatar_url);
        break;
      }
    }

    globalNotifications[roomId] = {
      type: "invite",
      room_id: roomId,
      room_name: roomName,
      sender: displayName,
      avatar_url: avatarUrl,
      sender_id: inviter,
      timestamp,
      unread: 1,
    };
  }

  return { ...globalNotifications };
}

