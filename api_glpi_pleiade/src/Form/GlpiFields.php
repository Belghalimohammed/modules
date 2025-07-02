<?php

namespace Drupal\api_glpi_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure API Pléiade Pastell fields settings.
 */
class GlpiFields extends ConfigFormBase {

  /** 
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_glpi_pleiade_config_form';
  }

  /** 
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'api_glpi_pleiade.settings'
    ];
  }

  /** 
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('api_glpi_pleiade.settings');
    
    $form['glpi_url'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Url de l\'instance GLPI + /apirest.php'),
        '#default_value' => $config->get('glpi_url'),
        
    ];
    $form['app_token'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Token Api ( Configuration -> Générale -> API -> client API )'),
      '#default_value' => $config->get('app_token'),
    ]; 
    
    $form['endpoint_ticket'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Endpoint Url For tickets'),
      '#default_value' => $config->get('endpoint_ticket'),
    ]; 
	$form['glpi_group'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Group name for GLPI Lemon Users'),
      '#default_value' => $config->get('glpi_group'),
    ];    

    return parent::buildForm($form, $form_state);
  }
  
  /** 
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Retrieve the configuration.
    $config = $this->config('api_glpi_pleiade.settings');  
    $config->set('glpi_url', $form_state->getValue('glpi_url'));
    $config->set('app_token', $form_state->getValue('app_token'));
    $config->set('endpoint_ticket', $form_state->getValue('endpoint_ticket'));
    $config->set('glpi_group', $form_state->getValue('glpi_group'));
    $config->save();
    
    parent::submitForm($form, $form_state);
  }

}
