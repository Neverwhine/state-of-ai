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

  /* --- Boot --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
