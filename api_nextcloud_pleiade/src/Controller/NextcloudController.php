<?php

namespace Drupal\api_nextcloud_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;

use Drupal\user\PrivateTempStoreFactory;

class NextCloudController extends ControllerBase
{
 protected $nextcloudUrl = ' https://partager-sitiv.territoirenumeriqueouvert.org';
  public function notifs_query(Request $request)
  {
    $settings_nextcloud = \Drupal::config('api_nextcloud_pleiade.settings');
    // // API endpoint URL
    $tempstore = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
    $groupData = $tempstore->get('groups');
    if ($groupData !== NULL) {
      $groupDataArray = explode(",", str_replace(", ", ",", $groupData));
    }
    if (in_array($settings_nextcloud->get('nextcloud_lemon_group'), $groupDataArray)) {

      $return = []; //our variable to fill with data returned by Pastell
      $nextcloudataApi = new ApiPleiadeManager();
      $return = $nextcloudataApi->getNextcloudNotifs();
      return new JsonResponse(json_encode($return), 200, [], true);
    }
    
  }



  

 public function generateToken(Request $request) {

   $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
  $key =  $user->get('field_nextcloud_api_key')->value;

  if($key != "" ){
      return new JsonResponse([
      'error' => "already exists",
    ],409);
  }
  $client = \Drupal::httpClient(); // Drupal's global Guzzle client
  $url = 'https://partager-sitiv.territoirenumeriqueouvert.org/index.php/login/v2';

  try {
    $response = $client->post($url, [
      'headers' => [
        'OCS-APIREQUEST' => 'true',
        'Accept' => 'application/json',
        'User-Agent' => 'Drupal/NextcloudTokenFetcher',
      ],
      
      // Optional:
      // 'proxy' => 'http://192.168.76.3:3128',
      // 'verify' => false, // Only for self-signed certs (not recommended in prod)
    ]);

    $body = $response->getBody()->getContents();
    $data = json_decode($body, true);

    if (!isset($data['poll']['token']) || !isset($data['login'])) {
      return new JsonResponse(['error' => 'Unexpected response from Nextcloud.'], 500);
    }

    return new JsonResponse([
      'login_url' => $data['login'],
      'poll_url' => $data['poll']['endpoint'],
      'poll_token' => $data['poll']['token'],
    ],200);
  }
  catch (\Exception $e) {
    \Drupal::logger('nextcloud')->error('Token generation failed: @msg', ['@msg' => $e->getMessage()]);
    return new JsonResponse(['error' => 'Failed to contact Nextcloud login API.'], 500);
  }
}

 public function pollToken(Request $request) {
  $pollToken = $request->get("token");

  if (empty($pollToken)) {
    return new JsonResponse(['error' => 'Missing pollToken.'], 400);
  }

  $client = \Drupal::httpClient();
  $url = 'https://partager-sitiv.territoirenumeriqueouvert.org/index.php/login/v2/poll';

  try {
    $response = $client->post($url, [
      'headers' => [
        'Accept' => 'application/json',
        'Content-Type' => 'application/json',
      ],
      'json' => ['token' => $pollToken],
      // Optional proxy and SSL settings
      // 'proxy' => 'http://192.168.76.3:3128',
      // 'verify' => false,
    ]);

    $body = $response->getBody()->getContents();
    $data = json_decode($body, true);

    if (empty($data['appPassword'])) {
      return new JsonResponse(['status' => 'waiting']);
    }

    // Save to current user
    $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
    $user->set('field_nextcloud_api_key', $data['appPassword']);
     $user->set('field_nextcloud_api_user', $data['loginName']);
     $user->save();
    \Drupal::logger('nextcloud')->error('log='.$data['loginName'] . '||||pass=' .  $data['appPassword']);
    return new JsonResponse([
      'data' => $data,
      'status' => 'success',
      'message' => 'Token stored successfully.',
    ]);
  }
  catch (\Exception $e) {
    \Drupal::logger('nextcloud')->error('Polling failed: @msg', ['@msg' => $e->getMessage()]);
    return new JsonResponse(['status' => 'error'], 500);
  }
}
}
