/* ============================================================
   SEC-2: The Autonomous Revolution — Interactions
   ============================================================ */
(function () {
  'use strict';

  function initSec2() {
    var section = document.getElementById('sec-4');
    if (!section) return;

    initAgentCards(section);
    initDeployBars(section);
    initTaskChart(section);
    initTechSpec(section);
    initParticleCanvas(section);
  }

  /* ── 1. Agent Card Expand / Collapse ── */

  function initAgentCards(section) {
    var cards = section.querySelectorAll('.ar-agent-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var wasExpanded = card.classList.contains('ar-card--expanded');
        cards.forEach(function (c) {
          if (c !== card) c.classList.remove('ar-card--expanded');
        });
        if (wasExpanded) {
          card.classList.remove('ar-card--expanded');
        } else {
          card.classList.add('ar-card--expanded');
        }
      });
    });
  }

  /* ── 2. Deploy Bar Animation ── */

  function initDeployBars(section) {
    var bars = section.querySelectorAll('.ar-deploy-bar-fill');
    if (!bars.length) return;

    var triggered = false;
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !triggered) {
            triggered = true;
            bars.forEach(function (bar) {
              var target = bar.getAttribute('data-target');
              if (target) {
                bar.style.width = target;
              }
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    var grid = section.querySelector('.ar-deploy-grid');
    if (grid) observer.observe(grid);
  }

  /* ── 3. Task Chart Bar Animation ── */

  function initTaskChart(section) {
    var fills = section.querySelectorAll('.ar-task-fill');
    if (!fills.length) return;

    var triggered = false;
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !triggered) {
            triggered = true;
            fills.forEach(function (fill, i) {
              setTimeout(function () {
                fill.classList.add('animated');
              }, i * 120);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    var chart = section.querySelector('.ar-task-chart');
    if (chart) observer.observe(chart);
  }

  /* ── 4. Tech Spec Collapse Toggle ── */

  function initTechSpec(section) {
    section.querySelectorAll('.ar-techspec-header').forEach(function (header) {
      header.addEventListener('click', function () {
        header.closest('.ar-techspec').classList.toggle('open');
      });
    });
  }

  /* ── 5. Particle Canvas ── */

  function initParticleCanvas(section) {
    var canvas = document.getElementById('arParticleCanvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var particles = [];
    var PARTICLE_COUNT = 40;
    var COLORS = ['#4ECDC4', '#F5C542', '#E8837C', '#4A90D9'];
    var animating = false;
    var rafId = null;

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    function createParticle() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.2 + 0.1),
        r: Math.random() * 1.5 + 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.07 + 0.08,
      };
    }

    function init() {
      resize();
      particles = [];
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle());
      }
    }

    function hexToRgb(hex) {
      var r = parseInt(hex.slice(1, 3), 16);
      var g = parseInt(hex.slice(3, 5), 16);
      var b = parseInt(hex.slice(5, 7), 16);
      return { r: r, g: g, b: b };
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* Draw connections */
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            var rgb = hexToRgb(particles[i].color);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle =
              'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (0.03 * (1 - dist / 120)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      /* Draw particles */
      for (var k = 0; k < particles.length; k++) {
        var p = particles[k];
        var c = hexToRgb(p.color);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + p.alpha + ')';
        ctx.fill();
      }
    }

    function update() {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        /* Wrap around edges */
        if (p.y < -5) {
          p.y = canvas.height + 5;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -5) p.x = canvas.width + 5;
        if (p.x > canvas.width + 5) p.x = -5;
      }
    }

    function loop() {
      if (!animating) return;
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (animating) return;
      animating = true;
      resize();
      loop();
    }

    function stop() {
      animating = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    /* Only animate when visible */
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            start();
          } else {
            stop();
          }
        });
      },
      { threshold: 0.05 }
    );

    init();
    observer.observe(canvas.parentElement);

    /* Handle resize */
    var resizeTimeout;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function () {
        resize();
        /* Re-constrain particles */
        particles.forEach(function (p) {
          if (p.x > canvas.width) p.x = Math.random() * canvas.width;
          if (p.y > canvas.height) p.y = Math.random() * canvas.height;
        });
      }, 200);
    });

    /* Respect reduced motion */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      init();
      draw();
      /* Don't animate, just show static particles */
      return;
    }
  }

  /* ── Init on DOM ready ── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSec2);
  } else {
    initSec2();
  }
})();

/* ── Additional handlers for reconciled class names ── */
(function () {
  'use strict';

  function initSec2Extra() {
    var section = document.getElementById('sec-4');
    if (!section) return;

    /* Deploy bar animation using CSS custom property --bar-pct */
    var deployGrid = section.querySelector('.ar-deploy-grid');
    if (deployGrid) {
      var deployObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            section.querySelectorAll('.ar-deploy-bar-fill').forEach(function (fill) {
              var pct = getComputedStyle(fill).getPropertyValue('--bar-pct');
              if (pct) fill.style.width = pct.trim();
            });
            deployObserver.disconnect();
          }
        });
      }, { threshold: 0.2 });
      deployObserver.observe(deployGrid);
    }

    /* Stat bar fill animation */
    var statBar = section.querySelector('.ar-stat-bar-fill');
    if (statBar) {
      var statObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            statBar.classList.add('animated');
            statObserver.disconnect();
          }
        });
      }, { threshold: 0.3 });
      statObserver.observe(statBar);
    }

    /* How It Works toggle */
    section.querySelectorAll('.ar-howworks-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parent = btn.closest('.ar-howworks');
        parent.classList.toggle('open');
        btn.setAttribute('aria-expanded', parent.classList.contains('open'));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSec2Extra);
  } else {
    initSec2Extra();
  }
})();
