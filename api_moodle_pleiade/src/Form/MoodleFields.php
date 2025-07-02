<?php

namespace Drupal\api_moodle_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure API Pléiade Pastell fields settings.
 */
class MoodleFields extends ConfigFormBase {

  /** 
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_moodle_pleiade_config_form';
  }

  /** 
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'api_moodle_pleiade.settings'
    ];
  }

  /** 
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('api_moodle_pleiade.settings');
    
    $form['moodle_url'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Url Moodle'),
        '#default_value' => $config->get('moodle_url'),  
    ];
    $form['username_moodle'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Moodle Username'),
      '#default_value' => $config->get('username_moodle'),
    ];
    
    $form['password_moodle'] = [
      '#type' => 'password',
      '#title' => $this->t('Moodle Password'),
      '#default_value' => $config->get('password_moodle'),
    ];
    
    $form['function_moodle'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Moodle Function'),
      '#default_value' => $config->get('function_moodle'),
    ];
    
    $form['services_moodle'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Moodle Services'),
      '#default_value' => $config->get('services_moodle'),
    ];
    
    $form['field_moodle_block_id'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Afficher le bloc moodle le bureau'),
      '#default_value' => $config->get('field_moodle_block_id'),
      '#description' => $this->t('Check this box to display moodle_block.'),
    ];
    return parent::buildForm($form, $form_state);
  }
  
  /** 
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Retrieve the configuration.
    $config = $this->config('api_moodle_pleiade.settings');  
    $config->set('moodle_url', $form_state->getValue('moodle_url'));
    $config->set('username_moodle', $form_state->getValue('username_moodle'));
    $config->set('password_moodle', $form_state->getValue('password_moodle'));
    $config->set('function_moodle', $form_state->getValue('function_moodle'));
    $config->set('services_moodle', $form_state->getValue('services_moodle'));
    $config->set('field_moodle_block_id', $form_state->getValue('field_moodle_block_id'));

    
    $config->save();
    
    parent::submitForm($form, $form_state);
  }

}