<?php

namespace Drupal\api_watcha_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Drupal\api_watcha_pleiade\Service\WatchaService;
use Drupal\Core\Database\Database;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Routing\TrustedRedirectResponse;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\user\Entity\User;

class PleiadeAjaxWatchaController extends ControllerBase
{

  protected $watchaService;
    protected $currentUser;
  public function __construct(WatchaService $watchaService,AccountProxyInterface $current_user)
  {
    $this->watchaService = $watchaService;
      $this->currentUser = $current_user;
  }

  public static function create(ContainerInterface $container)
  {
    return new static(
      $container->get('api_watcha_pleiade.watcha_service'),   $container->get('current_user')
    );
  }


   /**
   * GET: Return all notifications for current user.
   */
  public function getNotificationsDb(): JsonResponse {
    $uid = $this->currentUser->id();
    $connection = Database::getConnection();

    $result = $connection->select('matrix_notifications', 'm')
      ->fields('m')
      ->condition('uid', $uid)
      ->execute()
      ->fetchAllAssoc('room_id');

    return new JsonResponse($result);
  }

  /**
   * POST: Add or update a matrix notification.
   */
  public function addNotificationDb(Request $request): JsonResponse {
    $uid = $this->currentUser->id();
    $data = json_decode($request->getContent(), true);

    if (!isset($data['room_id'])) {
      return new JsonResponse(['error' => 'room_id is required.'], Response::HTTP_BAD_REQUEST);
    }

    // Safe defaults
    $fields = [
      'type' => $data['type'] ?? 'unread',
      'room_name' => $data['room_name'] ?? '',
      'unread' => $data['unread'] ?? 0,
      'sender' => $data['sender'] ?? '',
      'sender_id' => $data['sender_id'] ?? '',
      'avatar_url' => $data['avatar_url'] ?? '',
      'timestamp' => $data['timestamp'] ?? time() * 1000,
      'message' => $data['message'] ?? '',
      'room_id' => $data['room_id'],
      'uid' => $uid,
    ];

    Database::getConnection()
      ->merge('matrix_notifications')
      ->key(['uid' => $uid, 'room_id' => $fields['room_id']])
      ->fields($fields)
      ->execute();

    return new JsonResponse(['status' => 'success', 'saved' => $fields]);
  }

  
  public function watcha_auth_flow(Request $request)
  {
    $link = $this->watchaService->getAuthorizationLink();
    return new TrustedRedirectResponse($link);
  }

  public function watcha_auth(Request $request)
  {
    $code = $request->query->get('code');
    if (!$code) {
      return new Response("<h1>Missing code parameter.</h1>", 400);
    }

    $tokenData = $this->watchaService->exchangeCodeForToken($code);
    if (empty($tokenData['access_token'])) {
      return new Response("<h1>Token error</h1><pre>" . json_encode($tokenData, JSON_PRETTY_PRINT) . "</pre>", 500);
    }

    $redirectUrl = $this->watchaService->getSynapseRedirectUrl();
    return new TrustedRedirectResponse($redirectUrl);
  }

  public function watcha_synapse_callback(Request $request)
  {
    $loginToken = $request->query->get('loginToken');
    if (!$loginToken) {
      return new Response("Erreur : loginToken manquant", 400);
    }

    $responseData = $this->watchaService->handleSynapseCallback($loginToken);
    if (isset($responseData['access_token'])) {
      return new RedirectResponse("/");
    }

    return new Response("<h1>" . print_r($responseData, true) . "</h1>");
  }

  public function getConfig(Request $request)
  {
    try {
      $data = $this->watchaService->getConfigData();
      return new JsonResponse(['data' => $data], 200);
    } catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 401);
    }
  }

  public function getNotifications(Request $request)
  {

    try {
     
        $notifications = $this->watchaService->getNotifications($request->get("user"));
      

      return new JsonResponse(['data'=>$notifications], 200);
    } catch (\Exception $e) {
      return new JsonResponse(['errorobj' => $e], 401);
    }
  }

  public function test1(Request $request)
  {
    $notifications = $this->watchaService->test1();

    return new JsonResponse($notifications, 200);
  }

  public function test2(Request $request)
  {
    $notifications = $this->watchaService->test2();

    return new JsonResponse($notifications, 200);
  }
  public function watcha_test(Request $request)
  {
    $this->user = User::load(\Drupal::currentUser()->id());
    echo $this->user->get('field_watchaaccesstoken')->value;
    exit;
    //  $user_storage =  \Drupal::entityTypeManager()->getStorage('user');
    // $this->user = $user_storage->load(\Drupal::currentUser()->id());
    //   return new JsonResponse([
    //   "isWatchaActivated" => $this->user->get("field_iswatchaactivated")->value,
    //   "isGlpiActivated" => $this->user->get("field_isglpiactivated")->value,
    //   "isNextCloudActivated" => $this->user->get("field_isnextcloudactivated")->value,
    // ], 200);
    //   print_r(\Drupal::keyValue("collectivities_store")->get('global'));

    $array = \Drupal::keyValue("collectivities_store")->get('global', "does not exist");

    $labels = ['Site', 'Image', 'Horaire', 'Téléphone', 'Email', 'Token zimbra'];

    //  $collectivite = \Drupal::request()->getSession()->get('cas_attributes')["partner"][0];

    echo "<pre>";
    foreach ($array as $key => $infoArray) {
      echo strtoupper($key) . ":\n";
      foreach ($infoArray as $i => $value) {
        $label = $labels[$i] ?? "Valeur $i";
        echo "  $label: $value\n";
      }
      echo "\n";
    }
    echo "</pre>";


    return new Response("donee");
    // return new Response($this->user->get('field_watchaaccesstoken')->value);
    //return new Response(\Drupal::request()->getSession()->get('cas_attributes')["partner"][0]);
  }
}
