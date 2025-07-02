<?php

namespace Drupal\api_zimbra_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;
use Drupal\user\Entity\User;



class PleiadeAjaxZimbraController extends ControllerBase
{
  private $token;
  private $url;
  private $email;
  public function __construct()
  {
    $user = \Drupal\user\Entity\User::load(
      \Drupal::currentUser()->id()
    );
    $this->email = $user->getEmail();
    $collectivite = \Drupal::request()->getSession()->get('cas_attributes')["partner"][0];
    $array = \Drupal::keyValue("collectivities_store")->get('global', "does not exist");
    $this->token = $array[$collectivite]['token_zimbra'];
    $this->url = $array[$collectivite]['url_zimbra'];
  }
  public function zimbra_mails_query(Request $request)
  {

    if ($this->url != "") {
      $limit_mail = 500;
      $mail_endpoint = '<SearchRequest xmlns="urn:zimbraMail"  limit="' . $limit_mail . '"><query>is:unread inid:2</query></SearchRequest>';

      $return = []; // Variable to store Zimbra data
      $zimbradataApi = new ApiPleiadeManager();
      $return = $zimbradataApi->searchMyMails($mail_endpoint, $this->email, $this->token, $this->url);
      if ($return) {

        $userDomainData = $return[0] ?? null;
        return new JsonResponse(
          json_encode([
            "domainEntry" => $this->url,
            "userData" => $userDomainData,
          ]),
          200,
          [],
          true
        );
      } else {
        \Drupal::logger("zimbra_tasks_query")->error("Aucun retour API");
        return new JsonResponse(json_encode("0"), 200, [], true);
      }
    }
  }

  public function zimbra_tasks_query(Request $request)
  {
    
    /////////////VARIABLE GLOBALE TASKS ENDPOINT //////////////////
    $limit_tasks = 10000;
    $currentDateTime = new \DateTime();
    $limitEndTimeStamp = $currentDateTime->modify("+30 days")->getTimestamp() * 1000;
    $currentDateTime = new \DateTime();
    $limitStartTimeStamp = $currentDateTime->modify("-30 days")->getTimestamp() * 1000;
    $tasks_endpoint =
      '<SearchRequest xmlns="urn:zimbraMail" types="appointment" calExpandInstStart="' .
      $limitStartTimeStamp .
      '" calExpandInstEnd="' .
      $limitEndTimeStamp .
      '" limit="' .
      $limit_tasks .
      '" sortBy="idDesc"><query>inid:10</query></SearchRequest>';

  
    $settings_zimbra = \Drupal::config("api_zimbra_pleiade.settings");
    $tempstore = \Drupal::service("tempstore.private")->get("api_lemon_pleiade");
    $groupData = $tempstore->get("groups");

    if ($groupData !== null) {
      $groupDataArray = explode(",", str_replace(", ", ",", $groupData));
    }
    if (in_array($settings_zimbra->get("lemon_group"), $groupDataArray)) {
     
         $return = []; // Variable to store Zimbra data
          $zimbradataApi = new ApiPleiadeManager();
          $return = $zimbradataApi->searchMyTasks($tasks_endpoint, $this->email, $this->token, $this->url);

          if ($return) {
            $userDomainData = $return[0] ?? null;

            return new JsonResponse(
              json_encode([
                "domainEntry" => $this->url,
                "userData" => $userDomainData,
              ]),
              200,
              [],
              true
            );
          } else {
            \Drupal::logger("zimbra_tasks_query")->error("Aucun retour API");
            return new JsonResponse(json_encode("0"), 200, [], true);
          }

    
    } else {
      \Drupal::logger("zimbra_tasks_query")->error("Pas dans le groupe zimbra");
      return new JsonResponse(json_encode("0"), 200, [], true);
    }
  }

  public function get_full_calendar()
  {
    \Drupal::logger("zimbra_tasks_query")->info("page calendrier complet target");
    return [
      "#markup" => '
      <div class="d-flex justify-content-center">
        <div id="spinner-history" class="spinner-border text-primary" role="status">
        </div>
      </div>
      <div id="zimbra_full_calendar"></div>',
    ];
  }
}
