<?php

namespace Drupal\api_parapheur_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;

class PleiadeAjaxParapheurController extends ControllerBase {

    public function parapheur_entities_query(Request $request){
        
        $current_user = \Drupal::currentUser();

        // Get the user entity.
        $user = \Drupal\user\Entity\User::load($current_user->id());
        
        $tempstore = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
        $storedGroups = $tempstore->get('groups');
        if (is_string($storedGroups) && strpos($storedGroups, 'i-parapheur') !== false) {
            $return = []; //our variable to fill with data returned by Parapheur
            $parapheurdataApi = new ApiPleiadeManager();
            
            $return = $parapheurdataApi->searchMyDesktop();
            if($return){
	            return new JsonResponse(json_encode(count($return)), 200, [], true);
            }
            else
            {
                return new JsonResponse(json_encode('no data'), 200, [], true);
            }
        }else
        {
            return new JsonResponse(json_encode('no data'), 200, [], true);
        }
    }

}
