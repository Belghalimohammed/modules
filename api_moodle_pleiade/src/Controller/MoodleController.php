<?php

namespace Drupal\api_moodle_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\user\Entity\UserInterface;
use Drupal\Core\Field\FieldStorageDefinitionInterface;


class MoodleController extends ControllerBase {

  public function __construct() {
    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_moodle_pleiade')) {
      $this->settings_moodle = \Drupal::config('api_moodle_pleiade.settings');    
    }
  }
  public function moodle_entities(Request $request) {
    $this->client = \Drupal::httpClient();
    $moodle_url = $this->settings_moodle->get('moodle_url');
    $username_moodle = $this->settings_moodle->get('username_moodle');
    $password_moodle = $this->settings_moodle->get('password_moodle');
    $function_moodle = $this->settings_moodle->get('function_moodle');
    $services_moodle = $this->settings_moodle->get('services_moodle');

    $moodleUrl = $moodle_url.'/login/token.php?username='.$username_moodle.'&password='.$password_moodle.'&service='.$services_moodle;
    // var_dump($moodleUrl);
    // Set parameters for retrieving all courses
    $requestParams = [
        'headers' => [],
    ];

    // Make the request
    $clientRequest = $this->client->request('POST', $moodleUrl, $requestParams);
    $json_string = $clientRequest->getBody()->getContents();
    $data = json_decode($json_string, true);
    $token = $data['token'];
    
    $this->client = \Drupal::httpClient();
    
    if ($token !== null) {
      // Return the response in JSON format
      $moodleUrl1 =  $moodle_url.'/webservice/rest/server.php?wstoken='.$token.'&wsfunction='.$function_moodle.'&moodlewsrestformat=json';

      // Set parameters for retrieving all courses
      $requestParams1 = [
          'headers' => [],
      ];

      // Make the request
      $clientRequest1 = $this->client->request('POST', $moodleUrl1, $requestParams1);
      
      $response = $clientRequest1->getBody()->getContents();
      $array_courses = json_decode($response)->courses;
      
      foreach($array_courses as $courses){
        $fileurl = $courses->overviewfiles[0]->fileurl;
        
        if($fileurl){
            $requestParams4 = [
              'headers' => [
                "Content-Type" => "image/jpeg"
              ],
            ];
            $clientRequest4 = $this->client->request('GET', $fileurl.'?token='.$token , $requestParams4);
            $base = $clientRequest4->getBody()->getContents();
            
            $base64 = base64_encode($base);
            $mime = "image/jpeg";
            $img = ('data:' . $mime . ';base64,' . $base64);
            
            $courses->overviewfiles[0]->fileurl = $img;
        }
      }
      
      if ($response !== null) 
      {
          // Return the response in JSON format
          return new JsonResponse(json_encode($array_courses), 200, [], true);
      } 
      else 
      {
          // Handle the case where the response is null
          return new JsonResponse(['error' => 'Response is null'], 400);
      }
    }
    else 
    {
        // Handle the case where the response is null
        return new JsonResponse(['error' => 'Response is null'], 400);
    }
  }
}