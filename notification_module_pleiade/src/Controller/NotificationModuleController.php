<?php

namespace Drupal\notification_module_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;



class NotificationModuleController extends ControllerBase {
    public function __construct() {
        $moduleHandler = \Drupal::service('module_handler');
        if ($moduleHandler->moduleExists('notification_module_pleiade')) {
          $this->settings_notification = \Drupal::config('notification_module_pleiade.settings');    
        }
      }
    
      public function notification_fields(Request $request) {
        $tempstoreGroup = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
        $storedGroups = $tempstoreGroup->get('groups');

        $entityTypeManager = \Drupal::entityTypeManager();
        $query = $entityTypeManager->getStorage('node')->getQuery();
        $query->condition('type', 'notification');
        $query->condition('status', 1); // Published content condition
        $query->accessCheck(FALSE);
        $entityIds = $query->execute();
        $notifications = $entityTypeManager->getStorage('node')->loadMultiple($entityIds);
      
        $notificationAAfficher = [];
      
        foreach ($notifications as $notification) {
          $title = $notification->getTitle(); 
          $body = $notification->get('field_description')->value;
          $dptValues = $notification->get('field_dpt')->getValue();
          $creationDate = $notification->getChangedTime();

          $dpts = array_map(function($item) {
            return 'dpt-' . $item['value'];
          }, $dptValues);

          if(!empty($dpts)){
            foreach($dpts as $dpt) {
              if (is_string($storedGroups) && strpos($storedGroups, $dpt) !== false) {
                $notificationAAfficher[] = [
                  'application' => $title,
                  'field_description' => $body,
                  'creation_date' => $creationDate,
                ];
                break; // Ajoutez cette ligne si vous voulez arrêter la boucle après la première correspondance
              }
            }
          }
          else
          {
            $notificationAAfficher[] = [
              'application' => $title,
              'field_description' => $body,
              'creation_date' => $creationDate,
            ];
          }
        }

        return new JsonResponse($notificationAAfficher);
      }

    
}
