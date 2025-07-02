<?php

namespace Drupal\api_lemon_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Drupal\user\Entity\User;
use Drupal\user\PrivateTempStoreFactory;


class PleiadeAjaxController extends ControllerBase
{

  // function to query LemonLDAP API, myapplications endpoint
  public function lemon_myapps_query(Request $request)
  {
    $return = []; //our variable to fill with data returned by LemonLDAP   
    $lemondataApi = new ApiPleiadeManager();
    $return = $lemondataApi->searchMyApps();
    if($return){
      return new JsonResponse(json_encode($return), 200, [], true);
    }

  }

  // function to query LemonLDAP API, session/my/global endpoint
  public function lemon_session_query(Request $request)
  {
    unset($_COOKIE["groups"]);
    $return = []; //our variable to fill with data returned by LemonLDAP
    $lemondataApi = new ApiPleiadeManager();
    $return = $lemondataApi->searchMySession();
   
    if($return){
      $return['groupes'] = '';
      $groupArray = explode(";", $return["groups"]);
      foreach ($groupArray as $group) {
        if (!empty($group)) {
          $dpt = explode("|", $group);

          $return['groupes'] .= $dpt[0].',';
        }
      }
      $return['groups'] = $return['groupes'];
      \Drupal::logger('api_lemon_pleiade')->info('User group: @api', ['@api' => $return['groupes']]);
      // Store groups in Drupal private tempstore to serve to other modules later
      $tempstore = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
      $tempstore->set('groups', $return["groupes"]);
      setcookie('groups', $return['groups'], time() + 36000, '/');

      $email = $return["mail"];
      // Recherchez l'utilisateur par son adresse e-mail.
      $users = \Drupal::entityTypeManager()->getStorage('user')->loadByProperties(['mail' => $email]);

      // Assurez-vous que l'utilisateur a été trouvé.
      if (!empty($users)) {
        // Obtenez le premier utilisateur correspondant à l'adresse e-mail.
        $user = reset($users);

        // Vérifiez si l'utilisateur a un champ user_picture.
        if ($user->hasField('user_picture')) {
          // Obtenez la valeur du champ user_picture.
          $user_picture_value = $user->get('user_picture')->getValue();

          if (!empty($user_picture_value[0]['target_id'])) {
            // L'utilisateur a une image de profil personnalisée.
            $file = \Drupal\file\Entity\File::load($user_picture_value[0]['target_id']);
            $picture_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
          } else {
            // Utilisez l'image de profil par défaut de l'utilisateur.
            $field = \Drupal\field\Entity\FieldConfig::loadByName('user', 'user', 'user_picture');
            $default_image = $field->getSetting('default_image');

            if ($default_image) {
              $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $default_image['uuid']);
              if ($file) {
                $picture_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
              } else {
                // L'image par défaut n'a pas pu être chargée, utilisez une URL d'image par défaut.
                $picture_url = '/themes/custom/pleiadebv/assets/images/users/img_user.png';
              }
            } else {
              // Aucune image de profil par défaut n'est définie, utilisez une URL d'image par défaut.
              $picture_url = '/themes/custom/pleiadebv/assets/images/users/img_user.png';
            }
          }

          // Maintenant, $picture_url contient l'URL de l'image de profil de l'utilisateur.
          $return['user_picture_url'] = $picture_url;
        } else {
          // L'utilisateur n'a pas de champ user_picture.
          \Drupal::logger('api_lemon_pleiade')->warning('L\'utilisateur n\'a pas de champ user_picture.');
        }
      } else {
        // Aucun utilisateur trouvé avec cette adresse e-mail.
        \Drupal::logger('api_lemon_pleiade')->warning('Aucun utilisateur trouvé avec cette adresse e-mail.');
      }

      return new JsonResponse(json_encode($return), 200, [], true);
    }
    else
    {
      return new JsonResponse(json_encode('aucune donnée'), 200, [], true); 
    }
  }

  /**
   * Returns our session history page.
   *
   * @return array
   *   A simple renderable array.
   */
  public function reset_password()
  {
    return [
      '#markup' => '
      <div class="d-flex justify-content-center">
        <div id="spinner-history" class="spinner-border text-primary" role="status">
        </div>
      </div>
      <div id="history-connexion"></div>',
    ];
  }

}
