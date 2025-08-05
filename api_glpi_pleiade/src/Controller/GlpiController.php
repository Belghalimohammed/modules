<?php

namespace Drupal\api_glpi_pleiade\Controller;

use Drupal\api_glpi_pleiade\Service\GlpiService;
use Drupal\api_glpi_pleiade\Service\LemonService;
use Drupal\api_glpi_pleiade\Service\TestService;
use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\user\Entity\User;
use GuzzleHttp\Exception\RequestException;

class GlpiController extends ControllerBase
{
  private $settings_glpi;
  private $client;
  private $service;
  private $serviceTest;
  private $lemonService;
  public function __construct()
  {
    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_glpi_pleiade')) {
      $this->settings_glpi = \Drupal::config('api_glpi_pleiade.settings');
    }
    $this->client = \Drupal::httpClient();
    $this->service = new GlpiService();
    $this->lemonService = new LemonService();
    $this->serviceTest = new TestService();
  }
  public function glpi_list_tickets(Request $request)
  {

 $return = $this->service->getGLPITickets();
    return $return;
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


   public function test1(Request $request)
  {

     $return = $this->service->getGLPITickets();
    return new JsonResponse(json_encode($return), 200, [], true);
  }
  public function test2(Request $request)
  {

    $return = $this->serviceTest->test();
    return $return;
  }

  public function test3(Request $request)
  {

     $return = $this->service->test();
    return new JsonResponse(json_encode($return), 200, [], true);
  }

  public function test4(Request $request)
  {

     $return = $this->serviceTest->test4();
    return $return;
  }
}
