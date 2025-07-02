<?php

namespace Drupal\api_user_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

class PleiadeUserFieldsConfig extends ConfigFormBase
{

  /** 
   * {@inheritdoc}
   */
  public function getFormId()
  {
    return 'api_user_pleiade_config_form';
  }

  /** 
   * {@inheritdoc}
   */
  protected function getEditableConfigNames()
  {
    return [
      'api_user_pleiade.settings'
    ];
  }

  /** 
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state)
  {
    $config = $this->config('api_user_pleiade.settings');

    $form['have_chatbot'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Assistant Virtuel ?'),
      '#default_value' => $config->get('have_chatbot'),

    ];
    $form['apiKey'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Clé Api SnatchBot ( Si activé )'),
      '#default_value' => $config->get('apiKey'),
    ];
    $form['apiKey']['#states'] = [
      'visible' => [
        ':input[name="have_chatbot"]' => ['checked' => TRUE],
      ],
    ];
    $form['bot_id'] = [
      '#type' => 'textfield',
      '#title' => $this->t('ID bot SnatchBot ( Si activé )'),
      '#default_value' => $config->get('bot_id'),
    ];
    $form['bot_id']['#states'] = [
      'visible' => [
        ':input[name="have_chatbot"]' => ['checked' => TRUE],
      ],

    ];

    $form['annuaire_login'] = [
      '#type' => 'textfield',
      '#title' => $this->t('login annuaire'),
      '#default_value' => $config->get('annuaire_login'),

    ];
    $form['annuaire_password'] = [
      '#type' => 'textfield',
      '#title' => $this->t('mot de passe annuaire'),
      '#default_value' => $config->get('annuaire_password'),

    ];
    $form['annuaire_url'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Url Rest annuaire'),
      '#default_value' => $config->get('annuaire_url'),

    ];
    $form['coll_count'] = [
      '#type' => 'textfield',
      '#title' => $this->t("Nombre d'informations"),
      '#default_value' => $config->get('coll_count'),
    ];

    $count = $config->get('coll_count');
    if ($count === NULL || !is_numeric($count)) {
      $count = 3;
    } else {
      $count = intval($count);
    }

    for ($i = 0; $i < $count; $i++) {
      $form['row_' . $i] = [
        '#type' => 'container',
        '#tree' => TRUE,
        '#attributes' => ['class' => ['inline-row', 'row']],
      ];
      $form['row_' . $i]['title'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Titre à afficher'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
        '#default_value' => $config->get('row_' . $i . '.title'),

      ];
      $form['row_' . $i]['var'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Nom de variable'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
        '#default_value' => $config->get('row_' . $i . '.var'),

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
    $config = $this->config('api_user_pleiade.settings');
    $config->set('have_chatbot', $form_state->getValue('have_chatbot'));
    $config->set('apiKey', $form_state->getValue('apiKey'));
    $config->set('bot_id', $form_state->getValue('bot_id'));
    $config->set('annuaire_login', $form_state->getValue('annuaire_login'));
    $config->set('annuaire_password', $form_state->getValue('annuaire_password'));
    $config->set('annuaire_url', $form_state->getValue('annuaire_url'));
    $config->set('coll_count', $form_state->getValue('coll_count'));

    $count = intval($form_state->getValue('coll_count'));
  

  for ($i = 0; $i < $count; $i++) {
    $row1 = $form_state->getValue('row_' . $i) ?? [];
   
  
    $config->set('row_' . $i . '.title', $row1['title'] ?? '');
    $config->set('row_' . $i . '.var', $row1['var'] ?? '');
  }
    
    $config->save();

    parent::submitForm($form, $form_state);
  }
}
