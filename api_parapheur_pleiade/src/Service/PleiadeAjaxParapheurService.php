<?php

namespace Drupal\api_parapheur_pleiade\Service;

use Drupal\user\Entity\User;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class PleiadeAjaxParapheurService
{
    private $user;
    private $settings_parapheur;
    private $client;
    public function __construct()
    {
        $current_user = \Drupal::currentUser();
        $this->user = \Drupal\user\Entity\User::load($current_user->id());
        $moduleHandler = \Drupal::service('module_handler');
        $this->settings_parapheur = $moduleHandler->moduleExists('api_parapheur_pleiade') ? \Drupal::config('api_parapheur_pleiade.settings') : NULL;
        $this->client = \Drupal::httpClient();
    }

    public function authFlow()
    {
        $client = new Client();

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
        $this->user->set("field_parapheuraccesstoken", $accessToken);
        $this->user->save();
    }

    public function searchMyDesktop()
    {
        $url = $this->settings_parapheur->get('field_parapheur_url') .
            $this->settings_parapheur->get('field_parapheur_bureaux_url');
        return $this->curlGet('', [], $url, 'parapheur');
    }

    public function test()
    {
        $client = new Client();
        try {
           
            $accessToken = $this->user->get("field_parapheuraccesstoken")->value;
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
    }
}
