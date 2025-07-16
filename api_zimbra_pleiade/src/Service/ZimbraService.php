<?php

namespace Drupal\api_zimbra_pleiade\Service;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Exception\RequestException;

class ZimbraService implements ZimbraServiceInterface
{

    protected $settings_zimbra;
    private $client;
    public function __construct()
    {
        $moduleHandler = \Drupal::service('module_handler');
        $this->settings_zimbra = $moduleHandler->moduleExists('api_zimbra_pleiade') ? \Drupal::config('api_zimbra_pleiade.settings') : NULL;

        $this->client = \Drupal::httpClient();
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

    public function curlGet($endpoint, $inputs, $api, $application, $email = '', $token = '', $domain = '')
    {
        $data = $this->executeCurl($endpoint, "GET", $inputs, $api, $application, $email, $token, $domain);
       
        return $data; 
    }

    public function executeCurl($endpoint, $method, $inputs, $api, $application, $zimbra_mail, $zimbra_token, $zimbra_domain)
    {
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
    }
}
