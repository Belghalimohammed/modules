<?php

namespace Drupal\api_nextcloud_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;

use Drupal\user\PrivateTempStoreFactory;

class NextCloudController extends ControllerBase
{

  public function notifs_query(Request $request)
  {
    $settings_nextcloud = \Drupal::config('api_nextcloud_pleiade.settings');
    // // API endpoint URL
    $tempstore = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
    $groupData = $tempstore->get('groups');
    if ($groupData !== NULL) {
      $groupDataArray = explode(', ', $groupData);
    }
    if (in_array($settings_nextcloud->get('nextcloud_lemon_group'), $groupDataArray)) {

      $return = []; //our variable to fill with data returned by Pastell
      $nextcloudataApi = new ApiPleiadeManager();
      $return = $nextcloudataApi->getNextcloudNotifs();
      return new JsonResponse(json_encode($return), 200, [], true);
    }
    
  }
}
