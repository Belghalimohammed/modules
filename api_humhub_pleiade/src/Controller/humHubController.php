<?php

namespace Drupal\api_humhub_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;


class humHubController extends ControllerBase
{
        public function humhub_query(Request $request)
        {
                $configHumhub = \Drupal::config('api_humhub_pleiade.settings');
                $serveur = $configHumhub->get('sql_server');
                $utilisateur = $configHumhub->get('sql_user');
                $motdepasse = $configHumhub->get('sql_password');
                $basededonnees = $configHumhub->get('sql_database');
                $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());

                // Vérifie si l'objet utilisateur est valide
                if ($user) {
                    // Récupère l'adresse e-mail de l'utilisateur connecté
                    $username = $user->getDisplayName();
                }
                else{
                        $username = '';
                }
                // Connexion à la base de données
               // Créer une connexion à la base de données
                $conn = mysqli_connect($serveur, $utilisateur, $motdepasse, $basededonnees);

                // Vérifier la connexion
                if (!$conn) {
                die("Connection failed: " . mysqli_connect_error());
                }
                // Requête SQL pour sélectionner tous les utilisateurs de la table "user"
                $sql = "SELECT ID FROM user WHERE username = '$username'";

                $result = mysqli_query($conn, $sql);


                // Vérifier si la requête a réussi
                if (mysqli_num_rows($result) > 0) {
                $ID_user = mysqli_fetch_assoc($result)["ID"];
                if($ID_user !== NULL){
                        $sql1 = "SELECT token FROM rest_user_bearer_tokens WHERE user_id = '$ID_user'";
                        $result1 = mysqli_query($conn, $sql1);
                        $token = mysqli_fetch_assoc($result1);
                        if($token !== null){ 
                        $return = []; //our variable to fill with data returned by Pastell
                                $apiGeneral = new ApiPleiadeManager();
                                if($apiGeneral->get_notif_humhub($token) != 'undefined'){
                                        $return['notifs'] = $apiGeneral->get_notif_humhub($token);
                                }   
                                if($apiGeneral->get_messages_humhub($token) != 'undefined'){
                                        $return['messages'] = $apiGeneral->get_messages_humhub($token);
                                }
                                if($apiGeneral->get_spaces($token) != 'undefined'){
                                        $spaces = $apiGeneral->get_spaces($token)["results"];
                                        foreach($spaces as $space){
                                                
                                                if (in_array($ID_user, $space['users'])) {
                                                        $return['spaces'][] = $space;
                                                }
                                                
                                        }
                                }
                        }
                        else {
                                $return = "Compte RSE trouvé mais aucun token de connexion trouvé";
                        }
                }
                } 
                else {
                $return = "Aucun utilisateur trouvé sur le RSE correspondant au nom d'utilisateur ". $username;
                }
                mysqli_close($conn);

                return new JsonResponse(json_encode($return), 200, [], true);

        }     

}
