<?php

namespace Drupal\api_watcha_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

abstract class BaseController extends ControllerBase {
    public function __construct()
    {
        $this->initializeSession();

    }

    protected function initializeSession() {
        $session = \Drupal::service('session');
        if(!$session->has('initialized')) {
            $session->set('initialized',true);
          
        }
    }
}