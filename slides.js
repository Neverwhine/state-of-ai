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
    const fromIdx = activeIndex;
    if (idx === activeIndex && document.querySelector('.slide.is-active')) {
      // still trigger first animation
    }
    slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    activeIndex = idx;
    if (numEl) numEl.textContent = idx + 1;
    if (progressEl) progressEl.style.width = (((idx + 1) / total) * 100) + '%';
    // Stash desired entry state on the multi-state slide BEFORE animation fires
    const slideEl = slides[idx];
    if (slideEl && parseInt(slideEl.dataset.slideStates || '0', 10) > 1) {
      const totalStates = parseInt(slideEl.dataset.slideStates, 10);
      const enteredFromAfter = fromIdx > idx;
      slideEl.dataset.entryState = String(enteredFromAfter ? totalStates - 1 : 0);
    }
    if (!animatedFor.has(idx)) {
      animatedFor.add(idx);
      // small delay so the crossfade has begun
      setTimeout(() => triggerSlideAnimation(idx + 1), 120);
    } else {
      // Re-entry: reset multi-state slides so the talk replays cleanly
      const driver = getStateDriver(slideEl);
      if (driver && typeof driver.activate === 'function') {
        const totalStates = parseInt(slideEl.dataset.slideStates || '1', 10);
        const enteredFromAfter = fromIdx > idx;
        driver.activate(enteredFromAfter ? totalStates - 1 : 0);
      }
    }
  }

  // ── Multi-state slide navigation ──
  // A slide can declare data-slide-states="N" to absorb up to N-1 forward
  // advances (and back) before yielding to next slide. Slide drivers expose
  // their state controller at window.__slideN where N is data-slide.
  function getStateDriver(slideEl) {
    if (!slideEl) return null;
    const states = parseInt(slideEl.dataset.slideStates || '0', 10);
    if (states <= 1) return null;
    const n = parseInt(slideEl.dataset.slide, 10);
    return window['__slide' + n] || null;
  }

  function next() {
    const cur = slides[activeIndex];
    const driver = getStateDriver(cur);
    if (driver && typeof driver.advance === 'function' && driver.advance(+1)) return;
    activate(activeIndex + 1);
  }
  function prev() {
    const cur = slides[activeIndex];
    const driver = getStateDriver(cur);
    if (driver && typeof driver.advance === 'function' && driver.advance(-1)) return;
    activate(activeIndex - 1);
  }

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
  // Desktop / tablet (non-mobile): horizontal swipe advances slides (or internal states).
  // Mobile: vertical scroll governs navigation, so swipes do not navigate slides — but
  // a horizontal swipe over the unified-stack slide still advances/reverses its
  // internal state (so users have an alternative to tapping pips).
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  let touchStartX = 0, touchStartY = 0, touchStartTarget = null;
  document.addEventListener('touchstart', e => {
    if (!e.touches[0]) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTarget = e.target;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!e.changedTouches[0]) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) <= 50 || Math.abs(dx) <= Math.abs(dy)) return;
    if (isMobile) {
      // Only advance internal state when the swipe started on the unified-stack slide.
      const slideEl = touchStartTarget && touchStartTarget.closest && touchStartTarget.closest('.slide--stack-unified');
      if (!slideEl) return;
      const driver = getStateDriver(slideEl);
      if (driver && typeof driver.advance === 'function') driver.advance(dx < 0 ? +1 : -1);
      return;
    }
    if (dx < 0) next(); else prev();
  }, { passive: true });

  // ── On mobile (no virtual slides) — let scroll happen but still animate on enter ──
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

  // ─── SLIDE 1 — Cover (DVC squares + QR) ───
  // Soft staggered fade-in for the cover content; the colored DVC squares
  // animate in via a quick scale-up so the brand reads as deliberate.
  ANIMATIONS[1] = function () {
    const slide = document.getElementById('slide-1');
    if (!slide || !window.gsap) return;
    const blocks = slide.querySelectorAll('.cover-block');
    const wordmark = slide.querySelector('.cover-wordmark');
    const eyebrow = slide.querySelector('.cover-eyebrow');
    const title = slide.querySelector('.cover-title');
    const sub = slide.querySelector('.cover-subtitle');
    const tag = slide.querySelector('.cover-tagline');
    const qrRow = slide.querySelector('.cover-qr-row');
    gsap.from(blocks, { opacity: 0, scale: 0.96, duration: 0.55, stagger: 0.05, ease: 'power2.out' });
    gsap.from([wordmark, eyebrow, title, sub, tag, qrRow].filter(Boolean), {
      y: 14, opacity: 0, duration: 0.55, stagger: 0.08, ease: 'power2.out', delay: 0.25
    });
  };

  // ─── SLIDE 2 — Cinematic day-in-the-life ───
  // Sequence:
  //  1. Stars fade in (cold, pre-dawn night)
  //  2. House outline draws itself in stroke-by-stroke
  //  3. Sun rises along an arc, ground horizon lights up teal
  //  4. Each icon ignites in time-order, with a window glow + pulse
  //  5. Connectors flow between icons in sequence (showing the day)
  //  6. Sun arcs to evening; stars fade back in; headline drops in
  ANIMATIONS[2] = function () {
    const slide = document.getElementById('slide-2');
    if (!slide) return;

    // Reset on every entry so the animation replays
    const ICON_COUNT = 5;
    const icons   = Array.from(slide.querySelectorAll('.house-icon'));
    const pulses  = Array.from(slide.querySelectorAll('.icon-pulse'));
    const glows   = Array.from(slide.querySelectorAll('.win-glow'));
    const connectors = Array.from(slide.querySelectorAll('.day-connector'));
    const stars   = slide.querySelector('#starsLayer');
    const sun     = slide.querySelector('#sunGroup');
    const sunCore = slide.querySelector('#sunCore');
    const sunGlow = slide.querySelector('#sunGlowDisc');
    const ground  = slide.querySelector('#groundLine');
    const outline = slide.querySelector('#houseOutline');
    const roof    = slide.querySelector('#houseRoof');
    const grid    = slide.querySelector('#houseGrid');
    const headline = slide.querySelector('.opener-headline');
    const eyebrow  = slide.querySelector('.opener-eyebrow');

    if (!window.gsap) {
      // Graceful fallback — just reveal everything
      [stars, sun, grid, ...glows, ...connectors].forEach(el => el && (el.style.opacity = 1));
      icons.forEach(el => el.classList.add('is-revealed'));
      return;
    }

    // Reset state each replay
    gsap.set([stars, sun, grid, ...glows, ...connectors, ...pulses], { opacity: 0 });
    icons.forEach(g => {
      g.style.opacity = 0;
      g.style.transform = '';
    });
    gsap.set(headline, { opacity: 0, y: 18 });
    gsap.set(eyebrow, { opacity: 0, y: 8 });
    if (outline) { outline.style.strokeDashoffset = '1500'; }
    if (roof)    { roof.style.strokeDashoffset = '760';  }
    if (ground)  { ground.style.strokeDashoffset = '720'; }
    connectors.forEach(c => { c.style.strokeDashoffset = c.getAttribute('stroke-dasharray'); });

    // ---- Sun-path helper: arc from (60, 380) up to (700, 80) and back down ----
    // We sample positions along a parametric arc.
    function sunPos(t) {
      // t in [0, 1]
      const x = 60 + 640 * t;
      const y = 380 - Math.sin(Math.PI * t) * 320; // peak around t=0.5
      return { x, y };
    }
    function sunColor(t) {
      // dawn (#E8837C salmon) → day (#FFE6A8 warm) → dusk (#E8837C salmon)
      if (t < 0.5) {
        const k = t * 2;
        return gsap.utils.interpolate('#E8837C', '#FFE6A8', k);
      } else {
        const k = (t - 0.5) * 2;
        return gsap.utils.interpolate('#FFE6A8', '#E8837C', k);
      }
    }

    const tl = gsap.timeline();

    // 1. Stars twinkle in (cold, pre-dawn night)
    tl.to(stars, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0);
    tl.to(slide.querySelectorAll('.sky-star'), {
      opacity: 1, scale: 1.0, duration: 0.4, stagger: 0.05, ease: 'power2.out',
      transformOrigin: 'center'
    }, 0.1);

    // 2. House draws itself (outline + roof + ground)
    tl.to(ground, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out' }, 0.4);
    tl.to(outline, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 0.6);
    tl.to(roof, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' }, 1.4);
    tl.to(grid, { opacity: 1, duration: 0.5 }, 1.9);

    // 3. Sunrise: stars fade as sun appears
    tl.to(sun, { opacity: 1, duration: 0.5 }, 2.0);
    tl.to(stars, { opacity: 0.18, duration: 1.1, ease: 'power2.in' }, 2.1);
    // Sun travels its arc — use an object proxy for smooth interpolation
    const sunProxy = { t: 0 };
    tl.to(sunProxy, {
      t: 1,
      duration: 8.0,
      ease: 'none',
      onUpdate: () => {
        const p = sunPos(sunProxy.t);
        const c = sunColor(sunProxy.t);
        sun.setAttribute('transform', `translate(${p.x},${p.y})`);
        if (sunCore) sunCore.setAttribute('fill', c);
        // Glow pulses with sun height — brighter at noon
        if (sunGlow) {
          const h = Math.sin(Math.PI * sunProxy.t);
          sunGlow.setAttribute('r', 50 + h * 30);
        }
      }
    }, 2.0);

    // 4. Icons ignite in chronological order, mapped to sun position
    // Icon timing: 6:40, 6:45, 7:15 (morning, sun rising) → 7:20 (mid-morning) → 3:10pm (afternoon)
    // Map them onto the 8s sun timeline at relative times.
    const iconTimings = [
      { idx: 0, at: 2.6 },  // Email — sunrise has begun
      { idx: 1, at: 3.2 },  // Calendar
      { idx: 2, at: 3.9 },  // Telegram
      { idx: 3, at: 4.7 },  // Amazon (mid-morning)
      { idx: 4, at: 7.2 }   // Waymo (afternoon, sun descending)
    ];
    iconTimings.forEach((t, i) => {
      const iconEl  = icons[t.idx];
      const glowEl  = glows[t.idx];
      const pulseEl = pulses[t.idx];
      // Glow lights up the window
      tl.to(glowEl, { opacity: 1, duration: 0.5, ease: 'power2.out' }, t.at);
      // Icon scales-in with a soft pop
      tl.fromTo(iconEl,
        { opacity: 0, scale: 0.4, transformOrigin: 'center' },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2.0)' },
        t.at
      );
      // Pulse ring radiates outward
      tl.fromTo(pulseEl,
        { opacity: 0.7, scale: 1, transformOrigin: 'center' },
        { opacity: 0, scale: 2.4, duration: 1.0, ease: 'power2.out' },
        t.at + 0.05
      );
      // Connector flows from previous icon to this one
      if (i > 0) {
        const prevTime = iconTimings[i - 1].at;
        const conn = connectors[i - 1];
        if (conn) {
          tl.to(conn, { opacity: 0.7, duration: 0.2 }, prevTime + 0.4);
          tl.to(conn, { strokeDashoffset: 0, duration: Math.min(0.9, t.at - prevTime - 0.1), ease: 'power1.inOut' }, prevTime + 0.4);
          tl.to(conn, { opacity: 0.35, duration: 0.4 }, t.at + 0.1);
        }
      }
    });

    // 5. Final breath — stars fade back in, headline appears
    tl.to(stars, { opacity: 1, duration: 1.0, ease: 'power2.out' }, 9.5);
    tl.to(headline, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 9.7);
    tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 10.0);

    // Subtle continuous pulse on the icons after settle (signals "alive")
    tl.add(() => {
      icons.forEach((g, i) => {
        const ringPulse = pulses[i];
        if (!ringPulse) return;
        gsap.to(ringPulse, {
          opacity: 0.35, scale: 1.7, duration: 1.6, ease: 'power2.out',
          repeat: -1, yoyo: false,
          repeatDelay: 3.5 + (i * 0.3),
          transformOrigin: 'center',
          onRepeat: () => { gsap.set(ringPulse, { scale: 1, opacity: 0.7 }); }
        });
      });
    }, '+=0');
  };

  // ─── SLIDE 2 — Tech cycles (price-drop ladder + software-economics arc) ───
  // Reveals each platform chip left-to-right (PC → Internet → Mobile → Cloud → AI),
  // pulses the "AI" chip + "we are here" tag, then morphs the software-economics arc
  // (Bespoke → Cloud/SaaS → AI-native) and lights the AI column last.
  ANIMATIONS[3] = function () {
    const ladder = document.getElementById('tcLadder');
    const arc    = document.getElementById('tcArc');
    if (!ladder || ladder.dataset.played === '1') return;
    ladder.dataset.played = '1';

    const chips = ladder.querySelectorAll('.tc-chip');
    const eras  = arc ? arc.querySelectorAll('.tc-era') : [];

    // Stagger chips in left-to-right
    chips.forEach((chip, i) => {
      setTimeout(() => {
        chip.style.opacity = '1';
        chip.style.transform = 'none';
      }, 160 + i * 220);
    });
    setTimeout(() => ladder.classList.add('is-built'), 160 + chips.length * 220);

    // After chips settle, build the arc eras (left → right)
    const arcStart = 160 + chips.length * 220 + 180;
    eras.forEach((era, i) => {
      setTimeout(() => {
        era.style.opacity = '1';
        era.style.transform = 'none';
      }, arcStart + i * 280);
    });
    if (arc) {
      setTimeout(() => arc.classList.add('is-built'), arcStart + 80);
      // Light up AI orbits last (intelligence substrate goes live)
      setTimeout(() => arc.classList.add('is-lit'), arcStart + eras.length * 280 + 220);
    }

    // Pulse the "we are here" tag on the AI chip after the arc fully reveals
    setTimeout(() => {
      const here = ladder.querySelector('.tc-here');
      if (here && window.gsap) {
        window.gsap.fromTo(here,
          { opacity: 0, y: 4 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
        );
      }
    }, arcStart + eras.length * 280 + 420);
  };

  // ════════════════════════════════════════════════════════
  //   SLIDE 3 — UNIFIED STACK (3 internal states on one slide)
  //
  //   The same 5-layer DOM stack persists across states; only its
  //   per-card content (revenue → margin → mini) and the surrounding
  //   chrome (header copy, foot stats, side rails) morph between states.
  //
  //   States are advanced/reversed by the deck navigation (slides.js
  //   navigation hook) which calls window.__slide4.advance(+1 / -1) and
  //   window.__slide4.activate(stateIdx) before flipping slides.
  // ════════════════════════════════════════════════════════

  // Build the 5-layer card scaffolding once. Returns the cards array.
  function buildStackCards(container) {
    if (!container) return [];
    if (container.dataset.built === '1') {
      return Array.from(container.querySelectorAll('.stack-layer'));
    }
    const layers = D.stackLayers || [];
    const cards = [];
    layers.forEach(layer => {
      const card = document.createElement('div');
      card.className = 'stack-layer';
      card.style.setProperty('--accent', layer.accent);
      card.dataset.accent = layer.accent;
      card.dataset.marginPct = layer.marginPct;
      card.dataset.marginRange = layer.marginRange;
      card.dataset.revenue = layer.revenue2026;
      card.dataset.revenueLabel = layer.revenueLabel;
      card.dataset.growth = layer.growth;

      const badge = document.createElement('span');
      badge.className = 'stack-badge';
      badge.textContent = layer.badge;

      const title = document.createElement('span');
      title.className = 'stack-title';
      title.textContent = layer.title;

      const value = document.createElement('span');
      value.className = 'stack-value';
      value.textContent = layer.revenue2026;

      const label = document.createElement('span');
      label.className = 'stack-label';
      label.textContent = layer.revenueLabel;

      // Margin overlay bar — present always, width 0% until state 1
      const marginBar = document.createElement('span');
      marginBar.className = 'stack-margin-bar';
      marginBar.style.setProperty('--bar-width', '0%');

      card.appendChild(marginBar);
      card.appendChild(badge);
      card.appendChild(title);
      card.appendChild(value);
      card.appendChild(label);
      container.appendChild(card);
      cards.push(card);
    });
    container.dataset.built = '1';
    return cards;
  }

  // Apply per-state content to each card. Animates between states.
  function setStackState(cards, state) {
    if (!cards.length) return;
    cards.forEach(card => {
      const value = card.querySelector('.stack-value');
      const label = card.querySelector('.stack-label');
      const marginBar = card.querySelector('.stack-margin-bar');
      const accent = card.dataset.accent;
      const marginPct = parseFloat(card.dataset.marginPct) || 0;
      const marginSemantic = marginPct >= 40 ? '#4ECDC4' : (marginPct < 20 ? '#E8837C' : '#F5C542');

      // Reset state classes
      card.classList.remove('stack-layer--margin', 'stack-layer--force');

      if (state === 0) {
        // State A — revenue build-up. Pure accent borders.
        card.style.setProperty('--accent', accent);
        value.textContent = card.dataset.revenue;
        label.textContent = card.dataset.revenueLabel;
        if (marginBar) {
          if (window.gsap) gsap.to(marginBar, { duration: 0.5, '--bar-width': '0%', ease: 'power2.out' });
          else marginBar.style.setProperty('--bar-width', '0%');
        }
      } else if (state === 1) {
        // State B — margin lens. Bar fills proportional to margin; numbers swap.
        card.style.setProperty('--accent', marginSemantic);
        card.classList.add('stack-layer--margin');
        value.textContent = marginPct + '%';
        label.textContent = card.dataset.growth + ' rev · ' + card.dataset.marginRange + ' margin';
        if (marginBar) {
          if (window.gsap) {
            // Animate via custom property
            const proxy = { p: 0 };
            gsap.to(proxy, {
              p: marginPct, duration: 0.9, ease: 'power2.out',
              onUpdate: () => marginBar.style.setProperty('--bar-width', proxy.p + '%')
            });
          } else {
            marginBar.style.setProperty('--bar-width', marginPct + '%');
          }
        }
      } else if (state === 2) {
        // State C — forces lens. Stack stays in revenue mode but compresses;
        // accent stays original; the surrounding rails carry the meaning.
        card.style.setProperty('--accent', accent);
        card.classList.add('stack-layer--force');
        value.textContent = card.dataset.revenue;
        label.textContent = card.dataset.revenueLabel;
        if (marginBar) {
          if (window.gsap) gsap.to(marginBar, { duration: 0.4, '--bar-width': '0%', ease: 'power2.out' });
          else marginBar.style.setProperty('--bar-width', '0%');
        }
      }
    });
  }

  // Crossfade header / footer state blocks
  function activateStateBlock(slideEl, state) {
    if (!slideEl) return;
    slideEl.querySelectorAll('.su-header-state, .su-foot-state').forEach(el => {
      const target = parseInt(el.dataset.state, 10);
      el.classList.toggle('is-active', target === state);
    });
    slideEl.querySelectorAll('.su-pip').forEach(p => {
      const target = parseInt(p.dataset.pip, 10);
      const active = target === state;
      p.classList.toggle('is-active', active);
      p.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    const stage = slideEl.querySelector('.su-stage');
    if (stage) stage.dataset.state = String(state);
  }

  // Animate force arrows: draw on entry to state 2, fade on exit
  function setForceArrows(slideEl, state) {
    if (!slideEl) return;
    const paths = slideEl.querySelectorAll('.force-path');
    paths.forEach((p, i) => {
      const len = p.getTotalLength ? p.getTotalLength() : 600;
      p.style.strokeDasharray = len;
      if (state === 2) {
        // Draw in
        p.style.strokeDashoffset = len;
        requestAnimationFrame(() => {
          setTimeout(() => {
            p.style.transition = 'stroke-dashoffset 950ms ease-out, opacity 320ms ease-out';
            p.style.strokeDashoffset = '0';
            p.style.opacity = '1';
          }, 180 + i * 220);
        });
      } else {
        // Hide
        p.style.transition = 'opacity 220ms ease-out';
        p.style.opacity = '0';
      }
    });
  }

  // ─── SLIDE 3 — driver ───
  // Exposes window.__slide4 for the deck navigation to step through internal states.
  ANIMATIONS[4] = function () {
    const slide = document.getElementById('slide-4');
    if (!slide) return;
    const stackContainer = slide.querySelector('#suStack');
    const cards = buildStackCards(stackContainer);

    let state = 0;

    function render(s, opts) {
      state = Math.max(0, Math.min(2, s | 0));
      activateStateBlock(slide, state);
      setStackState(cards, state);
      setForceArrows(slide, state);
      // Persist on the slide so deck nav can read current state
      slide.dataset.state = String(state);
    }

    function advance(dir) {
      const next = state + (dir > 0 ? 1 : -1);
      if (next < 0 || next > 2) return false; // signal "leave slide"
      render(next);
      return true;
    }

    // Initial render — honor entry direction (entryState set by activate())
    const entryState = parseInt(slide.dataset.entryState || '0', 10);
    render(entryState);
    if (window.gsap) {
      gsap.from(cards, {
        opacity: 0, y: -14, duration: 0.55, ease: 'power2.out', stagger: 0.10,
        clearProps: 'opacity,y'
      });
    } else {
      cards.forEach((c, i) => setTimeout(() => c.classList.add('is-revealed'), i * 100));
    }

    // Wire pip clicks (idempotent)
    if (!slide.dataset.pipsWired) {
      slide.querySelectorAll('.su-pip').forEach(pip => {
        pip.addEventListener('click', e => {
          e.stopPropagation();
          const idx = parseInt(pip.dataset.pip, 10) || 0;
          render(idx);
        });
      });
      slide.dataset.pipsWired = '1';
    }

    // Expose driver for the deck navigation
    window.__slide4 = {
      advance,                    // advance(+1) or advance(-1) — returns false at boundary
      activate: render,           // jump to a specific state
      reset: () => render(0),     // for re-entry
      get state() { return state; }
    };
  };

  // ─── TOOLTIP HELPER for native [data-tip] elements (slide 11 seq-matrix etc.) ───
  // Lightweight: hover on desktop, tap on touch. Mirrors sec3.js popup styling
  // (.aa-tip-popup) which is loaded via slides-blocks.css.
  let __tipPopup = null;
  let __tipActive = null;
  let __tipHideTimer = null;
  // Prefer hover-capable detection so desktop users with touch screens still get hover tips.
  const __hasHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
  const __isTouch = !__hasHover && (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));

  function getTipPopup() {
    if (__tipPopup) return __tipPopup;
    __tipPopup = document.createElement('div');
    __tipPopup.className = 'aa-tip-popup';
    document.body.appendChild(__tipPopup);
    document.addEventListener('click', function () {
      if (__isTouch && __tipActive) {
        __tipPopup.classList.remove('aa-tip-popup--visible');
        __tipActive = null;
      }
    });
    window.addEventListener('scroll', function () {
      if (__tipActive) {
        __tipPopup.classList.remove('aa-tip-popup--visible');
        __tipActive = null;
      }
    }, { passive: true });
    return __tipPopup;
  }
  function showTip(el) {
    const p = getTipPopup();
    clearTimeout(__tipHideTimer);
    __tipActive = el;
    p.innerHTML = el.getAttribute('data-tip') || '';
    p.classList.remove('aa-tip-popup--funded', 'aa-tip-popup--model');
    p.style.visibility = 'hidden';
    p.style.display = 'block';
    p.classList.remove('aa-tip-popup--visible');
    const rect = el.getBoundingClientRect();
    const popW = p.offsetWidth;
    const popH = p.offsetHeight;
    let left = rect.left + rect.width / 2 - popW / 2;
    let top = rect.bottom + 10;
    if (top + popH > window.innerHeight - 10) top = rect.top - popH - 10;
    if (left < 10) left = 10;
    if (left + popW > window.innerWidth - 10) left = window.innerWidth - popW - 10;
    p.style.left = left + 'px';
    p.style.top = top + 'px';
    p.style.visibility = '';
    p.style.display = '';
    requestAnimationFrame(function () { p.classList.add('aa-tip-popup--visible'); });
  }
  function hideTip() {
    __tipHideTimer = setTimeout(function () {
      if (__tipPopup) __tipPopup.classList.remove('aa-tip-popup--visible');
      __tipActive = null;
    }, 150);
  }
  function bindSlideTooltips(scope) {
    if (!scope) return;
    const els = scope.querySelectorAll('[data-tip]');
    els.forEach(function (el) {
      if (el._tipBound) return;
      el._tipBound = true;
      el.setAttribute('tabindex', '0');
      el.addEventListener('mouseenter', function () { if (!__isTouch) showTip(el); });
      el.addEventListener('mouseleave', function () { if (!__isTouch) hideTip(); });
      el.addEventListener('focus', function () { showTip(el); });
      el.addEventListener('blur', function () { hideTip(); });
      el.addEventListener('click', function (e) {
        if (!__isTouch) return;
        e.stopPropagation();
        if (__tipActive === el) { hideTip(); } else { showTip(el); }
      });
    });
  }

  // ─── IFRAME LAZY-LOAD HELPER ───
  // Sets the iframe src to index.html?embed=<sec-id> on first slide entry.
  // Uses a RELATIVE URL ('index.html?...') so the embed works regardless of the
  // host path prefix (the previous '/?embed=...' hit the server root, which on
  // some deploy targets returns FastAPI/Starlette '{"detail":"Not Found"}' JSON).
  // If the iframe ever fails (404, non-HTML, JSON body), we hide it and reveal
  // a polished fallback card so the deck never shows raw JSON.
  function loadIframe(slideEl) {
    if (!slideEl) return;
    const f = slideEl.querySelector('iframe[data-iframe-embed]');
    if (!f || f.dataset.loaded === '1') return;
    const target = f.getAttribute('data-iframe-embed');
    if (!target) return;
    var hashId = target.indexOf(':') > -1 ? target.split(':')[1] : target;
    f.src = 'index.html?embed=' + encodeURIComponent(target) + '#' + hashId;
    f.dataset.loaded = '1';

    // Defensive: detect bad embed (no body, FastAPI JSON, or wrong content)
    // and swap to a fallback card.
    var verified = false;
    var verify = function () {
      if (verified) return;
      verified = true;
      try {
        var doc = f.contentDocument;
        // Same-origin: we can read the body. If it looks like JSON or is empty,
        // show fallback. If we can't read (cross-origin), assume it's loading
        // properly — Firebase serves same-origin so this branch only fires on
        // genuine errors.
        if (doc) {
          var bodyText = (doc.body && doc.body.innerText || '').trim();
          var looksLikeJson = bodyText.charAt(0) === '{' && bodyText.indexOf('"detail"') > -1;
          var hasEmbedTarget = !!doc.getElementById(hashId);
          if (looksLikeJson || (!hasEmbedTarget && bodyText.length < 200)) {
            showIframeFallback(f, target);
          }
        }
      } catch (e) { /* cross-origin — leave iframe alone */ }
    };
    f.addEventListener('load', verify);
    f.addEventListener('error', function () { showIframeFallback(f, target); });
    // Hard timeout: if nothing loaded in 8s, show fallback
    setTimeout(function () { if (!verified) verify(); }, 8000);
  }

  function showIframeFallback(iframe, target) {
    if (!iframe || iframe.dataset.fallback === '1') return;
    iframe.dataset.fallback = '1';
    var wrap = iframe.parentElement;
    if (!wrap) return;
    iframe.style.display = 'none';
    var fb = document.createElement('div');
    fb.className = 'iframe-fallback';
    var label = (target || '').split(':')[1] || target || 'report';
    label = label.replace(/-/g, ' ').replace(/block$/i, '').trim();
    fb.innerHTML =
      '<div class="iframe-fallback-eyebrow">Live data block</div>' +
      '<div class="iframe-fallback-title">' + label + '</div>' +
      '<a class="iframe-fallback-link" href="index.html#' + (target.split(':')[1] || target) + '" target="_blank" rel="noopener">Open in full report →</a>';
    wrap.appendChild(fb);
  }

  // ─── SLIDE 7 — Infrastructure & Energy (NATIVE CapEx Explorer) ───
  ANIMATIONS[8] = function () {
    initSlide7Capex();
  };

  function initSlide7Capex() {
    const canvas = document.getElementById('slide7CapexChart');
    if (!canvas || canvas.dataset.inited === '1' || typeof Chart === 'undefined') return;
    canvas.dataset.inited = '1';

    let chart = null;
    let showGap = false;

    const YEARS = ['2020', '2021', '2022', '2023', '2024', '2025', '2026E'];
    const COMPANIES = {
      amazon:    { label: 'Amazon',    color: '#FF9900', data: [40, 61, 63, 54, 83, 131, 200] },
      alphabet:  { label: 'Alphabet',  color: '#4285F4', data: [22, 29, 31, 32, 52, 91, 180] },
      microsoft: { label: 'Microsoft', color: '#7FBA00', data: [20, 27, 32, 35, 56, 80, 145] },
      meta:      { label: 'Meta',      color: '#0668E1', data: [16, 19, 32, 28, 39, 72, 125] },
      oracle:    { label: 'Oracle',    color: '#C74634', data: [9, 7, 9, 9, 13, 35, 50] }
    };
    const AI_REVENUE = [2, 5, 10, 20, 40, 100, 180];
    const activeCompanies = new Set(Object.keys(COMPANIES));

    function buildDatasets() {
      const datasets = [];
      const keys = Object.keys(COMPANIES);
      keys.forEach((key, i) => {
        const c = COMPANIES[key];
        const on = activeCompanies.has(key);
        datasets.push({
          label: c.label,
          data: on ? [...c.data] : c.data.map(() => 0),
          backgroundColor: on ? c.color + '55' : 'transparent',
          borderColor: on ? c.color : 'transparent',
          borderWidth: on ? 1.5 : 0,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: c.color,
          order: keys.length - i
        });
      });
      if (showGap) {
        datasets.push({
          label: 'AI Revenue',
          data: [...AI_REVENUE],
          backgroundColor: 'rgba(232,131,124,0.08)',
          borderColor: '#E8837C',
          borderWidth: 2.5,
          borderDash: [6, 3],
          fill: 'origin',
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#E8837C',
          pointBorderColor: '#2D3142',
          pointBorderWidth: 1.5,
          yAxisID: 'yRevenue',
          order: -1
        });
      }
      return datasets;
    }

    function updateTotal() {
      const el = document.getElementById('slide7CapexTotalNum');
      if (!el) return;
      const total = Object.keys(COMPANIES).reduce((s, k) => s + (activeCompanies.has(k) ? COMPANIES[k].data[6] : 0), 0);
      el.textContent = '~$' + total + 'B';
    }

    const gpt4Plugin = {
      id: 'slide7Gpt4Line',
      afterDraw(c) {
        const xs = c.scales.x, ys = c.scales.y;
        const x2022 = xs.getPixelForValue(2);
        const x2023 = xs.getPixelForValue(3);
        const xPos = x2022 + (x2023 - x2022) * 0.21;
        const ctx = c.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgba(245,197,66,0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xPos, ys.top);
        ctx.lineTo(xPos, ys.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#F5C542';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GPT-4', xPos, ys.top + 14);
        ctx.fillStyle = 'rgba(245,197,66,0.6)';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText('Mar 2023', xPos, ys.top + 26);
        ctx.restore();
      }
    };

    chart = new Chart(canvas, {
      type: 'line',
      data: { labels: YEARS, datasets: buildDatasets() },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(45,49,66,0.95)',
            borderColor: 'rgba(78,205,196,0.2)',
            borderWidth: 1,
            padding: 12,
            titleFont: { size: 13, weight: '600' },
            bodyFont: { size: 12 },
            callbacks: {
              label: function (ctx) {
                if (ctx.raw === 0) return null;
                return ' ' + ctx.dataset.label + ': $' + ctx.raw + 'B';
              },
              afterBody: function (items) {
                const total = items.reduce((s, i) => s + (i.raw || 0), 0);
                return '\n Total: $' + total + 'B';
              }
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#A0A8BC', font: { size: 11 } } },
          y: {
            stacked: true, beginAtZero: true,
            ticks: { callback: v => '$' + v + 'B', color: '#A0A8BC', font: { size: 11 }, maxTicksLimit: 8 },
            grid: { color: 'rgba(255,255,255,0.04)' }
          },
          yRevenue: {
            display: false, beginAtZero: true, min: 0,
            afterDataLimits(axis) { const m = axis.chart.scales.y.max; if (m) axis.max = m; }
          }
        },
        elements: { line: { borderJoinStyle: 'round' } }
      },
      plugins: [gpt4Plugin]
    });

    const togs = document.getElementById('slide7CapexToggles');
    if (togs) {
      togs.addEventListener('click', e => {
        const btn = e.target.closest('.capex-tog');
        if (!btn) return;
        const key = btn.dataset.company;
        if (activeCompanies.has(key)) {
          if (activeCompanies.size === 1) return;
          activeCompanies.delete(key);
          btn.classList.remove('active');
        } else {
          activeCompanies.add(key);
          btn.classList.add('active');
        }
        chart.data.datasets = buildDatasets();
        chart.update('active');
        updateTotal();
      });
    }

    const gap = document.getElementById('slide7GapToggle');
    if (gap) {
      gap.addEventListener('change', () => {
        showGap = gap.checked;
        chart.data.datasets = buildDatasets();
        chart.update('active');
      });
    }
  }

  // ─── SLIDE 4 — Funnel (was slide 6 — GSAP) ───
  ANIMATIONS[5] = function () {
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
    const modelPool = ['DeepSeek V3.2', 'GPT-5.5', 'Claude Opus 4.7', 'Gemini 3.1 Pro', 'Qwen3.5', 'GLM-5', 'Llama 4'];
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
    document.getElementById('slide-5')._modelTimer = modelTimer;

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

  // ─── SLIDE 5 — Model cluster (3 lanes: Commodity / Specialist / Restricted) ───
  ANIMATIONS[6] = function () {
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

  // ─── SLIDE 6 — Smarter AND cheaper dual axis (was 8) ───
  let smarterChart = null;
  ANIMATIONS[7] = function () {
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

  // ─── SLIDE 8 — Agent anatomy (iframe of 7-layer stack) ───
  ANIMATIONS[9] = function () {
    initSlide8AgentStack();
    const layers = document.querySelectorAll('#slide-9 .aa-layer');
    if (window.gsap && layers.length) {
      gsap.fromTo(layers,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.06 }
      );
    }
  };

  // Native agent stack: accordion + chip tooltips. Idempotent — safe to call repeatedly.
  function initSlide8AgentStack() {
    const stack = document.getElementById('slide8AgentStack');
    if (!stack || stack.dataset.inited === '1') return;
    stack.dataset.inited = '1';

    // Accordion behavior: click any layer-bar to expand/collapse.
    const layers = stack.querySelectorAll('.aa-layer');
    layers.forEach(layer => {
      const bar = layer.querySelector('.aa-layer-bar');
      if (!bar) return;
      bar.setAttribute('role', 'button');
      bar.setAttribute('tabindex', '0');
      const handle = () => {
        const wasExpanded = layer.classList.contains('aa-layer--expanded');
        layers.forEach(l => l.classList.remove('aa-layer--expanded'));
        if (!wasExpanded) layer.classList.add('aa-layer--expanded');
      };
      bar.addEventListener('click', handle);
      bar.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle(); }
      });
    });

    // Chip tooltips (desktop hover, mobile tap, keyboard focus).
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    let popup = null;
    let activeChip = null;

    function ensurePopup() {
      if (popup) return popup;
      popup = document.createElement('div');
      popup.className = 'aa-tip-popup';
      popup.setAttribute('role', 'tooltip');
      document.body.appendChild(popup);
      return popup;
    }

    function showTip(chip) {
      const tipHtml = chip.getAttribute('data-tip');
      if (!tipHtml) return;
      const p = ensurePopup();
      p.innerHTML = tipHtml;
      p.classList.toggle('aa-tip-popup--funded',
        chip.classList.contains('aa-tool-chip--funded') || chip.classList.contains('aa-tool-chip--dvc'));
      // Position above chip, centered, within viewport
      const r = chip.getBoundingClientRect();
      const pw = Math.min(320, window.innerWidth - 24);
      p.style.maxWidth = pw + 'px';
      // Force a reflow to measure height
      p.style.left = '0px';
      p.style.top = '0px';
      p.classList.add('aa-tip-popup--visible');
      const ph = p.offsetHeight;
      const pwReal = p.offsetWidth;
      let left = r.left + (r.width / 2) - (pwReal / 2);
      left = Math.max(12, Math.min(window.innerWidth - pwReal - 12, left));
      let top = r.top - ph - 10;
      if (top < 12) top = r.bottom + 10;
      p.style.left = left + 'px';
      p.style.top = top + 'px';
      activeChip = chip;
    }

    function hideTip() {
      if (popup) popup.classList.remove('aa-tip-popup--visible');
      activeChip = null;
    }

    const chips = stack.querySelectorAll('.aa-tool-chip--has-tip[data-tip]');
    chips.forEach(chip => {
      chip.setAttribute('tabindex', '0');
      if (!isTouch) {
        chip.addEventListener('mouseenter', () => showTip(chip));
        chip.addEventListener('mouseleave', hideTip);
      }
      chip.addEventListener('focus', () => showTip(chip));
      chip.addEventListener('blur', hideTip);
      chip.addEventListener('click', e => {
        if (!isTouch) return;
        e.stopPropagation();
        if (activeChip === chip) hideTip(); else showTip(chip);
      });
    });

    // Tap outside to dismiss on touch.
    document.addEventListener('click', e => {
      if (!isTouch) return;
      if (!activeChip) return;
      if (e.target.closest && e.target.closest('.aa-tool-chip--has-tip')) return;
      hideTip();
    });
    window.addEventListener('scroll', hideTip, true);
    window.addEventListener('resize', hideTip);
  }

  // ─── SLIDE 9 — Vibe coding cards ───
  ANIMATIONS[10] = function () {
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

  // ─── SLIDE 13 — Physical AI: 3 motion tiles + stat strip (REBUILT) ───
  ANIMATIONS[14] = function () {
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

  // ─── SLIDE 10 — Pricing + ARPU (NATIVE bars) ───
  ANIMATIONS[11] = function () {
    const icons = document.querySelectorAll('#slide-11 .pricing-icon');
    if (icons.length && window.gsap) {
      gsap.from(icons, { y: 14, opacity: 0, duration: 0.45, stagger: 0.07, ease: 'power2.out' });
    }
    const fills = document.querySelectorAll('#slide-11 .slide-arpu-fill');
    if (fills.length && window.gsap) {
      fills.forEach(function (el) {
        const target = el.style.width || '0%';
        gsap.fromTo(el,
          { width: 0, opacity: 0.4 },
          { width: target, opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.2 }
        );
      });
    }
  };

  // ─── SLIDE 11 — Sequoia services matrix (NATIVE) ───
  ANIMATIONS[12] = function () {
    const slide = document.getElementById('slide-12');
    bindSlideTooltips(slide);
    const entries = slide ? slide.querySelectorAll('.seq-entry') : [];
    if (!entries.length) return;
    // Guarantee final state (opacity 1, no transform) regardless of animation outcome —
    // direct-hash entry was leaving entries at opacity:0 because gsap.from could fire
    // twice and the second invocation reset all entries mid-tween.
    entries.forEach(function (el) { el.style.opacity = '1'; el.style.transform = ''; });
    if (window.gsap) {
      gsap.fromTo(entries,
        { y: 6, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, stagger: 0.012, ease: 'power2.out',
          onComplete: function () {
            entries.forEach(function (el) { el.style.opacity = '1'; el.style.transform = ''; });
          },
          onInterrupt: function () {
            entries.forEach(function (el) { el.style.opacity = '1'; el.style.transform = ''; });
          }
        });
    }
  };

  // ─── SLIDE 12 — Three attack angles (NATIVE via attack-angles.js) ───
  ANIMATIONS[13] = function () {
    if (window.ATTACK_ANGLES && typeof window.ATTACK_ANGLES.render === 'function') {
      window.ATTACK_ANGLES.render('attack-angles-block');
    }
    const cols = document.querySelectorAll('#slide-13 .aa-col');
    if (cols.length && window.gsap) {
      gsap.from(cols, { y: 18, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' });
    }
  };

  // ─── SLIDE 14 — Key Learnings (staggered card fade-in) ───
  ANIMATIONS[15] = function () {
    const cards = document.querySelectorAll('#slide-15 .kl-card');
    if (cards.length && window.gsap) {
      gsap.from(cards, { y: 14, opacity: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' });
    } else {
      cards.forEach((c, i) => {
        c.style.opacity = '0';
        c.style.transform = 'translateY(14px)';
        requestAnimationFrame(() => {
          setTimeout(() => {
            c.style.transition = 'opacity 450ms ease, transform 450ms ease';
            c.style.opacity = '1';
            c.style.transform = 'translateY(0)';
          }, i * 80);
        });
      });
    }
    const kicker = document.querySelector('#slide-15 .kl-kicker');
    if (kicker && window.gsap) {
      gsap.from(kicker, { y: 8, opacity: 0, delay: 0.55, duration: 0.5, ease: 'power2.out' });
    }
  };

  // ── Start ──
  // pick initial slide from hash (#slide-4 etc.)
  const m = location.hash.match(/^#slide-(\d+)$/);
  const startIdx = m ? Math.max(0, Math.min(total - 1, parseInt(m[1], 10) - 1)) : 0;
  activate(startIdx);

  // expose for debugging
  window.__deck = { activate, next, prev, get index() { return activeIndex; } };
})();
