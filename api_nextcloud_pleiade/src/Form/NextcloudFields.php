<?php

namespace Drupal\api_nextcloud_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure API Pléiade LemonLDAP fields settings.
 */
class NextcloudFields extends ConfigFormBase {


  /** 
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_nextcloud_pleiade_config_form';
  }

  /** 
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'api_nextcloud_pleiade.settings'
    ];
  }

  /** 
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('api_nextcloud_pleiade.settings');

    $form['nextcloud_url'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Nextcloud url'),
      '#default_value' => $config->get('nextcloud_url'),
      '#description' => $this->t('Nextcloud URL'),
    ];  

    $form['nextcloud_endpoint_notifs'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Nextcloud : notifications endpoint'),
      '#default_value' => $config->get('nextcloud_endpoint_notifs'),
      '#description' => $this->t('Nextcloud Endpoint'),
    ];
$form['nextcloud_lemon_group'] = [
      '#type' => 'textfield',
      '#title' => $this->t('LemonLDAP Group for Nextcloud'),
      '#default_value' => $config->get('nextcloud_lemon_group'),
      '#description' => $this->t('Nextcloud Lemon Group'),
    ];


    return parent::buildForm($form, $form_state);
  }
 
  /** 
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Retrieve the configuration.
      $this->config('api_nextcloud_pleiade.settings')

      // Set the submitted configuration setting.
      ->set('nextcloud_url', $form_state->getValue('nextcloud_url'))
      ->set('nextcloud_endpoint_notifs', $form_state->getValue('nextcloud_endpoint_notifs'))
       ->set('nextcloud_lemon_group', $form_state->getValue('nextcloud_lemon_group'))
	->save();

    parent::submitForm($form, $form_state);
  }

}
