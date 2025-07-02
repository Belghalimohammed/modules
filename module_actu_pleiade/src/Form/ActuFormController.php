<?php

namespace Drupal\module_actu_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configuration form definition for the Module actu Pleiade module.
 */
class ActuFormController extends ConfigFormBase
{

  /**
   * {@inheritdoc}
   */
  public function getFormId()
  {
    return 'module_actu_pleiade_config_form';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames()
  {
    return [
      'module_actu_pleiade.settings',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state)
  {
    $config = $this->config('module_actu_pleiade.settings');

    $form['url_site'] = [
      '#type' => 'url',
      '#title' => $this->t('Site pour récupérer les actualités Sitiv'),
      '#default_value' => $config->get('url_site'),
      '#description' => $this->t('Site pour récupérer les actualités')
    ];

     $form['proxy'] = [
      '#type' => 'textfield',
      '#title' => $this->t('proxy'),
      '#default_value' => $config->get('proxy'),
    ];
    $form['coll_count'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Nombre de collectivité'),
      '#default_value' => $config->get('coll_count'),
    ];
    $count = $config->get('coll_count');
    if ($count === NULL || !is_numeric($count)) {
      $count = 7;
    } else {
      $count = intval($count);
    }

    for ($i = 0; $i < $count; $i++) {
      $form['row__' . $i] = [
        '#type' => 'container',
        '#tree' => TRUE,
        '#attributes' => ['class' => ['inline-row2', 'row']],
      ];
      $form['row__' . $i]['nom'] = [
        '#type' => 'textfield',
        '#title' => $this->t('nom de la collectivité'),
        '#default_value' => $config->get('row__' . $i . '.nom'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
      ];
      $form['row__' . $i]['url'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Site pour récupérer les actualités'),
        '#default_value' => $config->get('row__' . $i . '.url'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
      ];
    }

    $form['actu_interne'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Autoriser les actualités interne Pléiade'),
      '#default_value' => $config->get('actu_interne'),
      '#description' => $this->t('Autoriser les actualités interne Pléiade')
    ];
    $form['flux_rss'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Flux RSS ? par défaut = JSON'),
      '#default_value' => $config->get('flux_rss'),
      '#description' => $this->t('Flux RSS ? par défaut = JSON')
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state)
  {
    $config = $this->config('module_actu_pleiade.settings');
    $config->set('flux_rss', $form_state->getValue('flux_rss'));
    $config->set('url_site', $form_state->getValue('url_site'));
    $config->set('actu_interne', $form_state->getValue('actu_interne'));
    $config->set('coll_count', $form_state->getValue('coll_count'));
    $config->set('proxy', $form_state->getValue('proxy'));

    $array = \Drupal::keyValue("collectivities_store")->get('global', []);
    $count = intval($form_state->getValue('coll_count'));
    
    for ($i = 0; $i < $count; $i++) {
      $row2 = $form_state->getValue('row__' . $i) ?? [];
      $nom = $row2['nom'] ?? '';
      if (empty($nom)) continue; // Skip if no name
      $array[$nom]['actu_url'] = $row2['url'];
      $config->set('row__' . $i . '.nom', $nom);

      $config->set('row__' . $i . '.url', $row2['url'] ?? '');
    }


    $config->save();
    \Drupal::keyValue("collectivities_store")->set('global', $array);
    parent::submitForm($form, $form_state);
  }
}
