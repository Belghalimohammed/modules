<?php

namespace Drupal\accessibility_tools\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Cache\Cache;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

/**
 * Provides a 'Custom HTML Block' block.
 *
 * @Block(
 *   id = "accessibility_tools",
 *   admin_label = "Bloc Accessibilité",
 * )
 */
class AccessibilityToolsBlock extends BlockBase
{



  /**
   * {@inheritdoc}
   */





  public function getCacheMaxAge()
  {
    return 0; // Or another valid duration
  }

  public function build()
  {
    $user_storage =  \Drupal::entityTypeManager()->getStorage('user');
    $user = $user_storage->load(\Drupal::currentUser()->id());

    $isMenuOpened =  $user->get("field_ismenuopened")->value;
    $isWatchaActivated = $user->get("field_iswatchaactivated")->value;
    $isGlpiActivated = $user->get("field_isglpiactivated")->value;
    $isNextCloudActivated = $user->get("field_isnextcloudactivated")->value && $user->get('field_nextcloud_api_key')->value;
    $isPostitActivated = $user->get("field_ispostitactivated")->value;


    return [
      '#type' => 'inline_template',
      '#template' => '
    
      <script>
      
       document.querySelectorAll(".persoWidget").forEach((checkbox) => {
  const category = checkbox.dataset.category;
  const url = `/v1/api_user_pleiade/setVariables?var=${category}`;

  checkbox.addEventListener("change", () => {
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(async (data) => {
       
        localStorage.setItem("isWatchaActivated", data.isWatchaActivated);
        localStorage.setItem("isGlpiActivated", data.isGlpiActivated);
        localStorage.setItem("isPostitActivated", data.isPostitActivated);
         localStorage.setItem("menuOpen_", data.isMenuOpened);
         if(checkbox.id === "persoNextCloud" && checkbox.checked){
               const res = await fetch("/v1/api_nextcloud_pleiade/generateToken");
                    const data = await res.json();
                   
                    if(res.status == 409){
                      window.location.href = "/";
                    }
                   
                    const popup = window.open(data["login_url"], "_blank");
             
                    const token = data["poll_token"];
                    if (popup) {
                      const checkClosed = setInterval(async function ()  {
                        if (popup.closed) {
                                        clearInterval(checkClosed); // Stop polling
                      
                                        fetch("/v1/api_nextcloud_pleiade/pollToken?token="+ token).then(()=>{
                                                  localStorage.setItem("isNextCloudActivated", "true");
                                        location.reload();
                                        });
                                      
                                      
                          
                        }
                      }, 100);
                    } else {
                      console.log("Popup blocked or failed to open.");
                    }
         } else {
            window.location.href = "/";
         }
      
      })
      .catch(error => {
        console.error("Error setting widget state:", error);
      });
  });
});
        </script>
      <div>
        <div class="p-3 border-bottom">
          <div class="mt-2"></div>
         
          <span>Taille de la police :</span>
          <div class="btn-group" role="group" aria-label="Taille de la police">
              <button type="button" class="btn" id="increaseFontSize"><i class="fa-solid fa-arrow-up"></i></button>
              <button type="button" class="btn" id="decreaseFontSize"><i class="fa-solid fa-arrow-down"></i></button>
              <button type="button" class="btn" id="resetFontSize"><i class="fa-solid fa-rotate-right"></i></button>
          </div>

          <label class="form-check-label" for="space_letters">Espace entre les caractères :</label>
          <div class="btn-group" role="group" aria-label="Espace entre les caractères">
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
      ',
      '#context' => [
        'is_menuOpened' => $isMenuOpened,
        'is_watcha' => $isWatchaActivated,
        'is_nextcloud' => $isNextCloudActivated,
        'is_glpi' => $isGlpiActivated,
        'is_postit' => $isPostitActivated,
      ],
      '#attached' => [
        'library' => [
          'accessibility_tools/accessibility_tools',
        ],
      ],
    ];
  }
}
