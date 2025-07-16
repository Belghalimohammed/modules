<?php

namespace Drupal\api_glpi_pleiade\Service;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class LemonService
{

    protected $settings_lemon;
    protected $client;
    public function __construct()
    {
        $moduleHandler = \Drupal::service('module_handler');
        $this->settings_lemon = $moduleHandler->moduleExists('api_lemon_pleiade') ? \Drupal::config('api_lemon_pleiade.settings') : NULL;
        $this->client = new Client();
    }

    public function searchMySession()
    {
        $endpoint = $this->settings_lemon->get('field_lemon_sessioninfo_url');
        return $this->executeCurl($endpoint, "GET", [], $this->settings_lemon->get('field_lemon_url'));
    }

    private function executeCurl($endpoint, $method, $inputs, $api)
    {


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
}
