import { RoomEvent, createClient, MemoryStore, Filter } from "matrix-js-sdk";
import {
  fetchMatrixConfig,
  fetchMatrixNotifications,
  renderMessages,
  handleLiveInvitations,
  handleLiveMessage,
  removeItemsOnReceipt,
  updateItemsOnReceipt,
  filter,
} from "./matrix-utils.js";

let toStartOfTime;
let matrixClient, startTs;
let myUserId, myAccessToken, synapseServer, watchaUrl, synapseServerApi;
let watchaBar, container;

// ---------------- CLIENT CREATION ----------------

function createMatrixClient() {
  return createClient({
    baseUrl: synapseServer,
    accessToken: myAccessToken,
    userId: myUserId,
    store: new MemoryStore(),
    useAuthorizationHeader: true,
    initialSyncLimit: 0,
  });
}

// ---------------- MAIN INIT ----------------

async function initMatrixClient() {
  try {
    const config = await fetchMatrixConfig();
    if (!config) return;
    const data = await fetchMatrixNotifications(config.myUserId);

    const notifications = data.data;
    ({ myUserId, myAccessToken, synapseServer, synapseServerApi, watchaUrl } =
      config);
    sessionStorage.setItem("notificationsCount", "0");
    renderMessages(notifications, {
      container,
      watchaBar,
      watchaUrl,

      myUserId,
    });

    matrixClient = createMatrixClient();
    startSyncLoop(container, watchaBar, watchaUrl, myUserId);
    matrixClient.on("sync", async (state, error) => {
      if (state !== "PREPARED") return;

      startTs = Date.now();

      matrixClient.on(
        RoomEvent.Timeline,
        async (event, room, toStartOfTimeline) => {
          toStartOfTime = toStartOfTimeline;

          const content = event.getContent();
          const relatesTo = content["m.relates_to"];

          // Check if this event is an edit (m.replace)
          if (relatesTo?.rel_type === "m.replace") {
            const targetEventId = relatesTo.event_id;

            updateItemsOnReceipt(container, room.roomId, event, targetEventId);
            // Optionally update your local message display here
          } else if (event.getType() === "m.room.redaction") {
            removeItemsOnReceipt(
              container,
              room.roomId,
              watchaBar,
              true,
              event.event.redacts,
              room
            );
          } else if (event.event.content["m.relates_to"] == undefined) {
            await handleLiveMessage(
              matrixClient,
              event,
              room,
              toStartOfTimeline,
              {
                myUserId,
                watchaUrl,
                container,
                watchaBar,
                baseUrl: matrixClient.baseUrl,
              }
            );
          }
        }
      );
      let name = "";
      let myEvent = null;
      matrixClient.on("RoomState.events", async (event) => {
        const content = event.getContent();
        const unsigned = event.getUnsigned();
        const age = unsigned?.age;

        if (
          (typeof age === "number" && age > 10000) ||
          startTs > event.localTimestamp
        )
          return;
        if (event.getType() === "m.room.name") {
          name = content.name;
        }
        if (
          event.getType() === "m.room.member" &&
          content.membership === "invite"
        ) {
          myEvent = event;
        }

        if (name != "" && myEvent != null) {
          handleLiveInvitations(
            event,
            name,
            matrixClient,
            {
              watchaUrl,
              container,
              watchaBar,
            },
            content.is_direct
          );

          name = "";
          myEvent = null;
        }
      });

      matrixClient.on("Session.logged_out", (error) => {
        window.location.href = Drupal.url(
          "v1/api_watcha_pleiade/watcha_auth_flow"
        );
      });

      matrixClient.on("Room.receipt", (room, event) => {
        const content = room.event.content; // this is the object you showed
        for (const eventId in content) {
          const receiptTypes = content[eventId]; // likely just "m.read"
          if (receiptTypes["m.read"]) {
            const userReceipts = receiptTypes["m.read"];
            for (const userId in userReceipts) {
              if (userId === myUserId && startTs < userReceipts[userId].ts) {
                removeItemsOnReceipt(container, event.roomId, watchaBar, false);
              }
            }
          }
        }
      });
    });

    const filterObj = new Filter(myUserId);
    filterObj.setDefinition(filter);
    matrixClient.startClient({ filter: filterObj });
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
        localStorage.setItem("notificationsCount", "0");
        initMatrixClient();
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

let nextBatch = null;
const globalNotifications = {}; // roomId -> latest notification
const eventIdToRoomMap = {}; // eventId -> roomId
const roomMemberCache = {}; // roomId -> memberId -> profile

document.addEventListener("DOMContentLoaded", waitForElementsAndStart);

async function startSyncLoop(container, watchaBar, watchaUrl, myUserId) {
  try {
    // Step 1: Initial sync with full filter
    const initUrl = `${synapseServer}/_matrix/client/v3/sync?filter=%7B%22room%22%3A%7B%22timeline%22%3A%7B%22unread_thread_notifications%22%3Atrue%2C%22limit%22%3A20%7D%2C%22state%22%3A%7B%22lazy_load_members%22%3Atrue%7D%7D%7D&full_state=false`;

    const initialRes = await fetch(initUrl, {
      headers: {
        Authorization: `Bearer ${myAccessToken}`,
      },
    });

    if (!initialRes.ok) {
      throw new Error("Initial sync failed");
    }

    const initialData = await initialRes.json();
    nextBatch = initialData.next_batch;
    console.log(await handleSyncResponse(initialData, true));

    // Step 2: Continue syncing every 30 seconds with filter=0
    setInterval(() => {
      syncWithFilter0(container, watchaBar, watchaUrl, myUserId);
    }, 30000);
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
    console.log(await handleSyncResponse(data, false));
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
    if (notifCount === 0) {
      delete globalNotifications[roomId];
      continue;
    }

    let roomName = roomId;
    if (!roomMemberCache[roomId]) roomMemberCache[roomId] = {};
    const roomMembers = roomMemberCache[roomId];

    const stateEvents = roomData.state?.events ?? [];
    const timelineEvents = roomData.timeline?.events ?? [];

    // Initial state updates
    if (isInitial) {
      for (const event of stateEvents) {
        if (event.type === "m.room.member") {
          roomMembers[event.state_key] = {
            displayname: event.content?.displayname,
            avatar_url: event.content?.avatar_url,
          };
        }
        if (event.type === "m.room.name") {
          roomName = event.content?.name ?? roomName;
        }
      }
    }

    // Update from timeline
    for (const event of timelineEvents) {
      if (event.type === "m.room.name") {
        roomName = event.content?.name ?? roomName;
      }
      if (event.type === "m.room.member") {
        roomMembers[event.state_key] = {
          displayname: event.content?.displayname,
          avatar_url: event.content?.avatar_url,
        };
      }
    }

    const editsMap = {};
    const events = timelineEvents.slice().reverse();
    let lastMessage = null;

    for (const event of events) {
      const type = event.type;
      const sender = event.sender;
      const content = event.content ?? {};
      const rel = content?.["m.relates_to"]?.rel_type;
      const isRedacted = !!event.unsigned?.redacted_by;

      // ✅ Handle redactions
      if (isRedacted) {
        const redactedId = event.redacts;
        const roomOfEvent = eventIdToRoomMap[redactedId];
        if (
          roomOfEvent &&
          globalNotifications[roomOfEvent]?.event_id === redactedId
        ) {
          delete globalNotifications[roomOfEvent];
          delete eventIdToRoomMap[redactedId];
        }
        continue;
      }

      // ✅ Handle edits
      if (rel === "m.replace") {
        const targetId = content["m.relates_to"]?.event_id;
        if (targetId) editsMap[targetId] = content;
        continue;
      }

      // Skip irrelevant
      if (type !== "m.room.message") continue;
      if (rel === "m.thread") continue;
      if (sender === myUserId) continue;

      lastMessage = event;
      break;
    }

    if (lastMessage) {
      const senderId = lastMessage.sender;
      let body = lastMessage.content?.body ?? "";

      // ✅ Apply edits
      if (editsMap[lastMessage.event_id]) {
        body = editsMap[lastMessage.event_id]["m.new_content"]?.body ?? body;
      }

      let senderData = roomMembers[senderId];

      // Fetch profile if not cached
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
            roomMembers[senderId] = senderData;
          } else {
            senderData = {};
          }
        } catch (err) {
          console.warn(`Failed to fetch profile for ${senderId}:`, err.message);
          senderData = {};
        }
      }

      const displayName = senderData?.displayname ?? senderId;
      const avatarUrl = getMxcUrl(senderData?.avatar_url);

      globalNotifications[roomId] = {
        type: "unread",
        room_id: roomId,
        room_name: roomName === roomId ? "direct" : roomName,
        unread: notifCount,
        message: body,
        sender: displayName,
        avatar_url: avatarUrl,
        sender_id: senderId,
        timestamp: lastMessage.origin_server_ts,
        event_id: lastMessage.event_id,
      };

      eventIdToRoomMap[lastMessage.event_id] = roomId;
    }
  }

  // 📨 Handle invites
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
