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

  // ─── IFRAME LAZY-LOAD HELPER ───
  // Sets the iframe src to index.html?embed=<sec-id> on first slide entry.
  function loadIframe(slideEl) {
    if (!slideEl) return;
    const f = slideEl.querySelector('iframe[data-iframe-embed]');
    if (!f || f.dataset.loaded === '1') return;
    const target = f.getAttribute('data-iframe-embed');
    if (!target) return;
    // Use absolute root path. Dev server strips queries on /index.html → /index 301;
    // /?embed=... avoids the redirect. Firebase Hosting serves index.html at / by default.
    // If target uses 'section:focus' syntax, jump the iframe to the focus element.
    var hashId = target.indexOf(':') > -1 ? target.split(':')[1] : target;
    f.src = '/?embed=' + encodeURIComponent(target) + '#' + hashId;
    f.dataset.loaded = '1';
  }

  // ─── SLIDE 6 — Infrastructure & Energy (CapEx iframe) ───
  ANIMATIONS[6] = function () {
    loadIframe(document.getElementById('slide-6'));
  };

  // ─── SLIDE 7 — Funnel (was slide 6 — GSAP) ───
  ANIMATIONS[7] = function () {
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
    document.getElementById('slide-7')._modelTimer = modelTimer;

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

  // ─── SLIDE 8 — Model cluster (3 lanes: Commodity / Specialist / Restricted) ───
  ANIMATIONS[8] = function () {
    const svg = document.getElementById('clusterSvg');
    if (!svg) return;
    if (svg.dataset.rendered === '1') {
      // Replay only the entrance animation — don't re-render geometry
      if (window.gsap) {
        const lanes = svg.querySelectorAll('.lane-bg');
        const titles = svg.querySelectorAll('.lane-title, .lane-sub');
        const chips = svg.querySelectorAll('.cluster-chip');
        const dep = svg.querySelectorAll('.cluster-chip--deprecated');
        gsap.fromTo(lanes,  { opacity: 0, scaleX: 0.8, transformOrigin: '50% 50%' }, { opacity: 1, scaleX: 1, duration: 0.55, stagger: 0.1, ease: 'power2.out' });
        gsap.fromTo(titles, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.15, stagger: 0.05 });
        gsap.fromTo(chips,  { opacity: 0 }, { opacity: 1, duration: 0.45, stagger: 0.04, delay: 0.45, ease: 'power2.out' });
        if (dep.length) gsap.to(dep, { opacity: 0.45, duration: 0.6, delay: 1.5 });
      }
      return;
    }
    const SVG_NS = 'http://www.w3.org/2000/svg';

    // viewBox is 1200x520; carve into 3 vertical lanes.
    const VW = 1200, VH = 520;
    const laneCenters = { commodity: 200, specialist: 600, govOnly: 1000 };
    const fillMap = {
      commodity:   'rgba(232,131,124,0.16)',
      specialist:  'rgba(245,197,66,0.18)',
      govOnly:     'rgba(160,168,188,0.18)',
      deprecated:  'rgba(124,77,255,0.10)'
    };
    const strokeMap = {
      commodity:   '#E8837C',
      specialist:  '#F5C542',
      govOnly:     '#A0A8BC',
      deprecated:  '#7C4DFF'
    };

    const groups = D.modelClusterGroups;

    // ----- 1. draw lane backdrops + headers -----
    const lanes = [
      { key: 'commodity',  title: 'COMMODITY',  sub: 'Open-source, fungible' },
      { key: 'specialist', title: 'SPECIALIST', sub: 'Vertical leaders' },
      { key: 'govOnly',    title: 'RESTRICTED', sub: 'Government / safety-gated' }
    ];
    lanes.forEach(lane => {
      const cx = laneCenters[lane.key];
      // backdrop column
      const bg = document.createElementNS(SVG_NS, 'rect');
      bg.setAttribute('x', cx - 170); bg.setAttribute('y', 30);
      bg.setAttribute('width', 340);  bg.setAttribute('height', VH - 60);
      bg.setAttribute('rx', 14);
      bg.setAttribute('fill', fillMap[lane.key].replace(/0\.\d+/, '0.05'));
      bg.setAttribute('stroke', strokeMap[lane.key] + '40');
      bg.setAttribute('stroke-width', '1');
      bg.setAttribute('class', 'lane-bg');
      bg.dataset.lane = lane.key;
      svg.appendChild(bg);

      const title = document.createElementNS(SVG_NS, 'text');
      title.setAttribute('class', 'lane-title');
      title.setAttribute('x', cx); title.setAttribute('y', 70);
      title.setAttribute('text-anchor', 'middle');
      title.setAttribute('fill', strokeMap[lane.key]);
      title.textContent = lane.title;
      svg.appendChild(title);

      const sub = document.createElementNS(SVG_NS, 'text');
      sub.setAttribute('class', 'lane-sub');
      sub.setAttribute('x', cx); sub.setAttribute('y', 92);
      sub.setAttribute('text-anchor', 'middle');
      sub.setAttribute('fill', '#A0A8BC');
      sub.textContent = lane.sub;
      svg.appendChild(sub);
    });

    // ----- 2. place chips inside each lane in a 2-column grid -----
    const allItems = [];
    function placeLane(items, laneKey) {
      const cx = laneCenters[laneKey];
      const cols = 2;
      const colW = 165;
      const startY = 140;
      const rowH = 60;
      items.forEach((name, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = cx - colW / 2 + col * colW;
        const y = startY + row * rowH;
        allItems.push({ name, group: laneKey, x, y });
      });
    }
    placeLane(groups.commodity,  'commodity');
    placeLane(groups.specialist, 'specialist');
    placeLane(groups.govOnly,    'govOnly');

    // Deprecated chips: row across the bottom
    const depStartX = (VW - groups.deprecated.length * 130) / 2 + 65;
    const depY = VH - 30;
    groups.deprecated.forEach((name, i) => {
      allItems.push({ name, group: 'deprecated', x: depStartX + i * 130, y: depY });
    });

    // ----- 3. render the chips (rounded pills, not bare circles) -----
    const chipEls = [];
    allItems.forEach(it => {
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'cluster-chip' + (it.group === 'deprecated' ? ' cluster-chip--deprecated' : ''));
      g.setAttribute('transform', `translate(${it.x},${it.y})`);

      const w = Math.max(120, Math.min(155, it.name.length * 9 + 22));
      const r = document.createElementNS(SVG_NS, 'rect');
      r.setAttribute('class', 'chip-shape');
      r.setAttribute('x', -w / 2); r.setAttribute('y', -18);
      r.setAttribute('width', w);   r.setAttribute('height', 36);
      r.setAttribute('rx', 18);
      r.setAttribute('fill', fillMap[it.group]);
      r.setAttribute('stroke', strokeMap[it.group]);
      r.setAttribute('stroke-width', '1.5');
      g.appendChild(r);

      const t = document.createElementNS(SVG_NS, 'text');
      t.setAttribute('class', 'cluster-chip-text');
      t.setAttribute('y', 4);
      t.setAttribute('text-anchor', 'middle');
      t.textContent = it.name;
      g.appendChild(t);

      if (it.group === 'deprecated') {
        const ln = document.createElementNS(SVG_NS, 'line');
        ln.setAttribute('x1', -w / 2 + 8); ln.setAttribute('x2', w / 2 - 8);
        ln.setAttribute('y1', 0); ln.setAttribute('y2', 0);
        ln.setAttribute('stroke', '#E8837C'); ln.setAttribute('stroke-width', '2');
        g.appendChild(ln);
      }

      svg.appendChild(g);
      chipEls.push(g);
    });
    svg.dataset.rendered = '1';

    if (!window.gsap) return;
    // Lane backdrops fade in first
    gsap.fromTo(svg.querySelectorAll('.lane-bg'),  { opacity: 0, scaleX: 0.8, transformOrigin: '50% 50%' }, { opacity: 1, scaleX: 1, duration: 0.55, stagger: 0.1, ease: 'power2.out' });
    gsap.fromTo(svg.querySelectorAll('.lane-title, .lane-sub'), { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.15, stagger: 0.05 });
    // Chips drop in by lane
    gsap.fromTo(chipEls, { opacity: 0 }, { opacity: 1, duration: 0.45, stagger: 0.04, delay: 0.45, ease: 'power2.out' });
    // Deprecated dim after settling
    const depEls = chipEls.filter((_, i) => allItems[i].group === 'deprecated');
    if (depEls.length) gsap.to(depEls, { opacity: 0.45, duration: 0.6, delay: 1.5 });
  };

  // ─── SLIDE 9 — Smarter AND cheaper dual axis (was 8) ───
  let smarterChart = null;
  ANIMATIONS[9] = function () {
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

  // ─── SLIDE 10 — Agent anatomy (iframe of 7-layer stack) ───
  ANIMATIONS[10] = function () {
    loadIframe(document.getElementById('slide-10'));
    // Animate KPI cards in
    const cards = document.querySelectorAll('#slide-10 .kpi-card');
    if (window.gsap && cards.length) {
      gsap.fromTo(cards,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.12 }
      );
    }
  };

  // ─── SLIDE 11 — Vibe coding cards ───
  ANIMATIONS[11] = function () {
    const grid = document.getElementById('vibeGrid');
    if (!grid || grid.children.length) return;
    (D.vibeCoding || []).forEach(c => {
      const card = document.createElement('div');
      card.className = 'vibe-card' + (c.dvc ? ' vibe-card--dvc' : '');
      card.innerHTML = `
        <div class="vibe-logo" style="--logo-color:${c.color}">${c.letter}</div>
        <div class="vibe-body">
          <div class="vibe-head">
            <span class="vibe-name">${c.name}</span>
            ${c.dvc ? '<span class="vibe-dvc">DVC</span>' : ''}
          </div>
          <span class="vibe-stat">${c.stat}</span>
          <span class="vibe-desc">${c.desc}</span>
        </div>`;
      grid.appendChild(card);
    });
    if (window.gsap) {
      gsap.fromTo(grid.children,
        { opacity: 0, y: 18, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out', stagger: 0.07 }
      );
    }
  };

  // ─── SLIDE 12 — Physical AI: 3 motion tiles + stat strip (REBUILT) ───
  ANIMATIONS[12] = function () {
    const tilesC = document.getElementById('physTiles');
    const stripC = document.getElementById('physStatsStrip');
    if (!tilesC || tilesC.children.length) return;

    const SVG_NS = 'http://www.w3.org/2000/svg';

    function buildTileIcon(kind, color) {
      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('viewBox', '0 0 240 120');
      svg.setAttribute('class', 'phys-tile-svg');
      svg.setAttribute('aria-hidden', 'true');
      // dashed road / route line
      const road = document.createElementNS(SVG_NS, 'line');
      road.setAttribute('x1', 0); road.setAttribute('y1', 100);
      road.setAttribute('x2', 240); road.setAttribute('y2', 100);
      road.setAttribute('stroke', color); road.setAttribute('stroke-width', 2);
      road.setAttribute('stroke-dasharray', '10 8');
      road.setAttribute('opacity', '0.55');
      road.setAttribute('class', 'phys-road');
      svg.appendChild(road);

      if (kind === 'car') {
        // Stylized autonomous car w/ sensor dome
        const body = document.createElementNS(SVG_NS, 'path');
        body.setAttribute('d', 'M 70 86 L 80 64 Q 90 56 120 56 L 160 56 Q 175 56 180 64 L 188 86 Z');
        body.setAttribute('fill', 'none'); body.setAttribute('stroke', color); body.setAttribute('stroke-width', 2.4);
        body.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(body);
        // sensor dome on top
        const dome = document.createElementNS(SVG_NS, 'ellipse');
        dome.setAttribute('cx', 130); dome.setAttribute('cy', 54); dome.setAttribute('rx', 14); dome.setAttribute('ry', 6);
        dome.setAttribute('fill', 'none'); dome.setAttribute('stroke', color); dome.setAttribute('stroke-width', 2);
        svg.appendChild(dome);
        const ping = document.createElementNS(SVG_NS, 'circle');
        ping.setAttribute('cx', 130); ping.setAttribute('cy', 54); ping.setAttribute('r', 3);
        ping.setAttribute('fill', color);
        ping.setAttribute('class', 'phys-ping');
        svg.appendChild(ping);
        // wheels
        [95, 165].forEach(cx => {
          const w = document.createElementNS(SVG_NS, 'circle');
          w.setAttribute('cx', cx); w.setAttribute('cy', 90); w.setAttribute('r', 8);
          w.setAttribute('fill', '#2D3142'); w.setAttribute('stroke', color); w.setAttribute('stroke-width', 2);
          svg.appendChild(w);
        });
      } else if (kind === 'truck') {
        // freight truck — cab + trailer, no driver
        const trailer = document.createElementNS(SVG_NS, 'rect');
        trailer.setAttribute('x', 60); trailer.setAttribute('y', 50);
        trailer.setAttribute('width', 90); trailer.setAttribute('height', 36); trailer.setAttribute('rx', 3);
        trailer.setAttribute('fill', 'none'); trailer.setAttribute('stroke', color); trailer.setAttribute('stroke-width', 2.4);
        svg.appendChild(trailer);
        const cab = document.createElementNS(SVG_NS, 'path');
        cab.setAttribute('d', 'M 152 60 L 175 60 Q 188 60 188 72 L 188 86 L 152 86 Z');
        cab.setAttribute('fill', 'none'); cab.setAttribute('stroke', color); cab.setAttribute('stroke-width', 2.4);
        cab.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(cab);
        // sensor on cab roof
        const sensor = document.createElementNS(SVG_NS, 'rect');
        sensor.setAttribute('x', 165); sensor.setAttribute('y', 52); sensor.setAttribute('width', 12); sensor.setAttribute('height', 6);
        sensor.setAttribute('fill', color); sensor.setAttribute('opacity', 0.7);
        sensor.setAttribute('class', 'phys-ping');
        svg.appendChild(sensor);
        // wheels
        [78, 130, 175].forEach(cx => {
          const w = document.createElementNS(SVG_NS, 'circle');
          w.setAttribute('cx', cx); w.setAttribute('cy', 90); w.setAttribute('r', 7);
          w.setAttribute('fill', '#2D3142'); w.setAttribute('stroke', color); w.setAttribute('stroke-width', 2);
          svg.appendChild(w);
        });
      } else if (kind === 'robotarm') {
        // robotic arm reaching towards target with particle arc
        const base = document.createElementNS(SVG_NS, 'rect');
        base.setAttribute('x', 70); base.setAttribute('y', 88); base.setAttribute('width', 30); base.setAttribute('height', 12); base.setAttribute('rx', 2);
        base.setAttribute('fill', 'none'); base.setAttribute('stroke', color); base.setAttribute('stroke-width', 2);
        svg.appendChild(base);
        // upper arm
        const arm1 = document.createElementNS(SVG_NS, 'line');
        arm1.setAttribute('x1', 85); arm1.setAttribute('y1', 88); arm1.setAttribute('x2', 130); arm1.setAttribute('y2', 50);
        arm1.setAttribute('stroke', color); arm1.setAttribute('stroke-width', 4); arm1.setAttribute('stroke-linecap', 'round');
        svg.appendChild(arm1);
        // forearm
        const arm2 = document.createElementNS(SVG_NS, 'line');
        arm2.setAttribute('x1', 130); arm2.setAttribute('y1', 50); arm2.setAttribute('x2', 175); arm2.setAttribute('y2', 70);
        arm2.setAttribute('stroke', color); arm2.setAttribute('stroke-width', 4); arm2.setAttribute('stroke-linecap', 'round');
        svg.appendChild(arm2);
        // joint pivots
        [[85,88],[130,50],[175,70]].forEach(([cx,cy]) => {
          const j = document.createElementNS(SVG_NS, 'circle');
          j.setAttribute('cx', cx); j.setAttribute('cy', cy); j.setAttribute('r', 4);
          j.setAttribute('fill', '#2D3142'); j.setAttribute('stroke', color); j.setAttribute('stroke-width', 2);
          svg.appendChild(j);
        });
        // gripper
        const grip = document.createElementNS(SVG_NS, 'path');
        grip.setAttribute('d', 'M 175 70 L 184 64 M 175 70 L 184 76');
        grip.setAttribute('stroke', color); grip.setAttribute('stroke-width', 2.5); grip.setAttribute('stroke-linecap', 'round');
        svg.appendChild(grip);
        // particle arc target
        const arc = document.createElementNS(SVG_NS, 'path');
        arc.setAttribute('d', 'M 195 60 Q 210 80 200 96');
        arc.setAttribute('fill', 'none'); arc.setAttribute('stroke', color); arc.setAttribute('stroke-width', 1.5);
        arc.setAttribute('stroke-dasharray', '3 5'); arc.setAttribute('opacity', '0.6');
        arc.setAttribute('class', 'phys-arc');
        svg.appendChild(arc);
        const target = document.createElementNS(SVG_NS, 'circle');
        target.setAttribute('cx', 200); target.setAttribute('cy', 96); target.setAttribute('r', 4);
        target.setAttribute('fill', color); target.setAttribute('class', 'phys-ping');
        svg.appendChild(target);
      }
      return svg;
    }

    (D.physicalAITiles || []).forEach(tile => {
      const el = document.createElement('div');
      el.className = 'phys-tile' + (tile.dvc ? ' phys-tile--dvc' : '');
      el.style.setProperty('--tile-color', tile.color);
      const cat = document.createElement('div');
      cat.className = 'phys-tile-cat';
      cat.textContent = tile.category;
      el.appendChild(cat);
      el.appendChild(buildTileIcon(tile.icon, tile.color));
      const cap = document.createElement('div');
      cap.className = 'phys-tile-caption';
      const cName = document.createElement('span');
      cName.className = 'phys-tile-company';
      cName.textContent = tile.company + (tile.dvc ? ' (DVC)' : '');
      const cDet = document.createElement('span');
      cDet.className = 'phys-tile-detail';
      cDet.textContent = tile.detail;
      cap.appendChild(cName); cap.appendChild(cDet);
      el.appendChild(cap);
      tilesC.appendChild(el);
    });

    // Stats strip (4 horizontal cards)
    if (stripC && !stripC.children.length) {
      (D.physicalAIStats || []).forEach(s => {
        const card = document.createElement('div');
        card.className = 'phys-strip-card';
        card.style.setProperty('--strip-color', s.accent);
        card.innerHTML = `<span class="phys-strip-num">${s.num}</span><span class="phys-strip-label">${s.label}</span>`;
        stripC.appendChild(card);
      });
    }

    if (window.gsap) {
      gsap.fromTo('#physTiles .phys-tile',
        { opacity: 0, y: 22, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)', stagger: 0.14 }
      );
      gsap.fromTo('#physStatsStrip .phys-strip-card',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.08, delay: 0.4 }
      );
    }
  };

  // ─── SLIDE 13 — Pricing + ARPU iframe (live report bars) ───
  ANIMATIONS[13] = function () {
    loadIframe(document.getElementById('slide-13'));
    // Reveal pricing-row icons
    const icons = document.querySelectorAll('#slide-13 .pricing-icon');
    if (icons.length && window.gsap) {
      gsap.from(icons, { y: 14, opacity: 0, duration: 0.45, stagger: 0.07, ease: 'power2.out' });
    }
  };

  // ─── SLIDE 14 — Sequoia services matrix (iframe) ───
  ANIMATIONS[14] = function () {
    loadIframe(document.getElementById('slide-14'));
  };

  // ─── SLIDE 15 — Close (cycles + you-are-here) ───
  ANIMATIONS[15] = function () {
    const curves = document.querySelectorAll('#slide-15 .cycle-curve');
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
