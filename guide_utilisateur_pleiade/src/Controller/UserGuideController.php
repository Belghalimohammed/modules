<?php

namespace Drupal\guide_utilisateur_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class UserGuideController extends ControllerBase
{

        public function __construct()
        {
                $moduleHandler = \Drupal::service('module_handler');
                if ($moduleHandler->moduleExists('guide_utilisateur_pleiade')) {
                        $this->settings_moodle = \Drupal::config('guide_utilisateur_pleiade.settings');
                }
        }
        public function get_guide(Request $request)
        {

                $entityTypeManager = \Drupal::entityTypeManager();
                $query = $entityTypeManager->getStorage('node')->getQuery();
                $query->accessCheck(TRUE);
                $query->condition('type', 'guide_utilisateur');
                $query->condition('status', 1); // Published content condition
                $query->sort('created', 'DESC');
                $entityIds = $query->execute();
                $guides = $entityTypeManager->getStorage('node')->loadMultiple($entityIds);

                $guideData = [];

                foreach ($guides as $guide) {
                        $title = $guide->getTitle();
                        $body = $guide->get('body')->value;
                        $subtitle = $guide->get('field_sous_titre')->value;
                        $categorieLabel = '';
                        $categorieField = $guide->get('field_categorie_du_guide');
                        $typeField = $guide->get('field_type_de_guide')->value;
                        
                        if (!$categorieField->isEmpty()) {
                        $selectedValue = $categorieField->getValue()[0]['value'];
                        $categorieLabel = $categorieField->getFieldDefinition()->getSetting('allowed_values')[$selectedValue];
                        }
                        // if (!$typeField->isEmpty()) {
                        //         $selectedValue = $typeField->getValue()[0]['value'];
                        //         $categorieLabel = $typeField->getFieldDefinition()->getSetting('allowed_values')[$selectedValue];
                        //         }
                        $sub_categorie = $guide->get('field_sous_categorie_du_guide')->value;

                        $url = '';
                        if ($guide->hasLinkTemplate('canonical')) {
                                $url = $guide->toUrl()->toString();
                        }
                        if ($guide->hasField('field_image_du_guide') && $guide->get('field_image_du_guide')->entity) {
                                $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $guide->get('field_image_du_guide')->entity->uuid());
                                if ($file) {
                                        try {
                                                $image_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
                                        } catch (InvalidStreamWrapperException $e) {
                                                // Handle exception if needed.
                                        }
                                }
                        } else {
                                // Si aucun fichier n'est associé au champ field_image, récupérer l'image par défaut
                                $default_image = $guide->get('field_image_du_guide')->getFieldDefinition()->getSetting('default_image');
                                $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $default_image['uuid']);
                                if ($file) {
                                        try {
                                                $image_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
                                        } catch (InvalidStreamWrapperException $e) {
                                                // Handle exception if needed.
                                        }
                                }
                        }
                        
                        // Ajouter les données au tableau à retourner
                        $guideData[] = [
                                'title' => $title,
                                'sub_title' => $subtitle,
                                'url' => $url,
                                'image' => $image_url,
                                'categorie' => $categorieLabel,
                                'type' => $typeField,
                               
                        ];
                        
                }

                // Retourner les données au format JSON
                return new JsonResponse($guideData);
        }

}