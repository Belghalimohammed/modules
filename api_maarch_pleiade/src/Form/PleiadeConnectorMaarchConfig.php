<?php

namespace Drupal\api_maarch_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure API Pléiade Pastell fields settings.
 */
class PleiadeConnectorMaarchConfig extends ConfigFormBase {

  /** 
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_maarch_pleiade_config_form';
  }

  /** 
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'api_maarch_pleiade.settings'
    ];
  }

  /** 
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('api_maarch_pleiade.settings');
    $form['clientSecret'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Client Secret'),
      '#default_value' => $config->get('clientSecret'),
    ];

     $form['clientId'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Client id'),
      '#default_value' => $config->get('clientId'),
    ];

     $form['synapseServer'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Serveur Synapse'),
      '#default_value' => $config->get('synapseServer'),
    ];

    return parent::buildForm($form, $form_state);
  }
  


  /** 
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Retrieve the configuration.
    $config = $this->config('api_maarch_pleiade.settings');
    $config->set('clientSecret', $form_state->getValue('clientSecret'));
    $config->set('clientId', $form_state->getValue('clientId'));
    $config->set('synapseServer', $form_state->getValue('synapseServer'));
   
$config->save();
    
    parent::submitForm($form, $form_state);
  }

}
