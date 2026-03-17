/* ====================================
   DVC STATE OF AI — APP.JS
   All interactivity, animations, charts
   ==================================== */

(function () {
  'use strict';

  // --- PARTICLE CANVAS ---
  function initParticles(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;
    let width, height;

    const COLORS = ['#4ECDC4', '#6EAFD8', '#F5C542', '#7C4DFF', '#A0A8BC'];
    const PARTICLE_COUNT = Math.min(80, Math.floor(window.innerWidth / 15));
    const CONNECTION_DIST = 140;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    }

    function createParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.5 + 0.3,
      };
    }

    function init() {
      resize();
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle());
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.15;
            ctx.strokeStyle = `rgba(78, 205, 196, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    function update() {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }
    }

    function animate() {
      update();
      draw();
      animId = requestAnimationFrame(animate);
    }

    init();
    if (!reducedMotion) {
      animate();
    } else {
      draw();
    }

    window.addEventListener('resize', () => {
      resize();
      if (reducedMotion) draw();
    });
  }

  // --- INTERSECTION OBSERVER FOR ANIMATIONS ---
  function initScrollAnimations() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (reducedMotion) {
              entry.target.style.transition = 'none';
            }
            entry.target.classList.add('visible');
            // Don't unobserve — allows re-triggering if needed
            // But for performance, unobserve once shown
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    document.querySelectorAll('.anim-fade, .anim-slide-up').forEach((el) => {
      observer.observe(el);
    });
  }

  // --- NUMBER COUNTER ANIMATION ---
  function initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseFloat(el.dataset.target);
            const prefix = el.dataset.prefix || '';
            const suffix = el.dataset.suffix || '';
            const duration = reducedMotion ? 0 : 1500;
            const start = performance.now();

            if (duration === 0) {
              el.textContent = prefix + target + suffix;
              observer.unobserve(el);
              return;
            }

            function animate(now) {
              const elapsed = now - start;
              const progress = Math.min(elapsed / duration, 1);
              // Ease out cubic
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = target * eased;

              // Format number
              const formatted = target % 1 !== 0
                ? current.toFixed(1)
                : Math.floor(current).toString();

              el.textContent = prefix + formatted + suffix;

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                el.textContent = prefix + target + suffix;
              }
            }

            requestAnimationFrame(animate);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.3 }
    );

    counters.forEach((c) => observer.observe(c));
  }

  // --- SCROLL PROGRESS BAR ---
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;

    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + '%';
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // --- SIDEBAR NAVIGATION ---
  function initSidebar() {
    const dots = document.querySelectorAll('.nav-dot');
    const sections = [];

    dots.forEach((dot) => {
      const idx = dot.dataset.section;
      const sec = document.getElementById('sec-' + idx);
      if (sec) sections.push({ dot, sec, idx: parseInt(idx) });

      dot.addEventListener('click', () => {
        if (sec) {
          sec.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    function updateActive() {
      const scrollY = window.scrollY + window.innerHeight / 3;

      let activeIdx = 0;
      for (const s of sections) {
        if (scrollY >= s.sec.offsetTop) {
          activeIdx = s.idx;
        }
      }

      dots.forEach((d) => {
        d.classList.toggle('active', parseInt(d.dataset.section) === activeIdx);
      });
    }

    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
  }

  // --- KEYBOARD NAVIGATION ---
  function initKeyboard() {
    const sectionEls = document.querySelectorAll('.section');
    let currentSection = 0;

    function getCurrentSection() {
      const scrollY = window.scrollY + window.innerHeight / 2;
      for (let i = sectionEls.length - 1; i >= 0; i--) {
        if (scrollY >= sectionEls[i].offsetTop) {
          return i;
        }
      }
      return 0;
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        currentSection = Math.min(getCurrentSection() + 1, sectionEls.length - 1);
        sectionEls[currentSection].scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        currentSection = Math.max(getCurrentSection() - 1, 0);
        sectionEls[currentSection].scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // --- CHARTS (Chart.js) ---
  function initCharts() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Chart.js global defaults
    if (typeof Chart !== 'undefined') {
      Chart.defaults.color = '#A0A8BC';
      Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
      Chart.defaults.font.family = "'Inter', sans-serif";
      Chart.defaults.animation.duration = reducedMotion ? 0 : 1200;
    }

    // 1. Reasoning Model Usage Chart
    initReasoningChart();
    // 2. Hyperscaler Capex Chart
    initCapexChart();
    // 3. Energy Chart
    initEnergyChart();
  }

  function initReasoningChart() {
    const canvas = document.getElementById('reasoningChart');
    if (!canvas || typeof Chart === 'undefined') return;

    let chart = null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !chart) {
          chart = new Chart(canvas, {
            type: 'bar',
            data: {
              labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026'],
              datasets: [
                {
                  label: 'Reasoning Models (%)',
                  data: [2, 5, 12, 18, 28, 35, 42, 48, 55],
                  backgroundColor: '#4ECDC4',
                  borderRadius: 4,
                  barPercentage: 0.7,
                },
                {
                  label: 'Standard Models (%)',
                  data: [98, 95, 88, 82, 72, 65, 58, 52, 45],
                  backgroundColor: 'rgba(160,168,188,0.3)',
                  borderRadius: 4,
                  barPercentage: 0.7,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: 'top',
                  labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 },
                },
              },
              scales: {
                x: { stacked: true, grid: { display: false } },
                y: {
                  stacked: true,
                  max: 100,
                  ticks: { callback: (v) => v + '%' },
                  grid: { color: 'rgba(255,255,255,0.04)' },
                },
              },
            },
          });
          observer.unobserve(canvas);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(canvas);
  }

  function initCapexChart() {
    const canvas = document.getElementById('capexChart');
    if (!canvas || typeof Chart === 'undefined') return;

    let chart = null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !chart) {
          chart = new Chart(canvas, {
            type: 'bar',
            data: {
              labels: ['Microsoft', 'Amazon', 'Alphabet', 'Meta', 'Oracle'],
              datasets: [
                {
                  label: '2024',
                  data: [55, 48, 52, 37, 11],
                  backgroundColor: 'rgba(74, 144, 217, 0.5)',
                  borderColor: '#4A90D9',
                  borderWidth: 1,
                  borderRadius: 4,
                },
                {
                  label: '2025',
                  data: [80, 75, 75, 60, 25],
                  backgroundColor: 'rgba(78, 205, 196, 0.6)',
                  borderColor: '#4ECDC4',
                  borderWidth: 1,
                  borderRadius: 4,
                },
                {
                  label: '2026E',
                  data: [95, 90, 85, 72, 40],
                  backgroundColor: 'rgba(245, 197, 66, 0.6)',
                  borderColor: '#F5C542',
                  borderWidth: 1,
                  borderRadius: 4,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: 'top',
                  labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 },
                },
              },
              scales: {
                x: { grid: { display: false } },
                y: {
                  ticks: { callback: (v) => '$' + v + 'B' },
                  grid: { color: 'rgba(255,255,255,0.04)' },
                },
              },
            },
          });
          observer.unobserve(canvas);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(canvas);
  }

  function initEnergyChart() {
    const canvas = document.getElementById('energyChart');
    if (!canvas || typeof Chart === 'undefined') return;

    let chart = null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !chart) {
          chart = new Chart(canvas, {
            type: 'line',
            data: {
              labels: ['2023', '2024', '2025', '2026E', '2027E', '2028E'],
              datasets: [
                {
                  label: 'US Base Case (TWh)',
                  data: [176, 205, 240, 280, 325, 390],
                  borderColor: '#4ECDC4',
                  backgroundColor: 'rgba(78, 205, 196, 0.1)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 5,
                  pointBackgroundColor: '#4ECDC4',
                  borderWidth: 2.5,
                },
                {
                  label: 'US High Case (TWh)',
                  data: [176, 215, 265, 340, 440, 580],
                  borderColor: '#E8837C',
                  backgroundColor: 'rgba(232, 131, 124, 0.06)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 5,
                  pointBackgroundColor: '#E8837C',
                  borderWidth: 2.5,
                  borderDash: [6, 4],
                },
                {
                  label: 'China (TWh)',
                  data: [90, 100, 150, 190, 220, 260],
                  borderColor: '#F5C542',
                  backgroundColor: 'rgba(245, 197, 66, 0.08)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 5,
                  pointBackgroundColor: '#F5C542',
                  borderWidth: 2.5,
                  borderDash: [4, 3],
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: 'top',
                  labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 },
                },
              },
              scales: {
                x: { grid: { display: false } },
                y: {
                  ticks: { callback: (v) => v + ' TWh' },
                  grid: { color: 'rgba(255,255,255,0.04)' },
                },
              },
            },
          });
          observer.unobserve(canvas);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(canvas);
  }

  // --- MONEY FLOW SECTION ---
  function initMoneyFlow() {
    const section = document.querySelector('.section--money-flow');
    if (!section) return;

    // Layer expand/collapse
    const layers = section.querySelectorAll('.mf-layer');
    layers.forEach((layer) => {
      const header = layer.querySelector('.mf-layer-header');
      if (!header) return;
      header.addEventListener('click', () => {
        const wasExpanded = layer.classList.contains('expanded');
        // Collapse all
        layers.forEach((l) => l.classList.remove('expanded'));
        // Toggle clicked
        if (!wasExpanded) {
          layer.classList.add('expanded');
        }
      });
    });

    // Depreciation toggle
    const depData = {
      4: { dep: '$75K', profit: '$30K', margin: '20.0%', breakeven: '~80%' },
      5: { dep: '$60K', profit: '$45K', margin: '30.0%', breakeven: '~70%' },
      6: { dep: '$50K', profit: '$55K', margin: '36.7%', breakeven: '~63%' },
    };

    const depBtns = section.querySelectorAll('.mf-dep-btn');
    depBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        depBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const years = parseInt(btn.dataset.dep);
        const d = depData[years];
        if (!d) return;
        const depEl = document.getElementById('depDepreciation');
        const profEl = document.getElementById('depProfit');
        const margEl = document.getElementById('depMargin');
        const brkEl = document.getElementById('depBreakeven');
        if (depEl) depEl.textContent = d.dep;
        if (profEl) profEl.textContent = d.profit;
        if (margEl) margEl.textContent = d.margin;
        if (brkEl) brkEl.textContent = d.breakeven;
      });
    });

    // Year toggle
    const yearBtns = section.querySelectorAll('.mf-year-toggle .mf-toggle-btn');
    yearBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        yearBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const year = btn.dataset.year;
        // Update all elements with data-years attribute
        section.querySelectorAll('[data-years]').forEach((el) => {
          try {
            const years = JSON.parse(el.dataset.years);
            if (years[year]) {
              el.textContent = years[year];
            }
          } catch (e) { /* skip */ }
        });
      });
    });

    // $1 Journey toggle
    const journeyBtn = document.getElementById('mfJourneyBtn');
    const journeyOverlay = document.getElementById('mfJourneyOverlay');
    const journeyClose = document.getElementById('mfJourneyClose');
    if (journeyBtn && journeyOverlay) {
      journeyBtn.addEventListener('click', () => {
        journeyOverlay.classList.add('visible');
      });
      if (journeyClose) {
        journeyClose.addEventListener('click', () => {
          journeyOverlay.classList.remove('visible');
        });
      }
      journeyOverlay.addEventListener('click', (e) => {
        if (e.target === journeyOverlay) {
          journeyOverlay.classList.remove('visible');
        }
      });
    }

    // Particle flow canvases between layers
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
      initFlowCanvases(section);
    }
  }

  function initFlowCanvases(section) {
    const canvases = section.querySelectorAll('.mf-flow-canvas');
    canvases.forEach((canvas) => {
      const ctx = canvas.getContext('2d');
      const colorFrom = canvas.dataset.colorFrom || '#4ECDC4';
      const colorTo = canvas.dataset.colorTo || '#7C4DFF';
      let particles = [];
      const PARTICLE_COUNT = 12;

      function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 30;
      }

      function createParticle() {
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: 0.4 + Math.random() * 0.6,
          r: 1.5 + Math.random() * 1.5,
          progress: Math.random(),
        };
      }

      function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
      }

      function lerpColor(c1, c2, t) {
        const a = hexToRgb(c1);
        const b = hexToRgb(c2);
        return `rgba(${Math.round(a.r + (b.r - a.r) * t)}, ${Math.round(a.g + (b.g - a.g) * t)}, ${Math.round(a.b + (b.b - a.b) * t)}, 0.6)`;
      }

      function init() {
        resize();
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles.push(createParticle());
        }
      }

      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const p of particles) {
          p.y += p.vy;
          p.x += p.vx;
          p.progress = p.y / canvas.height;
          if (p.y > canvas.height) {
            p.y = 0;
            p.x = Math.random() * canvas.width;
            p.progress = 0;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = lerpColor(colorFrom, colorTo, p.progress);
          ctx.fill();
        }
        requestAnimationFrame(animate);
      }

      // Only run when visible
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            init();
            animate();
            observer.unobserve(canvas);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(canvas);
    });
  }

  // --- AUTONOMOUS REVOLUTION (sec-2) ---
  function initAutonomousRevolution() {
    const sec = document.getElementById('sec-2');
    if (!sec) return;

    // Agent card expand/collapse
    sec.querySelectorAll('.ar-agent-card').forEach((card) => {
      card.addEventListener('click', () => {
        const wasExpanded = card.classList.contains('ar-agent-card--expanded');
        // collapse all
        sec.querySelectorAll('.ar-agent-card--expanded').forEach((c) =>
          c.classList.remove('ar-agent-card--expanded')
        );
        if (!wasExpanded) card.classList.add('ar-agent-card--expanded');
      });
    });

    // How It Works collapsible
    const hw = sec.querySelector('.ar-howworks');
    if (hw) {
      const btn = hw.querySelector('.ar-howworks-toggle');
      btn.addEventListener('click', () => {
        const collapsed = hw.dataset.collapsed === 'true';
        hw.dataset.collapsed = collapsed ? 'false' : 'true';
        btn.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
      });
    }

    // Task bars — animate on scroll via existing anim-fade + visible
    // The bars use .ar-task-bar.visible .ar-task-fill { width: var(--target-width) }
    // The existing IntersectionObserver adds 'visible' class, which triggers the animation.

    // Deploy bars animate the same way via .anim-fade.visible .ar-deploy-bar-fill

    // Stat bar — animate fill when visible
    const statBar = sec.querySelector('.ar-stat-bar');
    if (statBar) {
      const fillObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.querySelector('.ar-stat-bar-fill').classList.add('animated');
              fillObs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      fillObs.observe(statBar);
    }
  }

  // --- INIT ---
  function init() {
    initParticles('particleCanvas');
    initParticles('particleCanvas2');
    initScrollAnimations();
    initCounters();
    initScrollProgress();
    initSidebar();
    initKeyboard();
    initCharts();
    initMoneyFlow();
    initAutonomousRevolution();
    initCapitalConcentration();
  }

  // ═══ CAPITAL CONCENTRATION INTERACTIVE CHARTS ═══
  function initCapitalConcentration() {
    // --- AUM Horizontal Bar Chart ---
    const aumContainer = document.getElementById('aumBars');
    if (aumContainer) {
      const aumData = [
        { name: 'BlackRock',       aum: 14.04, color: '#4ECDC4' },
        { name: 'Vanguard',        aum: 11.60, color: '#4ECDC4' },
        { name: 'UBS',             aum: 6.90,  color: '#4A90D9' },
        { name: 'Fidelity',        aum: 6.80,  color: '#4A90D9' },
        { name: 'State Street',    aum: 5.70,  color: '#4A90D9' },
        { name: 'JPMorgan',        aum: 4.80,  color: '#F5C542' },
        { name: 'Goldman Sachs',   aum: 3.60,  color: '#F5C542' },
        { name: 'Capital Group',   aum: 3.20,  color: '#F5C542' },
        { name: 'Crédit Agricole', aum: 2.72,  color: '#E8837C' },
        { name: 'Allianz',         aum: 2.55,  color: '#E8837C' },
      ];
      const maxAum = aumData[0].aum;

      aumData.forEach((d, i) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:0.75rem;';

        const label = document.createElement('span');
        label.style.cssText = 'min-width:110px;color:#C8CCD4;font-size:0.78rem;font-weight:600;text-align:right;white-space:nowrap;';
        label.textContent = d.name;

        const track = document.createElement('div');
        track.style.cssText = 'flex:1;height:26px;background:rgba(255,255,255,0.04);border-radius:6px;overflow:hidden;position:relative;';

        const fill = document.createElement('div');
        const pct = (d.aum / maxAum) * 100;
        fill.style.cssText = `width:0%;height:100%;border-radius:6px;background:${d.color};opacity:0.85;transition:width 1.2s cubic-bezier(0.22,1,0.36,1);transition-delay:${i * 0.08}s;position:relative;`;
        fill.dataset.targetWidth = pct + '%';

        const val = document.createElement('span');
        val.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:0.72rem;font-weight:700;color:#1a1d28;font-variant-numeric:tabular-nums;';
        val.textContent = '$' + d.aum.toFixed(1) + 'T';
        fill.appendChild(val);

        track.appendChild(fill);
        row.appendChild(label);
        row.appendChild(track);
        aumContainer.appendChild(row);
      });

      // Animate on scroll
      const aumObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            aumContainer.querySelectorAll('[data-target-width]').forEach(fill => {
              fill.style.width = fill.dataset.targetWidth;
            });
            aumObs.unobserve(e.target);
          }
        });
      }, { threshold: 0.2 });
      aumObs.observe(aumContainer);
    }

    // --- Pareto Deals Bar Chart ---
    const paretoContainer = document.getElementById('paretoDeals');
    if (paretoContainer) {
      const dealData = [
        { company: 'OpenAI',    amount: 110, label: '$110B',  date: 'Feb 2026',  investors: 'SoftBank, Microsoft, Thrive, NVIDIA',  color: '#E8837C' },
        { company: 'OpenAI',    amount: 40,  label: '$40B',   date: 'Mar 2025',  investors: 'SoftBank, Microsoft, Thrive Capital',  color: '#E8837C' },
        { company: 'Anthropic', amount: 30,  label: '$30B',   date: 'Jan 2026',  investors: 'Lightspeed, Spark, Google, SWFs',      color: '#F5C542' },
        { company: 'Scale AI',  amount: 14.3,label: '$14.3B', date: 'Jun 2025',  investors: 'Tiger Global, existing investors',      color: '#4ECDC4' },
        { company: 'Anthropic', amount: 13,  label: '$13B',   date: 'Jul 2025',  investors: 'Menlo Ventures, a16z, SWFs',            color: '#F5C542' },
        { company: 'xAI',       amount: 10,  label: '$10B+',  date: 'Apr 2025',  investors: 'A16z, Lightspeed, Sequoia',             color: '#4A90D9' },
        { company: 'Prometheus',amount: 6.2, label: '$6.2B',  date: 'Feb 2025',  investors: 'Mag 7-backed data center JV',           color: '#A78BFA' },
        { company: 'xAI',       amount: 5.3, label: '$5.3B',  date: 'Jan 2025',  investors: 'Qatar IA, a16z, Sequoia, Fidelity',     color: '#4A90D9' },
      ];
      const maxDeal = dealData[0].amount;
      let activeTooltipRow = null; // track active tooltip for mobile

      dealData.forEach((d, i) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:0.75rem;cursor:pointer;position:relative;';

        const label = document.createElement('span');
        label.style.cssText = 'min-width:85px;color:#C8CCD4;font-size:0.78rem;font-weight:600;text-align:right;white-space:nowrap;';
        label.textContent = d.company;

        const track = document.createElement('div');
        track.style.cssText = 'flex:1;height:32px;background:rgba(255,255,255,0.04);border-radius:8px;overflow:hidden;position:relative;';

        const fill = document.createElement('div');
        const pct = (d.amount / maxDeal) * 100;
        fill.style.cssText = `width:0%;height:100%;border-radius:8px;background:linear-gradient(90deg,${d.color},${d.color}cc);transition:width 1s cubic-bezier(0.22,1,0.36,1);transition-delay:${i * 0.1}s;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;min-width:fit-content;`;
        fill.dataset.targetWidth = pct + '%';

        const amountSpan = document.createElement('span');
        amountSpan.style.cssText = 'font-size:0.75rem;font-weight:700;color:#1a1d28;font-variant-numeric:tabular-nums;white-space:nowrap;';
        amountSpan.textContent = d.label;
        fill.appendChild(amountSpan);

        track.appendChild(fill);

        const dateBadge = document.createElement('span');
        dateBadge.style.cssText = 'min-width:65px;color:#A0A8BC;font-size:0.7rem;text-align:left;white-space:nowrap;';
        dateBadge.textContent = d.date;

        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(dateBadge);

        // Detail row (mobile-friendly, replaces tooltip on small screens)
        const detailRow = document.createElement('div');
        detailRow.style.cssText = 'display:none;padding:0.5rem 0 0.25rem 0;font-size:0.76rem;color:#A0A8BC;line-height:1.5;';
        detailRow.innerHTML = `<span style="color:${d.color};font-weight:600">${d.company}</span> · ${d.label} · ${d.date} — <span style="color:#C8CCD4">${d.investors}</span>`;

        // Tooltip (desktop hover)
        const tooltip = document.createElement('div');
        tooltip.style.cssText = 'position:absolute;bottom:110%;left:50%;transform:translateX(-50%);background:#2D3142;border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:0.6rem 1rem;font-size:0.76rem;color:#E8E9ED;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity 0.25s;z-index:10;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
        tooltip.innerHTML = `<strong style="color:${d.color}">${d.company}</strong> · ${d.label} · ${d.date}<br><span style="color:#A0A8BC">${d.investors}</span>`;
        row.appendChild(tooltip);

        // Desktop hover
        row.addEventListener('mouseenter', () => {
          if (window.innerWidth > 768) {
            tooltip.style.opacity = '1'; track.style.transform = 'scaleY(1.1)'; track.style.transition = 'transform 0.2s';
          }
        });
        row.addEventListener('mouseleave', () => {
          tooltip.style.opacity = '0'; track.style.transform = 'scaleY(1)';
        });

        // Mobile tap — toggle detail row
        row.addEventListener('click', (e) => {
          e.stopPropagation();
          const isVisible = detailRow.style.display !== 'none';
          // Close any previously open detail
          if (activeTooltipRow && activeTooltipRow !== detailRow) {
            activeTooltipRow.style.display = 'none';
          }
          detailRow.style.display = isVisible ? 'none' : 'block';
          activeTooltipRow = isVisible ? null : detailRow;
          // Highlight bar
          fill.style.opacity = isVisible ? '1' : '0.95';
          track.style.transform = isVisible ? 'scaleY(1)' : 'scaleY(1.05)';
          track.style.transition = 'transform 0.2s';
        });

        const wrapper = document.createElement('div');
        wrapper.appendChild(row);
        wrapper.appendChild(detailRow);
        paretoContainer.appendChild(wrapper);
      });

      // Close on outside tap
      document.addEventListener('click', () => {
        if (activeTooltipRow) { activeTooltipRow.style.display = 'none'; activeTooltipRow = null; }
      });

      // Animate on scroll
      const paretoObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            paretoContainer.querySelectorAll('div[data-target-width]').forEach(fill => {
              fill.style.width = fill.dataset.targetWidth;
            });
            paretoObs.unobserve(e.target);
          }
        });
      }, { threshold: 0.2 });
      paretoObs.observe(paretoContainer);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
