<?php

namespace Drupal\api_pastell_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Url;
class PleiadePastellDocLotsForm extends ConfigFormBase
{

        /**
         * {@inheritdoc}
         */
        public function getFormId()
        {
                return 'api_pastell_pleiade_doc_lot_settings_form';
        }

        /**
         * {@inheritdoc}
         */
        protected function getEditableConfigNames()
        {
                return ['api_pastell_pleiade.settings'];
        }

        // Add form elements and submit handlers as needed.
        public function buildForm(array $form, FormStateInterface $form_state)
        {
                if (isset($_GET['id_e']) && !empty($_GET['id_e'])) {
                        $id_e = $_GET['id_e'];
                        // https://pastell.ecollectivites.fr/api/external-data.php?id_e=24&id_d=R3Mmu1m&page=0&field=iparapheur_sous_type
                        // on cree un doc bidon
                        $id_d = ecv_creadoc($id_e);
                        if($id_d){
                                $data = array(
                                        'id_e' => $id_e,
                                        'id_d' => $id_d->id_d,
                                        'field' => 'iparapheur_sous_type',
                                );
                                
                                $sstypes = ecv_getsoustype($data);
                                
                                
                                if($sstypes == null || $sstypes['status'] == 'error'){
                                        $suppr = ecv_suppr($id_e, $id_d->id_d);
                                        \Drupal::messenger()->addError($this->t('Veuillez selectionner une collectivité qui possède des sous-types i-parapheur'));        
                                        return $form;
                                }
                                $form['#prefix'] = '';
                                $form['#suffix'] = '
                                        <div id="previsu">
                                        <h3>Pré-visualisation</h3>En attente de fichiers PDF...
                                        </div>
                                        ';

                                $form['#attributes']['enctype'] = 'multipart/form-data';

                                // SS TYPE DOCS
                                $form['soustype'] = array(
                                        '#type' => 'select',
                                        '#title' => t('Circuits iParapheur :'),
                                        '#default_value' => $sstypes['Courrier'],
                                        '#options' => $sstypes,
                                        '#required' => TRUE,
                                );
                                $form['soustype']['#prefix'] = '<div class="expli"><span class="explinum">1</span>Choisissez un circuit et une date limite.</div>';

                                $suppr = ecv_suppr($id_e, $id_d->id_d);
                                $current_date = new DrupalDateTime();
                                $form['datelimite'] = array(
                                        '#title' => t('Date limite de signature :'),
                                        '#type' => 'date',
                                        '#description' => t('Par défaut, fixé au jour même.'),
                                        '#default_value' => $current_date->format('Y-m-d'),
                                );

                                // GED ?
                                $form['ged'] = array(
                                        '#type' => 'checkbox',
                                        '#title' => t('Transmission à la GED ?'),
                                        '#default_value' => 1,

                                        '#description' => t('Cochez cette case si vous souhaitez transmettre à la GED.'),
                                );
                                $form['id_e_lot'] = array(
                                        '#type' => 'textfield',
                                        '#title' => t('Création de documents en lots pour entité n° :'),
                                        '#default_value' => $id_e,
                                        '#attributes' => array('readonly' => 'readonly'),
                                );
                                // ****** FORM FICHIERS ************//
                                $form['actions'] = array();
                                //$form['actions']['#prefix'] = '<div class="expli"><span class="explinum">2</span>Cliquez sur parcourir, puis la touche CTRL + clic pour sélectionner les fichiers.</div>';
                                $form['actions']['content_upload']['file'] = array(
                                        '#type' => 'file',
                                        '#name' => 'files[]',
                                        '#title' => t('Fichiers locaux (PDF)'),
                                        '#value' => t('Choisir un fichier'),
                                        '#attributes' => array('multiple' => 'multiple'),
                                        '#required' => TRUE,
                                        '#field_prefix' => '<div class="expli"><span class="explinum">2</span>Cliquez sur Select. fichiers, puis la touche CTRL + clic pour sélectionner les fichiers.</div>',
                                        '#field_suffix' => '<div class="expli"><span class="explinum">3</span>Cliquez sur "envoyer les documents à la signature"</div>',
                                );
                                $form['#attached']['library'][] = 'api_pastell_pleiade/docLots.js';

                                $form['actions']['content_upload']['content_upload_button'] = array(
                                        '#type' => 'submit',
                                        '#name' => 'content_upload_action',
                                        '#value' => t('Envoyer les documents à la signature'),

                                );
                                return $form;
                        }
                } else {
                       \Drupal::messenger()->addError($this->t('Veuillez séléctionner une collectivité avant d\'envoyer des documents en lots'));
                        return $form;
                }
        }

        public function submitForm(array &$form, FormStateInterface $form_state)
        {
                $batch = array(
                        'title' => t('Création des documents et envoi au parapheur'),
                        'init_message' => t('Opération en cours'),
                        'progress_message' => t('Document @current sur @total en cours d\'envoi au parapheur...'),
                        'error_message' => t('L\'opération a échoué...'),
                );

                $id_e = $form['id_e_lot']['#value'];
                $sstype_index = $form_state->getValue('soustype');
                $options = $form['soustype']['#options'];
                $sstype = $options[$sstype_index];
                \Drupal::logger('api_pastell_pleiade')->info('Sous-type pârapheur: @cookie', ['@cookie' => $sstype]);
                $num_files = count($_FILES['files']['name']);
                \Drupal::logger('api_pastell_pleiade')->info('Nombre de docs transmis : @cookie', ['@cookie' => $num_files]);
                for ($i = 0; $i < $num_files; $i++) {
                        $file = file_save_upload($i, array('file_validate_extensions' => array('pdf'), ));
                        if ($file) {			
                                $nomfic = $file[0]->get('filename')->getValue()[0]['value'];
                                $nomfic = str_replace(' ', '_', $nomfic); // Replaces all spaces
                                $nomfic = preg_replace('/[^A-Za-z0-9\-]/', '', $nomfic); // Removes special chars.
                                $urlfic = ($file[0]->get('uri')->getValue()[0]['value']);
                                list($year, $month, $day) = explode('-', $form['datelimite']['#value']);
                                $ged = $form['ged']['#value'];                  
                                $batch['operations'][] = array('_ecv_docs_lots', array($id_e, $nomfic, $urlfic, $year, $month, $day, $ged, $sstype, $data = array()));
                                $batch['finished'] = 'ecv_batch_lot_finished';
                        } // fin if file
                } // fin for
                batch_set($batch);

        }
}