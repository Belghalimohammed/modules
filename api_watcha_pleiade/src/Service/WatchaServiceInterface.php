<?php

namespace Drupal\api_watcha_pleiade\Service;


interface WatchaServiceInterface
{
 
  public function getSynapseRedirectUrl(): string;

  public function getAuthorizationLink(): string;

  public function exchangeCodeForToken(string $code): array;

  public function handleSynapseCallback(string $loginToken): array;

  public function getConfigData(): array;
}