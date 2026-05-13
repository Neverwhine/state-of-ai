/* =====================================================================
   HEALTHCARE AI — INTERACTIVE MODULES (multi-stop rebuild)
   Renders:
     1) Three-layer Money River (D3 Sankey):  payments → destinations → cost pools
        - Layer A/B values are official 2024 CMS NHE.
        - Layer C is modeled and visually marked (diagonal hatch texture).
        - DVC/portfolio coloring is NEVER applied to Sankey links.
     2) Contextual company drawer: selecting a node, pool, AI surface, or
        process step lists relevant companies. Neutral badges by default.
     3) Directional Patient Event / Prevention Loop in SVG with C1-C8 (clockwise
        care) and F1-F8 (counterclockwise financial) arrow paths, VBC bridge
        annotation, private-pay prevention orbit, shared stack dependency lines.
   Requires: d3 v7 + d3-sankey, window.HEALTHCARE_DATA
   ===================================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function evidenceBadge(ev) {
    if (!ev) return '';
    var map = {
      official:         ['hc-badge--official', 'Official, 2024 CMS NHE'],
      modeled:          ['hc-badge--modeled',  'Modeled'],
      modeled_residual: ['hc-badge--modeled',  'Modeled residual'],
      company_claim:    ['hc-badge--company',  'Company claim'],
      vc_survey:        ['hc-badge--vc',       'VC survey'],
      context:          ['hc-badge--context',  'Context'],
      internal:         ['hc-badge--context',  'Internal']
    };
    var v = map[ev] || map.context;
    return '<span class="hc-badge ' + v[0] + '">' + v[1] + '</span>';
  }

  ready(function () {
    var root = document.getElementById('sec-healthcare-ai');
    if (!root) return;
    var DATA = window.HEALTHCARE_DATA;
    if (!DATA) return;

    // =================================================================
    // SHARED TOOLTIP (hover only) + STICKY DETAIL DRAWER (click)
    // =================================================================
    var tipEl = document.createElement('div');
    tipEl.className = 'hc-tooltip';
    tipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tipEl);
    var tipTimer = null;

    function showTip(html, x, y) {
      if (tipTimer) { clearTimeout(tipTimer); tipTimer = null; }
      tipEl.innerHTML = html;
      tipEl.classList.add('is-visible');
      var pad = 14;
      var w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      var maxX = window.innerWidth - w - pad;
      var maxY = window.innerHeight - h - pad;
      tipEl.style.left = Math.max(pad, Math.min(maxX, x + 14)) + 'px';
      tipEl.style.top  = Math.max(pad, Math.min(maxY, y + 14)) + 'px';
    }
    function hideTip() {
      // Defer hide to avoid flicker when moving between adjacent targets.
      if (tipTimer) clearTimeout(tipTimer);
      tipTimer = setTimeout(function () { tipEl.classList.remove('is-visible'); }, 60);
    }

    function tipForTerm(t) {
      return '<div class="hc-tooltip-title">' + escapeHtml(t.term) + '</div>' +
             '<div>' + escapeHtml(t.def) + '</div>' +
             (t.why ? '<div class="hc-tooltip-meta">' + escapeHtml(t.why) + '</div>' : '');
    }

    // =================================================================
    // CONTROL STATE  (logical toggles)
    // =================================================================
    // Money toggles:
    //   moneyOnly: hide overlays
    //   showAi: render AI surface chips/outline on cost pools
    //   showCompanies: render contextual company badges
    //   portfolioOnly: filter companies to DVC group when enabled
    var state = {
      moneyOnly: true,
      showAi: false,
      showCompanies: false,
      portfolioOnly: false,
      selection: null   // { type: 'node' | 'pool' | 'ai' | 'step' | 'company', id }
    };

    // =================================================================
    // STATS, SPONSORS, SOURCES, TAKEAWAYS
    // =================================================================
    var statsRow = root.querySelector('#hc-stats-row');
    if (statsRow) {
      statsRow.innerHTML = DATA.headlineStats.map(function (s) {
        return '<div class="hc-stat">' +
                 '<div class="hc-stat-value tabnum">' + escapeHtml(s.value) + '</div>' +
                 '<div class="hc-stat-label">' + escapeHtml(s.label) + '</div>' +
                 (s.sub ? '<div class="hc-stat-sub">' + escapeHtml(s.sub) + '</div>' : '') +
                 evidenceBadge(s.evidence) +
               '</div>';
      }).join('');
    }

    var sponsorStrip = root.querySelector('#hc-sponsor-strip');
    if (sponsorStrip) {
      var html = '<div class="hc-sponsor-label">Ultimate sponsors · 2024 CMS NHE</div>';
      html += DATA.sponsors.map(function (s) {
        return '<button type="button" class="hc-sponsor-bar" data-sponsor="' + s.id + '">' +
                 '<span class="hc-sponsor-bar-value tabnum">' + escapeHtml(s.display) + '</span>' +
                 '<span class="hc-sponsor-bar-label">' + escapeHtml(s.label) + '</span>' +
               '</button>';
      }).join('');
      sponsorStrip.innerHTML = html;
      sponsorStrip.querySelectorAll('.hc-sponsor-bar').forEach(function (el) {
        var s = DATA.sponsors.find(function (x) { return x.id === el.dataset.sponsor; });
        if (!s) return;
        el.addEventListener('mouseenter', function (ev) {
          showTip('<div class="hc-tooltip-title">' + escapeHtml(s.label) + '</div>' +
                  '<div>' + escapeHtml(s.tooltip) + '</div>' +
                  '<div class="hc-tooltip-meta">Sponsor strip is illustrative, not part of the balanced Sankey.</div>',
                  ev.clientX, ev.clientY);
        });
        el.addEventListener('mouseleave', hideTip);
      });
    }

    var sourcesList = root.querySelector('#hc-sources-list');
    if (sourcesList) {
      sourcesList.innerHTML = DATA.sources.map(function (s) {
        return '<li><a href="' + s.url + '" target="_blank" rel="noopener">' + escapeHtml(s.label) + '</a></li>';
      }).join('');
    }

    var takeawayWrap = root.querySelector('#hc-takeaways');
    if (takeawayWrap) {
      takeawayWrap.innerHTML = DATA.takeaways.map(function (t) {
        return '<div class="hc-takeaway"><div class="hc-takeaway-h">' + escapeHtml(t.title) + '</div>' +
                 '<div class="hc-takeaway-c">' + escapeHtml(t.copy) + '</div></div>';
      }).join('');
    }

    // Term-tooltip wiring (inline glossary spans)
    root.querySelectorAll('.hc-term[data-tt]').forEach(function (el) {
      var t = DATA.tooltips[el.dataset.tt];
      if (!t) return;
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', t.term + ': ' + t.def);
      el.addEventListener('mouseenter', function (ev) { showTip(tipForTerm(t), ev.clientX, ev.clientY); });
      el.addEventListener('mouseleave', hideTip);
      el.addEventListener('focus', function () { var r = el.getBoundingClientRect(); showTip(tipForTerm(t), r.left, r.bottom); });
      el.addEventListener('blur', hideTip);
    });

    // =================================================================
    // MONEY RIVER — Three-layer Sankey
    // =================================================================
    var insightEl    = root.querySelector('#hc-insight');
    var moneySvgEl   = root.querySelector('#hc-sankey-svg');
    var fallbackEl   = root.querySelector('#hc-fallback');
    var bottomSheet  = root.querySelector('#hc-bottom-sheet');

    function renderDefaultInsight() {
      var calls = DATA.moneyCallouts.slice(0, 4).map(function (c) {
        return '<div class="hc-callout"><div class="hc-callout-title">' + escapeHtml(c.title) +
               '</div><div class="hc-callout-body">' + escapeHtml(c.copy) + '</div></div>';
      }).join('');
      insightEl.innerHTML =
        '<div class="hc-insight-title">Money River — three stops</div>' +
        '<div class="hc-insight-head"><h4>Payments → destinations → cost pools</h4></div>' +
        '<div class="hc-insight-body">' +
          '<p><strong>Layer A</strong> and <strong>Layer B</strong> use official 2024 CMS NHE totals. <strong>Layer C</strong> decomposes destinations into modeled operating cost pools — what those dollars actually fund. Modeled links use a subtle diagonal hatch; node totals always balance to $5.3T.</p>' +
          '<p>Click a node or pool to lock the drawer. Toggle <em>Show AI surfaces</em> to outline where AI intervenes; toggle <em>Show company examples</em> to attach contextual badges.</p>' +
          '<div class="hc-callout-stack">' + calls + '</div>' +
        '</div>';
    }
    function setInsight(html) { if (insightEl) insightEl.innerHTML = html; }
    renderDefaultInsight();

    if (!window.d3 || !window.d3.sankey) {
      if (fallbackEl) fallbackEl.classList.remove('is-hidden');
      console.warn('[healthcare] d3-sankey not available; fallback tables shown.');
    } else {
      try {
        renderSankey();
        if (fallbackEl) fallbackEl.classList.add('is-hidden');
      } catch (e) {
        console.error('[healthcare] sankey render failed', e);
        if (fallbackEl) fallbackEl.classList.remove('is-hidden');
      }
    }

    var sankeyGraph = null;
    var d3LinkSel   = null;
    var d3NodeSel   = null;
    var overlayG    = null;
    var aiChipsByPool = {};
    var companyBadgesByPool = {};
    var companyBadgesByDest = {};

    function renderSankey() {
      var d3 = window.d3;
      var svg = d3.select(moneySvgEl);
      svg.selectAll('*').remove();

      var bbox = moneySvgEl.getBoundingClientRect();
      var width = Math.max(960, bbox.width || moneySvgEl.parentNode.clientWidth || 1000);
      var height = 760;
      var isMobile = window.innerWidth < 768;
      if (isMobile) { width = Math.max(1180, width); height = 820; }

      svg.attr('viewBox', '0 0 ' + width + ' ' + height);
      svg.attr('preserveAspectRatio', 'xMinYMin meet');

      // SVG <defs>: hatch pattern for modeled links + arrow markers
      var defs = svg.append('defs');
      var pat = defs.append('pattern')
        .attr('id', 'hc-modeled-hatch')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 6).attr('height', 6)
        .attr('patternTransform', 'rotate(45)');
      pat.append('rect').attr('width', 6).attr('height', 6).attr('fill', 'transparent');
      pat.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 6)
        .attr('stroke', 'rgba(232,233,237,0.18)').attr('stroke-width', 2);

      // Build three-layer node + link arrays
      var layerA = DATA.paymentChannels.map(function (n) { return Object.assign({}, n, { layer: 0 }); });
      var layerB = DATA.destinations.map(function (n) { return Object.assign({}, n, { layer: 1 }); });
      var poolTotals = {};
      DATA.moneyLinksBC.forEach(function (l) {
        poolTotals[l.target] = (poolTotals[l.target] || 0) + l.value_b;
      });
      var layerC = DATA.costPools.map(function (p) {
        return Object.assign({}, p, {
          layer: 2,
          value_b: poolTotals[p.id] || 0,
          display: '$' + Math.round(poolTotals[p.id] || 0).toLocaleString() + 'B',
          evidence: 'modeled'
        });
      });

      var allNodes = layerA.concat(layerB, layerC);
      var allLinks = []
        .concat(DATA.moneyLinksAB.map(function (l) {
          return { source: l.source, target: l.target, value: l.value_b, evidence: 'modeled', span: 'AB' };
        }))
        .concat(DATA.moneyLinksBC.map(function (l) {
          return { source: l.source, target: l.target, value: l.value_b, evidence: 'modeled', span: 'BC' };
        }));

      var sankey = d3.sankey()
        .nodeId(function (d) { return d.id; })
        .nodeWidth(16)
        .nodePadding(10)
        .nodeAlign(d3.sankeyJustify || d3.sankeyLeft)
        .extent([[18, 30], [width - 18, height - 30]]);

      sankeyGraph = sankey({
        nodes: allNodes.map(function (n) { return Object.assign({}, n); }),
        links: allLinks.map(function (l) { return Object.assign({}, l); })
      });

      svg.append('title').text('Money River — three-stop Sankey of US national health expenditure');
      svg.append('desc').text('Sankey diagram with three layers: payment channels (CMS source-of-funds), destination categories (CMS type-of-service), and modeled operating cost pools. Layer A and B values are official 2024 CMS NHE; Layer C is modeled and shown with diagonal hatch.');

      // -----------------------------
      // Node + link styling (no DVC)
      // -----------------------------
      function nodeFill(n) {
        if (n.evidence === 'modeled_residual') return 'rgba(160, 168, 188, 0.45)';
        if (n.layer === 0) return n.id === 'pay_out_of_pocket' ? 'rgba(255, 140, 66, 0.65)' : 'rgba(74, 144, 217, 0.6)';
        if (n.layer === 1) return 'rgba(78, 205, 196, 0.55)';
        return 'rgba(232, 233, 237, 0.42)'; // pool
      }
      function linkStrokeBase(l) {
        var src = typeof l.source === 'object' ? l.source : null;
        var sId = src ? src.id : l.source;
        if (sId === 'pay_out_of_pocket') return 'rgba(255, 140, 66, 0.45)';
        if (sId === 'pay_residual')      return 'rgba(160, 168, 188, 0.28)';
        if (l.span === 'BC')             return 'rgba(160, 168, 188, 0.38)';
        return 'rgba(120, 144, 168, 0.42)';
      }

      // Links (all visually "modeled" — they are all modeled in this graph)
      var linkG = svg.append('g').attr('fill', 'none').attr('class', 'hc-links');
      var link = linkG.selectAll('path.link')
        .data(sankeyGraph.links)
        .enter()
        .append('g')
        .attr('class', 'hc-link-group');

      link.append('path')
        .attr('class', 'link link-base')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke', linkStrokeBase)
        .attr('stroke-width', function (d) { return Math.max(1, d.width); });

      // Overlay hatch path on modeled (span === 'AB' or 'BC')
      link.append('path')
        .attr('class', 'link link-hatch')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke', 'url(#hc-modeled-hatch)')
        .attr('stroke-width', function (d) { return Math.max(1, d.width); });

      d3LinkSel = link;

      link.on('mouseenter', function (event, d) {
          var sId = (typeof d.source === 'object') ? d.source.id : d.source;
          var tId = (typeof d.target === 'object') ? d.target.id : d.target;
          var s = sankeyGraph.nodes.find(function (n) { return n.id === sId; });
          var t = sankeyGraph.nodes.find(function (n) { return n.id === tId; });
          showTip(
            '<div class="hc-tooltip-title">' + escapeHtml(s.label) + ' → ' + escapeHtml(t.label) + '</div>' +
            '<div>Modeled allocation: <strong class="tabnum">$' + Math.round(d.value).toLocaleString() + 'B</strong></div>' +
            '<div class="hc-tooltip-meta">Modeled allocation, constrained to official node totals</div>',
            event.clientX, event.clientY
          );
        })
        .on('mousemove', function (event) { showTip(tipEl.innerHTML, event.clientX, event.clientY); })
        .on('mouseleave', hideTip);

      // -----------------------------
      // Nodes
      // -----------------------------
      var nodeG = svg.append('g').attr('class', 'hc-nodes');
      var node = nodeG.selectAll('g.node')
        .data(sankeyGraph.nodes)
        .enter().append('g')
        .attr('class', function (d) {
          var cls = 'node node-l' + d.layer;
          if (d.evidence === 'modeled_residual' || d.evidence === 'modeled') cls += ' is-modeled';
          if (d.layer === 2) cls += ' is-pool';
          return cls;
        })
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr('aria-label', function (d) { return d.label + ', ' + (d.display || ''); })
        .attr('data-id', function (d) { return d.id; });

      node.append('rect')
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('height', function (d) { return Math.max(2, d.y1 - d.y0); })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('fill', nodeFill);

      node.append('text')
        .attr('class', 'node-label')
        .attr('x', function (d) { return d.layer === 2 ? d.x0 - 6 : (d.x0 < width / 2 ? d.x1 + 8 : d.x0 - 8); })
        .attr('y', function (d) { return (d.y0 + d.y1) / 2; })
        .attr('dy', '0.35em')
        .attr('text-anchor', function (d) { return d.layer === 2 ? 'end' : (d.x0 < width / 2 ? 'start' : 'end'); })
        .each(function (d) {
          var label = d.label;
          var val = d.display || '';
          var t = d3.select(this);
          t.append('tspan').text(label);
          t.append('tspan').attr('class', 'val').attr('dx', '0.4em').text(val);
        });

      d3NodeSel = node;

      node.on('mouseenter', function (event, d) {
        var ttBody = (d.tooltip_id && DATA.tooltips[d.tooltip_id]) ? DATA.tooltips[d.tooltip_id].def : d.description;
        var ev = d.evidence === 'modeled' || d.evidence === 'modeled_residual'
          ? 'Modeled' : 'Official, 2024 CMS NHE';
        showTip(
          '<div class="hc-tooltip-title">' + escapeHtml(d.label) + ' · ' + escapeHtml(d.display || '') + '</div>' +
          '<div>' + escapeHtml(ttBody) + '</div>' +
          '<div class="hc-tooltip-meta">' + ev + '</div>',
          event.clientX, event.clientY
        );
      });
      node.on('mousemove', function (event) { showTip(tipEl.innerHTML, event.clientX, event.clientY); });
      node.on('mouseleave', hideTip);
      node.on('click', function (event, d) { selectNode(d); });
      node.on('keydown', function (event, d) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectNode(d); }
      });
      node.on('mouseover', function (event, d) { if (!state.selection) highlightForNode(d.id); });
      node.on('mouseout', function () { if (!state.selection) clearHighlight(); });

      // Layer header labels (top of each column)
      function colMid(layer) {
        var cols = sankeyGraph.nodes.filter(function (n) { return n.layer === layer; });
        if (!cols.length) return null;
        return (cols[0].x0 + cols[0].x1) / 2;
      }
      var headers = [
        { x: colMid(0), title: 'Layer A · Payment channels', sub: 'Official, 2024 CMS NHE source-of-funds' },
        { x: colMid(1), title: 'Layer B · Destinations',     sub: 'Official, 2024 CMS NHE type-of-service' },
        { x: colMid(2), title: 'Layer C · Cost pools',       sub: 'Modeled decomposition, totals balanced to Layer B' }
      ];
      var headerG = svg.append('g').attr('class', 'hc-col-headers');
      headers.forEach(function (h) {
        if (h.x == null) return;
        headerG.append('text').attr('class', 'col-title').attr('x', h.x).attr('y', 16).attr('text-anchor', 'middle').text(h.title);
        headerG.append('text').attr('class', 'col-sub').attr('x', h.x).attr('y', 28).attr('text-anchor', 'middle').text(h.sub);
      });

      // -----------------------------
      // Overlay layer — AI surfaces + company badges
      // -----------------------------
      overlayG = svg.append('g').attr('class', 'hc-overlay-layer');

      // Helper: find pool node for AI chips
      function poolById(id) { return sankeyGraph.nodes.find(function (n) { return n.id === id && n.layer === 2; }); }
      function destById(id) { return sankeyGraph.nodes.find(function (n) { return n.id === id && n.layer === 1; }); }

      // AI surfaces: pool outline highlight + small text chip beside pool
      aiChipsByPool = {};
      DATA.aiSurfaces.forEach(function (a) {
        a.attach_pools.forEach(function (pId) {
          (aiChipsByPool[pId] = aiChipsByPool[pId] || []).push(a);
        });
      });

      Object.keys(aiChipsByPool).forEach(function (pId) {
        var p = poolById(pId);
        if (!p) return;
        var list = aiChipsByPool[pId];
        var midY = (p.y0 + p.y1) / 2;
        var grp = overlayG.append('g').attr('class', 'hc-ai-chipgrp').attr('data-pool', pId);
        list.forEach(function (a, i) {
          var w = Math.max(110, a.label.length * 6.4);
          var h = 16;
          var x = p.x1 + 14;
          var y = midY - (list.length - 1) * 11 + i * 22 - h / 2;
          var g = grp.append('g')
            .attr('class', 'hc-ai-chip')
            .attr('data-ai', a.id)
            .attr('tabindex', 0)
            .attr('role', 'button')
            .attr('aria-label', a.label + ' AI surface')
            .attr('transform', 'translate(' + x + ',' + y + ')');
          g.append('rect').attr('width', w).attr('height', h).attr('rx', 7);
          g.append('text').attr('x', w / 2).attr('y', h / 2 + 4).attr('text-anchor', 'middle').text(a.label);
          g.on('mouseenter', function (ev) {
            showTip('<div class="hc-tooltip-title">' + escapeHtml(a.label) + ' · AI surface</div>' +
                    '<div>' + escapeHtml(a.message) + '</div>' +
                    '<div class="hc-tooltip-meta">Overlay only — not a money-conserving layer</div>',
                    ev.clientX, ev.clientY);
          });
          g.on('mouseleave', hideTip);
          g.on('click', function () { selectAi(a.id); });
          g.on('keydown', function (ev) {
            if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectAi(a.id); }
          });
        });
      });

      // Company badges placed near pools (and destinations for fallback)
      companyBadgesByPool = {};
      companyBadgesByDest = {};
      DATA.companies.forEach(function (c) {
        (c.money_pool_ids || []).forEach(function (pId) {
          (companyBadgesByPool[pId] = companyBadgesByPool[pId] || []).push(c);
        });
        (c.destination_ids || []).forEach(function (dId) {
          (companyBadgesByDest[dId] = companyBadgesByDest[dId] || []).push(c);
        });
      });

      Object.keys(companyBadgesByPool).forEach(function (pId) {
        var p = poolById(pId);
        if (!p) return;
        var list = companyBadgesByPool[pId];
        var midY = (p.y0 + p.y1) / 2;
        var grp = overlayG.append('g').attr('class', 'hc-co-grp').attr('data-pool', pId);
        list.forEach(function (c, i) {
          var x = p.x1 + 6 + (i % 5) * 11;
          var y = midY + 14 + Math.floor(i / 5) * 12;
          var g = grp.append('g')
            .attr('class', 'hc-co-badge')
            .attr('data-company', c.id)
            .attr('data-group', c.group)
            .attr('tabindex', 0)
            .attr('role', 'button')
            .attr('aria-label', c.name + ' (' + (c.group === 'dvc' ? 'DVC portfolio' : 'benchmark') + ')')
            .attr('transform', 'translate(' + x + ',' + y + ')');
          g.append('circle').attr('r', 4.5);
          g.on('mouseenter', function (ev) {
            showTip('<div class="hc-tooltip-title">' + escapeHtml(c.name) + '</div>' +
                    '<div>' + escapeHtml(c.short_description) + '</div>' +
                    '<div class="hc-tooltip-meta">Click for full card</div>',
                    ev.clientX, ev.clientY);
          });
          g.on('mouseleave', hideTip);
          g.on('click', function () { selectCompany(c.id); });
          g.on('keydown', function (ev) {
            if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectCompany(c.id); }
          });
        });
      });

      applyToggleVisibility();
    } // end renderSankey

    function applyToggleVisibility() {
      if (!overlayG) return;
      var showAi = state.showAi;
      var showCo = state.showCompanies;
      var portfolioOnly = state.portfolioOnly;

      overlayG.selectAll('.hc-ai-chip').style('display', showAi ? null : 'none');
      overlayG.selectAll('.hc-co-grp').style('display', showCo ? null : 'none');
      overlayG.selectAll('.hc-co-badge').style('display', function () {
        if (!showCo) return 'none';
        if (portfolioOnly && this.getAttribute('data-group') !== 'dvc') return 'none';
        return null;
      });
    }

    // -----------------------------
    // Highlight + selection
    // -----------------------------
    function relatedIds(id) {
      var hit = {}; hit[id] = true;
      sankeyGraph && sankeyGraph.links.forEach(function (l) {
        var s = typeof l.source === 'object' ? l.source.id : l.source;
        var t = typeof l.target === 'object' ? l.target.id : l.target;
        if (s === id) hit[t] = true;
        if (t === id) hit[s] = true;
      });
      return hit;
    }
    function highlightForNode(id) {
      if (!d3LinkSel) return;
      var rel = relatedIds(id);
      d3LinkSel.classed('is-dim', function (d) {
        var s = typeof d.source === 'object' ? d.source.id : d.source;
        var t = typeof d.target === 'object' ? d.target.id : d.target;
        return !(s === id || t === id);
      });
      d3LinkSel.classed('is-hi', function (d) {
        var s = typeof d.source === 'object' ? d.source.id : d.source;
        var t = typeof d.target === 'object' ? d.target.id : d.target;
        return s === id || t === id;
      });
      d3NodeSel.classed('is-dim', function (d) { return !rel[d.id]; });
    }
    function clearHighlight() {
      if (!d3LinkSel) return;
      d3LinkSel.classed('is-dim', false).classed('is-hi', false);
      d3NodeSel.classed('is-dim', false);
    }

    // -----------------------------
    // Selection handlers + drawer cards
    // -----------------------------
    function setSelection(sel) {
      state.selection = sel;
      // Update sankey highlight if available
      if (sankeyGraph) {
        if (sel && (sel.type === 'node' || sel.type === 'pool')) highlightForNode(sel.id);
        else clearHighlight();
      }
      // Highlight in patient loop if relevant
      updateLoopForSelection();
    }

    function companiesForSelection(sel) {
      if (!sel) return [];
      var list = DATA.companies;
      if (state.portfolioOnly) list = list.filter(function (c) { return c.group === 'dvc'; });
      if (sel.type === 'node') {
        // Node may be payment (no companies — show none) or destination
        return list.filter(function (c) { return (c.destination_ids || []).indexOf(sel.id) >= 0; });
      }
      if (sel.type === 'pool') {
        return list.filter(function (c) { return (c.money_pool_ids || []).indexOf(sel.id) >= 0; });
      }
      if (sel.type === 'ai') {
        return list.filter(function (c) { return (c.ai_surface_ids || []).indexOf(sel.id) >= 0; });
      }
      if (sel.type === 'step') {
        return list.filter(function (c) { return (c.process_step_ids || []).indexOf(sel.id) >= 0; });
      }
      return [];
    }

    function companyCardChip(c) {
      var groupBadge = (c.group === 'dvc')
        ? '<span class="hc-badge hc-badge--dvc">DVC</span>'
        : '<span class="hc-badge hc-badge--bench">Benchmark</span>';
      return '<button type="button" class="hc-co-chip" data-action="company" data-id="' + c.id + '">' +
               '<span class="hc-co-chip-name">' + escapeHtml(c.name) + '</span>' +
               (state.showCompanies || state.portfolioOnly ? groupBadge : '') +
               '<span class="hc-co-chip-desc">' + escapeHtml(c.short_description) + '</span>' +
             '</button>';
    }

    function whoAttacksDrawer(sel) {
      var cos = companiesForSelection(sel);
      if (!cos.length) return '<p class="hc-empty">No company examples linked to this selection.</p>';
      // Group by DVC vs benchmark
      var dvc = cos.filter(function (c) { return c.group === 'dvc'; });
      var bm = cos.filter(function (c) { return c.group !== 'dvc'; });
      var html = '<h5>Who attacks this surface?</h5>';
      if (dvc.length) html += '<div class="hc-co-group"><div class="hc-co-group-h">DVC portfolio</div><div class="hc-co-list">' + dvc.map(companyCardChip).join('') + '</div></div>';
      if (bm.length)  html += '<div class="hc-co-group"><div class="hc-co-group-h">Other benchmarks</div><div class="hc-co-list">' + bm.map(companyCardChip).join('') + '</div></div>';
      return html;
    }

    function aiSurfacesForNode(n) {
      // For a destination node: gather AI surfaces attached via its cost pools
      if (!n || n.layer !== 1) return [];
      var pools = DATA.moneyLinksBC.filter(function (l) { return l.source === n.id; }).map(function (l) { return l.target; });
      var seen = {};
      var surfaces = [];
      DATA.aiSurfaces.forEach(function (a) {
        if (a.attach_pools.some(function (p) { return pools.indexOf(p) >= 0; })) {
          if (!seen[a.id]) { seen[a.id] = true; surfaces.push(a); }
        }
      });
      return surfaces;
    }

    function selectNode(d) {
      var type = d.layer === 2 ? 'pool' : 'node';
      setSelection({ type: type, id: d.id });

      var ev = d.evidence === 'modeled' || d.evidence === 'modeled_residual'
        ? '<span class="hc-badge hc-badge--modeled">Modeled</span>'
        : '<span class="hc-badge hc-badge--official">Official, 2024 CMS NHE</span>';

      var title, subtitle;
      if (d.layer === 0) { title = 'Payment channel'; subtitle = 'Layer A · CMS source-of-funds'; }
      else if (d.layer === 1) { title = 'Destination category'; subtitle = 'Layer B · CMS type-of-service / product'; }
      else { title = 'Operating cost pool'; subtitle = 'Layer C · Modeled decomposition'; }

      var extras = '';
      if (d.layer === 1) {
        // List cost-pool decomposition for this destination
        var rows = DATA.moneyLinksBC.filter(function (l) { return l.source === d.id; })
          .sort(function (a, b) { return b.value_b - a.value_b; });
        var sum = rows.reduce(function (s, r) { return s + r.value_b; }, 0);
        if (rows.length) {
          extras += '<h5>Where these dollars go (modeled)</h5><ul class="hc-pool-rows">';
          rows.forEach(function (r) {
            var pool = DATA.costPools.find(function (p) { return p.id === r.target; });
            var pct = sum > 0 ? (100 * r.value_b / sum) : 0;
            extras += '<li><button type="button" class="hc-pool-row" data-action="pool" data-id="' + r.target + '">' +
                        '<span class="hc-pool-row-name">' + escapeHtml(pool ? pool.label : r.target) + '</span>' +
                        '<span class="hc-pool-row-val tabnum">$' + Math.round(r.value_b).toLocaleString() + 'B</span>' +
                        '<span class="hc-pool-row-pct tabnum">' + pct.toFixed(0) + '%</span>' +
                      '</button></li>';
          });
          extras += '</ul>';
        }
        // AI surfaces touched via these pools
        var sf = aiSurfacesForNode(d);
        if (sf.length) {
          extras += '<h5>AI surfaces touching this destination</h5><ul class="hc-ai-list">';
          sf.forEach(function (a) {
            extras += '<li><button type="button" class="hc-ai-pill" data-action="ai" data-id="' + a.id + '">' + escapeHtml(a.label) + '</button></li>';
          });
          extras += '</ul>';
        }
      } else if (d.layer === 2) {
        // For a pool, list which destinations route into it
        var feeders = DATA.moneyLinksBC.filter(function (l) { return l.target === d.id; })
          .sort(function (a, b) { return b.value_b - a.value_b; });
        if (feeders.length) {
          extras += '<h5>Destinations funding this pool (modeled)</h5><ul class="hc-pool-rows">';
          feeders.forEach(function (f) {
            var dest = DATA.destinations.find(function (x) { return x.id === f.source; });
            extras += '<li><button type="button" class="hc-pool-row" data-action="node" data-id="' + f.source + '">' +
                        '<span class="hc-pool-row-name">' + escapeHtml(dest ? dest.label : f.source) + '</span>' +
                        '<span class="hc-pool-row-val tabnum">$' + Math.round(f.value_b).toLocaleString() + 'B</span>' +
                      '</button></li>';
          });
          extras += '</ul>';
        }
        // AI surfaces attached to this pool
        var ai2 = DATA.aiSurfaces.filter(function (a) { return a.attach_pools.indexOf(d.id) >= 0; });
        if (ai2.length) {
          extras += '<h5>AI surfaces</h5><ul class="hc-ai-list">';
          ai2.forEach(function (a) {
            extras += '<li><button type="button" class="hc-ai-pill" data-action="ai" data-id="' + a.id + '">' + escapeHtml(a.label) + '</button></li>';
          });
          extras += '</ul>';
        }
      }

      var who = whoAttacksDrawer(state.selection);

      var srcLink = d.src ? '<a class="hc-insight-link" href="' + d.src + '" target="_blank" rel="noopener">CMS source ↗</a>' : '';

      var html =
        '<div class="hc-insight-title">' + escapeHtml(title) + '</div>' +
        '<div class="hc-insight-head"><h4>' + escapeHtml(d.label) + '</h4>' + ev + '</div>' +
        '<div class="hc-insight-sub">' + escapeHtml(subtitle) + '</div>' +
        '<div class="hc-insight-body">' +
          '<p><strong class="tabnum">' + (d.display || '') + '</strong> — ' + escapeHtml(d.description || '') + '</p>' +
          (d.ai_relevance ? '<p class="hc-ai-rel"><em>AI relevance:</em> ' + escapeHtml(d.ai_relevance) + '</p>' : '') +
          extras +
          who +
          srcLink +
        '</div>';
      setInsight(html);
      maybeOpenSheet(html);
    }

    function selectAi(id) {
      var a = DATA.aiSurfaces.find(function (x) { return x.id === id; });
      if (!a) return;
      setSelection({ type: 'ai', id: id });
      var poolList = a.attach_pools.map(function (pId) {
        var p = DATA.costPools.find(function (x) { return x.id === pId; });
        return p ? '<button type="button" class="hc-pool-row" data-action="pool" data-id="' + p.id + '"><span class="hc-pool-row-name">' + escapeHtml(p.label) + '</span></button>' : '';
      }).join('');
      var stepList = a.attach_steps.map(function (sid) {
        return '<button type="button" class="hc-step-pill" data-action="step" data-id="' + sid + '">' + escapeHtml(sid) + '</button>';
      }).join('');
      var who = whoAttacksDrawer(state.selection);
      var html =
        '<div class="hc-insight-title">AI surface</div>' +
        '<div class="hc-insight-head"><h4>' + escapeHtml(a.label) + '</h4><span class="hc-badge hc-badge--context">Overlay</span></div>' +
        '<div class="hc-insight-sub">Overlay on cost pools and patient-loop steps — not a money-conserving layer</div>' +
        '<div class="hc-insight-body">' +
          '<p>' + escapeHtml(a.message) + '</p>' +
          (poolList ? '<h5>Attaches to cost pools</h5><ul class="hc-pool-rows">' + poolList + '</ul>' : '') +
          (stepList ? '<h5>Attaches to process steps</h5><div class="hc-step-row">' + stepList + '</div>' : '') +
          who +
        '</div>';
      setInsight(html);
      maybeOpenSheet(html);
    }

    function selectStep(stepId) {
      // Step may be C1-C8, F1-F8, P1-P5, V1-V5
      var s = DATA.careLoop.concat(DATA.financialLoop, DATA.preventionOrbit, DATA.vbcBridge)
        .find(function (x) { return x.id === stepId; });
      if (!s) return;
      setSelection({ type: 'step', id: stepId });

      var type;
      if (DATA.careLoop.indexOf(s) >= 0) type = 'Care loop';
      else if (DATA.financialLoop.indexOf(s) >= 0) type = 'Financial / admin loop';
      else if (DATA.preventionOrbit.indexOf(s) >= 0) type = 'Private-pay prevention orbit';
      else type = 'VBC bridge annotation';

      var aiSurfaces = (s.ai || []).map(function (aid) {
        return '<button type="button" class="hc-ai-pill" data-action="ai" data-id="' + aid + '">' +
               escapeHtml((DATA.aiSurfaces.find(function (a) { return a.id === aid; }) || { label: aid }).label) +
               '</button>';
      }).join('');

      var deps = (DATA.stepStackDeps[stepId] || []).map(function (sid) {
        var st = DATA.sharedStack.find(function (x) { return x.id === sid; });
        return st ? '<li><strong>' + escapeHtml(st.label) + '</strong> — ' + escapeHtml(st.contents) + '</li>' : '';
      }).join('');

      var who = whoAttacksDrawer(state.selection);
      var html =
        '<div class="hc-insight-title">' + escapeHtml(type) + '</div>' +
        '<div class="hc-insight-head"><h4>' + escapeHtml(stepId + ' · ' + s.label) + '</h4></div>' +
        '<div class="hc-insight-body">' +
          '<p>' + escapeHtml(s.description || '') + '</p>' +
          (aiSurfaces ? '<h5>AI surfaces here</h5><div class="hc-step-row">' + aiSurfaces + '</div>' : '') +
          (deps ? '<h5>Shared stack dependencies</h5><ul>' + deps + '</ul>' : '') +
          (s.examples ? '<p class="hc-examples"><em>Examples:</em> ' + escapeHtml(s.examples) + '</p>' : '') +
          who +
        '</div>';
      setInsight(html);
      maybeOpenSheet(html);
    }

    function selectCompany(id) {
      var c = DATA.companies.find(function (x) { return x.id === id; });
      if (!c) return;
      setSelection({ type: 'company', id: id });

      var moneyChips = (c.money_pool_ids || []).map(function (pId) {
        var p = DATA.costPools.find(function (x) { return x.id === pId; });
        return p ? '<button type="button" class="hc-pool-row" data-action="pool" data-id="' + p.id + '"><span class="hc-pool-row-name">' + escapeHtml(p.label) + '</span></button>' : '';
      }).join('');
      var destChips = (c.destination_ids || []).map(function (dId) {
        var d = DATA.destinations.find(function (x) { return x.id === dId; });
        return d ? '<button type="button" class="hc-pool-row" data-action="node" data-id="' + d.id + '"><span class="hc-pool-row-name">' + escapeHtml(d.label) + '</span></button>' : '';
      }).join('');
      var stepChips = (c.process_step_ids || []).map(function (sid) {
        return '<button type="button" class="hc-step-pill" data-action="step" data-id="' + sid + '">' + escapeHtml(sid) + '</button>';
      }).join('');
      var aiChips = (c.ai_surface_ids || []).map(function (aid) {
        var a = DATA.aiSurfaces.find(function (x) { return x.id === aid; });
        return a ? '<button type="button" class="hc-ai-pill" data-action="ai" data-id="' + a.id + '">' + escapeHtml(a.label) + '</button>' : '';
      }).join('');

      var groupBadge = (c.group === 'dvc')
        ? '<span class="hc-badge hc-badge--dvc">DVC portfolio</span>'
        : '<span class="hc-badge hc-badge--bench">Benchmark</span>';

      var html =
        '<div class="hc-insight-title">Company</div>' +
        '<div class="hc-insight-head"><h4>' + escapeHtml(c.name) + '</h4>' + groupBadge + '</div>' +
        '<div class="hc-insight-body">' +
          '<p>' + escapeHtml(c.short_description) + '</p>' +
          '<div class="hc-co-meta">' +
            '<div><span class="k">Buyer / user</span><span class="v">' + escapeHtml(c.buyer_user || '—') + '</span></div>' +
            '<div><span class="k">Value capture</span><span class="v">' + escapeHtml(c.value_capture || '—') + '</span></div>' +
            '<div><span class="k">Evidence</span><span class="v">' + evidenceBadge(c.evidence) + '</span></div>' +
          '</div>' +
          '<h5>Money / value-chain placement</h5>' +
          (moneyChips ? '<ul class="hc-pool-rows">' + moneyChips + '</ul>' : '<p class="hc-empty">No money-pool placement.</p>') +
          (destChips ? '<h6>CMS destinations touched</h6><ul class="hc-pool-rows">' + destChips + '</ul>' : '') +
          '<h5>Patient / process placement</h5>' +
          (stepChips ? '<div class="hc-step-row">' + stepChips + '</div>' : '<p class="hc-empty">No patient-loop placement.</p>') +
          (aiChips ? '<h5>AI surfaces</h5><div class="hc-step-row">' + aiChips + '</div>' : '') +
          (c.public_note ? '<p class="hc-public-note"><em>' + escapeHtml(c.public_note) + '</em></p>' : '') +
        '</div>';
      setInsight(html);
      maybeOpenSheet(html);

      // Highlight relevant sankey nodes (destinations + pools)
      if (d3NodeSel) {
        var hit = {};
        (c.destination_ids || []).forEach(function (id) { hit[id] = true; });
        (c.money_pool_ids || []).forEach(function (id) { hit[id] = true; });
        d3NodeSel.classed('is-dim', function (d) { return !hit[d.id]; });
        d3LinkSel.classed('is-dim', function (l) {
          var s = typeof l.source === 'object' ? l.source.id : l.source;
          var t = typeof l.target === 'object' ? l.target.id : l.target;
          return !(hit[s] || hit[t]);
        }).classed('is-hi', function (l) {
          var s = typeof l.source === 'object' ? l.source.id : l.source;
          var t = typeof l.target === 'object' ? l.target.id : l.target;
          return hit[s] || hit[t];
        });
      }
    }

    // -----------------------------
    // Toggle controls wiring
    // -----------------------------
    function wireToggles() {
      root.querySelectorAll('.hc-view-btn[data-toggle]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var key = btn.dataset.toggle;
          if (key === 'moneyOnly') {
            state.moneyOnly = true; state.showAi = false; state.showCompanies = false;
          } else if (key === 'ai') {
            state.showAi = !state.showAi;
            if (state.showAi || state.showCompanies) state.moneyOnly = false;
            else state.moneyOnly = true;
          } else if (key === 'companies') {
            state.showCompanies = !state.showCompanies;
            if (state.showAi || state.showCompanies) state.moneyOnly = false;
            else state.moneyOnly = true;
          } else if (key === 'portfolioOnly') {
            state.portfolioOnly = !state.portfolioOnly;
            if (state.portfolioOnly) { state.showCompanies = true; state.moneyOnly = false; }
          }
          reflectToggleButtons();
          applyToggleVisibility();
          // Refresh insight to update the contextual drawer respecting portfolio filter
          if (state.selection) {
            var sel = state.selection;
            if (sel.type === 'node' || sel.type === 'pool') {
              var n = sankeyGraph && sankeyGraph.nodes.find(function (x) { return x.id === sel.id; });
              if (n) selectNode(n);
            } else if (sel.type === 'ai')      selectAi(sel.id);
              else if (sel.type === 'step')    selectStep(sel.id);
              else if (sel.type === 'company') selectCompany(sel.id);
          }
        });
      });
    }
    function reflectToggleButtons() {
      root.querySelectorAll('.hc-view-btn[data-toggle]').forEach(function (b) {
        var key = b.dataset.toggle;
        var on = false;
        if (key === 'moneyOnly') on = state.moneyOnly;
        else if (key === 'ai') on = state.showAi;
        else if (key === 'companies') on = state.showCompanies;
        else if (key === 'portfolioOnly') on = state.portfolioOnly;
        b.classList.toggle('is-active', !!on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    wireToggles();
    reflectToggleButtons();

    // Insight panel click delegation
    if (insightEl) {
      insightEl.addEventListener('click', function (ev) {
        var t = ev.target.closest('[data-action]');
        if (!t) return;
        var action = t.dataset.action, id = t.dataset.id;
        if (action === 'company') selectCompany(id);
        else if (action === 'pool') {
          var p = sankeyGraph && sankeyGraph.nodes.find(function (n) { return n.id === id; });
          if (p) selectNode(p);
        } else if (action === 'node') {
          var n = sankeyGraph && sankeyGraph.nodes.find(function (x) { return x.id === id; });
          if (n) selectNode(n);
        } else if (action === 'ai') selectAi(id);
        else if (action === 'step') selectStep(id);
      });
    }

    // ESC clears selection
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        state.selection = null;
        renderDefaultInsight();
        clearHighlight();
        closeSheet();
        updateLoopForSelection();
      }
    });

    // Mobile bottom sheet
    function maybeOpenSheet(html) {
      if (window.innerWidth >= 900) return;
      if (!bottomSheet) return;
      bottomSheet.querySelector('.hc-bottom-sheet-body').innerHTML = html;
      bottomSheet.classList.add('is-open');
    }
    function closeSheet() {
      if (bottomSheet) bottomSheet.classList.remove('is-open');
    }
    var sheetClose = root.querySelector('.hc-bottom-sheet-close');
    if (sheetClose) sheetClose.addEventListener('click', closeSheet);

    // =================================================================
    // PATIENT EVENT / PREVENTION LOOP — directional SVG
    // =================================================================
    var loopSvgEl = root.querySelector('#hc-loop-svg');
    var stateSelector = root.querySelector('#hc-state-selector');
    var loopOrderedFallback = root.querySelector('#hc-loop-fallback');
    var currentLoopState = 'state_at_risk';

    function renderStateSelector() {
      if (!stateSelector) return;
      stateSelector.innerHTML = DATA.patientStates.map(function (s) {
        return '<button type="button" class="hc-state-btn ' + (s.id === currentLoopState ? 'is-active' : '') +
               '" data-state="' + s.id + '" style="--hc-state-color:' + s.color + '" aria-pressed="' +
               (s.id === currentLoopState ? 'true' : 'false') + '">' + escapeHtml(s.label) + '</button>';
      }).join('');
      stateSelector.querySelectorAll('.hc-state-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          currentLoopState = btn.dataset.state;
          renderStateSelector();
          renderLoop();
        });
      });
    }

    var SVG_NS = 'http://www.w3.org/2000/svg';
    function svgEl(tag, attrs, parent) {
      var n = document.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (k) {
        if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]);
      });
      (parent || loopSvgEl).appendChild(n);
      return n;
    }

    function renderLoop() {
      if (!loopSvgEl) return;
      while (loopSvgEl.firstChild) loopSvgEl.removeChild(loopSvgEl.firstChild);
      loopSvgEl.setAttribute('viewBox', '0 0 1120 760');
      loopSvgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      var scenario = DATA.stateScenarios[currentLoopState] || { care: [], financial: [], prevention: [], vbc: [] };
      var stateInfo = DATA.patientStates.find(function (x) { return x.id === currentLoopState; });
      var careActive = {}; scenario.care.forEach(function (id) { careActive[id] = true; });
      var finActive = {};  scenario.financial.forEach(function (id) { finActive[id] = true; });
      var prevActive = {}; scenario.prevention.forEach(function (id) { prevActive[id] = true; });
      var vbcActive = {};  scenario.vbc.forEach(function (id) { vbcActive[id] = true; });
      var stackActive = {};
      scenario.care.concat(scenario.financial).forEach(function (sid) {
        (DATA.stepStackDeps[sid] || []).forEach(function (st) { stackActive[st] = true; });
      });

      // Defs: arrow markers
      var defs = svgEl('defs', {});
      function marker(id, fill) {
        var m = svgEl('marker', { id: id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, defs);
        svgEl('path', { d: 'M0,0 L10,5 L0,10 z', fill: fill }, m);
      }
      marker('hc-arrow-care', '#4ECDC4');
      marker('hc-arrow-fin', '#F5C542');
      marker('hc-arrow-soft', 'rgba(232,233,237,0.6)');

      // Center patient card
      var cg = svgEl('g', { class: 'patient-center', transform: 'translate(560,300)' });
      svgEl('rect', { x: -110, y: -65, width: 220, height: 130, rx: 16, fill: 'rgba(0,0,0,0.45)', stroke: stateInfo ? stateInfo.color : '#4ECDC4', 'stroke-width': 2 }, cg);
      svgEl('circle', { r: 8, fill: stateInfo ? stateInfo.color : '#4ECDC4' }, cg).setAttribute('cy', '-32');
      svgEl('text', { class: 'patient-label', x: 0, y: -8, 'text-anchor': 'middle' }, cg).textContent = 'Patient state';
      svgEl('text', { class: 'patient-state', x: 0, y: 18, 'text-anchor': 'middle', fill: stateInfo ? stateInfo.color : '#4ECDC4' }, cg).textContent = stateInfo ? stateInfo.label : '';
      svgEl('text', { class: 'patient-prompt', x: 0, y: 42, 'text-anchor': 'middle' }, cg).textContent = stateInfo ? stateInfo.prompt : '';
      svgEl('text', { class: 'patient-scenario', x: 0, y: 60, 'text-anchor': 'middle' }, cg).textContent = '— ' + (scenario.scenario || '');

      // Ellipses for care + financial loops (visual guides)
      svgEl('ellipse', { class: 'loop-guide care', cx: 560, cy: 270, rx: 390, ry: 190, fill: 'none', stroke: 'rgba(78,205,196,0.18)', 'stroke-width': 1, 'stroke-dasharray': '4 4' });
      svgEl('ellipse', { class: 'loop-guide fin',  cx: 560, cy: 330, rx: 390, ry: 190, fill: 'none', stroke: 'rgba(245,197,66,0.18)', 'stroke-width': 1, 'stroke-dasharray': '4 4' });

      // Loop label tags
      svgEl('text', { class: 'loop-label care', x: 560, y: 50, 'text-anchor': 'middle' }, null).textContent = 'Care loop · clockwise';
      svgEl('text', { class: 'loop-label fin',  x: 560, y: 555, 'text-anchor': 'middle' }, null).textContent = 'Financial / admin loop · counterclockwise';

      // Draw care loop arrows (C1→C2→...→C8→C1) - upper half clockwise
      drawLoopArrows(DATA.careLoop, 'care', careActive, 'hc-arrow-care', true);
      // Draw financial arrows (F1→F2→...→F8→F1) - lower half counterclockwise
      drawLoopArrows(DATA.financialLoop, 'fin', finActive, 'hc-arrow-fin', false);

      // Step nodes — care
      DATA.careLoop.forEach(function (s) { drawStepNode(s, 'care', careActive[s.id]); });
      DATA.financialLoop.forEach(function (s) { drawStepNode(s, 'fin', finActive[s.id]); });

      // VBC bridge (left rail)
      var vbcG = svgEl('g', { class: 'vbc-bridge' });
      svgEl('text', { class: 'rail-title', x: 130, y: 130, 'text-anchor': 'middle' }, vbcG).textContent = 'VBC bridge';
      svgEl('text', { class: 'rail-sub', x: 130, y: 145, 'text-anchor': 'middle' }, vbcG).textContent = 'Reimbursement annotation';
      DATA.vbcBridge.forEach(function (v) { drawRailNode(v, 'vbc', vbcActive[v.id], vbcG); });

      // Prevention orbit (right rail)
      var preG = svgEl('g', { class: 'prevention-orbit' });
      svgEl('text', { class: 'rail-title', x: 990, y: 130, 'text-anchor': 'middle' }, preG).textContent = 'Private-pay prevention orbit';
      svgEl('text', { class: 'rail-sub', x: 990, y: 145, 'text-anchor': 'middle' }, preG).textContent = 'Anchored to out-of-pocket';
      DATA.preventionOrbit.forEach(function (p) { drawRailNode(p, 'prev', prevActive[p.id], preG); });

      // VBC bridge → C8 / prevention orbit dashed connectors when state activates
      if (vbcActive.V5) {
        drawDashedConnector(220, 465, 760, 365, 'rgba(245,197,66,0.55)'); // V5 → C8
      }
      if (vbcActive.V2 || vbcActive.V3) {
        drawDashedConnector(220, 240, 990, 240, 'rgba(245,197,66,0.35)'); // VBC bridge → prevention orbit
      }
      // Private-pay orbit anchor line to pay_out_of_pocket region (bottom-left annotation)
      svgEl('line', { x1: 990, y1: 510, x2: 1080, y2: 720, stroke: 'rgba(255,140,66,0.45)', 'stroke-width': 1, 'stroke-dasharray': '3 4' });
      svgEl('text', { x: 1080, y: 735, 'text-anchor': 'end', class: 'oop-anchor' }, null).textContent = 'Anchors to out-of-pocket (Sankey)';

      // Shared stack rail (bottom)
      var stackG = svgEl('g', { class: 'stack-rail' });
      svgEl('text', { class: 'rail-title', x: 560, y: 580, 'text-anchor': 'middle' }, stackG).textContent = 'Shared stack — care, payment, and prevention compete here';
      var cellW = 110, cellH = 64, gap = 14, totalW = 7 * cellW + 6 * gap;
      var startX = 560 - totalW / 2;
      DATA.sharedStack.forEach(function (s, i) {
        var x = startX + i * (cellW + gap);
        var y = 600;
        var g = svgEl('g', { class: 'stack-cell' + (stackActive[s.id] ? ' is-active' : ''), 'data-id': s.id, tabindex: 0, role: 'button', 'aria-label': s.label + ' stack layer', transform: 'translate(' + x + ',' + y + ')' }, stackG);
        svgEl('rect', { width: cellW, height: cellH, rx: 8 }, g);
        svgEl('text', { class: 'sc-h', x: cellW / 2, y: 20, 'text-anchor': 'middle' }, g).textContent = s.label;
        svgEl('text', { class: 'sc-c', x: cellW / 2, y: 40, 'text-anchor': 'middle' }, g).textContent = s.contents.length > 22 ? s.contents.substring(0, 22) + '…' : s.contents;
        g.addEventListener('click', function () { selectStackCell(s); });
        g.addEventListener('mouseenter', function (ev) {
          showTip('<div class="hc-tooltip-title">' + escapeHtml(s.label) + ' · shared stack</div>' +
                  '<div>' + escapeHtml(s.contents) + '</div>' +
                  '<div class="hc-tooltip-meta">' + escapeHtml(s.why) + '</div>',
                  ev.clientX, ev.clientY);
        });
        g.addEventListener('mouseleave', hideTip);
      });

      // Dependency lines from active steps to active stack cells
      var depG = svgEl('g', { class: 'dep-lines' });
      Object.keys(stackActive).forEach(function () { /* preserve order */ });
      // For each active step, line from step bottom to its stack cells (faint)
      ['care','fin'].forEach(function (which) {
        var list = which === 'care' ? DATA.careLoop : DATA.financialLoop;
        var act = which === 'care' ? careActive : finActive;
        list.forEach(function (s) {
          if (!act[s.id]) return;
          (DATA.stepStackDeps[s.id] || []).forEach(function (stId) {
            var idx = DATA.sharedStack.findIndex(function (x) { return x.id === stId; });
            if (idx < 0) return;
            var x2 = startX + idx * (cellW + gap) + cellW / 2;
            var y2 = 600;
            svgEl('line', { x1: s.x, y1: s.y + 14, x2: x2, y2: y2, stroke: 'rgba(232,233,237,0.18)', 'stroke-width': 1 }, depG);
          });
        });
      });

      // Ordered-list fallback (accessibility / mobile)
      if (loopOrderedFallback) {
        var careHtml = scenario.care.map(function (id) {
          var s = DATA.careLoop.find(function (x) { return x.id === id; });
          return s ? '<li><strong>' + s.id + ' · ' + escapeHtml(s.label) + '</strong> — ' + escapeHtml(s.description) + '</li>' : '';
        }).join('');
        var finHtml = scenario.financial.map(function (id) {
          var s = DATA.financialLoop.find(function (x) { return x.id === id; });
          return s ? '<li><strong>' + s.id + ' · ' + escapeHtml(s.label) + '</strong> — ' + escapeHtml(s.description) + '</li>' : '';
        }).join('');
        loopOrderedFallback.innerHTML =
          '<h5>Active scenario · ' + escapeHtml(stateInfo.label) + '</h5>' +
          '<p>' + escapeHtml(scenario.scenario) + '</p>' +
          (careHtml ? '<h6>Care loop</h6><ol class="hc-loop-list care">' + careHtml + '</ol>' : '') +
          (finHtml  ? '<h6>Financial / admin loop</h6><ol class="hc-loop-list fin">' + finHtml + '</ol>' : '');
      }
    }

    function drawLoopArrows(steps, kind, active, markerId, clockwise) {
      // Connect each consecutive pair (and the wrap from last to first) with an arrow.
      for (var i = 0; i < steps.length; i++) {
        var a = steps[i];
        var b = steps[(i + 1) % steps.length];
        var isActive = active[a.id] && active[b.id];
        var stroke = isActive ? (kind === 'care' ? '#4ECDC4' : '#F5C542') : 'rgba(232,233,237,0.22)';
        var sw = isActive ? 2.4 : 1.2;
        // Use a quadratic curve through midpoint bowed away from center (560,300)
        var mx = (a.x + b.x) / 2;
        var my = (a.y + b.y) / 2;
        var dx = mx - 560, dy = my - 300;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        // bow factor controls how far out the arc reaches; care loop above, fin below
        var bow = 18;
        var cx = mx + (dx / len) * bow;
        var cy = my + (dy / len) * bow;
        // Trim endpoints to step bounding circle (~r=22)
        var trim = 24;
        var v1x = (cx - a.x), v1y = (cy - a.y);
        var l1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
        var sx = a.x + (v1x / l1) * trim;
        var sy = a.y + (v1y / l1) * trim;
        var v2x = (cx - b.x), v2y = (cy - b.y);
        var l2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;
        var ex = b.x + (v2x / l2) * trim;
        var ey = b.y + (v2y / l2) * trim;
        var d = 'M ' + sx + ' ' + sy + ' Q ' + cx + ' ' + cy + ' ' + ex + ' ' + ey;
        svgEl('path', {
          class: 'loop-arrow ' + kind + (isActive ? ' is-active' : ' is-dim'),
          d: d, fill: 'none', stroke: stroke, 'stroke-width': sw,
          'marker-end': 'url(#' + markerId + ')'
        });
      }
    }

    function drawStepNode(s, kind, isActive) {
      var classes = 'loop-step is-' + kind + (isActive ? ' is-active' : ' is-dim');
      var w = 110, h = 38;
      var g = svgEl('g', {
        class: classes,
        transform: 'translate(' + (s.x - w / 2) + ',' + (s.y - h / 2) + ')',
        tabindex: 0, role: 'button', 'aria-label': s.id + ' ' + s.label,
        'data-id': s.id
      });
      svgEl('rect', { class: 'bg', width: w, height: h, rx: 8 }, g);
      svgEl('text', { class: 'num', x: 12, y: h / 2 + 4 }, g).textContent = s.id;
      svgEl('text', { class: 'lbl', x: 28, y: h / 2 + 4 }, g).textContent = s.label;
      g.addEventListener('mouseenter', function (ev) {
        showTip('<div class="hc-tooltip-title">' + escapeHtml(s.id + ' · ' + s.label) + '</div>' +
                '<div>' + escapeHtml(s.description) + '</div>',
                ev.clientX, ev.clientY);
      });
      g.addEventListener('mouseleave', hideTip);
      g.addEventListener('click', function () { selectStep(s.id); });
      g.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectStep(s.id); }
      });
    }

    function drawRailNode(s, kind, isActive, parent) {
      var classes = 'rail-step is-' + kind + (isActive ? ' is-active' : ' is-dim');
      var w = 140, h = 36;
      var g = svgEl('g', {
        class: classes,
        transform: 'translate(' + (s.x - w / 2) + ',' + (s.y - h / 2) + ')',
        tabindex: 0, role: 'button', 'aria-label': s.id + ' ' + s.label,
        'data-id': s.id
      }, parent);
      svgEl('rect', { class: 'bg', width: w, height: h, rx: 8 }, g);
      svgEl('text', { class: 'num', x: 10, y: h / 2 + 4 }, g).textContent = s.id;
      svgEl('text', { class: 'lbl', x: 30, y: h / 2 + 4 }, g).textContent = s.label;
      g.addEventListener('mouseenter', function (ev) {
        showTip('<div class="hc-tooltip-title">' + escapeHtml(s.id + ' · ' + s.label) + '</div>' +
                '<div>' + escapeHtml(s.description) + '</div>',
                ev.clientX, ev.clientY);
      });
      g.addEventListener('mouseleave', hideTip);
      g.addEventListener('click', function () { selectStep(s.id); });
      g.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectStep(s.id); }
      });
    }

    function drawDashedConnector(x1, y1, x2, y2, stroke) {
      svgEl('line', {
        class: 'vbc-connector',
        x1: x1, y1: y1, x2: x2, y2: y2,
        stroke: stroke || 'rgba(245,197,66,0.4)',
        'stroke-width': 1.2, 'stroke-dasharray': '5 4',
        'marker-end': 'url(#hc-arrow-soft)'
      });
    }

    function selectStackCell(s) {
      setSelection({ type: 'step', id: s.id });
      var cos = DATA.companies.filter(function (c) {
        return (c.process_step_ids || []).some(function () { return false; }); // stack cells don't have direct company placement
      });
      var html =
        '<div class="hc-insight-title">Shared stack layer</div>' +
        '<div class="hc-insight-head"><h4>' + escapeHtml(s.label) + '</h4></div>' +
        '<div class="hc-insight-body">' +
          '<p>' + escapeHtml(s.contents) + '</p>' +
          '<p><em>Why for AI:</em> ' + escapeHtml(s.why) + '</p>' +
        '</div>';
      setInsight(html);
      maybeOpenSheet(html);
    }

    function updateLoopForSelection() {
      if (!loopSvgEl) return;
      var sel = state.selection;
      // Default: rely on state-driven highlights already applied by renderLoop.
      // For step/company selection, additionally outline matching nodes.
      loopSvgEl.querySelectorAll('.loop-step, .rail-step, .stack-cell').forEach(function (el) {
        el.classList.remove('is-focus');
      });
      if (!sel) return;
      var focusIds = {};
      if (sel.type === 'step') focusIds[sel.id] = true;
      if (sel.type === 'company') {
        var c = DATA.companies.find(function (x) { return x.id === sel.id; });
        if (c) (c.process_step_ids || []).forEach(function (id) { focusIds[id] = true; });
      }
      if (sel.type === 'ai') {
        var a = DATA.aiSurfaces.find(function (x) { return x.id === sel.id; });
        if (a) (a.attach_steps || []).forEach(function (id) { focusIds[id] = true; });
      }
      Object.keys(focusIds).forEach(function (id) {
        loopSvgEl.querySelectorAll('[data-id="' + id + '"]').forEach(function (el) {
          el.classList.add('is-focus');
        });
      });
    }

    renderStateSelector();
    renderLoop();
    window.addEventListener('resize', function () {
      // Sankey is responsive via viewBox; loop is responsive via viewBox.
    });
  });
})();
