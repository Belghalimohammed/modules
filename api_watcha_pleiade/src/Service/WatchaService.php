<?php

namespace Drupal\api_watcha_pleiade\Service;

use Drupal\user\Entity\User;
use GuzzleHttp\Client;

class WatchaService
{
  protected $clientId;
  protected $clientSecret;
  protected $authTokenUrl = 'https://connecter.territoirenumeriqueouvert.org/oauth2/token';
  protected $authAuthorizeUrl = 'https://connecter.territoirenumeriqueouvert.org/oauth2/authorize';
  protected $synapseServer;
  protected $synapseApi;
  protected $authCallbackUrl;
  protected $synapseCallbackUrl;

  protected $user;
  //protected $profileCache = [];
  //protected $roomNameCache = [];

  public function __construct()
  {
    $config = \Drupal::config('api_watcha_pleiade.settings');
    $baseUrl = \Drupal::request()->getSchemeAndHttpHost();

    $this->clientId = $config->get('clientId');
    $this->clientSecret = $config->get('clientSecret');
    $this->synapseServer = $config->get('synapseServer');
    $this->synapseApi = $this->synapseServer . '/_matrix/client/v3';
    $this->authCallbackUrl = $baseUrl . '/v1/api_watcha_pleiade/watcha_auth';
    $this->synapseCallbackUrl = $baseUrl . '/v1/api_watcha_pleiade/watcha_synapse_callback';
    $this->user = User::load(\Drupal::currentUser()->id());
  }

  public function getSynapseRedirectUrl(): string
  {
    return $this->synapseApi . "/login/sso/redirect/oidc?redirectUrl=" . urlencode($this->synapseCallbackUrl);
  }

  public function getAuthorizationLink(): string
  {
    $params = [
      'response_type' => 'code',
      'client_id' => 'synapse',
      'scope' => 'openid profile email',
      'redirect_uri' => $this->authCallbackUrl,
    ];
    return $this->authAuthorizeUrl . '?' . http_build_query($params);
  }

  public function exchangeCodeForToken(string $code): array
  {
    $params = [
      'code' => $code,
      'client_id' => $this->clientId,
      'client_secret' => $this->clientSecret,
      'redirect_uri' => $this->authCallbackUrl,
      'grant_type' => 'authorization_code',
    ];

    $ch = curl_init($this->authTokenUrl);
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => http_build_query($params),
      CURLOPT_RETURNTRANSFER => true,
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
  }

  public function handleSynapseCallback(string $loginToken): array
  {
    $client = new Client();
    $response = $client->post("{$this->synapseApi}/login", [
      'headers' => ['Content-Type' => 'application/json'],
      'json' => [
        'type' => 'm.login.token',
        'token' => $loginToken,
      ],
    ]);

    $data = json_decode($response->getBody()->getContents(), true);

    if (!empty($data['access_token'])) {
      $this->user->set("field_watchaaccesstoken", $data['access_token']);
      $this->user->save();
    }

    return $data;
  }

  public function getConfigData(): array
  {
    $client = new Client();
    $token = $this->user->get('field_watchaaccesstoken')->value;

    $response = $client->get("{$this->synapseApi}/account/whoami", [
      'headers' => [
        'Authorization' => "Bearer $token",
        'Accept' => 'application/json',
      ],
    ]);

    $data = json_decode($response->getBody()->getContents(), true);

    return [
      'myUserId' => $data['user_id'],
      'myAccessToken' => $token,
      'synapseServer' => $this->synapseServer,
      'synapseServerApi' => $this->synapseApi,
      'watchaUrl' => "https://discuter-sitiv.territoirenumeriqueouvert.org/app/#/room/",
    ];
  }


  public function getNotifications($userId): array
  {
    $accessToken = $this->user->get('field_watchaaccesstoken')->value;
    $grouped = [];

    // 🔧 Matrix sync filters
    $filter = [
      'room' => [
        'timeline' => [
          'limit' => 50,
          'types' => ['m.room.message', 'm.sticker'],
        ],
        'ephemeral' => ['types' => ['m.receipt']],
        'state' => ['lazy_load_members' => true],
        'include_leave' => false,
      ],
      'presence' => ['types' => []],
      'account_data' => ['types' => []],
    ];
    $filterEncoded = urlencode(json_encode($filter));
    $url = "{$this->synapseApi}/sync?filter={$filterEncoded}&full_state=false";
    $data = $this->matrixGet($url, $accessToken);

    // ✅ Handle joined rooms
    foreach ($data['rooms']['join'] ?? [] as $roomId => $roomData) {
      $maxReadTs = 0;

      // 🔍 Find user's latest read timestamp
      foreach ($roomData['ephemeral']['events'] ?? [] as $event) {
        if ($event['type'] === 'm.receipt') {
          foreach ($event['content'] ?? [] as $eventId => $receiptTypes) {
            foreach ($receiptTypes['m.read'] ?? [] as $uid => $receipt) {
              if ($uid === $userId) {
                $maxReadTs = max($maxReadTs, $receipt['ts'] ?? 0);
              }
            }
            foreach ($receiptTypes['m.read.private'] ?? [] as $uid => $receipt) {
              if ($uid === $userId) {
                $maxReadTs = max($maxReadTs, $receipt['ts'] ?? 0);
              }
            }
          }
        }
      }

      // 🧠 Build room members and room name from state events
      $roomMembers = [];
      $roomName = $roomId;
      foreach ($roomData['state']['events'] ?? [] as $stateEvent) {
        if ($stateEvent['type'] === 'm.room.member') {
          $uid = $stateEvent['state_key'] ?? null;
          if ($uid) {
            $roomMembers[$uid] = $stateEvent['content'];
          }
        }
        if ($stateEvent['type'] === 'm.room.name') {
          $roomName = $stateEvent['content']['name'] ?? $roomName;
        }
      }

      // 📥 Filter unread messages
      $unreadMessages = [];
      $editsMap = [];
      //     echo "<br><br>";echo $roomId . "::::  " . $maxReadTs ;echo "<br><br>";
      foreach ($roomData['timeline']['events'] ?? [] as $event) {
        $type = $event['type'] ?? '';
        $sender = $event['sender'] ?? '';
        $ts = $event['origin_server_ts'] ?? 0;
        $content = $event['content'] ?? [];
        $rel = $content['m.relates_to']['rel_type'] ?? null;
        $isRedacted = isset($event['unsigned']['redacted_by']);

        // Collect edits
        if ($rel === 'm.replace') {
          $targetId = $content['m.relates_to']['event_id'] ?? null;
          if ($targetId) {
            $editsMap[$targetId] = $content;
          }
          continue;
        }

        // Skip non-message types
        if (!in_array($type, ['m.room.message', 'm.sticker'])) continue;
        if ($sender === $userId) continue;
        if ($isRedacted) continue;
        if ($rel === 'm.thread') continue; // still skip threads
        if ($ts <= $maxReadTs) continue;
        // echo "<br><br>";var_dump($event);echo "<br><br>";
        // Store unread message
        $unreadMessages[] = $event;
      }

      // Sort by newest timestamp
      if (!empty($unreadMessages)) {
        usort($unreadMessages, fn($a, $b) => ($b['origin_server_ts'] ?? 0) <=> ($a['origin_server_ts'] ?? 0));
        $latest = $unreadMessages[0];
        $senderId = $latest['sender'];

        // Replace message body if there's an edit
        $body = $latest['content']['body'] ?? '';
        if (isset($editsMap[$latest['event_id']])) {
          $editedContent = $editsMap[$latest['event_id']];
          $body = $editedContent['m.new_content']['body'] ?? $body;
        }

        $senderData = $roomMembers[$senderId] ?? null;
        $displayName = $senderData['displayname'] ?? $senderId;
        $avatarUrl = $this->getMxcUrl($senderData['avatar_url'] ?? '');

        $grouped[$roomId] = [
          'type' => "unread",
          'room_id' => $roomId,
          'room_name' => $roomName === $roomId ? "direct" : $roomName,
          'unread' => count($unreadMessages),
          'message' => $body,
          'sender' => $displayName,
          'avatar_url' => $avatarUrl,
          'sender_id' => $senderId,
          'timestamp' => $latest['origin_server_ts'],
          'event_id' => $latest["event_id"],
        ];
      }
    }

    // 📨 Handle invited rooms
    foreach ($data['rooms']['invite'] ?? [] as $roomId => $inviteData) {
      $roomName = "Invite";
      $inviter = null;
      $timestamp = null;

      foreach ($inviteData['invite_state']['events'] ?? [] as $event) {
        if ($event['type'] === 'm.room.name') {
          $roomName = $event['content']['name'] ?? $roomName;
        }
        if ($event['type'] === 'm.room.member' && !empty($event['sender'])) {
          $inviter = $event['sender'];
          $timestamp = $event['origin_server_ts'] ?? null;
        }
      }

      $displayName = $inviter;
      $avatarUrl = null;

      // Try to extract inviter info directly from invite events
      foreach ($inviteData['invite_state']['events'] ?? [] as $event) {
        if ($event['type'] === 'm.room.member' && ($event['state_key'] ?? '') === $inviter) {
          $displayName = $event['content']['displayname'] ?? $inviter;
          $avatarUrl = $this->getMxcUrl($event['content']['avatar_url'] ?? '');
          break;
        }
      }

      $grouped[$roomId] = [
        'type' => "invite",
        'room_id' => $roomId,
        'room_name' => $roomName,
        'sender' => $displayName,
        'avatar_url' => $avatarUrl,
        'sender_id' => $inviter,
        'timestamp' => $timestamp,
        'unread' => 1,

      ];
    }

    return $grouped;
  }

  private function matrixGet(string $url, string $accessToken): array
  {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 10,
      CURLOPT_HTTPHEADER => ["Authorization: Bearer $accessToken"],
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true) ?? [];
  }

  protected function getMxcUrl(?string $mxcUrl): string
  {

    if ($mxcUrl == null || empty($mxcUrl) || !str_starts_with($mxcUrl, 'mxc://')) {
      // Return default avatar URL if no mxc url
      return 'https://pleiade-test.sitiv.fr/sites/default/files/default_images/blank-profile-picture-gb0f9530de_640.png';
    }
    $server = $this->synapseServer;
    $mediaId = substr($mxcUrl, 6);
    return $server . "/_matrix/media/r0/download/$mediaId";
  }


  public function test1(): array
  {
    $accessToken = $this->user->get('field_watchaaccesstoken')->value;

    // Get only invites from /sync
    $filterEncoded = urlencode(json_encode([
      'room' => [
        'timeline' => ['limit' => 50, 'types' => ['m.room.message', 'm.sticker']],
        'state' => ['lazy_load_members' => true],
        'ephemeral' => ['types' => ['m.receipt']],
        'include_leave' => false,
      ],
      'presence' => ['types' => []],
      'account_data' => ['types' => []],
    ]));

    $url = "{$this->synapseApi}/sync?filter=$filterEncoded&full_state=false";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 4,
      CURLOPT_HTTPHEADER => ["Authorization: Bearer $accessToken"],
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return $data;
  }

  public function test2(): array
  {
    $userId = "@531e2bc0-e709-11ec-8514-4ef358516943:discuter.sitiv.fr";
    $filePath = "/var/www/html/pleiade_sitiv/web/modules/custom/api_watcha_pleiade/src/Service/sync.txt";
    if (!file_exists($filePath)) {
      throw new \Exception("Sync file not found: $filePath");
    }

    $json = file_get_contents($filePath);
    $data = json_decode($json, true);

    if (!$data || !is_array($data)) {
      throw new \Exception("Invalid or empty sync file: $filePath");
    }

    $grouped = [];

    foreach ($data['rooms']['join'] ?? [] as $roomId => $roomData) {
      $maxReadTs = 0;

      foreach ($roomData['ephemeral']['events'] ?? [] as $event) {
        if ($event['type'] === 'm.receipt') {
          foreach ($event['content'] ?? [] as $eventId => $receiptTypes) {
            foreach ($receiptTypes['m.read'] ?? [] as $uid => $receipt) {
              if ($uid === $userId) {
                $maxReadTs = max($maxReadTs, $receipt['ts'] ?? 0);
              }
            }
            foreach ($receiptTypes['m.read.private'] ?? [] as $uid => $receipt) {
              if ($uid === $userId) {
                $maxReadTs = max($maxReadTs, $receipt['ts'] ?? 0);
              }
            }
          }
        }
      }
      // echo "<br>   ". $roomId . "   <br>-------------------------  ".$maxReadTs;
      $roomMembers = [];
      $roomName = $roomId;

      foreach ($roomData['state']['events'] ?? [] as $stateEvent) {
        if ($stateEvent['type'] === 'm.room.member') {
          $uid = $stateEvent['state_key'] ?? null;
          if ($uid) {
            $roomMembers[$uid] = $stateEvent['content'];
          }
        }
        if ($stateEvent['type'] === 'm.room.name') {
          $roomName = $stateEvent['content']['name'] ?? $roomName;
        }
      }

      $unreadMessages = [];

      foreach ($roomData['timeline']['events'] ?? [] as $event) {
        $type = $event['type'] ?? '';
        $sender = $event['sender'] ?? '';
        $ts = $event['origin_server_ts'] ?? 0;
        $rel = $event['content']['m.relates_to']['rel_type'] ?? null;
        $isRedacted = isset($event['unsigned']['redacted_by']);

        if (!in_array($type, ['m.room.message', 'm.sticker'])) continue;
        if ($sender === $userId) continue;
        if ($isRedacted) continue;
        if ($rel === 'm.thread' || $rel === 'm.replace') continue;
        if ($ts <= $maxReadTs) continue;

        $unreadMessages[] = $event;
        // echo "<br><br>";var_dump($event);
      }

      if (!empty($unreadMessages)) {
        usort($unreadMessages, fn($a, $b) => ($b['origin_server_ts'] ?? 0) <=> ($a['origin_server_ts'] ?? 0));
        $latest = $unreadMessages[0];
        $senderId = $latest['sender'];
        $senderData = $roomMembers[$senderId] ?? null;

        $displayName = $senderData['displayname'] ?? $senderId;
        $avatarUrl = $this->getMxcUrl($senderData['avatar_url'] ?? '');

        $grouped[$roomId] = [
          'type' => "unread",
          'room_id' => $roomId,
          'room_name' => $roomName === $roomId ? "direct" : $roomName,
          'unread' => count($unreadMessages),
          'message' => $latest['content']['body'] ?? '',
          'sender' => $displayName,
          'avatar_url' => $avatarUrl,
          'sender_id' => $senderId,
          'timestamp' => $latest['origin_server_ts'],
        ];
      }
    }

    foreach ($data['rooms']['invite'] ?? [] as $roomId => $inviteData) {
      $roomName = "Invite";
      $inviter = null;
      $timestamp = null;

      foreach ($inviteData['invite_state']['events'] ?? [] as $event) {
        if ($event['type'] === 'm.room.name') {
          $roomName = $event['content']['name'] ?? $roomName;
        }
        if ($event['type'] === 'm.room.member' && !empty($event['sender'])) {
          $inviter = $event['sender'];
          $timestamp = $event['origin_server_ts'] ?? null;
        }
      }

      $displayName = $inviter;
      $avatarUrl = null;

      foreach ($inviteData['invite_state']['events'] ?? [] as $event) {
        if ($event['type'] === 'm.room.member' && ($event['state_key'] ?? '') === $inviter) {
          $displayName = $event['content']['displayname'] ?? $inviter;
          $avatarUrl = $this->getMxcUrl($event['content']['avatar_url'] ?? '');
          break;
        }
      }

      $grouped[$roomId] = [
        'type' => "invite",
        'room_id' => $roomId,
        'room_name' => $roomName,
        'sender' => $displayName,
        'avatar_url' => $avatarUrl,
        'sender_id' => $inviter,
        'timestamp' => $timestamp,
        'unread' => 1,
      ];
    }

    return $grouped;
  }
}
