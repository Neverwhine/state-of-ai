/* ====================================
   SEC-3: ANATOMY OF AN AI AGENT — JS
   Self-contained IIFE, no dependencies
   ==================================== */

(function () {
  'use strict';

  /* Shared tooltip popup (singleton) */
  var popup = null;
  var hideTimer = null;
  var activeEl = null;
  var isTouchDevice = 'ontouchstart' in window;

  function getPopup() {
    if (!popup) {
      popup = document.createElement('div');
      popup.className = 'aa-tip-popup';
      document.body.appendChild(popup);

      // Dismiss on outside tap (mobile)
      document.addEventListener('click', function () {
        if (isTouchDevice && activeEl) {
          popup.classList.remove('aa-tip-popup--visible');
          activeEl = null;
        }
      });
      // Dismiss on scroll
      window.addEventListener('scroll', function () {
        if (activeEl) {
          popup.classList.remove('aa-tip-popup--visible');
          activeEl = null;
        }
      }, { passive: true });
    }
    return popup;
  }

  function showTip(el, modifier) {
    var p = getPopup();
    clearTimeout(hideTimer);
    activeEl = el;
    p.innerHTML = el.getAttribute('data-tip');

    // Modifier classes
    p.classList.remove('aa-tip-popup--funded', 'aa-tip-popup--model');
    if (modifier) p.classList.add(modifier);

    // Position: measure first
    p.style.visibility = 'hidden';
    p.style.display = 'block';
    p.classList.remove('aa-tip-popup--visible');

    var rect = el.getBoundingClientRect();
    var popW = p.offsetWidth;
    var popH = p.offsetHeight;

    var left = rect.left + rect.width / 2 - popW / 2;
    var top = rect.bottom + 10;

    if (top + popH > window.innerHeight - 10) {
      top = rect.top - popH - 10;
    }
    if (left < 10) left = 10;
    if (left + popW > window.innerWidth - 10) left = window.innerWidth - popW - 10;

    p.style.left = left + 'px';
    p.style.top = top + 'px';
    p.style.visibility = '';
    p.style.display = '';

    requestAnimationFrame(function () {
      p.classList.add('aa-tip-popup--visible');
    });
  }

  function hideTip() {
    hideTimer = setTimeout(function () {
      if (popup) popup.classList.remove('aa-tip-popup--visible');
      activeEl = null;
    }, 150);
  }

  function bindTipEvents(el, modifier) {
    el.addEventListener('mouseenter', function () {
      if (!isTouchDevice) showTip(el, modifier);
    });
    el.addEventListener('mouseleave', function () {
      if (!isTouchDevice) hideTip();
    });
    el.addEventListener('click', function (e) {
      if (!isTouchDevice) return;
      e.stopPropagation();
      if (activeEl === el) { hideTip(); } else { showTip(el, modifier); }
    });
  }

  function init() {
    var sec5 = document.getElementById('sec-5');
    if (sec5 && sec5.classList.contains('section--agent-anatomy')) {
      initAccordion(sec5);
      initChipTooltips(sec5);
    }
    initModelCardTooltips();
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

  /* --- Chip Tooltips (data-tip) for sec-5 --- */
  function initChipTooltips(sec) {
    var chips = sec.querySelectorAll('.aa-tool-chip--has-tip[data-tip]');
    if (!chips.length) return;

    chips.forEach(function (chip) {
      var mod = (chip.classList.contains('aa-tool-chip--funded') || chip.classList.contains('aa-tool-chip--dvc'))
        ? 'aa-tip-popup--funded' : null;
      bindTipEvents(chip, mod);
    });
  }

  /* --- Model Card Tooltips (data-tip) for sec-3 --- */
  function initModelCardTooltips() {
    var sec3 = document.getElementById('sec-3');
    if (!sec3) return;
    var cards = sec3.querySelectorAll('.model-card[data-tip]');
    if (!cards.length) return;

    cards.forEach(function (card) {
      card.style.cursor = 'pointer';
      bindTipEvents(card, 'aa-tip-popup--model');
    });
  }

  /* --- Generic data-tip Tooltips (any element with data-tip outside sec-3/sec-5) --- */
  function initGenericTooltips() {
    var els = document.querySelectorAll('[data-tip]');
    if (!els.length) return;

    els.forEach(function (el) {
      // Skip already-bound elements (sec-3 model cards, sec-5 chips)
      if (el.classList.contains('model-card') || el.classList.contains('aa-tool-chip--has-tip')) return;
      if (el._tipBound) return;
      el._tipBound = true;
      bindTipEvents(el, null);
    });
  }

  /* --- Boot --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { init(); initGenericTooltips(); });
  } else {
    init();
    initGenericTooltips();
  }
})();
