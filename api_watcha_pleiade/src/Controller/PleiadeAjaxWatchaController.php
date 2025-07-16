<?php

namespace Drupal\api_watcha_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Drupal\api_watcha_pleiade\Service\WatchaServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Routing\TrustedRedirectResponse;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\user\Entity\User;

class PleiadeAjaxWatchaController extends ControllerBase
{

  protected $watchaService;
  protected $currentUser;
  public function __construct(WatchaServiceInterface $watchaService, AccountProxyInterface $current_user)
  {
    $this->watchaService = $watchaService;
    $this->currentUser = $current_user;
  }

  public static function create(ContainerInterface $container)
  {
    return new static(
      $container->get(WatchaServiceInterface::class),
      $container->get('current_user')
    );
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
