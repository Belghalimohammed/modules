<?php

namespace Drupal\api_maarch_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Drupal\api_maarch_pleiade\Service\MaarchServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Routing\TrustedRedirectResponse;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\user\Entity\User;

class PleiadeAjaxMaarchController extends ControllerBase
{

  protected $maarchService;
  protected $currentUser;
  public function __construct(MaarchServiceInterface $maarchService, AccountProxyInterface $current_user)
  {
    $this->maarchService = $maarchService;
    $this->currentUser = $current_user;
  }

  public static function create(ContainerInterface $container)
  {
    return new static(
      $container->get(MaarchServiceInterface::class),
      $container->get('current_user')
    );
  }

 
}
