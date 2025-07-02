(function ($, Drupal) {
  "use strict";

  Drupal.behaviors.AccessibilityBehavior = {
    attach: function (context) {
      setTimeout(() => {
        const $context = $(context);
        const fontElements = $('#menuLemon .sidebar-link, .sidebar-nav ul .nav-small-cap, .sidebar-nav ul .sidebar-item .sidebar-link, #mes_applications .sidebar-link', $context);
        let currentSpacing = 0;

        // Font Size Handlers
        const updateFontSize = (delta) => {
          fontElements.each(function () {
            const size = parseInt(window.getComputedStyle(this).fontSize) || 16;
            this.style.fontSize = (size + delta) + 'px';
          });
          const bodySize = parseInt(document.body.style.fontSize) || 16;
          document.body.style.fontSize = (bodySize + delta) + 'px';
        };

        const resetFontSize = () => {
          fontElements.css('font-size', '18px');
          document.body.style.fontSize = '16px';
        };

        // Letter Spacing Handlers
        const updateLetterSpacing = (delta) => {
          currentSpacing = Math.max(currentSpacing + delta, 0);
          document.body.style.letterSpacing = currentSpacing ? `${currentSpacing}px` : 'normal';
        };

        // Contrast and Black & White Filter
        const updateFilter = () => {
          let filter = '';
          if ($('#contraste').is(':checked')) filter += 'contrast(200%) ';
          if ($('#black_and_white').is(':checked')) filter += 'grayscale(100%) ';
          document.body.style.filter = filter.trim();
        };

        // Zoom Mode (Mouse Info)
        const mouseInfoDiv = $('<div>', {
          css: {
            position: 'fixed',
            padding: '5px 10px',
            fontSize: '2rem',
            borderRadius: '5px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            border: '1px solid rgba(0,0,0,0.8)',
            color: '#fff',
            display: 'none',
            zIndex: '9999999999999',
            lineHeight: '1.2',
            pointerEvents: 'none',
            userSelect: 'none'
          }
        }).appendTo('body')[0];

        const handleMouseMove = (event) => {
          const el = event.target;
          if (['SPAN', 'A', 'TD', 'TH', 'BUTTON', 'P'].includes(el.tagName) || el.tagName.match(/^H[1-6]$/)) {
            mouseInfoDiv.style.left = `${event.clientX + 50}px`;
            mouseInfoDiv.style.top = `${event.clientY + 50}px`;
            mouseInfoDiv.textContent = el.textContent;
            mouseInfoDiv.style.display = 'block';
          }
        };

        $('#mode-loupe', $context).on('change', function () {
          if (this.checked) {
            document.body.addEventListener('mousemove', handleMouseMove);
          } else {
            mouseInfoDiv.style.display = 'none';
            document.body.removeEventListener('mousemove', handleMouseMove);
          }
        });

        // Font Size Buttons
        $('.btn-group button', $context).on('click', function () {
          if (this.id === 'increaseFontSize') updateFontSize(2);
          else if (this.id === 'decreaseFontSize') updateFontSize(-2);
          else if (this.id === 'resetFontSize') resetFontSize();
        });

        // Letter Spacing Buttons
        $('#increaseSpaces', $context).on('click', () => updateLetterSpacing(1));
        $('#decreaseSpaces', $context).on('click', () => updateLetterSpacing(-1));
        $('#resetSpaces', $context).on('click', () => updateLetterSpacing(-currentSpacing));

        // Theme View Checkbox
        $('#theme-view', $context).on('change', function () {
          localStorage.setItem('themeViewChecked', this.checked ? 'true' : '');
        });

        if (localStorage.getItem('themeViewChecked') === 'true') {
          $('#theme-view', $context).prop('checked', true).trigger('change');
        }

        // Contrast and B/W filters
        $('#contraste, #black_and_white', $context).on('change', function () {
          const key = this.id + 'Change';
          localStorage.setItem(key, this.checked ? 'true' : '');
          updateFilter();
        });

        if (localStorage.getItem('contrasteChange') === 'true') {
          $('#contraste', $context).prop('checked', true);
        }
        if (localStorage.getItem('black_and_whiteChange') === 'true') {
          $('#black_and_white', $context).prop('checked', true);
        }
        updateFilter();

        
      }, 0);
    }
  };
})(jQuery, Drupal);