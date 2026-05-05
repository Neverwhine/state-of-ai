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

  // ─── SLIDES 3 / 4 — Stack chart + Margin morph ───
  let stackChart = null, marginChart = null;

  ANIMATIONS[3] = function () {
    if (stackChart) return;
    const ctx = document.getElementById('stackChart');
    if (!ctx || !window.Chart) return;
    const labels = D.stackRevenue.map(r => r.layer);
    const y2024  = D.stackRevenue.map(r => r.y2024);
    const y2026  = D.stackRevenue.map(r => r.y2026);
    const growth = D.stackRevenue.map(r => r.growth);

    stackChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '2024 ($B)',
            data: y2024,
            backgroundColor: 'rgba(160,168,188,0.45)',
            borderColor: 'rgba(160,168,188,0.7)',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: '2026 ($B)',
            data: y2026,
            backgroundColor: '#4ECDC4',
            borderColor: '#4ECDC4',
            borderWidth: 0,
            borderRadius: 4
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1100, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            position: 'top', align: 'end',
            labels: { color: '#E8ECEF', boxWidth: 10, boxHeight: 10, font: { size: 11, weight: '600' } }
          },
          tooltip: {
            backgroundColor: '#1f2433', borderColor: '#4ECDC4', borderWidth: 1,
            titleColor: '#E8ECEF', bodyColor: '#A0A8BC',
            callbacks: {
              afterLabel: ctx => ctx.datasetIndex === 1 ? `Growth: ${growth[ctx.dataIndex]}` : ''
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 240,
            grid: { color: 'rgba(160,168,188,0.08)' },
            ticks: { color: '#A0A8BC', callback: v => '$' + v + 'B' }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#E8ECEF', font: { weight: '600' } }
          }
        }
      },
      plugins: [growthLabelPlugin(growth)]
    });
  };

  // Custom plugin: paint growth % at end of each row
  function growthLabelPlugin(growthArr) {
    return {
      id: 'growthLabels',
      afterDatasetsDraw(chart) {
        const { ctx, scales } = chart;
        const ds = chart.data.datasets[1]; // 2026 dataset
        if (!ds) return;
        const meta = chart.getDatasetMeta(1);
        ctx.save();
        ctx.font = '700 11px Inter';
        ctx.fillStyle = '#F5C542';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        meta.data.forEach((bar, i) => {
          const v = growthArr[i];
          if (v == null) return;
          ctx.fillText(v, bar.x + 8, bar.y);
        });
        ctx.restore();
      }
    };
  }

  ANIMATIONS[4] = function () {
    if (marginChart) return;
    const ctx = document.getElementById('marginChart');
    if (!ctx || !window.Chart) return;
    const labels  = D.stackMargins.map(r => r.layer);
    const margins = D.stackMargins.map(r => r.margin);
    const ranges  = D.stackMargins.map(r => r.range);

    // color: high (>=40%) teal, low (<25%) coral, mid gold
    const colors = margins.map(m => m >= 40 ? '#4ECDC4' : (m < 20 ? '#E8837C' : '#F5C542'));

    marginChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Margin (%)',
          data: margins,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1100, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1f2433', borderColor: '#4ECDC4', borderWidth: 1,
            callbacks: {
              label: ctx => `Margin: ${ctx.parsed.x}%  (${ranges[ctx.dataIndex]})`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true, max: 80,
            grid: { color: 'rgba(160,168,188,0.08)' },
            ticks: { color: '#A0A8BC', callback: v => v + '%' }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#E8ECEF', font: { weight: '600' } }
          }
        }
      },
      plugins: [{
        id: 'rangeLabels',
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          const meta = chart.getDatasetMeta(0);
          ctx.save();
          ctx.font = '700 11px Inter';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          meta.data.forEach((bar, i) => {
            ctx.fillStyle = colors[i];
            ctx.fillText(margins[i] + '%', bar.x + 8, bar.y);
          });
          ctx.restore();
        }
      }]
    });
  };

  // ─── SLIDE 5 — Industrial layers reveal bottom-up ───
  ANIMATIONS[5] = function () {
    const layers = Array.from(document.querySelectorAll('#slide-5 .industrial-layer'));
    // bottom-up: reverse order
    const sorted = layers.slice().sort((a, b) => parseInt(b.dataset.layer) - parseInt(a.dataset.layer));
    sorted.forEach((el, i) => {
      setTimeout(() => el.classList.add('is-revealed'), i * 220);
    });

    // CapEx number count-up
    const c2024 = document.getElementById('capex2024');
    const c2026 = document.getElementById('capex2026');
    if (c2024) animateNumber(c2024, 0, D.hyperscalerCapex.y2024, 1100, v => '$' + Math.round(v) + 'B');
    if (c2026) animateNumber(c2026, 0, D.hyperscalerCapex.y2026, 1500, v => '$' + Math.round(v) + 'B');
  };

  function animateNumber(el, from, to, dur, fmt) {
    const start = performance.now();
    function tick(t) {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (to - from) * eased;
      el.textContent = fmt ? fmt(v) : Math.round(v);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ─── SLIDE 6 — Spoons (CSS-driven, no JS needed) ───
  ANIMATIONS[6] = function () { /* purely CSS animations */ };

  // ─── SLIDE 7 — Two forces + mini stack + inference chart ───
  let inferenceChart = null;
  ANIMATIONS[7] = function () {
    // Build mini stack from data
    const mini = document.getElementById('miniStack');
    if (mini && !mini.children.length) {
      // Top of stack first
      const stackOrder = D.stackRevenue.map(r => r.layer); // already top→bottom
      stackOrder.forEach((label, i) => {
        const row = document.createElement('div');
        row.className = 'mini-stack-row';
        // top 2 are app/model (teal), bottom 3 (cloud, silicon, power) coral, orchestration mid
        if (i < 2) row.classList.add('mini-stack-row--teal');
        else if (i === 2) row.classList.add('mini-stack-row--mid');
        else row.classList.add('mini-stack-row--coral');
        row.innerHTML = `<span>${label}</span><span>${D.stackRevenue[i].growth}</span>`;
        mini.appendChild(row);
      });
    }

    // Cost drop %
    const dropEl = document.getElementById('costDropPct');
    if (dropEl) dropEl.textContent = D.inferenceCostDrop;

    if (inferenceChart) return;
    const ctx = document.getElementById('inferenceChart');
    if (!ctx || !window.Chart) return;

    inferenceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: D.inferenceCost.map(p => p.date),
        datasets: [{
          label: '$ / M tokens',
          data: D.inferenceCost.map(p => p.cost),
          borderColor: '#E8837C',
          backgroundColor: 'rgba(232,131,124,0.10)',
          fill: true, tension: 0.35,
          pointBackgroundColor: '#E8837C',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: 4,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 1500, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1f2433', borderColor: '#E8837C', borderWidth: 1,
            callbacks: { label: ctx => '$' + ctx.parsed.y.toFixed(2) + ' / M tokens' }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#A0A8BC', font: { size: 10 }, maxRotation: 35, minRotation: 0 }
          },
          y: {
            type: 'logarithmic',
            grid: { color: 'rgba(160,168,188,0.08)' },
            ticks: { color: '#A0A8BC', callback: v => '$' + (v < 1 ? v : v.toFixed(0)) }
          }
        }
      }
    });
  };

  // ─── SLIDE 8 — Funnel (GSAP) ───
  ANIMATIONS[8] = function () {
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
    document.getElementById('slide-8')._modelTimer = modelTimer;

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

  // ─── SLIDE 9 — Model cluster dissolve ───
  ANIMATIONS[9] = function () {
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

  // ─── SLIDE 10 — Smarter AND cheaper dual axis ───
  let smarterChart = null;
  ANIMATIONS[10] = function () {
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

  // ─── SLIDE 11 — Physical AI map ───
  ANIMATIONS[11] = function () {
    const pins = document.querySelectorAll('#slide-11 .map-pin');
    const routes = document.querySelectorAll('#slide-11 .route');
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

  // ─── SLIDE 12 — Pricing + ARPU bar chart ───
  let arpuChart = null;
  ANIMATIONS[12] = function () {
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

  // ─── SLIDE 13 — Close (cycles + you-are-here) ───
  ANIMATIONS[13] = function () {
    const curves = document.querySelectorAll('#slide-13 .cycle-curve');
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
