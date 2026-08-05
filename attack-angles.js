/* === Three Attack Angles on the Services Map ===
 * Single source of truth. Used by index.html (in #attack-angles-block) and slides.html (slide 15).
 */
(function () {
  'use strict';

  const ANGLES = [
    {
      key: 'saas',
      title: 'SAAS TO INCUMBENTS',
      tagline: 'Sell software to the people doing the work.',
      glyph: 'stack',
      color: '#4ECDC4',
      when: 'Many moderately-sized buyers · similar workflows',
      badWhen: 'Concentrated market or fragmented + sticky clients',
      customer: 'The service provider',
      capital: { label: 'Equity · moderate · inference-cost drag', dots: 2 },
      pricing: 'Seat + usage hybrid',
      grossMargin: 52,
      grossMarginLabel: '40-60%',
      ebitda: 5,
      ebitdaLabel: '0-10% (near break-even)',
      comps: [
        { name: 'Harvey',        detail: '$11B · ~$190M ARR (Jan 2026) ≈ 58×' },
        { name: 'Legora',        detail: 'Harvey’s direct European competitor' },
        { name: 'ServiceTitan',  detail: 'NASDAQ: TTAN' },
        { name: 'ServiceNow Otto', detail: 'May 2026' },
        { name: 'Agentforce',    detail: 'pay-per-resolution GA' }
      ],
      dvc: [
        { name: 'Avoca',              detail: 'AI comms · SMB services' },
        { name: 'Kick',               detail: 'Self-driving bookkeeping' },
        { name: 'PermitFlow',         detail: 'Construction permitting' },
        { name: 'FleetWorks',         detail: 'AI voice · freight' },
        { name: 'Hona AI',            detail: 'Clinical notes' },
        { name: 'Solve Intelligence', detail: 'Patent drafting' },
        { name: 'Docdraft',           detail: 'Legal drafting' },
        { name: 'Docsum',             detail: 'Contract negotiation' },
        { name: 'Eloquent AI',        detail: 'Financial services AI' }
      ]
    },
    {
      key: 'vertical',
      title: 'VERTICAL AGENTIC',
      tagline: 'Replace the service. Sell the outcome.',
      glyph: 'arrow',
      color: '#F5C542',
      when: 'Concentrated market · clear winners possible',
      badWhen: 'Highly fragmented or relationship-locked customers',
      customer: 'The end customer',
      capital: { label: 'Equity · heavy · deep venture-burn', dots: 3 },
      pricing: 'Outcome / per-task',
      grossMargin: 45,
      grossMarginLabel: '30-55%',
      ebitda: -15,
      ebitdaLabel: 'Negative (scaling)',
      comps: [
        { name: 'Sierra',     detail: '$15.8B / ~$165M ARR ≈ 96×' },
        { name: 'Decagon',    detail: '$4.5B ($250M Series D, Jan 2026) — no multiple shown: the ARR denominator could not be sourced' },
        { name: 'Lovable',    detail: '$500M ARR · 146 employees' },
        { name: 'Crescendo',  detail: 'Acquired PartnerHero' },
        { name: 'EvenUp',     detail: '$2B+ · demand letters' }
      ],
      dvc: [
        { name: 'Higgsfield',         detail: 'In talks at $5B · >$500M run-rate' },
        { name: 'Doctronic',          detail: 'AI medical consults · acquired Summer Health' },
        { name: 'Howie AI',           detail: 'EA · scheduling' },
        { name: 'tely.ai',            detail: 'B2B content marketing' },
        { name: 'Unreal Labs',        detail: 'Performance marketing' },
        { name: 'Keye',               detail: 'PE due diligence' },
        { name: 'Generative Alpha',   detail: 'Investment agent' },
        { name: 'Realytics',          detail: 'Consumer intel' },
        { name: 'Motives',            detail: 'Qualitative research' }
      ]
    },
    {
      key: 'rollup',
      title: 'AGENTIC ROLLUP',
      tagline: 'Buy the business. Automate. Lever up. Repeat.',
      glyph: 'rollup',
      color: '#E8837C',
      when: 'Fragmented · sticky client relationships',
      badWhen: 'Concentrated market or low operating leverage',
      customer: 'You become the service provider',
      capital: { label: 'Equity + Debt · acquisition leverage', dots: 3 },
      pricing: 'Own the P&L · price the work',
      grossMargin: 42,
      grossMarginLabel: '35-50%',
      ebitda: 35,
      ebitdaLabel: '30-40% target',
      comps: [
        { name: 'Dwelly',     detail: 'Property mgmt · $95M equity + debt', dvc: true },
        { name: 'Crete',      detail: 'Accounting rollup' },
        { name: 'Long Lake',  detail: 'HOA management rollup' },
        { name: 'Eudia',      detail: 'In-house legal' },
        { name: 'Titan + RFA', detail: 'IT managed services' },
        { name: 'Metropolis', detail: 'Parking operations' }
      ],
      dvc: [
        { name: 'Dwelly', detail: 'UK property mgmt · $95M equity + debt', link: 'fleetworks' },
        { name: 'Fura',   detail: 'Digital freight broker · uses FleetWorks', link: 'fleetworks' }
      ]
    }
  ];

  // ── Aug 3, 2026 context bands ──
  // Two things changed the competitive picture for the angles without changing
  // the angles themselves: the rollup arbitrage is now a funded contest, and the
  // model layer entered implementation services directly.
  const CONTEXT = {
    rollupContest: {
      tag: 'THE ROLLUP ARBITRAGE IS NOW A FUNDED CONTEST',
      body: 'The rollup arbitrage is now a funded contest: dedicated AI-services holding vehicles are raising against the same small-cap services targets that the angle depends on, alongside a large pool of PE/VC dry powder. We do not print fund sizes here — the specific figures we previously carried could not be sourced. The consequence stands: the 30&ndash;40% EBITDA arbitrage is no longer under-discovered, and the edge is sourcing and operating speed at the small end.'
    },
    modelLayerServices: {
      tag: 'MODEL LAYER ENTERS SERVICES',
      body: 'Anthropic entered AI implementation services directly through <strong>Ode with Anthropic</strong>, a joint venture with private-capital partners. We do not print the venture size or headcount — those figures could not be sourced. The structural point is what matters: the services-capture thesis now has a competitor that owns the model.'
    },
    disclosure: 'Multiples are computed on company-disclosed, unaudited ARR, and are dated where the denominator is dated. Margin bands are DVC estimates unchanged from the May 2026 edition. Funding and revenue figures were re-checked against source on Aug 4, 2026.'
  };

  function contextHTML(compact) {
    const cls = compact ? ' aa-context--compact' : '';
    return `
      <div class="aa-context${cls}">
        <div class="aa-context-card aa-context-card--rollup">
          <span class="aa-context-tag">${CONTEXT.rollupContest.tag}</span>
          <p class="aa-context-body">${CONTEXT.rollupContest.body}</p>
        </div>
        <div class="aa-context-card aa-context-card--model">
          <span class="aa-context-tag">${CONTEXT.modelLayerServices.tag}</span>
          <p class="aa-context-body">${CONTEXT.modelLayerServices.body}</p>
        </div>
      </div>
      <p class="aa-context-note">${CONTEXT.disclosure}</p>
    `;
  }

  // SVG glyphs for column headers
  const GLYPHS = {
    stack: '<svg viewBox="0 0 60 60" width="48" height="48" aria-hidden="true"><rect x="10" y="14" width="40" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="10" y="26" width="40" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="10" y="38" width="40" height="8" rx="2" fill="currentColor" opacity="0.18" stroke="currentColor" stroke-width="2"/></svg>',
    arrow: '<svg viewBox="0 0 60 60" width="48" height="48" aria-hidden="true"><circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" stroke-width="2" opacity="0.45"/><path d="M 8 30 L 50 30 M 42 22 L 50 30 L 42 38" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    rollup: '<svg viewBox="0 0 60 60" width="48" height="48" aria-hidden="true"><rect x="6" y="10" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2" opacity="0.55"/><rect x="6" y="36" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2" opacity="0.55"/><rect x="40" y="10" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2" opacity="0.55"/><rect x="22" y="22" width="22" height="16" rx="3" fill="currentColor" opacity="0.18" stroke="currentColor" stroke-width="2"/><path d="M 20 17 L 24 25 M 20 43 L 24 35 M 40 17 L 36 25" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/></svg>'
  };

  function dotMeter(filled) {
    let s = '';
    for (let i = 0; i < 3; i++) {
      s += `<span class="aa-dot${i < filled ? ' aa-dot--on' : ''}"></span>`;
    }
    return s;
  }

  function chipsHTML(items, accent) {
    return items.map(c => `
      <div class="aa-chip${c.dvc ? ' aa-chip--dvc' : ''}" style="--aa-accent:${accent}">
        <span class="aa-chip-name">${c.name}${c.dvc ? ' <span class="aa-dvc-pill">DVC</span>' : ''}</span>
        <span class="aa-chip-detail">${c.detail}</span>
      </div>
    `).join('');
  }

  function dvcChipsHTML(items, accent) {
    return items.map(c => `
      <div class="aa-chip aa-chip--dvc${c.link ? ' aa-chip--linked' : ''}" data-link="${c.link || ''}" style="--aa-accent:${accent}">
        <span class="aa-chip-name">${c.name}<span class="aa-dvc-pill">DVC</span></span>
        <span class="aa-chip-detail">${c.detail}</span>
      </div>
    `).join('');
  }

  function render(target) {
    const el = (typeof target === 'string') ? document.getElementById(target) : target;
    if (!el) return;
    if (el.dataset.aaRendered === '1') return;

    el.innerHTML = `
      <div class="aa-header">
        <h3 class="aa-title">Three angles of attack on the services map.</h3>
        <p class="aa-sub">Market structure picks the strategy. Founders who pick the wrong one fight gravity.</p>
      </div>
      <div class="aa-grid">
        ${ANGLES.map(a => `
          <article class="aa-col" data-angle="${a.key}" style="--aa-accent:${a.color}">
            <header class="aa-col-head">
              <div class="aa-glyph">${GLYPHS[a.glyph]}</div>
              <h4 class="aa-col-title">${a.title}</h4>
              <p class="aa-col-tagline">${a.tagline}</p>
            </header>

            <dl class="aa-rows">
              <div class="aa-row">
                <dt>Customer</dt>
                <dd><strong>${a.customer}</strong></dd>
              </div>
              <div class="aa-row">
                <dt>Best when</dt>
                <dd class="aa-best">${a.when}</dd>
              </div>
              <div class="aa-row">
                <dt>Bad when</dt>
                <dd class="aa-bad">${a.badWhen}</dd>
              </div>
              <div class="aa-row">
                <dt>Capital</dt>
                <dd>
                  <span class="aa-meter" aria-label="Capital intensity">${dotMeter(a.capital.dots)}</span>
                  <span class="aa-meter-label">${a.capital.label}</span>
                </dd>
              </div>
              <div class="aa-row">
                <dt>Pricing</dt>
                <dd>${a.pricing}</dd>
              </div>
              <div class="aa-row aa-row--bars">
                <dt>Margin profile</dt>
                <dd>
                  <div class="aa-bar-row">
                    <span class="aa-bar-label">Gross</span>
                    <div class="aa-bar"><div class="aa-bar-fill aa-bar-fill--gross" style="width:${a.grossMargin}%"></div></div>
                    <span class="aa-bar-num">${a.grossMarginLabel}</span>
                  </div>
                  <div class="aa-bar-row">
                    <span class="aa-bar-label">EBITDA</span>
                    <div class="aa-bar${a.ebitda < 0 ? ' aa-bar--negative' : ''}"><div class="aa-bar-fill aa-bar-fill--ebitda" style="width:${Math.max(4, Math.abs(a.ebitda))}%"></div></div>
                    <span class="aa-bar-num">${a.ebitdaLabel}</span>
                  </div>
                </dd>
              </div>
              <div class="aa-row aa-row--chips">
                <dt>Comps</dt>
                <dd class="aa-chips">${chipsHTML(a.comps, a.color)}</dd>
              </div>
              <div class="aa-row aa-row--chips">
                <dt>DVC plays</dt>
                <dd class="aa-chips aa-chips--dvc">${dvcChipsHTML(a.dvc, a.color)}</dd>
              </div>
            </dl>
          </article>
        `).join('')}
      </div>
      ${contextHTML(false)}
      <p class="aa-footer">
        <strong>Pick one.</strong> The market structure picks the strategy &mdash; not the founder.
        <span class="aa-footer-note">Inside DVC: <strong>Fura</strong> (rollup) uses <strong>FleetWorks</strong> (SaaS) for its AI voice layer &mdash; the portfolio compounds.</span>
      </p>
    `;
    el.dataset.aaRendered = '1';
  }

  // Compact stage-only renderer: 3 illustrative cards, no chip-dump.
  // Speech: "do not read every company in the table now; point is the lens."
  function renderStage(target) {
    const el = (typeof target === 'string') ? document.getElementById(target) : target;
    if (!el) return;
    if (el.dataset.aaStageRendered === '1') return;

    el.innerHTML = `
      <div class="aa-stage-cards">
        ${ANGLES.map(a => `
          <article class="aa-stage-card" style="--aa-accent:${a.color}">
            <header class="aa-stage-card-head">
              <div class="aa-stage-glyph">${GLYPHS[a.glyph]}</div>
              <h4 class="aa-stage-card-title">${a.title}</h4>
              <p class="aa-stage-card-tagline">${a.tagline}</p>
            </header>
            <ul class="aa-stage-facts">
              <li><span class="aa-stage-fact-label">Customer</span><span class="aa-stage-fact-value">${a.customer}</span></li>
              <li><span class="aa-stage-fact-label">Best when</span><span class="aa-stage-fact-value">${a.when}</span></li>
              <li><span class="aa-stage-fact-label">Pricing</span><span class="aa-stage-fact-value">${a.pricing}</span></li>
              <li><span class="aa-stage-fact-label">Capital</span><span class="aa-stage-fact-value">${a.capital.label}</span></li>
              <li><span class="aa-stage-fact-label">Margin</span><span class="aa-stage-fact-value tabnum">Gross ${a.grossMarginLabel} · EBITDA ${a.ebitdaLabel}</span></li>
            </ul>
            <div class="aa-stage-examples">
              <span class="aa-stage-examples-label">Examples</span>
              <span class="aa-stage-examples-list">${a.comps.slice(0, 3).map(c => c.name).join(' · ')}</span>
            </div>
          </article>
        `).join('')}
      </div>
      ${contextHTML(true)}
      <p class="aa-stage-footer">Market structure picks the strategy — not the founder. <span class="aa-stage-footer-note">Full company map in the report.</span></p>
    `;
    el.dataset.aaStageRendered = '1';
  }

  // Expose globally so both index.html and slides.html can call it.
  window.ATTACK_ANGLES = { ANGLES, CONTEXT, render, renderStage };

  // Auto-render if a default container is present in the page.
  function autoRender() {
    render('attack-angles-block');
    renderStage('attack-angles-stage');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRender);
  } else {
    autoRender();
  }
})();
