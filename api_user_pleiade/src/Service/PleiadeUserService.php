<?php

namespace Drupal\api_user_pleiade\Service;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;

class PleiadeUserService
{
    private $annuaireLogin;
    private $annuairePassword;
    private $annuaireUrl;
    private $user;
    private $config;
    public function __construct()
    {
        $this->config = \Drupal::config('api_user_pleiade.settings');
        $this->annuaireLogin =  $this->config->get("annuaire_login");
        $this->annuairePassword =  $this->config->get("annuaire_password");
        $this->annuaireUrl =  $this->config->get("annuaire_url");
        $user_storage =  \Drupal::entityTypeManager()->getStorage('user');
        $this->user = $user_storage->load(\Drupal::currentUser()->id());
    }

    function getAnnuaireInfos()
    {
        try {
            $client = new Client();
            $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
            $token =    $user->get("field_annuaireaccesstoken")->value;
            $dn =  $user->get("field_annuairedn")->value;

            $response = $client->get('https://annuaire.territoirenumeriqueouvert.org/rest.php/v1/objects/USER/' . $dn . '/user', [
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'Session-Token' => $token
                ]

            ]);


            $result = json_decode($response->getBody()->getContents(), true);
            return $result;
        } catch (ClientException $e) {
            if ($e->getCode() === 401) {
                $this->annuaire_auth_flow();
                return $this->getAnnuaireInfos();
            }
        }
    }

    function annuaire_auth_flow()
    {
        $this->getAnnuaireToken();
        $this->getAnnuaireDn();
    }
    function getAnnuaireToken()
    {
        try {
            $client = new Client();

            $response = $client->post($this->annuaireUrl . '/login', [
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    "user" => $this->annuaireLogin,
                    "password" => $this->annuairePassword
                ]

            ]);
            $token = json_decode($response->getBody()->getContents(), true);

            $this->user->set("field_annuaireaccesstoken", $token);
            $this->user->save();
        } catch (ClientException $e) {
            return null;
        }
    }

    function getAnnuaireDn()
    {
        if (!$this->user->get("field_annuairedn")->isEmpty() || $this->user->get("field_annuairedn")->value != null)
            return;
        try {

            $client = new Client();
            $userMail = \Drupal::request()->getSession()->get('cas_attributes')["mail"][0];
            $response = $client->get($this->annuaireUrl . '/objects/USER?filter=mail=' . $userMail, [
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'Session-Token' => $this->user->get("field_annuaireaccesstoken")->value
                ]

            ]);

            $result = json_decode($response->getBody()->getContents(), true);
            $dn = array_key_first($result);
            $this->user->set("field_annuairedn", $dn);
            $this->user->save();

            return $dn;
        } catch (ClientException $e) {
            return null;
        }
    }
}
