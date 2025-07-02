<?php

namespace Drupal\api_pastell_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure API Pléiade Pastell fields settings.
 */
class PleiadePastellapiFieldsConfig extends ConfigFormBase {

  /** 
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_pastell_pleiade_config_form';
  }

  /** 
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'api_pastell_pleiade.settings'
    ];
  }

  /** 
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('api_pastell_pleiade.settings');
    
    $form['field_pastell_url'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Pastell url'),
        '#default_value' => $config->get('field_pastell_url'),
        '#description' => $this->t('Enter the full Pastell url with / at the end, ex: https://pastell.mydomain.com/'),
      ]; 

    $form['field_pastell_documents_url'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Pastell docs endpoint'),
      '#default_value' => $config->get('field_pastell_documents_url'),
      '#description' => $this->t('Enter the endpoint for documents with / at the end, i.e: api/v2/Document/'),
    ];  

    $form['field_pastell_entities_url'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Pastell entities endpoint'),
      '#default_value' => $config->get('field_pastell_entities_url'),
      '#description' => $this->t('Enter the Pastell entities endpoint url (no / at the end), i.e: api/v2/entite'),
    ];

    $form['field_pastell_limit_documents'] = [
      '#type' => 'number',
      '#title' => $this->t('Limite de document à récupérer'),
      '#default_value' => $config->get('field_pastell_limit_documents'),
      '#description' => $this->t('Number of max docs retrieved during Pastell API request'),
    ];
    $form['field_pastell_username_doc_lots'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Username pour utilisateur doc en lots'),
      '#default_value' => $config->get('field_pastell_username_doc_lots'),
      '#description' => $this->t('Username pour utilisateur doc en lots'),
    ];
    $form['field_pastell_password_doc_lots'] = [
      '#type' => 'password',
      '#title' => $this->t('Password pour utilisateur doc en lots'),
      '#default_value' => $config->get('field_pastell_username_doc_lots'),
      '#description' => $this->t('Password pour utilisateur doc en lots'),
    ];

    $form['field_pastell_flux_url'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Endpoint pour la liste des flux'),
      '#default_value' => $config->get('field_pastell_flux_url'),
      '#description' => $this->t('Endpoint pour la liste des flux'),
    ];

    $form['field_pastell_ldap_group'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Nom du groupe Pastell dans LDAP'),
      '#default_value' => $config->get('field_pastell_ldap_group'),
      '#description' => $this->t('Name of the LDAP Pastell group, usually "pastell"'),
    ];

    $form['field_pastell_auth_method'] = [
      '#type' => 'select',
      '#title' => t('Méthode d\'authentification.'),
      '#options' => array(
          'cas' => t('CAS'),
          'oidc' => t('OpenID Connect'),
          'saml' => t('SAML'),
          'http' => t('Http Header'),
      ),
      '#default_value' => $config->get('field_pastell_auth_method'),
      '#description' => $this->t('Authentification method for Pastell API'),
      '#required' => TRUE,
    ];  
    
    return parent::buildForm($form, $form_state);
  }
  


  /** 
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Retrieve the configuration.
    $config = $this->config('api_pastell_pleiade.settings');
   
    $config->set('field_pastell_url', $form_state->getValue('field_pastell_url'));
    $config->set('field_pastell_documents_url', $form_state->getValue('field_pastell_documents_url'));
    $config->set('field_pastell_entities_url', $form_state->getValue('field_pastell_entities_url'));
    $config->set('field_pastell_limit_documents', $form_state->getValue('field_pastell_limit_documents'));
    $config->set('field_pastell_flux_url', $form_state->getValue('field_pastell_flux_url'));
    $config->set('field_pastell_ldap_group', $form_state->getValue('field_pastell_ldap_group'));
    $config->set('field_pastell_auth_method', $form_state->getValue('field_pastell_auth_method'));
    $config->set('field_pastell_username_doc_lots', $form_state->getValue('field_pastell_username_doc_lots'));
    $config->set('field_pastell_password_doc_lots', $form_state->getValue('field_pastell_password_doc_lots'));
    $config->save();
    
    parent::submitForm($form, $form_state);
  }

}