/* ====================================
   SEC-3: ANATOMY OF AN AI AGENT — JS
   Self-contained IIFE, no dependencies
   ==================================== */

(function () {
  'use strict';

  function init() {
    var sec = document.getElementById('sec-5');
    if (!sec || !sec.classList.contains('section--agent-anatomy')) return;

    initAccordion(sec);
    initChipTooltips(sec);
  }

  /* --- Layer Stack Accordion --- */
  function initAccordion(sec) {
    var layers = sec.querySelectorAll('.aa-layer');
    if (!layers.length) return;

    layers.forEach(function (layer) {
      var bar = layer.querySelector('.aa-layer-bar');
      if (!bar) return;

      bar.addEventListener('click', function () {
        var wasExpanded = layer.classList.contains('aa-layer--expanded');

        // Collapse all
        layers.forEach(function (l) {
          l.classList.remove('aa-layer--expanded');
        });

        // Expand clicked (if it wasn't already open)
        if (!wasExpanded) {
          layer.classList.add('aa-layer--expanded');
        }
      });
    });
  }

  /* --- Chip Tooltips (data-tip) --- */
  function initChipTooltips(sec) {
    var chips = sec.querySelectorAll('.aa-tool-chip--has-tip[data-tip]');
    if (!chips.length) return;

    // Create single tooltip element
    var popup = document.createElement('div');
    popup.className = 'aa-tip-popup';
    document.body.appendChild(popup);

    var hideTimer = null;
    var activeChip = null;
    var isTouchDevice = 'ontouchstart' in window;

    function showTip(chip) {
      clearTimeout(hideTimer);
      activeChip = chip;
      popup.innerHTML = chip.getAttribute('data-tip');

      // Add funded modifier
      if (chip.classList.contains('aa-tool-chip--funded') || chip.classList.contains('aa-tool-chip--dvc')) {
        popup.classList.add('aa-tip-popup--funded');
      } else {
        popup.classList.remove('aa-tip-popup--funded');
      }

      // Position: show it first to measure
      popup.style.visibility = 'hidden';
      popup.style.display = 'block';
      popup.classList.remove('aa-tip-popup--visible');

      var rect = chip.getBoundingClientRect();
      var popW = popup.offsetWidth;
      var popH = popup.offsetHeight;

      // Default: below the chip, centered
      var left = rect.left + rect.width / 2 - popW / 2;
      var top = rect.bottom + 10;

      // If goes off bottom, show above
      if (top + popH > window.innerHeight - 10) {
        top = rect.top - popH - 10;
      }

      // Clamp horizontal
      if (left < 10) left = 10;
      if (left + popW > window.innerWidth - 10) left = window.innerWidth - popW - 10;

      popup.style.left = left + 'px';
      popup.style.top = top + 'px';
      popup.style.visibility = '';
      popup.style.display = '';

      // Animate in
      requestAnimationFrame(function () {
        popup.classList.add('aa-tip-popup--visible');
      });
    }

    function hideTip() {
      hideTimer = setTimeout(function () {
        popup.classList.remove('aa-tip-popup--visible');
        activeChip = null;
      }, 150);
    }

    // Desktop: hover
    chips.forEach(function (chip) {
      chip.addEventListener('mouseenter', function () {
        if (!isTouchDevice) showTip(chip);
      });
      chip.addEventListener('mouseleave', function () {
        if (!isTouchDevice) hideTip();
      });

      // Mobile: tap to toggle
      chip.addEventListener('click', function (e) {
        if (!isTouchDevice) return;
        e.stopPropagation();
        if (activeChip === chip) {
          hideTip();
        } else {
          showTip(chip);
        }
      });
    });

    // Dismiss on outside tap (mobile)
    document.addEventListener('click', function () {
      if (isTouchDevice && activeChip) {
        popup.classList.remove('aa-tip-popup--visible');
        activeChip = null;
      }
    });

    // Dismiss on scroll
    window.addEventListener('scroll', function () {
      if (activeChip) {
        popup.classList.remove('aa-tip-popup--visible');
        activeChip = null;
      }
    }, { passive: true });
  }

  /* --- Boot --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
