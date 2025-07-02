<?php

namespace Drupal\datatable_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;


class DatatableController extends ControllerBase
{

    public function documents_recents(Request $request)
    {

         $dataApi = new ApiPleiadeManager();
        $formattedData['docs'] = [];
        $tempstoreGroup = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
        $storedGroups = $tempstoreGroup->get('groups');
        if (is_string($storedGroups) && strpos($storedGroups, 'pastell') !== false) {
            

            $tempstore = \Drupal::service('tempstore.private')->get('api_pastell_pleiade');
            $tempstore->delete('documents_pastell');
            $return1 = []; //our variable to fill with data returned by Pastell
            // Our collectivite ID for Pastell id_e is sent as param by our js module
            $id_e = $request->query->get('id_e');
            // check value exists and is numleric
            if (null !== $id_e && is_numeric($id_e)) {
                \Drupal::logger('api_pastell_documents')->info('function search Pastell Docs with id_e : ' . $id_e);
               
                
                $return1 = $dataApi->searchMyDocs($id_e);
                $return2 = $dataApi->searchMyFlux();
                // var_dump(gettype($return1));
                if ($return1) {
                    foreach ($return1 as &$document) {
                        if (isset($return2[$document['type']]['nom'])) {
                            // Remplacer le type par le nom associé
                            $document['type'] = $return2[$document['type']]['nom'];
                        }
                    }
                    $tempstore = \Drupal::service('tempstore.private')->get('api_pastell_pleiade');
                    $tempstore->set('documents_pastell', $return1);
                } else {
                    $return1 = [];
                }
            } else {
                $return1 = [];
            }
            $formattedData['docs'] = array_merge($formattedData['docs'], $return1);
        }

        if (is_string($storedGroups) && strpos($storedGroups, 'i-parapheur') !== false) {

            $config = \Drupal::config('api_parapheur_pleiade.settings');
            $field_parapheur_url = $config->get('field_parapheur_url');
            $return1 = $dataApi->searchMyDesktop();
            if ($return1) {

                $return1 = array_map(function ($item) use ($field_parapheur_url) {
                    return [
                        'type' => 'Parapheur',
                        'titre' => $item['stepList'][0]['desks'][0]['name'] . " | " . $item['name'],
                        'id' => $item['id'],
                        'status' => $item['stepList'][0]['action'],
                        'creation' => date('d/m/y', strtotime($item['draftCreationDate'])),
                        'fileUrl' => $field_parapheur_url . "tenant/" . $item['tenant_id'] . '/desk/' . $item['stepList'][0]['desks'][0]['id'] . "/folder/" . $item['id'],
                        'type_dossier' => $item['type']['name'] . " | " . $item['subtype']['name']
                    ];
                }, $return1);

                //var_dump($return1);
            } else {
                $return1 = [];
            }
        } else {
            $return1 = [];
        }
        $formattedData['docs'] = array_merge($formattedData['docs'], $return1);


        $return_nc = $dataApi->getNextcloudNotifs();
        $tempstore = \Drupal::service('tempstore.private')->get('api_nextcloud_pleiade');
        $tempstore->set('documents_nextcloud', $return_nc);
        if ($return_nc) {
            if ($return_nc->ocs->data) {

                $data = $return_nc->ocs->data; // Access the 'data' property of the object
                if ($data) {
                    foreach ($data as $item) {
                        if (!isset($item->subjectRichParameters->file)) {
                            continue; // Skip the iteration if 'file' is not present
                        }

                        $status = '';
                        if (strpos($item->subject, 'modif') !== false) {
                            $status = 'Modifié';
                        } elseif (strpos($item->subject, 'partag') !== false) {
                            $status = 'Partagé';
                        }

                        $fileUrl = isset($item->subjectRichParameters->file->link) ? $item->subjectRichParameters->file->link : null;
                        $fileName = isset($item->subjectRichParameters->file->name) ? $item->subjectRichParameters->file->name : null;

                        $formattedItem = [
                            'type' => 'Nextcloud',
                            'titre' => $fileName,
                            'creation' => date('d/m/y', strtotime($item->datetime)),
                            // 'subject' => $item->subject,
                            'status' => $status,
                            'fileUrl' => $fileUrl
                        ];
                        $formattedItems[] = $formattedItem;
                    }

                    if ($formattedItems !== null && $formattedData['docs'] !== null) {
                        $formattedData['docs'] = array_merge($formattedData['docs'], $formattedItems);
                    } else {
                        $formattedData['docs'] = $formattedItems;
                    }
                }
            } else {
                $formattedItems = [];
            }
        }

        $jsonData = json_encode($formattedData);
        $moduleHandler = \Drupal::service('module_handler');
           $settings_pastell = $moduleHandler->moduleExists('api_pastell_pleiade') ? \Drupal::config('api_pastell_pleiade.settings') : NULL;

         $url =$settings_pastell->get('field_pastell_url') .
          $settings_pastell->get('field_pastell_documents_url') . $id_e .
           '&limit=' .$settings_pastell->get('field_pastell_limit_documents');
              if($tempstore) {
                        \Drupal::logger('api_pastell_pleiade')->debug($url);
              } else {
                    \Drupal::logger('api_pastell_pleiade')->debug("null");
              }

        if ($jsonData !== 'null') {
            return new JsonResponse($jsonData, 200, [], true);
        } else {
            return new JsonResponse('0', 200, [], true);
        }
    }
}
