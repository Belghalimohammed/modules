<?php

namespace Drupal\api_user_pleiade\Controller;


use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;

class PleiadeUserController extends ControllerBase
{

  private $user;
  public function __construct()
  {
    $this->annuaireLogin =  $this->config("api_user_pleiade.settings")->get("annuaire_login");
    $this->annuairePassword =  $this->config("api_user_pleiade.settings")->get("annuaire_password");
    $this->annuaireUrl =  $this->config("api_user_pleiade.settings")->get("annuaire_url");

    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_user_pleiade')) {
      $this->settings_user = \Drupal::config('api_user_pleiade.settings');
    }

    $user_storage =  \Drupal::entityTypeManager()->getStorage('user');
    $this->user = $user_storage->load(\Drupal::currentUser()->id());
  }

  public function user_infos(Request $request)
  {

    $current_user = \Drupal::currentUser();

    // Get the user entity.
    $user = \Drupal\user\Entity\User::load($current_user->id());

    // Initialize an array to store user information.
    $user_info = array();

    // Check if the user entity exists.
    if ($user) {
      // Get all user fields and their values.
      $fields = $user->getFields();

      // Iterate through each field.
      foreach ($fields as $field_name => $field) {
        // Get the field value.
        $field_value = $field->getValue();

        // Store the field name and value in the user info array.
        $user_info[$field_name] = $field_value;
      }
    }
    if ($user_info) {

      return new JsonResponse(json_encode($user_info), 200, [], true);
    } else {
      echo 'erreur lors de la récupération des users';
    }
  }
  public function user_list_query(Request $request)
  {

    // Load the user storage service.
    $query = \Drupal::entityQuery('user')->accessCheck(TRUE);;
    $uids = $query->execute();
    $users = array();


    foreach ($uids as $uid) {
      $user = \Drupal\user\Entity\User::load($uid);

      // Get user's profile picture URL.
      $picture_url = '';
      if (isset($user->get('user_picture')->entity)) {
        $picture_url = $user->get('user_picture')->entity->createFileUrl();
      } else {
        // Default image
        $field = \Drupal\field\Entity\FieldConfig::loadByName('user', 'user', 'user_picture');
        $default_image = $field->getSetting('default_image');
        if ($default_image) {
          $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $default_image['uuid']);
          if ($file != '' || $file != null) {
            try {
              $picture_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
            } catch (InvalidStreamWrapperException $e) {
              $picture_url = '';
            }
          } else {
            $picture_url = '/themes/custom/pleiadebv/assets/images/users/img_user.png';
          }
        } else {
          $picture_url = '/themes/custom/pleiadebv/assets/images/users/img_user.png';
        }
      }


      // Get user's last login timestamp.
      $last_login_timestamp = '';
      if ($user->getLastLoginTime()) {
        $last_login_timestamp = $user->getLastLoginTime();
      }

      // Get user's email.
      $email = '';
      if ($user->getEmail()) {
        $email = $user->getEmail();
      }

      $users[] = array(
        'id' => $user->id(),
        'picture_url' => $picture_url,
        'last_login_timestamp' => $last_login_timestamp,
        'email' => $email,
      );
    }

    if ($users) {

      return new JsonResponse(json_encode($users), 200, [], true);
    } else {
      echo 'erreur lors de la récupération des users';
    }
  }

  public function user_add_application(Request $request)
  {
    // Load the current user.
    $user = \Drupal\user\Entity\User::load(
      \Drupal::currentUser()->id()
    );
    if (!$user) {
      return new JsonResponse(['message' => 'User not found.'], 404);
    }

    // Get 'uri' and 'title' from request (POST or GET).
    $uri = $request->get('uri');
    $title = $request->get('title');

    if (empty($uri) || empty($title)) {
      return new JsonResponse(['message' => 'Missing uri or title parameter.'], 400);
    }

    // Current values of the field.
    $values = $user->get('field_url_application')->getValue();

    $new_value = [
      'uri' => $uri,
      'title' => $title,
    ];

    // Check if the URI already exists to avoid duplicates.
    foreach ($values as $existing_value) {
      if (isset($existing_value['uri']) && $existing_value['uri'] === $new_value['uri']) {
        return new JsonResponse(['message' => 'This URL already exists in the user field.'], 409);
      }
    }

    // Add the new value.
    $values[] = $new_value;

    // Update the field and save.
    $user->set('field_url_application', $values);
    $user->save();

    return new RedirectResponse("/");
  }

  public function user_delete_application(Request $request)
  {
    // Charger l'utilisateur courant.
    $user = \Drupal\user\Entity\User::load(
      \Drupal::currentUser()->id()
    );
    if (!$user) {
      return new JsonResponse(['message' => 'Utilisateur introuvable.'], 404);
    }

    // Récupérer 'uri' et 'title' depuis la requête.
    $uri = $request->get('uri');
    $title = $request->get('title');

    if (empty($uri) || empty($title)) {
      return new JsonResponse(['message' => 'Paramètre uri ou title manquant.'], 400);
    }

    // Fonction pour normaliser un URI (supprime slash final seulement si ce n’est pas juste '/')
    $normalize_uri = function ($u) {
      return rtrim($u, '/');
    };

    $normalized_uri = $normalize_uri($uri);

    // Récupérer les valeurs actuelles du champ.
    $values = $user->get('field_url_application')->getValue();

    // Filtrer pour supprimer la bonne valeur.
    $new_values = array_filter($values, function ($item) use ($normalized_uri, $title, $normalize_uri) {
      $item_uri = isset($item['uri']) ? $normalize_uri($item['uri']) : '';
      $item_title = $item['title'] ?? '';
      return !($item_uri === $normalized_uri && $item_title === $title);
    });

    // Si rien n’a été supprimé
    if (count($new_values) === count($values)) {
      return new JsonResponse(['message' => 'Aucune correspondance trouvée pour uri et title.'], 404);
    }

    // Mettre à jour et enregistrer
    $user->set('field_url_application', array_values($new_values));
    $user->save();

    return new RedirectResponse("/");
  }

  public function setVariables(Request $request)
  {
    if ($request->get("var") == "field_isnextcloudactivated" && empty($this->user->get('field_nextcloud_api_key')->value)) {
      $this->user->set($request->get("var"), true);
    } else  if ($request->get("var") == "field_iswatchaactivated" && empty($this->user->get('field_watchaaccesstoken')->value)) {
      $this->user->set($request->get("var"), true);
      $this->user->save();
    } else {
      $this->user->set($request->get("var"), !$this->user->get($request->get("var"))->value);
      $this->user->save();
    }


    return new JsonResponse([
      "isWatchaActivated" => $this->user->get("field_iswatchaactivated")->value,
      "isGlpiActivated" => $this->user->get("field_isglpiactivated")->value,
      "isNextCloudActivated" => $this->user->get("field_isnextcloudactivated")->value,
      "isMenuOpened" => $this->user->get("field_ismenuopened")->value,
      "isPostitActivated" => $this->user->get("field_ispostitactivated")->value,
    ], 200);
  }
  public function setVariablesValue(Request $request)
  {

    $this->user->set($request->get("var"), $request->get("value"));
    $this->user->save();
    return new JsonResponse([], 200);
  }

  public function getVariablesValue(Request $request)
  {
    $data = $this->user->get($request->get("var"))->value;
    return new JsonResponse($data, 200);
  }
}
