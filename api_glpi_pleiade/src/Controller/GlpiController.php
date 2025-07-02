<?php

namespace Drupal\api_glpi_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;
use Drupal\user\Entity\User;
use GuzzleHttp\Exception\RequestException;

class GlpiController extends ControllerBase
{
  private $settings_glpi;
  private $client;
  public function __construct()
  {
    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_glpi_pleiade')) {
      $this->settings_glpi = \Drupal::config('api_glpi_pleiade.settings');
    }
    $this->client = \Drupal::httpClient();
  }
  public function glpi_list_tickets(Request $request)
  {


    try {
      $settings_glpi = \Drupal::config('api_glpi_pleiade.settings');
      // // API endpoint URL
      $tempstore = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');

      $groupData = $tempstore->get('groups');
      if ($groupData !== NULL) {
        $groupDataArray = explode(",", str_replace(", ", ",", $groupData));
      }


      if (in_array($settings_glpi->get('glpi_group'), $groupDataArray)) {

        $glpiDataAPI = new ApiPleiadeManager();
        $return = $glpiDataAPI->getGLPITickets();
        
        $returnEmailUser = $glpiDataAPI->searchMySession();

        $userEmail = $returnEmailUser['mail'];

        //      $return = '';
        if ($return) {
          $allTickets = array(); // Tableau pour stocker tous les tickets

          foreach ($return as $ticket) { // Notez l'utilisation de "&" pour accéder au ticket par référence
            // Extraire l'ID de chaque ticket
            $ticketId = $ticket['id'];

            // Effectuer la requête en utilisant $glpiDataAPI->getStatutActorGLPI() avec $ticketId
            $statut = $glpiDataAPI->getStatutActorGLPI($ticketId);

            // Créer un tableau pour stocker les données extraites de $newData
            $newData = array();

            foreach ($statut as $status) {
              // Extraire le type et le users_id de chaque ticket
              $type = $status['type'];
              $users_id = $status['users_id'];

              // Créer un nouvel objet JSON avec les informations extraites
              $newTicketData = array(
                'type' => $type,
                'users_id' => $users_id
              );

              // Ajouter le nouvel objet JSON au tableau $newData
              $newData[] = $newTicketData;
            }

            // Ajouter $newData à la fin du ticket actuel
            $ticket['newData'] = $newData;

            // Ajouter le ticket actuel au tableau de tous les tickets
            $allTickets[] = $ticket;
          }
          $allTickets['usermail'] = $userEmail;
          return new JsonResponse(json_encode($allTickets), 200, [], true);
        } else {
          return new JsonResponse(json_encode(''), 200, [], true);
        }
      } else {
        return new JsonResponse(null, 403);
      }
    } catch (\Exception $e) {
      return new JsonResponse(null, 403);
    }
  }
  public function glpi_tickets()
  {
    return [
      '#markup' => '
      <div class="d-flex justify-content-center">
        <div id="spinner-history" class="spinner-border text-primary" role="status">
        </div>
      </div>
      <div id="glpi_list_tickets"></div>',
    ];
  }

  public function getGLPITicketsCount()
  {
    $endpoint = $this->settings_glpi->get('endpoint_ticket'); // Usually "Ticket"
    $url_api_glpi = $this->settings_glpi->get('glpi_url') . '/apirest.php/' . $endpoint;

    // Get required config
    $glpi_url = $this->settings_glpi->get('glpi_url');
    $app_token = $this->settings_glpi->get('app_token');
    $sessionCookieValue = $_COOKIE['lemonldap'];

    // Load current user and their token
    $current_user = \Drupal::currentUser();
    $user = User::load($current_user->id());
    if (!$user || !$user->get('field_glpi_user_token')->value) {
      \Drupal::logger('api_glpi_pleiade')->alert("User token manquant" . $user->get('field_glpi_user_token')->value);
      return NULL;
    }
    $glpi_user_token = $user->get('field_glpi_user_token')->value;

    // Initialize GLPI session
    $initSessionUrl = $glpi_url . '/apirest.php/initSession?app_token=' . $app_token . '&user_token=' . $glpi_user_token;
    try {
      $sessionResponse = $this->client->request('POST', $initSessionUrl, [
        'headers' => [
          'Content-Type' => 'text/plain',
          'Cookie' => 'lemonldap=' . $sessionCookieValue,
        ],
      ]);
      $sessionData = json_decode($sessionResponse->getBody()->getContents());
      $sessionToken = $sessionData->session_token;
    } catch (RequestException $e) {
      \Drupal::logger('api_glpi_pleiade')->error('Session init error: @error', ['@error' => $e->getMessage()]);
      return NULL;
    }

    // Prepare ticket count request with a small range (we don't need full data)
    $url = $url_api_glpi . '?app_token=' . $app_token . '&session_token=' . $sessionToken;
    try {
      $response = $this->client->request('GET', $url, [
        'headers' => [
          'Content-Type' => 'text/plain',
          'Range' => '0-0', // Ask for 1 item to get Content-Range header
          'Cookie' => 'lemonldap=' . $sessionCookieValue,
        ],
      ]);
      // Get count from Content-Range header
      $contentRange = $response->getHeaderLine('Content-Range'); // Example: "0-0/45"
      if (preg_match('/\/(\d+)$/', $contentRange, $matches)) {
        return (int)$matches[1]; // Total ticket count
      }
    } catch (RequestException $e) {
      \Drupal::logger('api_glpi_pleiade')->error('Ticket count error: @error', ['@error' => $e->getMessage()]);
    }

    return NULL;
  }


}
