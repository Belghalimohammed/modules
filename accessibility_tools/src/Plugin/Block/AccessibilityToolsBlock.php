<?php

namespace Drupal\accessibility_tools\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a 'Custom HTML Block' for accessibility and user preferences.
 *
 * @Block(
 *   id = "accessibility_tools",
 *   admin_label = "Bloc Accessibilité",
 * )
 */
class AccessibilityToolsBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function getCacheMaxAge() {
    // This block is highly dynamic and user-specific. Do not cache.
    return 0;
  }

  /**
   * {@inheritdoc}
   */
  public function build() {
    $current_user_id = \Drupal::currentUser()->id();

    // Do not render the block for anonymous users.
    if (!$current_user_id) {
      return [];
    }

    $user_storage = \Drupal::entityTypeManager()->getStorage('user');
    $user = $user_storage->load($current_user_id);

    // --- PHP LOGIC: Prepare variables for the template ---

    $hasWatchaToken = !empty($user->get('field_watchaaccesstoken')->value);
    $js_hasWatchaToken = $hasWatchaToken ? 'true' : 'false';

    $isMenuOpened = (bool) $user->get("field_ismenuopened")->value;
    $isWatchaActivated = (bool) $user->get("field_iswatchaactivated")->value && $hasWatchaToken;
    $isNextCloudActivated = (bool) $user->get("field_isnextcloudactivated")->value && !empty($user->get('field_nextcloud_api_key')->value);
    $isGlpiActivated = (bool) $user->get("field_isglpiactivated")->value;
    $isPostitActivated = (bool) $user->get("field_ispostitactivated")->value;

    return [
      '#type' => 'inline_template',
      '#template' => <<<HTML
        <div>
          <div class="p-3 border-bottom">
            <div class="mt-2"></div>
           
            <span>Taille de la police :</span>
            <div class="btn-group" role="group" aria-label="Taille de la police" data-control="font-size">
                <button type="button" class="btn" id="increaseFontSize"><i class="fa-solid fa-arrow-up"></i></button>
                <button type="button" class="btn" id="decreaseFontSize"><i class="fa-solid fa-arrow-down"></i></button>
                <button type="button" class="btn" id="resetFontSize"><i class="fa-solid fa-rotate-right"></i></button>
            </div>
  
            <label class="form-check-label" for="space_letters">Espace entre les caractères :</label>
            <div class="btn-group" role="group" aria-label="Espace entre les caractères" data-control="letter-spacing">
                <button type="button" class="btn" id="increaseSpaces"><i class="fa-solid fa-arrow-up"></i></button>
                <button type="button" class="btn" id="decreaseSpaces"><i class="fa-solid fa-arrow-down"></i></button>
                <button type="button" class="btn" id="resetSpaces"><i class="fa-solid fa-rotate-right"></i></button>
            </div>
  
            <label class="form-check-label" for="mode-loupe">Mode loupe :</label>
            <input type="checkbox" class="form-check-input" id="mode-loupe">
  
            <label class="form-check-label" for="theme-view"><span>Thème Sombre :</span></label>
            <input type="checkbox" name="theme-view" class="form-check-input" id="theme-view" />
  
            <label class="form-check-label" for="contraste">Contraste élevé :</label>
            <input type="checkbox" class="form-check-input" id="contraste">
  
            <label class="form-check-label" for="black_and_white">Mode noir et blanc :</label>
            <input type="checkbox" class="form-check-input" id="black_and_white">
  
            <hr>
  
            <label class="form-check-label">Ouverture menu :</label>
            <input type="checkbox" class="form-check-input persoWidget" data-category="field_ismenuopened" {% if is_menuOpened %}checked{% endif %}>
  
            <label class="form-check-label">Afficher Watcha :</label>
            <input type="checkbox" class="form-check-input persoWidget" id="persoWatcha" data-category="field_iswatchaactivated" {% if is_watcha %}checked{% endif %}>
  
            <label class="form-check-label">Afficher NextCloud :</label>
            <input type="checkbox" class="form-check-input persoWidget" id="persoNextCloud" data-category="field_isnextcloudactivated" {% if is_nextcloud %}checked{% endif %}>
  
            <label class="form-check-label">Afficher GLPI :</label>
            <input type="checkbox" class="form-check-input persoWidget" id="persoGlpi" data-category="field_isglpiactivated" {% if is_glpi %}checked{% endif %}>
  
            <label class="form-check-label">Afficher Post-It :</label>
            <input type="checkbox" class="form-check-input persoWidget" id="persoPostit" data-category="field_ispostitactivated" {% if is_postit %}checked{% endif %}>
          </div>
        </div>

        <script>
        (function (Drupal) {
          Drupal.behaviors.userPreferencesToggle = {
            attach: function (context) {
              context.querySelectorAll('.persoWidget:not(.processed)').forEach((checkbox) => {
                checkbox.classList.add('processed');
                checkbox.addEventListener('change', async (event) => {
                  const checkbox = event.currentTarget;
                  const category = checkbox.dataset.category;
                  const setPreferenceUrl = Drupal.url(`v1/api_user_pleiade/setVariables?var=\${category}`);
                  checkbox.disabled = true;
                  
                  try {
                    // --- STEP 1: Update the backend preference ---
                    // The `await` keyword pauses execution here until the fetch completes.
                    const response = await fetch(setPreferenceUrl);
                  
                    // --- STEP 2: Verify the backend update was successful ---
                    // This is a crucial check. We only proceed if the server responded with OK (status 200-299).
                    if (!response.ok) {
                      // If there was a server error, stop everything and report it.
                      throw new Error(`Server error: \${response.status} \${response.statusText}`);
                    }
                   
                    // --- STEP 3: Proceed with frontend logic (Watcha, NextCloud, etc.) ---
                    // This code is now GUARANTEED to run only *after* a successful backend update.
                    
                    // --- LOGIC FOR WATCHA ---
                    if (checkbox.id === 'persoWatcha') {
                      if (checkbox.checked) {
                        const hasToken = {{ js_hasWatchaToken }}; 
                        if (hasToken) {
                          localStorage.setItem('isWatchaActivated', 'true');
                         location.reload();
                        } else {
                          window.location.href = Drupal.url('v1/api_watcha_pleiade/watcha_auth_flow');
                        }
                      } else {
                        localStorage.setItem('isWatchaActivated', 'false');
                        location.reload();
                      }
                      return; // Execution stops here for the Watcha case.
                    }

                    // --- LOGIC FOR NEXTCLOUD ---
                    if (checkbox.id === 'persoNextCloud' && checkbox.checked) {
                      const res = await fetch(Drupal.url('v1/api_nextcloud_pleiade/generateToken'));
                      if (!res.ok) throw new Error('Failed to generate NextCloud token.');

                      if (res.status === 409) {
                        location.reload();
                        return;
                      }
                      const data = await res.json();
                      const popup = window.open(data.login_url, '_blank', 'width=600,height=700');
                      if (popup) {
                        const checkClosed = setInterval(() => {
                          if (popup.closed) {
                            clearInterval(checkClosed);
                            fetch(Drupal.url('v1/api_nextcloud_pleiade/pollToken?token=' + data.poll_token))
                              .then(() => location.reload());
                          }
                        }, 500);
                      }
                      return; // Execution stops here for the NextCloud case.
                    }

                    // --- DEFAULT ACTION for all other checkboxes ---
                    // This runs if it's not Watcha or NextCloud (e.g., GLPI, Post-It).
                    location.reload();

                  } catch (error) {
                    console.error('Failed to update user preference:', error);
                    // Re-enable the checkbox so the user can try again.
                    checkbox.disabled = false;
                    // Optionally, show a user-friendly error message.
                    alert('Une erreur est survenue. Veuillez réessayer.');
                  }
                });
              });
            }
          };
        })(Drupal);
        </script>
HTML
,
      '#context' => [
        'is_menuOpened' => $isMenuOpened,
        'is_watcha' => $isWatchaActivated,
        'is_nextcloud' => $isNextCloudActivated,
        'is_glpi' => $isGlpiActivated,
        'is_postit' => $isPostitActivated,
        'js_hasWatchaToken' => $js_hasWatchaToken,
      ],
      '#attached' => [
        'library' => [
          'accessibility_tools/accessibility_tools',
        ],
      ],
    ];
  }
}