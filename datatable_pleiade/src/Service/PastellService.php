<?php

namespace Drupal\datatable_pleiade\Service;

use GuzzleHttp\Client;
use Drupal\Component\Serialization\Json;
use GuzzleHttp\Exception\RequestException;

class PastellService
{

    protected $settings_pastell;
    private $client;
    public function __construct()
    {
        $moduleHandler = \Drupal::service('module_handler');
        $this->settings_pastell = $moduleHandler->moduleExists('api_pastell_pleiade') ? \Drupal::config('api_pastell_pleiade.settings') : NULL;
        $this->client = new Client();
    }


    public function searchMyDocs($id_e)
    {
        $url = $this->settings_pastell->get('field_pastell_url') .
            $this->settings_pastell->get('field_pastell_documents_url') . $id_e .
            '&limit=' . $this->settings_pastell->get('field_pastell_limit_documents');

        return $this->executeCurl("GET", [], $url);
    }

    public function searchMyFlux()
    {
        $url = $this->settings_pastell->get('field_pastell_url') .
            $this->settings_pastell->get('field_pastell_flux_url');
        return $this->executeCurl("GET", [], $url);
    }

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
    private function executeCurl($method, $inputs, $api)
    {

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
    }
}
