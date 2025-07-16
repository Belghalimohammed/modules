<?php

namespace Drupal\api_glpi_pleiade\Service;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Drupal\user\Entity\User;

class GlpiService
{

    protected $settings_glpi;
    protected $client;
    public function __construct()
    {
        $moduleHandler = \Drupal::service('module_handler');
    $this->settings_glpi = $moduleHandler->moduleExists('api_glpi_pleiade') ? \Drupal::config('api_glpi_pleiade.settings') : NULL;
     $this->client = new Client();
    }


   public function getGLPITickets()
  {
    $endpoint = $this->settings_glpi->get('endpoint_ticket');
    $url = $this->settings_glpi->get('glpi_url') . '/apirest.php/' . $endpoint;
    return $this->executeCurl([], $url);
  }

  public function getStatutActorGLPI($id)
  {
    $url = $this->settings_glpi->get('glpi_url') . '/apirest.php/Ticket/' . $id . '/Ticket_User';
    return $this->executeCurl([], $url);
  }

  
private function executeCurl($inputs, $api)
{
    // --- 1. PARAMÈTRES ET AUTHENTIFICATION (VOTRE CODE ORIGINAL, QUI FONCTIONNE) ---
    $url_api_glpi = $api;
    $glpi_url = $this->settings_glpi->get('glpi_url');
    $app_token = $this->settings_glpi->get('app_token');
    $current_user = \Drupal::currentUser();
    $user = User::load($current_user->id());
    $sessionCookieValue = $_COOKIE['lemonldap'] ?? '';

    if (!$user || !($glpi_user_token = $user->get('field_glpi_user_token')->value)) {
        \Drupal::logger('api_glpi_pleiade')->alert("Utilisateur ou Token GLPI manquant.");
        return null;
    }

    $sessionToken = null;
    try {
        $url1 = $glpi_url . '/apirest.php/initSession?app_token=' . $app_token . '&user_token=' . $glpi_user_token;
        $clientRequest = $this->client->request('POST', $url1, [
            'headers' => [
                'Content-Type' => 'text/plain',
                'Cookie' => 'lemonldap=' . $sessionCookieValue,
            ],
        ]);
        $response1 = $clientRequest->getBody()->getContents();
        $data = json_decode($response1);
        $sessionToken = $data->session_token ?? null;

        if (!$sessionToken) {
            \Drupal::logger('api_glpi_pleiade')->error("Impossible d'obtenir un session_token depuis initSession.");
            return null;
        }
    } catch (RequestException $e) {
        \Drupal::logger('api_glpi_pleiade')->error('Erreur Curl (initSession): @error', ['@error' => $e->getMessage()]);
        return null;
    }

    // --- 2. RÉCUPÉRATION DES DONNÉES (PARTIE MODIFIÉE) ---
    $response = null;
    if (substr($url_api_glpi, -7) === "/Ticket") {
        
        // On prépare les critères de recherche avec les BONS identifiants numériques.
        $search_parameters = [
            'criteria' => [
                [
                    'field'      => 84, // ID numérique pour "Supprimé"
                    'searchtype' => 'equals',
                    'value'      => '0'
                ],
                [
                    'link'       => 'OR',
                    'criteria'   => [
                        [
                            'field'      => 4, // ID numérique pour "Demandeur"
                            'searchtype' => 'equals',
                            'value'      => 'is_me'
                        ],
                        [
                            'field'      => 5, // ID numérique pour "Assigné à - Technicien"
                            'searchtype' => 'equals',
                            'value'      => 'is_me'
                        ]
                    ]
                ]
            ],
            'range'   => '0-999', // On récupère jusqu'à 1000 tickets.
            'sorted'  => 'status',
            'order'   => 'ASC',
            'expand_dropdowns' => true, // Similaire à votre 'expand_dropdown'
        ];

        // On transforme ce tableau en une chaîne pour l'URL.
        $search_query_string = http_build_query($search_parameters);

        // On assemble l'URL finale pour la recherche, en gardant votre méthode d'auth.
        $url = $glpi_url . '/apirest.php/Ticket'
               . '?app_token=' . $app_token
               . '&session_token=' . $sessionToken
               . '&' . $search_query_string;

    } else {
        // Comportement pour les autres endpoints (inchangé)
        $url = $url_api_glpi . '?app_token=' . $app_token . '&session_token=' . $sessionToken . '&expand_dropdowns=true';
    }

    try {
        // On exécute la requête GET sur l'URL finale (qui est maintenant une URL de recherche).
        $clientRequest = $this->client->request('GET', $url, [
            'headers' => [
                'Content-Type' => 'text/plain',
                'Cookie' => 'lemonldap=' . $sessionCookieValue,
            ],
        ]);
        $response_content = $clientRequest->getBody()->getContents();
        $response = Json::decode($response_content);
    } catch (RequestException $e) {
        \Drupal::logger('api_glpi_pleiade')->error('Erreur Curl (GET): @error', ['@error' => $e->getMessage()]);
    }
    
    // --- 3. FERMETURE DE SESSION (BONNE PRATIQUE) ---
    $this->killGlpiSession($glpi_url, $sessionToken, $app_token);

    return $response;
}


/**
 * Fonction d'aide pour tuer la session GLPI.
 */
private function killGlpiSession($glpi_url, $session_token, $app_token)
{
    if (!$session_token) return;
    try {
        $kill_url = $glpi_url . '/apirest.php/killSession?session_token=' . $session_token . '&app_token=' . $app_token;
        $this->client->request('GET', $kill_url);
    } catch (RequestException $e) {
        // Pas critique si cela échoue, on ne logue qu'en cas de besoin.
    }
}
}
