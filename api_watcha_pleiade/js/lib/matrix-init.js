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
           

            updateItemsOnReceipt(container,
              room.roomId,
              event,
              targetEventId,
              )
            // Optionally update your local message display here
           
          }else if (event.getType() === "m.room.redaction") {
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

document.addEventListener("DOMContentLoaded", waitForElementsAndStart);
