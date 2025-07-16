<?php

namespace Drupal\module_general_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configuration form definition for the Module General Pleiade module.
 */
class ModuleGeneralPleiadeConfigForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'module_general_pleiade_config_form';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return ['module_general_pleiade.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('module_general_pleiade.settings');

    $form['color_theme'] = [
      '#type' => 'color',
      '#title' => $this->t('Couleur du thème'),
      '#default_value' => $config->get('color_theme'),
      '#description' => $this->t('Sur Firefox, pour passer du code HEXA au code RGB, cliquez sur <a href="https://www.rgbtohex.net/hex-to-rgb/" target="_blank">ce lien.</a>'),
    ];
   
    $form['coll_count'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Nombre de collectivité'),
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
        '#default_value' => $config->get('row_' . $i . '.nom'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
      ];
      $form['row_' . $i]['Horaires'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Horaires du support'),
        '#default_value' => $config->get('row_' . $i . '.Horaires'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
      ];
      $form['row_' . $i]['numero'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Numéro de téléphone du support'),
        '#default_value' => $config->get('row_' . $i . '.numero'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
      ];
      $form['row_' . $i]['mail'] = [
        '#type' => 'textfield',
        '#title' => $this->t('lien du support'),
        '#default_value' => $config->get('row_' . $i . '.mail'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
      ];

      $form['row__' . $i] = [
        '#type' => 'container',
        '#tree' => TRUE,
        '#attributes' => ['class' => ['inline-row2', 'row']],
      ];
      $form['row__' . $i]['site'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Site web de collectivité'),
        '#default_value' => $config->get('row__' . $i . '.site'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
      ];

      
      $form['row__' . $i]['logo'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Logo de collectivité'),
        '#default_value' => $config->get('row__' . $i . '.logo'),
        '#description' => $this->t('Enter a URL or upload a file below. If you upload a file, this will be filled automatically.'),
        '#attributes' => ['id' => 'edit-row-' . $i . '-logo'],
        '#wrapper_attributes' => ['class' => ['inline-field']],
      ];
      
      $form['row__' . $i]['logo_upload'] = [
        '#type' => 'managed_file',
        '#title' => $this->t('Upload Logo'),
        '#upload_location' => 'public://logos/',
        '#default_value' => NULL,
        '#upload_validators' => [
          'file_validate_extensions' => ['png jpg jpeg svg'],
        ],
        '#attributes' => ['class' => ['logo-upload']],
        '#ajax' => [
          'callback' => '::logoUploadCallback',
          'event' => 'change',
          'wrapper' => 'edit-row-' . $i . '-logo',
        ],
      ];

    }
    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
 public function submitForm(array &$form, FormStateInterface $form_state) {
  $config = $this->config('module_general_pleiade.settings');

  // Save simple fields
  $config->set('color_theme', $form_state->getValue('color_theme'));
  $config->set('coll_count', $form_state->getValue('coll_count'));

  $count = intval($form_state->getValue('coll_count'));

  // Load existing data from key-value store (if any)
  $kv_store = \Drupal::keyValue("collectivities_store");
  $existing_data = $kv_store->get('global') ?? [];

  for ($i = 0; $i < $count; $i++) {
    $row1 = $form_state->getValue('row_' . $i) ?? [];
    $row2 = $form_state->getValue('row__' . $i) ?? [];
    $nom = $row1['nom'] ?? '';
  
    if (empty($nom)) continue; // Skip empty names
  
    // Handle logo (URL or uploaded file)
    $logo_value = $row2['logo'] ?? '';
    $upload_fid = $form_state->getValue(['row__' . $i, 'logo_upload'])[0] ?? NULL;
  
    if ($upload_fid && $file = \Drupal\file\Entity\File::load($upload_fid)) {
      $file->setPermanent();
      $file->save();
      $logo_value = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
    }
  
    $existing_data[$nom] = array_merge($existing_data[$nom] ?? [], [
      'nom' => $nom,
      'site' => $row2['site'] ?? '',
      'logo' => $logo_value,
      'horaires' => $row1['Horaires'] ?? '',
      'numero' => $row1['numero'] ?? '',
      'mail' => $row1['mail'] ?? '',
    ]);
  
    $config->set("row_{$i}.nom", $nom);
    $config->set("row_{$i}.Horaires", $row1['Horaires'] ?? '');
    $config->set("row_{$i}.numero", $row1['numero'] ?? '');
    $config->set("row_{$i}.mail", $row1['mail'] ?? '');
    $config->set("row__{$i}.site", $row2['site'] ?? '');
    $config->set("row__{$i}.logo", $logo_value);
  }

  $config->save();

  // Save merged data to key-value store
  $kv_store->set('global', $existing_data);

  parent::submitForm($form, $form_state);
}



}
