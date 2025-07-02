<?php 

// postit_module/src/Controller/PostItController.php

namespace Drupal\module_postit_pleiade\Controller;

use Symfony\Component\HttpFoundation\Request;
use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Drupal\user\Entity\User;
class PostItController extends ControllerBase {

  public function savePostIt(?Request $request) {
    // $requestData = '{"message":"sretusrtus","color":"rgb(255, 255, 255)","transform":"","top":0,"left":0,"text_color":"rgb(0, 0, 0)"}';
    $requestData2 = '{"message":"ok","color":"rgb(255, 255, 255)","transform":"","top":0,"left":0,"text_color":"rgb(0, 0, 0)"}';
    $requestData = json_decode(urldecode($request->getContent()), true);
    if (empty($requestData)) {
        // Si $requestData est vide, supprimez la valeur du champ field_post_it_items pour l'utilisateur courant.
        $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
        $user->set('field_post_it_items', '');
        $user->save();

        \Drupal::logger('module_postit_pleiade')->info('Post-it data removed for user.');
        
        return new JsonResponse(['message' => 'Post-it data removed for user.']);
    }

    $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
    $current_user_items = $user->get('field_post_it_items')->getValue();

    if (empty($current_user_items)) {
        // Si le champ est vide, utilisez la première requête de données.
        $merged_items = $requestData;
    } else {
        // Si le champ n'est pas vide, fusionnez les données existantes avec les nouvelles données.
        $current_user_items = json_decode($current_user_items[0]['value'], true);
        $merged_items = array_merge($current_user_items, $requestData);
    }

    // Mettez à jour le champ field_post_it_items avec les données fusionnées.
    $user->set('field_post_it_items', json_encode($merged_items));
    $user->save();
    
    \Drupal::logger('module_postit_pleiade')->info('New Posts-its: @api', ['@api' => json_encode($merged_items)]);
    
    return new JsonResponse([$merged_items]);
}
  /**
   * Retrieves post-it items from user profile.
   */
  public function retrievePostIt() {
    
    $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
   
    $jsonString = $user->get('field_post_it_items')->getValue();
    \Drupal::logger('module_postit_pleiade')->info('Post-its du user: @api', ['@api' => json_encode($jsonString)]);
    if($jsonString !== 'null'){
    $jsonString = $jsonString[0]['value']; 
    $array = json_decode($jsonString, true);
    }
    return new JsonResponse($jsonString);

  }

}