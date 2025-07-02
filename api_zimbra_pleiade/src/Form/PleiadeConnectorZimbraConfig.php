<?php

namespace Drupal\api_zimbra_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure API Pléiade Pastell fields settings.
 */
class PleiadeConnectorZimbraConfig extends ConfigFormBase
{

  /** 
   * {@inheritdoc}
   */
  public function getFormId()
  {
    return 'api_zimbra_pleiade_config_form';
  }

  /** 
   * {@inheritdoc}
   */
  protected function getEditableConfigNames()
  {
    return [
      'api_zimbra_pleiade.settings'
    ];
  }

  /** 
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state)
  {
    $config = $this->config('api_zimbra_pleiade.settings');

    $form['field_zimbra_mail'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Zimbra endpoint Mails'),
      '#default_value' => $config->get('field_zimbra_mail'),
      // '#value' => $config->get('field_zimbra_url'),
      '#description' => $this->t('Enter the Zimbra SOAP request for mails, start with "SearchRequest and end with /SearchRequest"')
    ];
    $form['field_zimbra_agenda'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Zimbra endpoint Agenda'),
      '#default_value' => $config->get('field_zimbra_agenda'),
      // '#value' => $config->get('field_zimbra_url'),
      '#description' => $this->t('Enter the Zimbra SOAP request for agenda, start with "SearchRequest and end with /SearchRequest"'),
    ];
 
    $form['field_zimbra_auth_method'] = [
      '#type' => 'select',
      '#title' => t('Méthode d\'authentification.'),
      '#options' => array(
        'cas' => t('CAS'),
        'oidc' => t('OpenID Connect'),
        'saml' => t('SAML'),
        'http' => t('Http Header'),
      ),
      '#default_value' => $config->get('field_zimbra_auth_method'),
      '#description' => $this->t('Authentification method for ZIMBRA API')
    ];
    $form['field_zimbra_for_demo'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Zimbra demo mode'),
      '#default_value' => $config->get('field_zimbra_for_demo'),
      // '#value' => $config->get('field_zimbra_url'),
      '#description' => $this->t('Checkbox to enable demo mode'),
    ];
    $form['lemon_group'] = [
      '#type' => 'textfield',
      '#title' => t('LemonLDAP name group for zimbra module'),
      '#default_value' => $config->get('lemon_group'),
      '#description' => $this->t('Lemon group name in lemonLDAP module ')
    ];



    $form['coll_count'] = [
      '#type' => 'textfield',
      '#title' => $this->t("Nombre d'informations"),
      '#default_value' => $config->get('coll_count'),
    ];
    $count = $config->get('coll_count');
    if ($count === NULL || !is_numeric($count)) {
      $count = 8;
    } else {
      $count = intval($count);
    }

    for ($i = 0; $i < $count; $i++) {
      $form['row_' . $i] = [
        '#type' => 'container',
        '#tree' => TRUE,
        '#attributes' => ['class' => ['inline-row', 'row']],
      ];
      $form['row_' . $i]['nom'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Nom de collectivité'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
        '#default_value' => $config->get('row_' . $i . '.nom'),

      ];
      $form['row_' . $i]['url'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Url'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
        '#default_value' => $config->get('row_' . $i . '.url'),

      ];
      $form['row_' . $i]['token'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Token'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
        '#default_value' => $config->get('row_' . $i . '.token'),

      ];
    }


    return parent::buildForm($form, $form_state);
  }



  /** 
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state)
  {
    // Retrieve the configuration.
    $config = $this->config('api_zimbra_pleiade.settings');
   
    $config->set('field_zimbra_auth_method', $form_state->getValue('field_zimbra_auth_method'));
    $config->set('field_zimbra_mail', $form_state->getValue('field_zimbra_mail'));
    $config->set('field_zimbra_agenda', $form_state->getValue('field_zimbra_agenda'));
    $config->set('field_zimbra_for_demo', $form_state->getValue('field_zimbra_for_demo'));
    $config->set('lemon_group', $form_state->getValue('lemon_group'));

    $config->set('coll_count', $form_state->getValue('coll_count'));

    $count = intval($form_state->getValue('coll_count'));
    $array = \Drupal::keyValue("collectivities_store")->get('global', []);

    for ($i = 0; $i < $count; $i++) {


      $row1 = $form_state->getValue('row_' . $i) ?? [];
      if (empty($row1['nom'])) continue; // Skip if no name
      $array[$row1['nom']]['token_zimbra'] = $row1['token'];
      $array[$row1['nom']]['url_zimbra'] =$row1['url'];
      $config->set('row_' . $i . '.nom', $row1['nom'] ?? '');
      $config->set('row_' . $i . '.url', $row1['url'] ?? '');
      $config->set('row_' . $i . '.token', $row1['token'] ?? '');
    }
    $config->save();
    \Drupal::keyValue("collectivities_store")->set('global', $array);
    parent::submitForm($form, $form_state);
  }
}
