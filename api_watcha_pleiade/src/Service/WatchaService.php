<?php

namespace Drupal\api_watcha_pleiade\Service;

use Drupal\user\Entity\User;
use GuzzleHttp\Client;

class WatchaService implements WatchaServiceInterface
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
    $token = $data['access_token'];



    if (!empty($data['access_token'])) {
      $this->user->set("field_watchaaccesstoken", $token);
      $this->user->save();
    }

    return $data;
  }

  public function getConfigData(): array
  {
    $client = new Client();
    $token = $this->user->get('field_watchaaccesstoken')->value;



    if (empty($this->user->get('field_watchauserid')->value)) {
      $response = $client->get("{$this->synapseApi}/account/whoami", [
        'headers' => [
          'Authorization' => "Bearer $token",
          'Accept' => 'application/json',
        ],
      ]);

      $data = json_decode($response->getBody()->getContents(), true);
      $this->user->set("field_watchauserid", $data['user_id']);
      $this->user->save();
      $userId =  $data['user_id'];
    } else {
      $userId = $this->user->get('field_watchauserid')->value;
    }
    return [
      'myUserId' => $userId,
      'myAccessToken' => $token,
      'synapseServer' => $this->synapseServer,
      'synapseServerApi' => $this->synapseApi,
      'watchaUrl' => "https://discuter-sitiv.territoirenumeriqueouvert.org/app/#/room/",
    ];
  }
}
