/* slides.js — State of AI slideshow
 * Navigation + per-slide animation triggers.
 * All numbers come from window.SLIDES_DATA.
 */
(function () {
  'use strict';

  const D = window.SLIDES_DATA;
  if (!D) {
    console.error('[slides] SLIDES_DATA not found. slides-data.js must load before slides.js');
    return;
  }

  // ── Chart.js global defaults to match dark theme ──
  if (window.Chart) {
    Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#A0A8BC';
    Chart.defaults.borderColor = 'rgba(160,168,188,0.12)';
  }

  // ── Slide registry ──
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  const totalEl = document.getElementById('slideTotal');
  const numEl = document.getElementById('slideNum');
  const progressEl = document.getElementById('progressFill');
  if (totalEl) totalEl.textContent = total;

  let activeIndex = 0;
  const animatedFor = new Set(); // slide indexes whose animation has played

  // Wire up dive-deeper anchor links
  document.querySelectorAll('.dive-deeper').forEach(a => {
    const n = parseInt(a.dataset.slideLink, 10);
    a.href = (D.diveDeeperAnchors && D.diveDeeperAnchors[n]) || 'index.html';
  });

  // ── Activate a slide ──
  function activate(idx) {
    idx = Math.max(0, Math.min(total - 1, idx));
    if (idx === activeIndex && document.querySelector('.slide.is-active')) {
      // still trigger first animation
    }
    slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    activeIndex = idx;
    if (numEl) numEl.textContent = idx + 1;
    if (progressEl) progressEl.style.width = (((idx + 1) / total) * 100) + '%';
    if (!animatedFor.has(idx)) {
      animatedFor.add(idx);
      // small delay so the crossfade has begun
      setTimeout(() => triggerSlideAnimation(idx + 1), 120);
    }
  }

  function next() { activate(activeIndex + 1); }
  function prev() { activate(activeIndex - 1); }

  // ── Keyboard ──
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault(); next();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault(); prev();
    } else if (e.key === 'Escape') {
      window.location.href = 'index.html';
    } else if (e.key === 'Home') {
      activate(0);
    } else if (e.key === 'End') {
      activate(total - 1);
    }
  });

  // ── Click zones ──
  const zPrev = document.getElementById('zonePrev');
  const zNext = document.getElementById('zoneNext');
  if (zPrev) zPrev.addEventListener('click', prev);
  if (zNext) zNext.addEventListener('click', next);

  // ── Touch swipe ──
  let touchStartX = 0, touchStartY = 0;
  document.addEventListener('touchstart', e => {
    if (!e.touches[0]) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!e.changedTouches[0]) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next(); else prev();
    }
  }, { passive: true });

  // ── On mobile (no virtual slides) — let scroll happen but still animate on enter ──
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isMobile) {
    // Make all slides visible (CSS already does this); use IntersectionObserver
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const n = parseInt(en.target.dataset.slide, 10);
          if (!animatedFor.has(n - 1)) {
            animatedFor.add(n - 1);
            triggerSlideAnimation(n);
          }
          if (numEl) numEl.textContent = n;
          if (progressEl) progressEl.style.width = ((n / total) * 100) + '%';
        }
      });
    }, { threshold: 0.4 });
    slides.forEach(s => io.observe(s));
  }

  // ── Dispatcher ──
  function triggerSlideAnimation(n) {
    try {
      const fn = ANIMATIONS[n];
      if (fn) fn();
    } catch (err) {
      console.warn('[slides] animation error on slide', n, err);
    }
  }

  // ════════════════════════════════════════════════════════
  //   SLIDE-BY-SLIDE ANIMATIONS
  // ════════════════════════════════════════════════════════
  const ANIMATIONS = {};

  // ─── SLIDE 1 — OpenClaw house ───
  ANIMATIONS[1] = function () {
    const icons = document.querySelectorAll('#slide-1 .house-icon');
    if (window.gsap) {
      gsap.fromTo(icons,
        { opacity: 0, scale: 0.6, transformOrigin: 'center' },
        { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.7)', stagger: 0.18 }
      );
    } else {
      icons.forEach((el, i) => setTimeout(() => el.classList.add('is-revealed'), i * 180));
    }
  };

  // ─── SLIDE 2 — Tech cycles draw ───
  ANIMATIONS[2] = function () {
    const curves = document.querySelectorAll('#slide-2 .cycle-curve');
    curves.forEach((c, i) => {
      // measure path length for accurate animation
      const len = c.getTotalLength ? c.getTotalLength() : 1200;
      c.style.strokeDasharray = len;
      c.style.strokeDashoffset = len;
      // force reflow then transition
      requestAnimationFrame(() => {
        setTimeout(() => {
          c.style.transition = 'stroke-dashoffset 1400ms ease-out';
          c.style.strokeDashoffset = '0';
        }, i * 350);
      });
    });
  };

  // ─── STACK VISUAL HELPERS (slides 3, 4, 5) ───
  // Build a single-column stack of 5 layer cards into a container element.
  // mode: 'full' | 'revenue' | 'margin' | 'small'
  function buildStackViz(container, mode) {
    if (!container || container.children.length) return [];
    const layers = D.stackLayers || [];
    const cards = [];
    layers.forEach(layer => {
      const card = document.createElement('div');
      card.className = 'stack-layer';
      card.style.setProperty('--accent', layer.accent);

      const badge = document.createElement('span');
      badge.className = 'stack-badge';
      badge.textContent = layer.badge;

      const title = document.createElement('span');
      title.className = 'stack-title';
      title.textContent = layer.title;

      const value = document.createElement('span');
      value.className = 'stack-value';

      const label = document.createElement('span');
      label.className = 'stack-label';

      if (mode === 'margin') {
        // Margin lens: width-proportional bar, semantic coloring
        value.textContent = layer.marginPct + '%';
        label.textContent = layer.marginRange;
        // semantic color: high (>=40) teal, mid (20-39) gold, low (<20) coral
        const m = layer.marginPct;
        const semantic = m >= 40 ? '#4ECDC4' : (m < 20 ? '#E8837C' : '#F5C542');
        card.style.setProperty('--accent', semantic);
        card.classList.add('stack-layer--margin');
        // store target width pct for animation
        card.dataset.marginPct = m;
      } else if (mode === 'revenue') {
        value.textContent = layer.revenue2026;
        label.textContent = layer.growth + ' · ' + layer.revenueLabel;
      } else {
        // 'full' or 'small'
        value.textContent = layer.revenue2026;
        label.textContent = layer.revenueLabel;
      }

      card.appendChild(badge);
      card.appendChild(title);
      card.appendChild(value);
      card.appendChild(label);
      container.appendChild(card);
      cards.push(card);
    });
    return cards;
  }

  // ─── SLIDE 3 — The Stack: stagger reveal of 5 layers ───
  ANIMATIONS[3] = function () {
    const container = document.getElementById('stackViz3');
    const cards = buildStackViz(container, 'full');
    if (!cards.length) return;
    if (window.gsap) {
      gsap.fromTo(cards,
        { opacity: 0, y: -16 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.12 }
      );
    } else {
      cards.forEach((c, i) => setTimeout(() => c.classList.add('is-revealed'), i * 120));
    }
  };

  // ─── SLIDE 4 — Same stack, two lenses (revenue vs margin) ───
  ANIMATIONS[4] = function () {
    const revContainer = document.getElementById('stackVizRev');
    const marContainer = document.getElementById('stackVizMar');
    const revCards = buildStackViz(revContainer, 'revenue');
    const marCards = buildStackViz(marContainer, 'margin');
    if (!revCards.length || !marCards.length) return;

    if (window.gsap) {
      const tl = gsap.timeline();
      // 1. Reveal left (revenue) stack
      tl.fromTo(revCards,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.08 }
      );
      // 2. Fade in right (margin) stack background cards
      tl.fromTo(marCards,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.06 },
        '+=0.2'
      );
      // 3. Animate margin bars: width 0% → marginPct (using CSS custom property width)
      marCards.forEach(card => {
        const pct = parseFloat(card.dataset.marginPct) || 0;
        // initialize width to 0, then animate
        card.style.setProperty('--bar-width', '0%');
        tl.to(card, {
          duration: 0.7, ease: 'power2.out',
          onUpdate: function() {
            const p = this.progress();
            card.style.setProperty('--bar-width', (pct * p) + '%');
          }
        }, '<0.05');
      });
    } else {
      revCards.forEach((c, i) => setTimeout(() => c.classList.add('is-revealed'), i * 80));
      marCards.forEach((c, i) => {
        setTimeout(() => {
          c.classList.add('is-revealed');
          c.style.setProperty('--bar-width', (parseFloat(c.dataset.marginPct) || 0) + '%');
        }, 500 + i * 80);
      });
    }
  };

  // ─── SLIDE 5 — Two forces: stack + arrows reveal ───
  ANIMATIONS[5] = function () {
    const container = document.getElementById('stackViz5');
    const cards = buildStackViz(container, 'small');
    const paths = document.querySelectorAll('#slide-5 .force-path');

    if (window.gsap) {
      const tl = gsap.timeline();
      tl.fromTo(cards,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.09 }
      );
    } else {
      cards.forEach((c, i) => setTimeout(() => c.classList.add('is-revealed'), i * 90));
    }

    // SVG arrow stroke-dashoffset reveal
    paths.forEach((p, i) => {
      const len = p.getTotalLength ? p.getTotalLength() : 600;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      requestAnimationFrame(() => {
        setTimeout(() => {
          p.style.transition = 'stroke-dashoffset 1100ms ease-out';
          p.style.strokeDashoffset = '0';
        }, 600 + i * 250);
      });
    });
  };

  // ─── SLIDE 6 — Funnel (GSAP) ───
  ANIMATIONS[6] = function () {
    const dotsG  = document.getElementById('funnelDots');
    const appsG  = document.getElementById('funnelApps');
    const modsG  = document.getElementById('funnelModels');
    if (!dotsG || dotsG.children.length) return; // already built

    const SVG_NS = 'http://www.w3.org/2000/svg';

    // ── 1. user dots — random across top ──
    const dots = [];
    for (let i = 0; i < 60; i++) {
      const c = document.createElementNS(SVG_NS, 'circle');
      const x = 80 + Math.random() * 740;
      const y = 50 + Math.random() * 30;
      c.setAttribute('cx', x);
      c.setAttribute('cy', y);
      c.setAttribute('r', 2.5);
      c.setAttribute('class', 'funnel-dot');
      c.setAttribute('data-x0', x);
      c.setAttribute('data-y0', y);
      dotsG.appendChild(c);
      dots.push(c);
    }

    // ── 2. app pills — middle band, evenly spaced ──
    const apps = D.appLayer;
    const bandY = 200;
    const slotW = 760 / apps.length;
    apps.forEach((a, i) => {
      const x = 80 + slotW * i + slotW / 2;
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('transform', `translate(${x},${bandY})`);

      const pill = document.createElementNS(SVG_NS, 'rect');
      pill.setAttribute('x', -55); pill.setAttribute('y', -22);
      pill.setAttribute('width', 110); pill.setAttribute('height', 44);
      pill.setAttribute('rx', 8);
      pill.setAttribute('class', a.dvc ? 'app-pill app-pill--dvc' : 'app-pill');
      if (a.dvc) {
        pill.setAttribute('fill', 'rgba(78,205,196,0.10)');
      }
      g.appendChild(pill);

      const t1 = document.createElementNS(SVG_NS, 'text');
      t1.setAttribute('class', 'app-pill-text');
      t1.setAttribute('y', -2);
      t1.textContent = a.name;
      if (a.dvc) t1.setAttribute('fill', '#4ECDC4');
      g.appendChild(t1);

      const t2 = document.createElementNS(SVG_NS, 'text');
      t2.setAttribute('class', 'app-pill-val');
      t2.setAttribute('y', 14);
      t2.textContent = a.val;
      g.appendChild(t2);

      appsG.appendChild(g);
    });

    // ── 3. model logos band (rotating) ──
    const modelPool = ['DeepSeek V3.2', 'GPT-5.5', 'Claude 4.1', 'Gemini 2.5', 'Qwen 3', 'GLM-5', 'Llama 4'];
    const modelSlots = 5;
    const modelY = 440;
    const modelTexts = [];
    for (let i = 0; i < modelSlots; i++) {
      const x = 120 + (660 / (modelSlots - 1)) * i;
      const t = document.createElementNS(SVG_NS, 'text');
      t.setAttribute('class', 'model-logo-text');
      t.setAttribute('x', x);
      t.setAttribute('y', modelY);
      t.textContent = modelPool[i % modelPool.length];
      modsG.appendChild(t);
      modelTexts.push({ el: t, idx: i });
    }
    // rotate every 2s
    let modelTick = modelSlots;
    const modelTimer = setInterval(() => {
      modelTexts.forEach((m, i) => {
        // fade out / in
        if (window.gsap) {
          gsap.to(m.el, { opacity: 0, duration: 0.35, onComplete: () => {
            m.el.textContent = modelPool[(modelTick + i) % modelPool.length];
            gsap.to(m.el, { opacity: 1, duration: 0.35 });
          }});
        } else {
          m.el.textContent = modelPool[(modelTick + i) % modelPool.length];
        }
      });
      modelTick++;
    }, 2200);
    // stash so we can clear later if needed
    document.getElementById('slide-6')._modelTimer = modelTimer;

    // ── 4. animate dots flowing top → app layer → models ──
    if (window.gsap) {
      dots.forEach((d, i) => {
        const x0 = parseFloat(d.getAttribute('data-x0'));
        const targetApp = appsG.children[i % apps.length];
        const tm = targetApp.getAttribute('transform').match(/translate\(([\d.]+),([\d.]+)\)/);
        const ax = parseFloat(tm[1]);
        const ay = parseFloat(tm[2]);
        // model slot (round-robin)
        const mIdx = i % modelSlots;
        const mx = 120 + (660 / (modelSlots - 1)) * mIdx;
        const my = modelY - 16;

        const tl = gsap.timeline({ delay: i * 0.04, repeat: -1, repeatDelay: 1.6 });
        tl.set(d, { attr: { cx: x0, cy: parseFloat(d.getAttribute('data-y0')) }, opacity: 0 });
        tl.to(d, { opacity: 0.7, duration: 0.2 });
        tl.to(d, { attr: { cx: ax, cy: ay - 22 }, duration: 1.0, ease: 'power2.in' });
        tl.to(d, { opacity: 0, duration: 0.15 });
        tl.to(d, { attr: { cx: mx, cy: my }, duration: 0.6, ease: 'power2.out' });
        tl.to(d, { opacity: 0.5, duration: 0.2 }, '-=0.6');
        tl.to(d, { opacity: 0, duration: 0.3 });
      });
    }
  };

  // ─── SLIDE 7 — Model cluster dissolve ───
  ANIMATIONS[7] = function () {
    const svg = document.getElementById('clusterSvg');
    if (!svg || svg.children.length) return;
    const SVG_NS = 'http://www.w3.org/2000/svg';

    const groups = D.modelClusterGroups;
    const allItems = [
      ...groups.commodity.map(n  => ({ name: n, group: 'commodity' })),
      ...groups.specialist.map(n => ({ name: n, group: 'specialist' })),
      ...groups.govOnly.map(n    => ({ name: n, group: 'govOnly' })),
      ...groups.deprecated.map(n => ({ name: n, group: 'deprecated' }))
    ];

    // Initial positions: clustered in center with jitter
    const centerX = 600, centerY = 240;
    const initR = 110;

    const circleEls = [];
    allItems.forEach((it, i) => {
      const ang = (i / allItems.length) * Math.PI * 2;
      const r = initR * (0.4 + Math.random() * 0.6);
      const cx = centerX + Math.cos(ang) * r;
      const cy = centerY + Math.sin(ang) * r;

      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'cluster-circle' + (it.group === 'deprecated' ? ' cluster-circle--deprecated' : ''));
      g.setAttribute('transform', `translate(${cx},${cy})`);

      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('class', 'circle-shape');
      c.setAttribute('r', 36);
      const fillMap = {
        commodity:   'rgba(232,131,124,0.16)',
        specialist:  'rgba(245,197,66,0.16)',
        govOnly:     'rgba(160,168,188,0.16)',
        deprecated:  'rgba(124,77,255,0.10)'
      };
      const strokeMap = {
        commodity:   '#E8837C',
        specialist:  '#F5C542',
        govOnly:     '#A0A8BC',
        deprecated:  '#7C4DFF'
      };
      c.setAttribute('fill', fillMap[it.group]);
      c.setAttribute('stroke', strokeMap[it.group]);
      c.setAttribute('stroke-width', '1.5');
      g.appendChild(c);

      const t = document.createElementNS(SVG_NS, 'text');
      t.setAttribute('class', 'cluster-circle-text');
      t.setAttribute('y', 4);
      t.textContent = it.name;
      g.appendChild(t);

      // strikethrough for deprecated
      if (it.group === 'deprecated') {
        const ln = document.createElementNS(SVG_NS, 'line');
        ln.setAttribute('x1', -32); ln.setAttribute('x2', 32);
        ln.setAttribute('y1', 0);   ln.setAttribute('y2', 0);
        ln.setAttribute('stroke', '#E8837C'); ln.setAttribute('stroke-width', '2');
        g.appendChild(ln);
      }

      svg.appendChild(g);
      circleEls.push({ el: g, item: it, x0: cx, y0: cy });
    });

    // Animation timeline
    if (!window.gsap) return;
    const tl = gsap.timeline();

    // 1. Pulse the cluster — fade in (don't touch transform; we use it for positioning)
    tl.fromTo(circleEls.map(c => c.el), { opacity: 0 },
      { opacity: 1, duration: 0.55, stagger: 0.03, ease: 'power2.out' });
    // pulse the inner circle shapes (scale on a non-transformed child element)
    tl.fromTo(svg.querySelectorAll('.cluster-circle .circle-shape'),
      { scale: 0.6, transformOrigin: '50% 50%' },
      { scale: 1, duration: 0.5, ease: 'back.out(1.7)', stagger: 0.02 }, '-=0.4');
    tl.to(svg.querySelectorAll('.cluster-circle .circle-shape'),
      { scale: 1.12, duration: 0.35, yoyo: true, repeat: 1, transformOrigin: '50% 50%' }, '+=0.15');

    // 2. Split into groups
    // Layout targets:
    const groupTargets = {
      commodity:  { cx: 220,  cyStart: 200, dx: 0, dy: 60 }, // 6 circles in 2x3 grid
      specialist: { cx: 600,  cyStart: 200, dx: 0, dy: 60 }, // 4 circles in 1x4
      govOnly:    { cx: 980,  cyStart: 220, dx: 0, dy: 60 }, // 2 circles
      deprecated: { cx: 600,  cyStart: 480, dx: 0, dy: 0  }  // bottom
    };

    // Compute target per circle within its group
    const counters = { commodity: 0, specialist: 0, govOnly: 0, deprecated: 0 };
    circleEls.forEach(ce => {
      const g = ce.item.group;
      const idx = counters[g]++;
      let tx, ty;
      if (g === 'commodity') {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        tx = 160 + col * 140;
        ty = 160 + row * 90;
      } else if (g === 'specialist') {
        const row = idx; // 4 rows
        tx = 600;
        ty = 130 + row * 80;
      } else if (g === 'govOnly') {
        tx = 980;
        ty = 200 + idx * 90;
      } else { // deprecated
        tx = 600;
        ty = 470;
      }
      ce.tx = tx; ce.ty = ty;
    });

    // Tween each circle to its target position individually (per-element targets)
    circleEls.forEach((ce, i) => {
      tl.to(ce.el, {
        duration: 1.2, ease: 'power3.inOut',
        attr: { transform: `translate(${ce.tx},${ce.ty})` }
      }, i === 0 ? '+=0.3' : '<');
    });

    // Reveal labels
    tl.add(() => {
      document.getElementById('labelCommodity').classList.add('is-revealed');
      document.getElementById('labelSpecialist').classList.add('is-revealed');
      document.getElementById('labelGov').classList.add('is-revealed');
    }, '-=0.6');

    // 3. Fade deprecated to bottom
    const dep = circleEls.filter(c => c.item.group === 'deprecated').map(c => c.el);
    if (dep.length) {
      tl.to(dep, { opacity: 0.4, duration: 0.6 }, '+=0.3');
    }
  };

  // ─── SLIDE 8 — Smarter AND cheaper dual axis ───
  let smarterChart = null;
  ANIMATIONS[8] = function () {
    if (smarterChart) return;
    const ctx = document.getElementById('smarterChart');
    if (!ctx || !window.Chart) return;

    const labels = D.smarterCurve.map(p => p.date);
    const mmlu   = D.smarterCurve.map(p => p.mmlu);
    const cost   = D.smarterCurve.map(p => p.cost);

    smarterChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'MMLU benchmark (%)',
            data: mmlu,
            yAxisID: 'yMMLU',
            borderColor: '#4ECDC4',
            backgroundColor: 'rgba(78,205,196,0.10)',
            fill: false, tension: 0.3,
            pointBackgroundColor: '#4ECDC4', pointRadius: 5, pointBorderColor: '#fff', pointBorderWidth: 1,
            borderWidth: 3
          },
          {
            label: 'Cost ($/M tokens)',
            data: cost,
            yAxisID: 'yCost',
            borderColor: '#E8837C',
            backgroundColor: 'rgba(232,131,124,0.08)',
            fill: false, tension: 0.3,
            pointBackgroundColor: '#E8837C', pointRadius: 5, pointBorderColor: '#fff', pointBorderWidth: 1,
            borderWidth: 3, borderDash: [6, 4]
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 1800, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            position: 'top', align: 'end',
            labels: { color: '#E8ECEF', font: { size: 12, weight: '600' }, boxWidth: 14 }
          },
          tooltip: { backgroundColor: '#1f2433', borderColor: '#4ECDC4', borderWidth: 1 }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#A0A8BC', font: { weight: '600' } } },
          yMMLU: {
            position: 'left', min: 60, max: 100,
            grid: { color: 'rgba(160,168,188,0.08)' },
            ticks: { color: '#4ECDC4', callback: v => v + '%' },
            title: { display: true, text: 'MMLU (capability) ↑', color: '#4ECDC4', font: { weight: '700', size: 11 } }
          },
          yCost: {
            type: 'logarithmic',
            position: 'right', min: 0.1, max: 100,
            grid: { drawOnChartArea: false },
            ticks: { color: '#E8837C', callback: v => '$' + (v < 1 ? v : v.toFixed(0)) },
            title: { display: true, text: '$ / M tokens (cost) ↓', color: '#E8837C', font: { weight: '700', size: 11 } }
          }
        }
      },
      plugins: [{
        id: 'crossoverLabel',
        afterDatasetsDraw(chart) {
          const meta = chart.getDatasetMeta(0);
          if (!meta.data || meta.data.length < 3) return;
          const p = meta.data[2]; // 2025 point — approximate crossover
          const ctx = chart.ctx;
          ctx.save();
          ctx.fillStyle = '#F5C542';
          ctx.font = '700 11px Inter';
          ctx.textAlign = 'center';
          ctx.fillText('The assumption broke.', p.x, p.y - 18);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
          ctx.strokeStyle = '#F5C542'; ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
      }]
    });
  };

  // ─── SLIDE 9 — Physical AI map ───
  ANIMATIONS[9] = function () {
    const pins = document.querySelectorAll('#slide-9 .map-pin');
    const routes = document.querySelectorAll('#slide-9 .route');
    pins.forEach((p, i) => setTimeout(() => p.classList.add('is-active'), 150 + i * 120));
    setTimeout(() => routes.forEach(r => r.classList.add('is-active')), 600);

    // numbers
    const map = {
      physWaymo:   D.physicalAI.waymoWeeklyRides,
      physTAM:     D.physicalAI.laborMarketTAM,
      physTesla:   D.physicalAI.teslaFSDMiles,
      physAurora:  D.physicalAI.auroraTrucks
    };
    Object.keys(map).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });
  };

  // ─── SLIDE 10 — Pricing + ARPU bar chart ───
  let arpuChart = null;
  ANIMATIONS[10] = function () {
    if (arpuChart) return;
    const ctx = document.getElementById('arpuChart');
    if (!ctx || !window.Chart) return;
    const labels = D.arpu.map(a => a.name);
    const values = D.arpu.map(a => a.value);
    const colors = D.arpu.map(a => a.color);

    arpuChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'ARPU ($/mo)',
          data: values,
          backgroundColor: colors,
          borderRadius: 4,
          borderWidth: 0
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 1100, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#1f2433', borderColor: '#4ECDC4', borderWidth: 1,
            callbacks: { label: c => '$' + c.parsed.x.toFixed(2) + ' / mo' } }
        },
        scales: {
          x: { beginAtZero: true,
            grid: { color: 'rgba(160,168,188,0.08)' },
            ticks: { color: '#A0A8BC', callback: v => '$' + v } },
          y: { grid: { display: false }, ticks: { color: '#E8ECEF', font: { weight: '700' } } }
        }
      },
      plugins: [{
        id: 'arpuLabels',
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          const meta = chart.getDatasetMeta(0);
          ctx.save();
          ctx.font = '800 13px Inter';
          ctx.fillStyle = '#E8ECEF';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          meta.data.forEach((bar, i) => {
            ctx.fillText('$' + values[i].toFixed(2), bar.x + 8, bar.y);
          });
          ctx.restore();
        }
      }]
    });
  };

  // ─── SLIDE 11 — Close (cycles + you-are-here) ───
  ANIMATIONS[11] = function () {
    const curves = document.querySelectorAll('#slide-11 .cycle-curve');
    curves.forEach((c, i) => {
      const len = c.getTotalLength ? c.getTotalLength() : 1200;
      c.style.strokeDasharray = len;
      c.style.strokeDashoffset = len;
      requestAnimationFrame(() => {
        setTimeout(() => {
          c.style.transition = 'stroke-dashoffset 1400ms ease-out';
          c.style.strokeDashoffset = '0';
        }, i * 300);
      });
    });
    // YAH already pulses via CSS
  };

  // ── Start ──
  // pick initial slide from hash (#slide-3 etc.)
  const m = location.hash.match(/^#slide-(\d+)$/);
  const startIdx = m ? Math.max(0, Math.min(total - 1, parseInt(m[1], 10) - 1)) : 0;
  activate(startIdx);

  // expose for debugging
  window.__deck = { activate, next, prev, get index() { return activeIndex; } };
})();
