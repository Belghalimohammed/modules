/**
 * @file
 * Handles accessibility tool interactions like theme toggling, font size, etc.
 *
 * This file uses the Drupal behaviors system and the drupal/once library to
 * ensure that event handlers are attached only once, even with AJAX content.
 */
(function ($, Drupal, once) {
  'use strict';

  // Define a single behavior for all accessibility tools.
  Drupal.behaviors.AccessibilityTools = {
    attach: function (context) {

      /*
       * =======================================================================
       *   1. Dark/Light Theme Toggler
       * =======================================================================
       */
      once('theme-view-toggle', '#theme-view', context).forEach(function (checkbox) {
        const $checkbox = $(checkbox);
        const body = $('body');

        // Function to set the theme based on the checkbox state
        const applyTheme = () => {
          const newTheme = $checkbox.is(':checked') ? 'dark' : 'light';
          body.attr('data-theme', newTheme);
        };

        // Attach the event handler
        $checkbox.on('change', function () {
          localStorage.setItem('themeViewChecked', this.checked);
          applyTheme();
        });

        // Initialize theme on page load
        if (localStorage.getItem('themeViewChecked') === 'true') {
          $checkbox.prop('checked', true);
        }
        applyTheme(); // Apply theme based on initial state
      });


      /*
       * =======================================================================
       *   2. Font Size Controls
       * =======================================================================
       */
      once('font-size-controls', '.btn-group[data-control="font-size"]', context).forEach(function (controlGroup) {
        const $controlGroup = $(controlGroup);
        const fontElements = $('#menuLemon .sidebar-link, .sidebar-nav ul .nav-small-cap, .sidebar-nav ul .sidebar-item .sidebar-link, #mes_applications .sidebar-link');

        const updateFontSize = (delta) => {
          fontElements.each(function () {
            const currentSize = parseInt(window.getComputedStyle(this).fontSize, 10) || 16;
            this.style.fontSize = (currentSize + delta) + 'px';
          });
          const bodySize = parseInt(window.getComputedStyle(document.body).fontSize, 10) || 16;
          document.body.style.fontSize = (bodySize + delta) + 'px';
        };

        const resetFontSize = () => {
          fontElements.css('font-size', ''); // Reset to CSS default
          document.body.style.fontSize = ''; // Reset to CSS default
        };

        $controlGroup.on('click', 'button', function () {
          const action = this.id;
          if (action === 'increaseFontSize') updateFontSize(2);
          else if (action === 'decreaseFontSize') updateFontSize(-2);
          else if (action === 'resetFontSize') resetFontSize();
        });
      });


      /*
       * =======================================================================
       *   3. Letter Spacing Controls
       * =======================================================================
       */
      once('letter-spacing-controls', '.btn-group[data-control="letter-spacing"]', context).forEach(function (controlGroup) {
        let currentSpacing = 0; // This state is now local to this control
        const $controlGroup = $(controlGroup);

        const updateLetterSpacing = (delta) => {
          currentSpacing = Math.max(0, currentSpacing + delta);
          document.body.style.letterSpacing = currentSpacing > 0 ? `${currentSpacing}px` : 'normal';
        };

        $controlGroup.on('click', 'button', function () {
          const action = this.id;
          if (action === 'increaseSpaces') updateLetterSpacing(1);
          else if (action === 'decreaseSpaces') updateLetterSpacing(-1);
          else if (action === 'resetSpaces') {
            currentSpacing = 0; // Reset state
            document.body.style.letterSpacing = 'normal';
          }
        });
      });


      /*
       * =======================================================================
       *   4. Contrast and B&W Filter Controls
       * =======================================================================
       */
      once('filter-controls', '#contraste, #black_and_white', context).forEach(function (checkbox) {
        const $checkbox = $(checkbox);
        const updateFilter = () => {
          let filterValue = '';
          if ($('#contraste').is(':checked')) filterValue += 'contrast(2)';
          if ($('#black_and_white').is(':checked')) filterValue += ' grayscale(1)';
          document.body.style.filter = filterValue.trim();
        };

        $checkbox.on('change', function () {
          localStorage.setItem(this.id + 'Checked', this.checked);
          updateFilter();
        });

        // Initialize state on page load
        if (localStorage.getItem(checkbox.id + 'Checked') === 'true') {
          $checkbox.prop('checked', true);
        }
        updateFilter();
      });


      /*
       * =======================================================================
       *   5. Zoom Mode (Magnifying Glass)
       * =======================================================================
       */
      once('zoom-mode-control', '#mode-loupe', context).forEach(function (checkbox) {
        // Create the info div only once and append to body
        const mouseInfoDiv = $('<div>').css({
          // ... your CSS styles ...
          position: 'fixed', padding: '5px 10px', fontSize: '2rem', borderRadius: '5px', backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(0,0,0,0.8)', color: '#fff', display: 'none', zIndex: '9999999999999', lineHeight: '1.2', pointerEvents: 'none', userSelect: 'none'
        }).appendTo('body')[0];

        const handleMouseMove = (event) => {
          const el = event.target;
          if (['SPAN', 'A', 'TD', 'TH', 'BUTTON', 'P'].includes(el.tagName) || el.tagName.match(/^H[1-6]$/)) {
            mouseInfoDiv.style.left = `${event.clientX + 20}px`;
            mouseInfoDiv.style.top = `${event.clientY + 20}px`;
            mouseInfoDiv.textContent = el.textContent.trim();
            mouseInfoDiv.style.display = el.textContent.trim() ? 'block' : 'none';
          } else {
            mouseInfoDiv.style.display = 'none';
          }
        };

        $(checkbox).on('change', function () {
          if (this.checked) {
            document.body.addEventListener('mousemove', handleMouseMove);
          } else {
            document.body.removeEventListener('mousemove', handleMouseMove);
            mouseInfoDiv.style.display = 'none';
          }
        });
      });

    }
  };

})(jQuery, Drupal, once);