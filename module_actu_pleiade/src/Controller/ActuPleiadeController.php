<?php

namespace Drupal\module_actu_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\module_actu_pleiade\Service\ActuPleiadeService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ActuPleiadeController extends ControllerBase
{
    protected $actuService;
    public function __construct(ActuPleiadeService $service)
    {
        $this->actuService = $service;
    }
    

    public static function create(ContainerInterface $container)
    {
        return new static(
            $container->get('module_actu_pleiade.actu_service')
        );
    }
    public function actu_list(Request $request)
    {
        $array = $this->actuService->getList();
        if (empty($array)) {
            return new JsonResponse([], 301);
        }
        return new JsonResponse($array, 200);
    }
}
