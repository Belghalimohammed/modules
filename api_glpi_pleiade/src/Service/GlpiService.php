<?php

namespace Drupal\api_glpi_pleiade\Service;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Drupal\user\Entity\User;
use GuzzleHttp\Cookie\CookieJar;
use GuzzleHttp\TransferStats;
use Symfony\Component\HttpFoundation\JsonResponse;

class GlpiService
{

    protected $settings_glpi;
    protected $client;
    protected $glpi_url;
    protected $app_token;

    public function __construct()
    {
        $moduleHandler = \Drupal::service('module_handler');
        $this->settings_glpi = $moduleHandler->moduleExists('api_glpi_pleiade') ? \Drupal::config('api_glpi_pleiade.settings') : NULL;
        $this->client = new Client(['on_stats' => function (TransferStats $stats) {
            \Drupal::logger('api_glpi_pleiade')->error('time for :: ' . $stats->getEffectiveUri() . " is :: " . $stats->getTransferTime() . " seconds");
        }]);
        $this->glpi_url = $this->settings_glpi->get('glpi_url');
        $this->app_token = $this->settings_glpi->get('app_token');
    }

    function findIdByPrefix(array $items, string $prefix): ?int
    {
        foreach ($items as $key => $item) {
            if (str_starts_with(strtolower($item["name"]), $prefix)) {
                return $key;
            }
        }
        return null;
    }

    public function getGLPITickets()
    {
        $sessionToken = $this->initGlpiSession();
        if (!$sessionToken) {
            return new JsonResponse(['error' => 'Failed to initialize GLPI session.'], 500);
        }

        $url = $this->buildSessionUrl($sessionToken);
        $fullSession = $this->sendGlpiGetRequest($url);

        $priorityOrder = ['super', 'technicien', 'self'];
        $id = null;

        foreach ($priorityOrder as $keyword) {
            $id = $this->findIdByPrefix($fullSession["session"]["glpiprofiles"], $keyword);
            if ($id !== null) {
                break;
            }
        }
        if (!$fullSession) {
            return new JsonResponse(['error' => 'Failed to retrieve session from GLPI.'], 500);
        }

        $data = array_keys($fullSession['session']['glpiprofiles']);

        $currentUserId = $fullSession['session']['glpiID'];
        $groups = $fullSession['session']['glpigroups'];

        $url = $this->buildChangeActiveProfileUrl($sessionToken);
        $tmp = $this->sendGlpiGetRequestPayload($url, $id);

        try {
            $groupsResult = $this->getCurrentGlpiGroups($sessionToken, $currentUserId);
            $groupsName = $groupsResult["data"];

            $filtered = array_filter($groupsName, function ($group) use ($groups) {
                return in_array($group['2'], $groups);
            });

            $myGroups = [];
            foreach ($filtered as $group) {
                $myGroups[$group['2']] = $group['1'];
            }
        } catch (\Throwable $th) {
            $myGroups = null;
        }

        $data = $this->getCombinedUserAndGroupTickets($sessionToken, $currentUserId, $myGroups);

        $this->killGlpiSession($sessionToken);

        return new JsonResponse($data);
    }

    private function getCurrentGlpiGroups($sessionToken, $currentUserId)
    {

        $request_params = [
            'forcedisplay' => ['1', '2'],

        ];

        $url = $this->glpi_url . '/apirest.php/search/Group?' . http_build_query($request_params) . '&session_token=' . $sessionToken . '&app_token=' . $this->app_token;

        $groups = $this->sendGlpiGetRequest($url);
        return $groups ?? null;
    }
    public function getCombinedUserAndGroupTickets(string $sessionToken, int $currentUserId, $myGroups): array
    {
        try {
            $url = $this->buildCombinedTicketUrl($sessionToken, $currentUserId, $myGroups);

            $rawTicketData = $this->sendGlpiGetRequest($url);

            if (!$rawTicketData || !isset($rawTicketData['data'])) {
                return [$url];
            }

            return $this->processCombinedTickets($rawTicketData['data'], $currentUserId, $myGroups);
        } catch (\Throwable $th) {
            return [];
        }
    }

    private function buildCombinedTicketUrl(string $sessionToken, int $currentUserId, $myGroups): string
    {
        $groupIds = $myGroups != null ? array_keys($myGroups) : [];

        $userAndGroupCriteria = [];

        $userFields = ['4', '5', '66'];
        if ($myGroups != null) {
            foreach ($userFields as $field) {
                $userAndGroupCriteria[] = ['field' => $field, 'searchtype' => 'equals', 'value' => $currentUserId, 'link' => 'OR'];
            }
        }

        $groupFields = ['8', '71', '65'];
        if (!empty($groupIds)) {
            foreach ($groupFields as $field) {
                foreach ($groupIds as $groupId) {
                    $userAndGroupCriteria[] = ['field' => $field, 'searchtype' => 'equals', 'value' => $groupId, 'link' => 'OR'];
                }
            }
        }

        if (!empty($userAndGroupCriteria)) {
            unset($userAndGroupCriteria[count($userAndGroupCriteria) - 1]['link']);
        }

        $statusCriteria = [
            ['link' => 'OR', 'field' => 12, 'searchtype' => 'equals', 'value' => '1'], 
            ['link' => 'OR', 'field' => 12, 'searchtype' => 'equals', 'value' => '2'], 
            ['link' => 'OR', 'field' => 12, 'searchtype' => 'equals', 'value' => '3'], 
            ['link' => 'OR', 'field' => 12, 'searchtype' => 'equals', 'value' => '4'], 
        ];
        unset($statusCriteria[0]['link']);
        $criteria = [];
        if (!empty($userAndGroupCriteria)) {
            $criteria[] = ['link'     => 'AND', 'criteria' => $userAndGroupCriteria];
        }

        $criteria[] = [
            'link'     => 'AND',
            'criteria' => $statusCriteria
        ];

        $request_params = [
            'range' => '0-999',
            'sort'  => '19',
            'order' => 'DESC',
            'forcedisplay' => ['1', '2', '3', '4', '5', '8', '10', '12', '15', '19', '65', '66', '71'],
            'criteria' => $criteria
        ];

        if (!empty($userAndGroupCriteria)) {
            unset($request_params['criteria'][0]['link']);
        }

        return $this->glpi_url . '/apirest.php/search/Ticket?' . http_build_query($request_params)
            . '&app_token=' . $this->app_token . '&session_token=' . $sessionToken;
    }

    private function isAssociated($ticketFieldValue, $idsToMatch): bool
    {
        if (!isset($ticketFieldValue)) {
            return false;
        }

        if (is_array($ticketFieldValue)) {
            if (is_array($idsToMatch)) {
                return !empty(array_intersect($ticketFieldValue, $idsToMatch));
            } else {
                return in_array($idsToMatch, $ticketFieldValue);
            }
        } else {
            if (is_array($idsToMatch)) {
                return in_array($ticketFieldValue, $idsToMatch);
            } else {
                return $ticketFieldValue == $idsToMatch;
            }
        }
    }

    private function processCombinedTickets(array $ticketsData, int $currentUserId, $myGroups): array
    {
        $statusMap = [1 => "Nouveau", 2 => "En cours (attribué)", 3 => "En cours (planifié)", 4 => "En attente"];
        $urgencyMap = [2 => 'Basse', 3 => 'Moyenne', 4 => "Haute"];
        $priorityMap = [2 => 'Basse', 3 => 'Moyenne', 4 => "Haute", 5 => "Très Haute", 6 => "Majeure"];

        $groupIds = $myGroups != null ?  array_values($myGroups) : [];
        $processedTickets = [];

        foreach ($ticketsData as $ticket) {
            $userRoles = [];
            if ($this->isAssociated($ticket['4'] ?? null, $currentUserId)) $userRoles[] = 'Demandeur';
            if ($this->isAssociated($ticket['5'] ?? null, $currentUserId)) $userRoles[] = 'Responsable';
            if ($this->isAssociated($ticket['66'] ?? null, $currentUserId)) $userRoles[] = 'Observateur';

            if (!empty($groupIds)) {
                if ($this->isAssociated($ticket['71'] ?? null, $groupIds)) $userRoles[] = '(Groupe) Demandeur';
                if ($this->isAssociated($ticket['8'] ?? null, $groupIds)) $userRoles[] = '(Groupe) Responsable';
                if ($this->isAssociated($ticket['65'] ?? null, $groupIds)) $userRoles[] = '(Groupe) Observateur';
            }

            if (empty($userRoles)) {
                continue;
            }

            $processedTickets[] = [
                'id'                     => $ticket['2'] ?? 'N/A',
                'name'                   => $ticket['1'] ?? 'N/A',
                'status'                 => $statusMap[$ticket['12']] ?? 'Inconnu',
                'start_date'             => $ticket['15'] ?? null,
                'last_modification_date' => $ticket['19'] ?? null,
                'urgency'                => $urgencyMap[$ticket['10']] ?? 'Inconnu',
                'priority'               => $priorityMap[$ticket['3']] ?? 'Inconnu',
                'roles'                  => implode(', ', array_unique($userRoles))
            ];
        }

        return $processedTickets;
    }

    private function buildSessionUrl($sessionToken)
    {
        $request_params = [
            'range' => '0-999',
            'sort'  => 1,
            'order' => 'DESC'

        ];

        return $this->glpi_url . '/apirest.php/getFullSession?' . http_build_query($request_params)
            . '&app_token=' . $this->app_token . '&session_token=' . $sessionToken;
    }

    private function buildChangeActiveProfileUrl($sessionToken)
    {
        return $this->glpi_url . '/apirest.php/changeActiveProfile'
            . '?app_token=' . $this->app_token
            . '&session_token=' . $sessionToken;
    }

    private function sendGlpiGetRequestPayload($url, $profile)
    {
        $sessionCookieValue = $_COOKIE['lemonldap'] ?? '';

        try {
            $clientRequest = $this->client->request('POST', $url, [
                'headers' => ['Content-Type' => 'application/json', 'Cookie' => 'lemonldap=' . $sessionCookieValue,],
                'json' => ['profiles_id' => $profile]
            ]);
            return Json::decode($clientRequest->getBody()->getContents());
        } catch (RequestException $e) {
            return null;
        }
    }

    private function initGlpiSession()
    {

        $user_token = $this->getOrCreateGlpiUserToken();
        $sessionCookieValue = $_COOKIE['lemonldap'] ?? '';

        if (!$user_token) return null;

        try {
            $url = $this->glpi_url . '/apirest.php/initSession?app_token=' . $this->app_token . '&user_token=' . $user_token;
            $clientRequest = $this->client->request('POST', $url, [
                'headers' => ['Content-Type' => 'text/plain', 'Cookie' => 'lemonldap=' . $sessionCookieValue,],
            ]);
            $data = json_decode($clientRequest->getBody()->getContents());
            return $data->session_token ?? null;
        } catch (RequestException $e) {
            return null;
        }
    }

    private function sendGlpiGetRequest($url)
    {
        $sessionCookieValue = $_COOKIE['lemonldap'] ?? '';

        try {
            $clientRequest = $this->client->request('GET', $url, [
                'headers' => ['Content-Type' => 'text/plain', 'Cookie' => 'lemonldap=' . $sessionCookieValue,],
            ]);
            return Json::decode($clientRequest->getBody()->getContents());
        } catch (RequestException $e) {
            return null;
        }
    }

    private function getOrCreateGlpiUserToken()
    {

        $current_user = \Drupal::currentUser();
        $user = User::load($current_user->id());
        $sessionCookieValue = $_COOKIE['lemonldap'] ?? '';

        if (!$user || !($glpi_user_token = $user->get('field_glpi_user_token')->value)) {
            $url = $this->glpi_url . '/getuserapitoken.php';
            $cookieName = 'lemonldap';
            $domain = parse_url($this->glpi_url, PHP_URL_HOST);

            $client = new Client();
            $cookieJar = CookieJar::fromArray([$cookieName => $sessionCookieValue], $domain);

            try {
                $response = $client->request('GET', $url, [
                    'cookies' => $cookieJar,
                    'http_errors' => false
                ]);
                $data = json_decode($response->getBody()->getContents());
                $glpi_user_token = $data->api_token ?? null;
                $user->set('field_glpi_user_token', $glpi_user_token);
                $user->save();
            } catch (RequestException $e) {
                return null;
            }
        }

        return $glpi_user_token;
    }

    private function killGlpiSession($sessionToken)
    {
        if (!$sessionToken) return;

        try {
            $url = $this->glpi_url . '/apirest.php/killSession?session_token=' . $sessionToken . '&app_token=' . $this->app_token;
            $this->client->request('GET', $url);
        } catch (RequestException $e) {
            
        }
    }
}
