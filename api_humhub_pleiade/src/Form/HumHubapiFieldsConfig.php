<?php

namespace Drupal\api_humhub_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

class HumHubapiFieldsConfig extends ConfigFormBase {

 
  public function getFormId() {
    return 'api_humhub_pleiade_config_form';
  }
  protected function getEditableConfigNames() {
    return [
      'api_humhub_pleiade.settings'
    ];
  }
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('api_humhub_pleiade.settings');
    
    $form['humhub_url'] = [
        '#type' => 'textfield',
        '#title' => $this->t('HumHub url'),
        '#default_value' => $config->get('humhub_url'),
        '#description' => $this->t('Enter the full HumHub url with /api/v1 at the end'),
      ];
    $form['sql_server'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Ip du serveur sql Humhub'),
      '#default_value' => $config->get('sql_server'),
      '#description' => $this->t('Ip du serveur sql Humhub'),
    ]; 
    $form['sql_user'] = [
      '#type' => 'textfield',
      '#title' => $this->t('User du serveur sql Humhub'),
      '#default_value' => $config->get('sql_user'),
      '#description' => $this->t('User du serveur sql Humhub'),
    ]; 
    $form['sql_password'] = [
      '#type' => 'password',
      '#title' => $this->t('Mot de passe du serveur sql Humhub'),
      '#default_value' => $config->get('sql_password'),
      '#description' => $this->t('Mot de passe du serveur sql Humhub'),
    ];
    $form['sql_database'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Datatable du serveur sql Humhub'),
      '#default_value' => $config->get('sql_database'),
      '#description' => $this->t('Datatable du serveur sql Humhub'),
    ];    
    return parent::buildForm($form, $form_state);
  }

  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->config('api_humhub_pleiade.settings');
    $config->set('humhub_url', $form_state->getValue('humhub_url'));
    $config->set('sql_server', $form_state->getValue('sql_server'));
    $config->set('sql_user', $form_state->getValue('sql_user'));
    $config->set('sql_password', $form_state->getValue('sql_password'));
    $config->set('sql_database', $form_state->getValue('sql_database'));
    $config->save();
    
    parent::submitForm($form, $form_state);
  }

}