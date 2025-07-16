<?php

namespace Drupal\api_zimbra_pleiade\Service;


interface ZimbraServiceInterface 
{
    public function searchMyMails(string $mailEndpoint, string $email, string $token, string $domain);

    public function searchMyTasks(string $tasksEndpoint, string $email, string $token, string $domain);

}
