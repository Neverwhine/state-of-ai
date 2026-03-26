(function() {
  'use strict';

  /* ================================================
     SECTION 8: PHYSICAL AI — INTERACTIVITY
     ================================================ */

  let fsdChartInstance = null;

  function initPhysicalAI() {
    initAVCardExpansion();
    initTreemapTooltips();
    initScrollAnimations();
  }

  /* --- AV Card Expand/Collapse --- */
  function initAVCardExpansion() {
    const avCards = document.querySelectorAll('.pai-av-card');
    avCards.forEach(card => {
      card.addEventListener('click', function() {
        const wasExpanded = this.classList.contains('expanded');
        // Collapse all first
        avCards.forEach(c => c.classList.remove('expanded'));
        // Toggle clicked
        if (!wasExpanded) {
          this.classList.add('expanded');
        }
      });
    });
  }

  /* --- Treemap Tooltips --- */
  function initTreemapTooltips() {
    const cells = document.querySelectorAll('.pai-treemap-cell');
    const tooltip = document.getElementById('pai-treemap-tooltip');
    if (!tooltip) return;

    cells.forEach(cell => {
      cell.addEventListener('mouseenter', function(e) {
        const detail = this.getAttribute('data-detail');
        const sector = this.getAttribute('data-sector');
        if (detail) {
          tooltip.innerHTML = '<strong style="color:#fff;display:block;margin-bottom:4px">' + sector + '</strong>' + detail;
          tooltip.classList.add('visible');
        }
      });

      cell.addEventListener('mousemove', function(e) {
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top = (e.clientY - 10) + 'px';
      });

      cell.addEventListener('mouseleave', function() {
        tooltip.classList.remove('visible');
      });
    });
  }

  /* --- FSD Miles Chart (Chart.js) --- */
  function initFSDChart() {
    const canvas = document.getElementById('pai-fsd-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    if (fsdChartInstance) return; // Already initialized

    const ctx = canvas.getContext('2d');

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(78, 205, 196, 0.35)');
    gradient.addColorStop(1, 'rgba(78, 205, 196, 0.02)');

    fsdChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['2021', '2022', '2023', '2024', '2025', '2026E'],
        datasets: [
          {
            type: 'line',
            label: 'Cumulative Miles (B)',
            data: [0.006, 0.08, 0.67, 2.25, 4.25, 10],
            borderColor: '#4ECDC4',
            backgroundColor: gradient,
            borderWidth: 3,
            pointBackgroundColor: '#4ECDC4',
            pointBorderColor: '#2D3142',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
            tension: 0.3,
            order: 1
          },
          {
            type: 'bar',
            label: 'Cumulative Miles (B)',
            data: [0.006, 0.08, 0.67, 2.25, 4.25, 10],
            backgroundColor: [
              'rgba(78,205,196,0.15)',
              'rgba(78,205,196,0.2)',
              'rgba(78,205,196,0.25)',
              'rgba(78,205,196,0.3)',
              'rgba(78,205,196,0.35)',
              'rgba(245,197,66,0.3)'
            ],
            borderColor: [
              'rgba(78,205,196,0.3)',
              'rgba(78,205,196,0.35)',
              'rgba(78,205,196,0.4)',
              'rgba(78,205,196,0.5)',
              'rgba(78,205,196,0.6)',
              'rgba(245,197,66,0.5)'
            ],
            borderWidth: 1,
            borderRadius: 6,
            order: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1A1A2E',
            titleColor: '#fff',
            bodyColor: '#A0A8BC',
            borderColor: 'rgba(78,205,196,0.2)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: function(ctx) {
                if (ctx.datasetIndex === 0) {
                  const val = ctx.parsed.y;
                  if (val < 1) return (val * 1000).toFixed(0) + 'M miles';
                  return val.toFixed(2) + 'B miles';
                }
                return null;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#A0A8BC',
              font: { family: 'Inter', size: 12, weight: 600 }
            }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#A0A8BC',
              font: { family: 'Inter', size: 11 },
              callback: function(val) { return val + 'B'; }
            },
            beginAtZero: true
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  /* --- Economics Bars Animation --- */
  function animateEconBars() {
    const rows = document.querySelectorAll('.pai-econ-row');
    rows.forEach(row => {
      const val = parseFloat(row.getAttribute('data-value'));
      const max = parseFloat(row.getAttribute('data-max'));
      const bar = row.querySelector('.pai-econ-bar');
      if (bar && val && max) {
        const pct = (val / max) * 100;
        bar.style.width = Math.min(pct, 100) + '%';
      }
    });
  }

  /* --- Shipment Bar Animation --- */
  function animateShipmentBar() {
    const fills = document.querySelectorAll('.pai-shipment-fill');
    fills.forEach(fill => {
      const w = fill.getAttribute('data-width');
      if (w) {
        fill.style.width = w + '%';
      }
    });
  }

  /* --- Scroll-triggered Animations --- */
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;

          // Trigger chart when visible
          if (el.querySelector('#pai-fsd-chart')) {
            initFSDChart();
          }

          // Trigger econ bars
          if (el.querySelector('#pai-econ-bars') || el.classList.contains('pai-econ-block')) {
            setTimeout(animateEconBars, 300);
          }

          // Trigger shipment bar
          if (el.classList.contains('pai-shipment-bar') || el.querySelector('.pai-shipment-bar')) {
            setTimeout(animateShipmentBar, 300);
          }
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe the chart block
    const chartBlock = document.querySelector('.pai-chart-block');
    if (chartBlock) observer.observe(chartBlock);

    // Observe econ block
    const econBlock = document.querySelector('.pai-econ-block');
    if (econBlock) observer.observe(econBlock);

    // Observe shipment bar
    const shipBar = document.querySelector('.pai-shipment-bar');
    if (shipBar) observer.observe(shipBar);
  }

  /* --- Init on DOM Ready --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhysicalAI);
  } else {
    initPhysicalAI();
  }
})();
