<?php

namespace Drupal\module_api_pleiade;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Drupal\user\Entity\User;
use Exception;

/**
 * API Manager for Pleiade integrations.
 */
class ApiPleiadeManager
{

  protected $settings_lemon;
  protected $settings_pastell;
  protected $settings_parapheur;
  protected $settings_nextcloud;
  protected $settings_humhub;
  protected $settings_glpi;
  protected $settings_zimbra;
  protected $settings_watcha;

  /** @var \GuzzleHttp\ClientInterface */
  public $client;

  /**
   * ApiPleiadeManager constructor.
   */
  public function __construct()
  {
    $this->client = \Drupal::httpClient();
    $moduleHandler = \Drupal::service('module_handler');

    $this->settings_lemon = $moduleHandler->moduleExists('api_lemon_pleiade') ? \Drupal::config('api_lemon_pleiade.settings') : NULL;
    $this->settings_pastell = $moduleHandler->moduleExists('api_pastell_pleiade') ? \Drupal::config('api_pastell_pleiade.settings') : NULL;
    $this->settings_parapheur = $moduleHandler->moduleExists('api_parapheur_pleiade') ? \Drupal::config('api_parapheur_pleiade.settings') : NULL;
    $this->settings_nextcloud = $moduleHandler->moduleExists('api_nextcloud_pleiade') ? \Drupal::config('api_nextcloud_pleiade.settings') : NULL;
    $this->settings_humhub = $moduleHandler->moduleExists('api_humhub_pleiade') ? \Drupal::config('api_humhub_pleiade.settings') : NULL;
    $this->settings_glpi = $moduleHandler->moduleExists('api_glpi_pleiade') ? \Drupal::config('api_glpi_pleiade.settings') : NULL;
    $this->settings_zimbra = $moduleHandler->moduleExists('api_zimbra_pleiade') ? \Drupal::config('api_zimbra_pleiade.settings') : NULL;
    $this->settings_watcha = $moduleHandler->moduleExists('api_watcha_pleiade') ? \Drupal::config('api_watcha_pleiade.settings') : NULL;
  }

  /**
   * Do CURL request with authorization.
   *
   * @param string $endpoint
   *   A request action of api.
   * @param string $method
   *   A method of curl request.
   * @param Array $inputs
   *   A data of curl request.
   *
   * @return array
   *   An associate array with respond data.
   */
  private function executeCurl($endpoint, $method, $inputs, $api, $application, $zimbra_mail, $zimbra_token, $zimbra_domain)
  {
    if ($application == 'lemon') {
      \Drupal::logger('api_lemon_pleiade')->info('Cookie Lemon: @cookie', ['@cookie' => $_COOKIE['lemonldap']]);
      $url = $api . "/" . $endpoint;
      \Drupal::logger('api_lemon_pleiade')->info('LEMON_API_URL: @api', ['@api' => $url]);
      $options = [
        'headers' => [
          'Content-Type' => 'application/json',
          'Cookie' => 'llnglanguage=fr; lemonldap=' . $_COOKIE['lemonldap']
        ],
      ];
      if (!empty($inputs)) {
        \Drupal::logger('api_lemon_pleiade')->info('Inputs dans la requête: @inp', ['@inp' => $inputs]);
        if ($method == 'GET') {
          $url .= '?' . self::arrayKeyfirst($inputs) . '=' . array_shift($inputs);
          foreach ($inputs as $param => $value) {
            $url .= '&' . $param . '=' . $value;
          }
        } else {
          $options['body'] = $inputs;
        }
      }
      try {
        $response = $this->client->request($method, $url, $options);
        return Json::decode($response->getBody());
      } catch (RequestException $e) {
        \Drupal::logger('api_lemon_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
        return Json::decode('0');
      }
    } elseif ($application == 'pastell') {
      $authMethod = $this->settings_pastell->get('field_pastell_auth_method');
      $url = ($authMethod == 'cas' || $authMethod == 'oidc') ? $api . '?auth=cas' : $api;
      $proxy_ticket = \Drupal::service('cas.proxy_helper')->getProxyTicket($url);
      \Drupal::logger('api_pastell_pleiade')->debug('PT: ' . $proxy_ticket);
      $url .= '&ticket=' . $proxy_ticket;
      $options = [
        'headers' => [
          'Content-Type' => 'multipart/form-data',
          'Cookie' => 'lemonldap=' . $_COOKIE['lemonldap'],
        ],
      ];
      if (!empty($inputs)) {
        if ($method == 'GET') {
          $url .= '?' . self::arrayKeyfirst($inputs) . '=' . array_shift($inputs);
          foreach ($inputs as $param => $value) {
            $url .= '&' . $param . '=' . $value;
          }
        } else {
          $url = $api . '&' . self::arrayKeyfirst($inputs) . '=' . array_shift($inputs);
          foreach ($inputs as $param => $value) {
            $url .= '&' . $param . '=' . $value;
          }
          $options['auth'] = [
            $this->settings_pastell->get('field_pastell_username_doc_lots'),
            $this->settings_pastell->get('field_pastell_password_doc_lots')
          ];
        }
      }
      \Drupal::logger('api_pastell_pleiade')->debug('requête incoming: ' . $url);

      try {
        $response = $this->client->request($method, $url, $options);
        return Json::decode($response->getBody()->getContents());
      } catch (RequestException $e) {
        \Drupal::logger('api_pastell_pleiade')->debug('Curl error: @error', ['@error' => $e->getMessage()]);
      }
    } elseif ($application == 'parapheur') {
      $client = new Client();
      try {
        $authUrl = 'https://portail.sitiv.fr/oauth2/authorize';
        $params = [
          'response_type' => 'code',
          'client_id' => 'parapheurv5-openid',
          'scope' => 'openid',
          'redirect_uri' => 'https://parapheurv5.sitiv.fr/auth/realms/api/broker/oidc/endpoint'
        ];
        $response = $client->request('GET', $authUrl, [
          'query' => $params,
          'headers' => ['Cookie' => 'lemonldap=' . $_COOKIE['lemonldap']],
          'allow_redirects' => false
        ]);
        $location = $response->getHeaders()['Location'][0];
        parse_str(parse_url($location, PHP_URL_QUERY), $queryParams);
        $code = $queryParams['code'];
        $tokenUrl = 'https://portail.sitiv.fr/oauth2/token';
        $redirectUri = $params['redirect_uri'];
        $response = $client->request('POST', $tokenUrl, [
          'auth' => ['parapheurv5-openid', 'parapheur-sitiv'],
          'form_params' => [
            'grant_type' => 'authorization_code',
            'redirect_uri' => $redirectUri,
            'code' => $code
          ]
        ]);
        $data = json_decode($response->getBody(), true);
        $accessToken = $data['access_token'];
        $exchangeUrl = 'https://parapheurv5.sitiv.fr/auth/realms/api/protocol/openid-connect/token';
        $response = $client->request('POST', $exchangeUrl, [
          'form_params' => [
            'client_id' => 'ipcore-web',
            'grant_type' => 'urn:ietf:params:oauth:grant-type:token-exchange',
            'requested_token_type' => 'urn:ietf:params:oauth:token-type:refresh_token',
            'subject_token_type' => 'urn:ietf:params:oauth:token-type:access_token',
            'subject_token' => $accessToken,
            'subject_issuer' => 'oidc'
          ]
        ]);
        $data = json_decode($response->getBody(), true);
        $accessToken = $data['access_token'];
        $apiUrl = 'https://parapheurv5.sitiv.fr/api/standard/v1/tenant';
        $response = $client->request('GET', $apiUrl, [
          'headers' => [
            'accept' => 'application/json',
            'Authorization' => 'Bearer ' . $accessToken
          ]
        ]);
        $apiData = json_decode($response->getBody(), true);
        $apiUrldesk = 'https://parapheurv5.sitiv.fr/api/standard/v1/tenant/' . $apiData["content"][0]["id"] . '/desk';
        $responsedesk = $client->request('GET', $apiUrldesk, [
          'headers' => [
            'accept' => 'application/json',
            'Authorization' => 'Bearer ' . $accessToken
          ]
        ]);
        $apiDatadesk = json_decode($responsedesk->getBody(), true);
        $allDeskFolders = [];
        if (isset($apiDatadesk['content']) && is_array($apiDatadesk['content'])) {
          foreach ($apiDatadesk['content'] as $item) {
            foreach (['/pending', '/delegated'] as $endpoint) {
              $apiUrldeskFolder = 'https://parapheurv5.sitiv.fr/api/standard/v1/tenant/' . $apiData["content"][0]["id"] . '/desk/' . $item["id"] . $endpoint . '?size=50';
              $responsedeskFolder = $client->request('GET', $apiUrldeskFolder, [
                'headers' => [
                  'accept' => 'application/json',
                  'Authorization' => 'Bearer ' . $accessToken
                ]
              ]);
              $apiDatadeskFolder = json_decode($responsedeskFolder->getBody(), true);
              if (isset($apiDatadeskFolder["content"]) && is_array($apiDatadeskFolder["content"])) {
                $apiDatadeskFolder["content"] = array_map(function ($deskFolder) use ($apiData) {
                  $deskFolder['tenant_id'] = $apiData["content"][0]["id"];
                  return $deskFolder;
                }, $apiDatadeskFolder["content"]);
                $allDeskFolders = array_merge($allDeskFolders, $apiDatadeskFolder["content"]);
              }
            }
          }
        }
        return $allDeskFolders;
      } catch (RequestException $e) {
        echo "Erreur : " . $e->getMessage();
        if ($e->hasResponse()) {
          echo "\n" . $e->getResponse()->getBody();
        }
      }
    } elseif ($application == 'zimbra') {
      $sessionCookieValue = $_COOKIE['lemonldap'];
      $value1 = $zimbra_mail;
      $value2 = 'name';
      $value3 = '0';
      $value4 = time() * 1000;
      $key = $zimbra_token;
      $data = $value1 . "|" . $value2 . "|" . $value3 . "|" . $value4;
      $hmac = hash_hmac('sha1', $data, $key);
      $preauthURL = $zimbra_domain . "service/preauth?account=" . $value1 . "&timestamp=" . $value4 . "&expires=0&preauth=" . $hmac;
      \Drupal::logger('api_zimbra_pleiade')->info($preauthURL);
      ob_start();
      try {
        $clientRequest = $this->client->request('GET', $preauthURL, [
          'headers' => [
            'Content-Type' => 'application/json',
            'Cookie' => 'lemonldap=' . $sessionCookieValue,
          ],
          'debug' => true,
          'allow_redirects' => false,
        ]);
        $responseToken = $clientRequest->getBody()->getContents();
        $debugInfo = ob_get_clean();
      } catch (RequestException $e) {
        \Drupal::logger('api_zimbra_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
      }
      $pattern = '/Set-Cookie: ZM_AUTH_TOKEN=([^;]+)/';
      if (preg_match($pattern, $debugInfo, $matches)) {
        $zmAuthToken = $matches[1];
        $apiEndpoint = $zimbra_domain . 'service/soap';
        $requestXml = '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                <soap:Header>
                    <context xmlns="urn:zimbra">
                        <format type="js"/>
                        <authToken>' . $zmAuthToken . '</authToken>
                    </context>
                </soap:Header>
                <soap:Body>' . $endpoint . '</soap:Body>
            </soap:Envelope>';
        try {
          $clientRequest = $this->client->request('POST', $apiEndpoint, [
            'headers' => [
              'Content-Type' => 'application/soap+xml',
              'Cookie' => 'lemonldap=' . $sessionCookieValue,
            ],
            'body' => $requestXml,
          ]);
          $responseSecond = $clientRequest->getBody()->getContents();
        } catch (RequestException $e) {
          \Drupal::logger('api_zimbra_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
        }
        $responseJson[] = Json::decode($responseSecond);
        if (strpos($endpoint, 'types="appointment"') !== false) {
          foreach ($responseJson[0]['Body']['SearchResponse']['appt'] as &$appointment) {
            if (isset($appointment['recur']) && $appointment['recur'] == 1) {
              $id_appointment = $appointment['id'];
              $ApptApiEndpoint = $zimbra_domain . 'service/soap';
              $ApptRequestXml = '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                            <soap:Header>
                                <context xmlns="urn:zimbra">
                                    <format type="js"/>
                                    <authToken>' . $zmAuthToken . '</authToken>
                                </context>
                            </soap:Header>
                            <soap:Body><GetAppointmentRequest xmlns="urn:zimbraMail" id="' . $id_appointment . '" sync="1"/></soap:Body>
                        </soap:Envelope>';
              try {
                $clientRequest = $this->client->request('POST', $ApptApiEndpoint, [
                  'headers' => [
                    'Content-Type' => 'application/soap+xml',
                    'Cookie' => 'lemonldap=' . $sessionCookieValue,
                  ],
                  'body' => $ApptRequestXml,
                ]);
                $responseAppt = $clientRequest->getBody()->getContents();
              } catch (RequestException $e) {
                \Drupal::logger('api_zimbra_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
              }
              $responseApptJson = Json::decode($responseAppt);
              $recur_detail = $responseApptJson["Body"]["GetAppointmentResponse"]["appt"][0]['inv'][0]['comp'][0]['recur'];
              $appointment['recur'] = $recur_detail;
            }
          }
        }
      }
      return ($responseJson);
    } elseif ($application == 'glpi') {
      $url_api_glpi = $api;
      $glpi_url = $this->settings_glpi->get('glpi_url');
      $app_token = $this->settings_glpi->get('app_token');
      $current_user = \Drupal::currentUser();
      $user = User::load($current_user->id());
      $sessionCookieValue = $_COOKIE['lemonldap'];
      if ($user) {
        $glpi_user_token = $user->get('field_glpi_user_token')->value;
        if (!$glpi_user_token) {
          \Drupal::logger('api_glpi_pleiade')->alert("User token manquant");
          return;
        }
      }
      $url1 = $glpi_url . '/apirest.php/initSession?app_token=' . $app_token . '&user_token=' . $glpi_user_token;
      try {
        $clientRequest = $this->client->request('POST', $url1, [
          'headers' => [
            'Content-Type' => 'text/plain',
            'Cookie' => 'lemonldap=' . $sessionCookieValue,
          ],
        ]);
        $response1 = $clientRequest->getBody()->getContents();
      } catch (RequestException $e) {
        \Drupal::logger('api_glpi_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
      }
      $data = json_decode($response1);
      $sessionToken = $data->session_token;
      if (substr($url_api_glpi, -7) === "/Ticket") {
        $url = $url_api_glpi . '?app_token=' . $app_token . '&session_token=' . $sessionToken . '&expand_dropdown=true&sort=status' . ($inputs ? '&' . $inputs : '');
      } else {
        $url = $url_api_glpi . '?app_token=' . $app_token . '&session_token=' . $sessionToken . '&expand_dropdowns=true';
      }
      try {
        $clientRequest = $this->client->request('GET', $url, [
          'headers' => [
            'Content-Type' => 'text/plain',
            'Cookie' => 'lemonldap=' . $sessionCookieValue,
          ],
        ]);
        $response = $clientRequest->getBody()->getContents();
      } catch (RequestException $e) {
        \Drupal::logger('api_glpi_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
      }
     
      return Json::decode($response);
    } elseif ($application == 'humhub') {
      try {
        $response = $this->client->request($method, $api, [
          'headers' => [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $inputs["token"]
          ],
          'verify' => false,
          'timeout' => 60
        ]);
        return Json::decode($response->getBody()->getContents());
      } catch (Exception $e) {
        return Json::decode($e->getMessage());
      }
    } elseif ($application == 'nextcloud') {
      $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
      $nc_key = $user->get('field_nextcloud_api_key')->value ?? null;
      $displayName = $user->get('field_nextcloud_api_user')->value ?? $user->getDisplayName();
      if ($nc_key && $displayName) {
        $token_authent = base64_encode($displayName . ':' . $nc_key);
        $headers = [
          'OCS-APIRequest: true',
          'Authorization: Basic ' . $token_authent
        ];
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $api);
        curl_setopt($ch, CURLOPT_HTTPGET, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        //curl_setopt($ch, CURLOPT_PROXY,"http://192.168.76.3:3128");
      
        $response = curl_exec($ch);
        $response = json_decode($response);
        if (curl_errno($ch)) {
          echo 'Error: ' . curl_error($ch);
        }
                   \Drupal::logger('nextcloud')->error("curl time  ::  ". curl_getinfo($ch,CURLINFO_TOTAL_TIME));

        curl_close($ch);
        return $response;
      }
    }
  }




  // --- API Wrappers ---

  public function curlGet($endpoint, $inputs, $api, $application, $email = '', $token = '', $domain = '')
  {
    return $this->executeCurl($endpoint, "GET", $inputs, $api, $application, $email, $token, $domain);
  }

  public function curlPost($endpoint, $inputs, $api, $application)
  {
    return $this->executeCurl($endpoint, "POST", $inputs, $api, $application);
  }

  // --- Application-specific methods ---

  public function searchMyApps()
  {
    $endpoint = $this->settings_lemon->get('field_lemon_myapps_url');
    return $this->curlGet($endpoint, [], $this->settings_lemon->get('field_lemon_url'), 'lemon');
  }

  public function searchMySession()
  {
    $endpoint = $this->settings_lemon->get('field_lemon_sessioninfo_url');
    return $this->curlGet($endpoint, [], $this->settings_lemon->get('field_lemon_url'), 'lemon');
  }

  public function searchMyDocs($id_e)
  {
    $url = $this->settings_pastell->get('field_pastell_url') .
      $this->settings_pastell->get('field_pastell_documents_url') . $id_e .
      '&limit=' . $this->settings_pastell->get('field_pastell_limit_documents');

    return $this->curlGet('', [], $url, 'pastell');
  }

  public function searchMyEntities()
  {
    $url = $this->settings_pastell->get('field_pastell_url') .
      $this->settings_pastell->get('field_pastell_entities_url');
    return $this->curlGet('', [], $url, 'pastell');
  }

  public function searchMyFlux()
  {
    $url = $this->settings_pastell->get('field_pastell_url') .
      $this->settings_pastell->get('field_pastell_flux_url');
    return $this->curlGet('', [], $url, 'pastell');
  }

  public function creationDoc($id_e)
  {
    $url = $this->settings_pastell->get('field_pastell_url') .
      "api/create-document.php&id_e=$id_e&type=document-a-signer";
    return $this->curlGet('', [], $url, 'pastell');
  }

  public function getSousTypeDoc($data)
  {
    $url = $this->settings_pastell->get('field_pastell_url') . "api/external-data.php";
    return $this->curlPost('', $data, $url, 'pastell');
  }

  public function postModifDoc($data)
  {
    $url = $this->settings_pastell->get('field_pastell_url') . "/api/modif-document.php";
    return $this->curlPost('', $data, $url, 'pastell');
  }

  public function searchMyDesktop()
  {
    $url = $this->settings_parapheur->get('field_parapheur_url') .
      $this->settings_parapheur->get('field_parapheur_bureaux_url');
    return $this->curlGet('', [], $url, 'parapheur');
  }


  public function searchMyMails($mail_endpoint, $email, $token, $domain)
  {
    return $this->curlGet($mail_endpoint, [], $this->settings_zimbra->get('field_zimbra_url'), 'zimbra', $email, $token, $domain);
  }

  public function searchMyTasks($tasks_endpoint, $email, $token, $domain)
  {
    if ($this->settings_zimbra->get('field_zimbra_for_demo')) {
      return $this->curlGet('', [], 'https://pleiadedev.ecollectivites.fr/sites/default/files/datasets/js/calendar.json', 'zimbra');
    }
    $url = $this->settings_zimbra->get('field_zimbra_url') . $this->settings_zimbra->get('field_zimbra_tasks');
    return $this->curlGet($tasks_endpoint, [], $url, 'zimbra', $email, $token, $domain);
  }

  public function getNextcloudNotifs()
  {
    $endpoint = $this->settings_nextcloud->get('nextcloud_endpoint_notifs');
    $url = $this->settings_nextcloud->get('nextcloud_url') . $endpoint . '?format=json';
    return $this->curlGet('', [], $url, 'nextcloud');
  }

  public function getGLPITickets()
  {
    $endpoint = $this->settings_glpi->get('endpoint_ticket');
    $url = $this->settings_glpi->get('glpi_url') . '/apirest.php/' . $endpoint;
    return $this->curlGet('', [], $url, 'glpi');
  }

  public function getStatutActorGLPI($id)
  {
    $url = $this->settings_glpi->get('glpi_url') . '/apirest.php/Ticket/' . $id . '/Ticket_User';
    return $this->curlGet('', [], $url, 'glpi');
  }

 

  /**
   * Polyfill for array_key_first for PHP < 7.3.
   */
  public static function arrayKeyfirst($array)
  {
    if (function_exists('array_key_first')) {
      return array_key_first($array);
    }
    foreach ($array as $key => $unused) {
      return $key;
    }
    return NULL;
  }
}
