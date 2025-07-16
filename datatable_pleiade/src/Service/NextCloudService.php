<?php

namespace Drupal\datatable_pleiade\Service;


class NextCloudService
{

    protected $settings_nextcloud;
    public function __construct()
    {
        $moduleHandler = \Drupal::service('module_handler');
        $this->settings_nextcloud = $moduleHandler->moduleExists('api_nextcloud_pleiade') ? \Drupal::config('api_nextcloud_pleiade.settings') : NULL;
    }


    public function getNextcloudNotifs()
    {
        $endpoint = $this->settings_nextcloud->get('nextcloud_endpoint_notifs');
        $url = $this->settings_nextcloud->get('nextcloud_url') . $endpoint . '?format=json';
        return $this->executeCurl($url);
    }

    private function executeCurl($api)
    {
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

            $response = curl_exec($ch);
            $response = json_decode($response);
            if (curl_errno($ch)) {
                echo 'Error: ' . curl_error($ch);
            }
            \Drupal::logger('nextcloud')->error("curl time  ::  " . curl_getinfo($ch, CURLINFO_TOTAL_TIME));

            curl_close($ch);
            return $response;
        }
    }
}
