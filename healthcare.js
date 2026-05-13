/* =====================================================================
   HEALTHCARE AI — INTERACTIVE MODULES
   Requires: d3 v7 + d3-sankey
   Data:     window.HEALTHCARE_DATA (healthcare-data.js)
   ===================================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var root = document.getElementById('sec-healthcare-ai');
    if (!root) return;
    var DATA = window.HEALTHCARE_DATA;
    if (!DATA) return;

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- Shared tooltip ------------------------------------------
    var tipEl = document.createElement('div');
    tipEl.className = 'hc-tooltip';
    tipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tipEl);

    function showTip(html, x, y) {
      tipEl.innerHTML = html;
      tipEl.classList.add('is-visible');
      var pad = 14;
      var w = tipEl.offsetWidth;
      var h = tipEl.offsetHeight;
      var maxX = window.innerWidth - w - pad;
      var maxY = window.innerHeight - h - pad;
      tipEl.style.left = Math.max(pad, Math.min(maxX, x + 14)) + 'px';
      tipEl.style.top = Math.max(pad, Math.min(maxY, y + 14)) + 'px';
    }
    function hideTip() { tipEl.classList.remove('is-visible'); }
    function tipFor(t) {
      return '<div class="hc-tooltip-title">' + escapeHtml(t.term) + '</div>' +
             '<div>' + escapeHtml(t.def) + '</div>' +
             (t.why ? '<div class="hc-tooltip-meta">' + escapeHtml(t.why) + '</div>' : '');
    }

    function escapeHtml(s) {
      return String(s || '').replace(/[&<>"']/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
      });
    }

    // ---------- Evidence badge helper ----------------------------------
    function badge(evidence) {
      if (!evidence) return '';
      var map = {
        official: ['hc-badge--official', 'Official'],
        company_claim: ['hc-badge--company', 'Company claim'],
        vc_survey: ['hc-badge--vc', 'VC survey'],
        modeled: ['hc-badge--modeled', 'Modeled'],
        context: ['hc-badge--context', 'Context'],
        verify: ['hc-badge--modeled', 'Verify']
      };
      var v = map[evidence];
      if (!v) return '';
      return '<span class="hc-badge ' + v[0] + '">' + v[1] + '</span>';
    }

    // ---------- Headline stat row, sponsors, sources -------------------
    var statsRow = root.querySelector('#hc-stats-row');
    if (statsRow) {
      statsRow.innerHTML = DATA.headlineStats.map(function (s) {
        return '<div class="hc-stat">' +
                 '<div class="hc-stat-value tabnum">' + s.value + '</div>' +
                 '<div class="hc-stat-label">' + s.label + '</div>' +
                 badge(s.evidence) +
               '</div>';
      }).join('');
    }

    var sponsorStrip = root.querySelector('#hc-sponsor-strip');
    if (sponsorStrip) {
      var sponsorHtml = '<div class="hc-sponsor-label">Ultimate sponsors of US health spending</div>';
      sponsorHtml += DATA.sponsors.map(function (s) {
        return '<button type="button" class="hc-sponsor-bar" data-tip="sponsor" data-id="' + s.id + '">' +
                 '<span class="hc-sponsor-bar-value tabnum">' + s.display + '</span>' +
                 '<span class="hc-sponsor-bar-label">' + s.label + '</span>' +
               '</button>';
      }).join('');
      sponsorStrip.innerHTML = sponsorHtml;
      sponsorStrip.querySelectorAll('.hc-sponsor-bar').forEach(function (el) {
        var s = DATA.sponsors.find(function (x) { return x.id === el.dataset.id; });
        if (!s) return;
        el.addEventListener('mouseenter', function (ev) {
          showTip('<div class="hc-tooltip-title">' + escapeHtml(s.label) + '</div>' +
                  '<div>' + escapeHtml(s.tooltip) + '</div>' +
                  '<div class="hc-tooltip-meta">Official rounded · sponsor strip is illustrative; not part of the balanced Sankey.</div>',
                  ev.clientX, ev.clientY);
        });
        el.addEventListener('mousemove', function (ev) { showTip(tipEl.innerHTML, ev.clientX, ev.clientY); });
        el.addEventListener('mouseleave', hideTip);
        el.addEventListener('focus', function () {
          var r = el.getBoundingClientRect();
          showTip('<div class="hc-tooltip-title">' + escapeHtml(s.label) + '</div><div>' + escapeHtml(s.tooltip) + '</div>', r.left, r.bottom);
        });
        el.addEventListener('blur', hideTip);
      });
    }

    var sourcesList = root.querySelector('#hc-sources-list');
    if (sourcesList) {
      sourcesList.innerHTML = DATA.sources.map(function (s) {
        return '<li><a href="' + s.url + '" target="_blank" rel="noopener">' + escapeHtml(s.label) + '</a></li>';
      }).join('');
    }

    // Takeaways
    var takeawayWrap = root.querySelector('#hc-takeaways');
    if (takeawayWrap) {
      takeawayWrap.innerHTML = DATA.takeaways.map(function (t) {
        return '<div class="hc-takeaway"><div class="hc-takeaway-h">' + escapeHtml(t.title) + '</div>' +
                 '<div class="hc-takeaway-c">' + escapeHtml(t.copy) + '</div></div>';
      }).join('');
    }

    // ---------- Term tooltips -----------------------------------------
    root.querySelectorAll('.hc-term[data-tt]').forEach(function (el) {
      var t = DATA.tooltips[el.dataset.tt];
      if (!t) return;
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', t.term + ': ' + t.def);
      el.addEventListener('mouseenter', function (ev) { showTip(tipFor(t), ev.clientX, ev.clientY); });
      el.addEventListener('mousemove', function (ev) { showTip(tipFor(t), ev.clientX, ev.clientY); });
      el.addEventListener('mouseleave', hideTip);
      el.addEventListener('focus', function () { var r = el.getBoundingClientRect(); showTip(tipFor(t), r.left, r.bottom); });
      el.addEventListener('blur', hideTip);
    });

    // ====================================================================
    // 1) MONEY RIVER (D3 Sankey)
    // ====================================================================
    var insightEl = root.querySelector('#hc-insight');
    var moneySvgWrap = root.querySelector('#hc-sankey-wrap');
    var moneySvgEl = root.querySelector('#hc-sankey-svg');
    var fallbackEl = root.querySelector('#hc-fallback');

    var view = 'money';   // 'money' | 'gates' | 'ai' | 'companies'
    var selectedId = null;

    function defaultInsight() {
      var html = '<div class="hc-insight-title">Money River</div>' +
        '<div class="hc-insight-head"><h4>Where the money comes from and where it lands</h4></div>' +
        '<div class="hc-insight-body">' +
          '<p>The left column shows payment channels published by CMS for 2024. The right column shows official destination categories. Link widths are <strong>modeled</strong> allocations that respect payer-mix hints in the CMS highlights; node totals are official.</p>' +
          '<p>Click a node to lock the panel and see which <strong>admin gates</strong>, <strong>AI surfaces</strong>, and <strong>companies</strong> attach to it. Toggle view controls above the chart to overlay them.</p>' +
        '</div>';
      // Embed callouts inline so they always have a home
      html += '<div class="hc-callout-stack">' +
        DATA.moneyCallouts.slice(0, 4).map(function (c) {
          return '<div class="hc-callout"><div class="hc-callout-title">' + escapeHtml(c.title) + '</div>' +
                 '<div class="hc-callout-body">' + escapeHtml(c.copy) + '</div></div>';
        }).join('') +
        '</div>';
      return html;
    }
    function renderInsight(html) { if (insightEl) insightEl.innerHTML = html; }
    renderInsight(defaultInsight());

    if (!window.d3 || !window.d3.sankey) {
      // No d3 — keep fallback visible
      if (fallbackEl) fallbackEl.classList.remove('is-hidden');
      console.warn('[healthcare] d3-sankey not available; falling back to tables.');
    } else {
      try { renderSankey(); } catch (e) {
        console.error('[healthcare] sankey render failed', e);
        if (fallbackEl) fallbackEl.classList.remove('is-hidden');
        return;
      }
      // hide fallback only after success
      if (fallbackEl) fallbackEl.classList.add('is-hidden');
    }

    function renderSankey() {
      var d3 = window.d3;
      var svg = d3.select(moneySvgEl);
      svg.selectAll('*').remove();

      // Determine width from container
      var bbox = moneySvgEl.getBoundingClientRect();
      var width = Math.max(880, bbox.width || moneySvgEl.parentNode.clientWidth || 1000);
      var height = 720;
      var isMobile = window.innerWidth < 768;
      if (isMobile) { width = Math.max(1100, width); height = 640; }

      svg.attr('viewBox', '0 0 ' + width + ' ' + height);
      svg.attr('preserveAspectRatio', 'xMinYMin meet');

      var sankey = d3.sankey()
        .nodeId(function (d) { return d.id; })
        .nodeWidth(18)
        .nodePadding(14)
        .extent([[20, 30], [width - 20, height - 30]]);

      var allNodes = [].concat(
        DATA.paymentChannels.map(function (n) { return Object.assign({}, n, { layer: 0 }); }),
        DATA.destinations.map(function (n) { return Object.assign({}, n, { layer: 1 }); })
      );
      var allLinks = DATA.moneyLinks.map(function (l) {
        return { source: l.source, target: l.target, value: l.value_b, evidence: l.evidence, rationale: l.rationale };
      });

      var graph = sankey({ nodes: allNodes.map(function (n) { return Object.assign({}, n); }),
                            links: allLinks.map(function (l) { return Object.assign({}, l); }) });

      // Title for SR users
      svg.append('title').text('Money River — US national health expenditure flow from payment channels to destination categories');
      svg.append('desc').text('Sankey diagram. Payment channels include private insurance, Medicare, Medicaid, out-of-pocket, other public/private, and a residual. Destinations include hospital care, physician services, prescription drugs, dental, nursing, home health, DME, and an admin/public-health/investment residual.');

      // Color helpers
      function nodeColor(n) {
        if (n.id === 'pay_out_of_pocket') return 'rgba(255, 140, 66, 0.6)';
        if (n.id === 'pay_residual' || n.id === 'dest_residual') return 'rgba(160, 168, 188, 0.4)';
        return n.layer === 0 ? 'rgba(74, 144, 217, 0.55)' : 'rgba(78, 205, 196, 0.55)';
      }
      function linkColor(l) {
        var s = (typeof l.source === 'object') ? l.source.id : l.source;
        if (s === 'pay_out_of_pocket') return 'rgba(255, 140, 66, 0.55)';
        if (s === 'pay_residual') return 'rgba(160, 168, 188, 0.32)';
        if (s === 'pay_medicare')  return 'rgba(74, 144, 217, 0.55)';
        if (s === 'pay_medicaid')  return 'rgba(78, 205, 196, 0.55)';
        if (s === 'pay_private_insurance') return 'rgba(78, 205, 196, 0.4)';
        return 'rgba(160, 168, 188, 0.45)';
      }

      // Links
      var linkG = svg.append('g').attr('fill', 'none').attr('class', 'links');
      var link = linkG.selectAll('path')
        .data(graph.links)
        .enter().append('path')
        .attr('class', 'link')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke', linkColor)
        .attr('stroke-width', function (d) { return Math.max(1, d.width); })
        .on('mousemove', function (event, d) {
          var s = typeof d.source === 'object' ? d.source : graph.nodes.find(function (n) { return n.id === d.source; });
          var t = typeof d.target === 'object' ? d.target : graph.nodes.find(function (n) { return n.id === d.target; });
          showTip(
            '<div class="hc-tooltip-title">' + escapeHtml(s.label) + ' → ' + escapeHtml(t.label) + '</div>' +
            '<div>Modeled allocation: <strong class="tabnum">$' + Math.round(d.value) + 'B</strong></div>' +
            '<div class="hc-tooltip-meta">Modeled — payer-mix hints from CMS highlights, balanced to node totals</div>',
            event.clientX, event.clientY
          );
        })
        .on('mouseleave', hideTip);

      // Nodes
      var nodeG = svg.append('g').attr('class', 'nodes');
      var node = nodeG.selectAll('g.node')
        .data(graph.nodes)
        .enter().append('g')
        .attr('class', function (d) {
          var cls = 'node ' + (d.layer === 0 ? 'is-payment' : 'is-destination');
          if (d.evidence === 'modeled') cls += ' is-residual';
          return cls;
        })
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr('aria-label', function (d) { return d.label + ', ' + d.display; })
        .attr('data-id', function (d) { return d.id; });

      node.append('rect')
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('height', function (d) { return Math.max(2, d.y1 - d.y0); })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('fill', nodeColor);

      node.append('text')
        .attr('x', function (d) { return d.x0 < width / 2 ? d.x1 + 8 : d.x0 - 8; })
        .attr('y', function (d) { return (d.y0 + d.y1) / 2; })
        .attr('dy', '0.35em')
        .attr('text-anchor', function (d) { return d.x0 < width / 2 ? 'start' : 'end'; })
        .text(function (d) { return d.label; })
        .append('tspan')
        .attr('class', 'val')
        .attr('dx', '0.4em')
        .text(function (d) { return d.display; });

      // Interactions
      node.on('mousemove', function (event, d) {
        var ttId = d.tooltip_id;
        var tooltipBody = ttId && DATA.tooltips[ttId] ? DATA.tooltips[ttId].def : d.description;
        showTip(
          '<div class="hc-tooltip-title">' + escapeHtml(d.label) + ' · ' + escapeHtml(d.display) + '</div>' +
          '<div>' + escapeHtml(tooltipBody) + '</div>' +
          '<div class="hc-tooltip-meta">' + (d.evidence === 'modeled' ? 'Modeled · residual' : 'Official · CMS') + '</div>',
          event.clientX, event.clientY
        );
      });
      node.on('mouseleave', hideTip);
      node.on('click', function (event, d) { selectNode(d.id); });
      node.on('keydown', function (event, d) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectNode(d.id); }
      });

      // Hover highlight
      node.on('mouseover', function (event, d) { highlightNode(d.id, /*lock*/ false); });
      node.on('mouseout',  function () { if (!selectedId) clearHighlight(); });

      // ---------- Overlays (gates, AI surfaces, companies) -------------
      var overlayG = svg.append('g').attr('class', 'hc-overlay-layer');

      function nodeById(id) { return graph.nodes.find(function (n) { return n.id === id; }); }
      function midOfNode(n) { return { x: (n.x0 + n.x1) / 2, y: (n.y0 + n.y1) / 2 }; }

      // Admin gates — render between payment & destination columns near attached nodes
      var gateY = {};
      DATA.adminGates.forEach(function (g, i) {
        var attached = g.attach.map(nodeById).filter(Boolean);
        if (!attached.length) return;
        var mid = { x: 0, y: 0 };
        attached.forEach(function (n) { var m = midOfNode(n); mid.x += m.x; mid.y += m.y; });
        mid.x /= attached.length; mid.y /= attached.length;
        // Stagger to reduce overlap
        var bias = (i % 2 === 0) ? -1 : 1;
        var gx = (width / 2) + (i % 3 - 1) * 70;
        var gy = mid.y + bias * 22 + (i * 6 - 18);
        gy = Math.max(50, Math.min(height - 50, gy));
        gateY[g.id] = { x: gx, y: gy };

        var gw = Math.max(110, g.label.length * 6.6);
        var gh = 22;
        var grp = overlayG.append('g')
          .attr('class', 'hc-overlay-gate')
          .attr('data-gate', g.id)
          .attr('tabindex', 0)
          .attr('role', 'button')
          .attr('aria-label', g.label + ' admin gate')
          .attr('transform', 'translate(' + (gx - gw / 2) + ',' + (gy - gh / 2) + ')');
        grp.append('rect').attr('width', gw).attr('height', gh).attr('rx', 6);
        grp.append('text').attr('x', gw / 2).attr('y', gh / 2 + 4).attr('text-anchor', 'middle').text(g.label);

        grp.on('mousemove', function (ev) {
          showTip('<div class="hc-tooltip-title">' + escapeHtml(g.label) + ' (admin gate)</div>' +
                  '<div>' + escapeHtml(g.summary) + '</div>' +
                  '<div class="hc-tooltip-meta">Process that controls, delays, or reimburses care</div>',
                  ev.clientX, ev.clientY);
        });
        grp.on('mouseleave', hideTip);
        grp.on('click', function () { selectGate(g.id); });
        grp.on('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectGate(g.id); } });
      });

      // AI surfaces — small pills near attached destination/payment nodes
      DATA.aiSurfaces.forEach(function (a, i) {
        var attached = a.attach.map(function (id) {
          // attach may be a gate id; use gateY otherwise nodeById
          if (gateY[id]) return { x: gateY[id].x, y: gateY[id].y, _gate: true };
          var n = nodeById(id); return n ? midOfNode(n) : null;
        }).filter(Boolean);
        if (!attached.length) return;
        var mid = { x: 0, y: 0 };
        attached.forEach(function (m) { mid.x += m.x; mid.y += m.y; });
        mid.x /= attached.length; mid.y /= attached.length;
        var ax = mid.x + (i % 2 === 0 ? -30 : 30);
        var ay = mid.y + ((i - 3) * 24);
        ay = Math.max(36, Math.min(height - 36, ay));

        var aw = Math.max(94, a.label.length * 6.4);
        var ah = 19;
        var grp = overlayG.append('g')
          .attr('class', 'hc-overlay-ai')
          .attr('data-ai', a.id)
          .attr('tabindex', 0)
          .attr('role', 'button')
          .attr('aria-label', a.label + ' AI surface')
          .attr('transform', 'translate(' + (ax - aw / 2) + ',' + (ay - ah / 2) + ')');
        grp.append('rect').attr('width', aw).attr('height', ah).attr('rx', 8);
        grp.append('text').attr('x', aw / 2).attr('y', ah / 2 + 4).attr('text-anchor', 'middle').text(a.label);

        grp.on('mousemove', function (ev) {
          showTip('<div class="hc-tooltip-title">' + escapeHtml(a.label) + ' (AI surface)</div>' +
                  '<div>' + escapeHtml(a.message) + '</div>',
                  ev.clientX, ev.clientY);
        });
        grp.on('mouseleave', hideTip);
        grp.on('click', function () { selectAI(a.id); });
        grp.on('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectAI(a.id); } });
        grp.style('opacity', 0);
      });

      // Company badges — small circles next to relevant node/gate/ai
      DATA.companies.forEach(function (c, idx) {
        // Skip non-money placements (loop-only) here
        var placed = false;
        c.placements.forEach(function (pId) {
          // money-side placements
          if (gateY[pId]) {
            placeBadge(c, gateY[pId].x + ((idx % 4 - 2) * 6), gateY[pId].y - 14);
            placed = true;
            return;
          }
          var n = nodeById(pId);
          if (n) {
            var mid = midOfNode(n);
            placeBadge(c, mid.x + 8 + ((idx % 5) * 6), mid.y + ((idx % 7 - 3) * 6));
            placed = true;
          }
          // ai surface placement -> we don't have ai geometry stored, skip silently
        });
        if (!placed) return;
      });

      function placeBadge(c, x, y) {
        var grp = overlayG.append('g')
          .attr('class', 'hc-overlay-company' + (c.status === 'Benchmark' ? ' is-bench' : ''))
          .attr('data-company', c.id)
          .attr('tabindex', 0)
          .attr('role', 'button')
          .attr('aria-label', c.name + (c.status === 'DVC' ? ' (DVC portfolio)' : ' (benchmark)'))
          .attr('transform', 'translate(' + x + ',' + y + ')');
        grp.append('circle').attr('r', 5);
        grp.style('opacity', 0);
        grp.on('mousemove', function (ev) {
          showTip('<div class="hc-tooltip-title">' + escapeHtml(c.name) + ' · ' + (c.status === 'DVC' ? 'DVC' : 'Benchmark') + '</div>' +
                  '<div>' + escapeHtml(c.one_liner) + '</div>',
                  ev.clientX, ev.clientY);
        });
        grp.on('mouseleave', hideTip);
        grp.on('click', function () { selectCompany(c.id); });
        grp.on('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectCompany(c.id); } });
      }

      // ---------- View toggles -----------------------------------------
      function applyView() {
        var gates = overlayG.selectAll('.hc-overlay-gate');
        var ais   = overlayG.selectAll('.hc-overlay-ai');
        var cos   = overlayG.selectAll('.hc-overlay-company');
        gates.style('opacity', (view === 'gates' || view === 'companies') ? 1 : (view === 'ai' ? 0.4 : 0.85));
        ais.style('opacity', (view === 'ai' || view === 'companies') ? 1 : (view === 'gates' ? 0.35 : 0));
        cos.style('opacity', (view === 'companies') ? 1 : 0);
      }
      applyView();

      root.querySelectorAll('.hc-view-btn[data-view]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          view = btn.dataset.view;
          root.querySelectorAll('.hc-view-btn[data-view]').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
          applyView();
        });
      });

      // ---------- Highlight / selection ---------------------------------
      function highlightNode(id, lock) {
        var related = relatedToNode(id);
        link.classed('dim', function (l) {
          var s = typeof l.source === 'object' ? l.source.id : l.source;
          var t = typeof l.target === 'object' ? l.target.id : l.target;
          return !(s === id || t === id);
        }).classed('hi', function (l) {
          var s = typeof l.source === 'object' ? l.source.id : l.source;
          var t = typeof l.target === 'object' ? l.target.id : l.target;
          return s === id || t === id;
        });
        node.classed('dim', function (d) { return d.id !== id && !related.nodes[d.id]; });
        if (lock) selectedId = id;
      }
      function clearHighlight() {
        link.classed('dim', false).classed('hi', false);
        node.classed('dim', false);
      }
      function relatedToNode(id) {
        var related = { nodes: {}, gates: {}, ais: {}, companies: {} };
        graph.links.forEach(function (l) {
          var s = typeof l.source === 'object' ? l.source.id : l.source;
          var t = typeof l.target === 'object' ? l.target.id : l.target;
          if (s === id) related.nodes[t] = true;
          if (t === id) related.nodes[s] = true;
        });
        DATA.adminGates.forEach(function (g) { if (g.attach.indexOf(id) >= 0) related.gates[g.id] = true; });
        DATA.aiSurfaces.forEach(function (a) { if (a.attach.indexOf(id) >= 0) related.ais[a.id] = true; });
        DATA.companies.forEach(function (c) { if (c.placements.indexOf(id) >= 0) related.companies[c.id] = true; });
        return related;
      }

      // Expose select handlers
      window._hcSelectNode = selectNode;
      window._hcSelectGate = selectGate;
      window._hcSelectAI = selectAI;
      window._hcSelectCompany = selectCompany;

      function selectNode(id) {
        selectedId = id;
        highlightNode(id, true);
        var n = graph.nodes.find(function (x) { return x.id === id; });
        if (!n) return;
        renderInsight(buildNodeCard(n));
        if (window.innerWidth < 768) openBottomSheet(buildNodeCard(n));
      }
      function selectGate(id) {
        var g = DATA.adminGates.find(function (x) { return x.id === id; });
        if (!g) return;
        renderInsight(buildGateCard(g));
        if (window.innerWidth < 768) openBottomSheet(buildGateCard(g));
      }
      function selectAI(id) {
        var a = DATA.aiSurfaces.find(function (x) { return x.id === id; });
        if (!a) return;
        renderInsight(buildAICard(a));
        if (window.innerWidth < 768) openBottomSheet(buildAICard(a));
      }
      function selectCompany(id) {
        var c = DATA.companies.find(function (x) { return x.id === id; });
        if (!c) return;
        renderInsight(buildCompanyCard(c));
        if (window.innerWidth < 768) openBottomSheet(buildCompanyCard(c));
        // Highlight all placements that match graph nodes
        var hit = {}; c.placements.forEach(function (p) { if (nodeById(p)) hit[p] = true; });
        node.classed('dim', function (d) { return !hit[d.id]; });
        link.classed('dim', function (l) {
          var s = typeof l.source === 'object' ? l.source.id : l.source;
          var t = typeof l.target === 'object' ? l.target.id : l.target;
          return !hit[s] && !hit[t];
        });
        // Highlight in patient loop
        highlightCompanyInLoop(c);
      }

      function buildNodeCard(n) {
        var related = relatedToNode(n.id);
        var gateChips = Object.keys(related.gates).map(function (gid) {
          var g = DATA.adminGates.find(function (x) { return x.id === gid; });
          return '<button type="button" class="hc-callout" data-action="gate" data-id="' + g.id + '"><div class="hc-callout-title">' + escapeHtml(g.label) + '</div><div class="hc-callout-body">' + escapeHtml(g.summary) + '</div></button>';
        }).join('');
        var aiChips = Object.keys(related.ais).map(function (aid) {
          var a = DATA.aiSurfaces.find(function (x) { return x.id === aid; });
          return '<li><strong>' + escapeHtml(a.label) + '</strong> — ' + escapeHtml(a.message) + '</li>';
        }).join('');
        var coChips = Object.keys(related.companies).map(function (cid) {
          var c = DATA.companies.find(function (x) { return x.id === cid; });
          return '<button type="button" class="hc-company-card" data-action="company" data-id="' + c.id + '" style="text-align:left">' +
            '<div class="hc-company-name">' + escapeHtml(c.name) + ' ' + (c.status === 'DVC' ? '<span class="hc-badge hc-badge--dvc">DVC</span>' : '<span class="hc-badge hc-badge--bench">Benchmark</span>') + '</div>' +
            '<div class="hc-company-cat">' + escapeHtml(c.category) + '</div>' +
          '</button>';
        }).join('');
        var html = '<div class="hc-insight-title">' + (n.layer === 0 ? 'Payment channel' : 'Destination') + '</div>' +
          '<div class="hc-insight-head"><h4>' + escapeHtml(n.label) + '</h4>' + badge(n.evidence) + '</div>' +
          '<div class="hc-insight-body">' +
            '<p><strong class="tabnum">' + n.display + '</strong> — ' + escapeHtml(n.description) + '</p>' +
            (gateChips ? '<h5>Admin gates</h5><div class="hc-callout-stack">' + gateChips + '</div>' : '') +
            (aiChips ? '<h5>AI surfaces</h5><ul>' + aiChips + '</ul>' : '') +
            (coChips ? '<h5>Companies</h5><div class="hc-company-grid">' + coChips + '</div>' : '') +
            (n.src ? '<a class="hc-insight-link" href="' + n.src + '" target="_blank" rel="noopener">CMS source ↗</a>' : '') +
          '</div>';
        return html;
      }
      function buildGateCard(g) {
        var coHtml = DATA.companies.filter(function (c) { return c.placements.indexOf(g.id) >= 0; }).map(function (c) {
          return '<button type="button" class="hc-company-card" data-action="company" data-id="' + c.id + '" style="text-align:left">' +
            '<div class="hc-company-name">' + escapeHtml(c.name) + ' ' + (c.status === 'DVC' ? '<span class="hc-badge hc-badge--dvc">DVC</span>' : '<span class="hc-badge hc-badge--bench">Benchmark</span>') + '</div>' +
            '<div class="hc-company-cat">' + escapeHtml(c.category) + '</div>' +
          '</button>';
        }).join('');
        return '<div class="hc-insight-title">Admin gate</div>' +
          '<div class="hc-insight-head"><h4>' + escapeHtml(g.label) + '</h4></div>' +
          '<div class="hc-insight-body"><p>' + escapeHtml(g.summary) + '</p>' +
            (coHtml ? '<h5>Companies playing here</h5><div class="hc-company-grid">' + coHtml + '</div>' : '') +
          '</div>';
      }
      function buildAICard(a) {
        var coHtml = DATA.companies.filter(function (c) { return c.placements.indexOf(a.id) >= 0; }).map(function (c) {
          return '<button type="button" class="hc-company-card" data-action="company" data-id="' + c.id + '" style="text-align:left">' +
            '<div class="hc-company-name">' + escapeHtml(c.name) + ' ' + (c.status === 'DVC' ? '<span class="hc-badge hc-badge--dvc">DVC</span>' : '<span class="hc-badge hc-badge--bench">Benchmark</span>') + '</div>' +
            '<div class="hc-company-cat">' + escapeHtml(c.category) + '</div>' +
          '</button>';
        }).join('');
        return '<div class="hc-insight-title">AI surface</div>' +
          '<div class="hc-insight-head"><h4>' + escapeHtml(a.label) + '</h4></div>' +
          '<div class="hc-insight-body"><p>' + escapeHtml(a.message) + '</p>' +
            (coHtml ? '<h5>Companies</h5><div class="hc-company-grid">' + coHtml + '</div>' : '') +
          '</div>';
      }

      // delegate clicks from insight panel
      insightEl && insightEl.addEventListener('click', function (ev) {
        var t = ev.target.closest('[data-action]');
        if (!t) return;
        var action = t.dataset.action;
        var id = t.dataset.id;
        if (action === 'company') selectCompany(id);
        else if (action === 'gate') selectGate(id);
        else if (action === 'ai') selectAI(id);
        else if (action === 'node') selectNode(id);
      });
    } // end renderSankey

    function buildCompanyCard(c) {
      var placementChips = c.placements.map(function (id) {
        var label = id;
        var found = DATA.destinations.concat(DATA.paymentChannels).find(function (n) { return n.id === id; }) ||
                    DATA.adminGates.find(function (g) { return g.id === id; }) ||
                    DATA.aiSurfaces.find(function (a) { return a.id === id; }) ||
                    DATA.careLoop.find(function (s) { return s.id === id; }) ||
                    DATA.financialLoop.find(function (s) { return s.id === id; }) ||
                    DATA.sharedStack.find(function (s) { return s.id === id; }) ||
                    DATA.preventionOrbit.find(function (s) { return s.id === id; }) ||
                    DATA.vbcBridge.find(function (s) { return s.id === id; });
        if (found) label = found.label;
        return '<li>' + escapeHtml(label) + '</li>';
      }).join('');
      var claims = (c.claims || []).map(function (cl) {
        return '<li>' + escapeHtml(cl.claim) + ' ' + badge(cl.evidence) +
               (cl.src ? ' <a class="hc-insight-link" style="margin:0" href="' + cl.src + '" target="_blank" rel="noopener">source ↗</a>' : '') +
               '</li>';
      }).join('');
      return '<div class="hc-insight-title">Company</div>' +
        '<div class="hc-insight-head"><h4>' + escapeHtml(c.name) + '</h4>' +
          (c.status === 'DVC' ? '<span class="hc-badge hc-badge--dvc">DVC portfolio</span>' : '<span class="hc-badge hc-badge--bench">Benchmark</span>') +
        '</div>' +
        '<div class="hc-insight-body">' +
          '<p>' + escapeHtml(c.one_liner) + '</p>' +
          '<h5>Category</h5><p>' + escapeHtml(c.category) + '</p>' +
          (placementChips ? '<h5>Placements</h5><ul>' + placementChips + '</ul>' : '') +
          (claims ? '<h5>Public claims</h5><ul>' + claims + '</ul>' : '<h5>Public traction</h5><p>Not disclosed.</p>') +
        '</div>';
    }

    function openBottomSheet(html) {
      var sheet = root.querySelector('#hc-bottom-sheet');
      if (!sheet) return;
      sheet.querySelector('.hc-bottom-sheet-body').innerHTML = html;
      sheet.classList.add('is-open');
    }
    function closeBottomSheet() {
      var sheet = root.querySelector('#hc-bottom-sheet');
      if (sheet) sheet.classList.remove('is-open');
    }
    var sheetClose = root.querySelector('.hc-bottom-sheet-close');
    if (sheetClose) sheetClose.addEventListener('click', closeBottomSheet);

    // ESC clears selection / closes sheet
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        selectedId = null;
        if (window._hcClearLoop) window._hcClearLoop();
        renderInsight(defaultInsight());
        closeBottomSheet();
        var d3root = window.d3 && d3.select(moneySvgEl);
        if (d3root) {
          d3root.selectAll('.link').classed('dim', false).classed('hi', false);
          d3root.selectAll('.node').classed('dim', false);
        }
      }
    });

    // ====================================================================
    // 2) PATIENT EVENT TO PREVENTION LOOP
    // ====================================================================
    var loopSvg = root.querySelector('#hc-loop-svg');
    var loopVbc = root.querySelector('#hc-loop-vbc');
    var loopPrev = root.querySelector('#hc-loop-prevention');
    var loopStack = root.querySelector('#hc-loop-stack');
    var loopStateBar = root.querySelector('#hc-state-selector');

    var currentState = 'state_at_risk';

    function renderStateSelector() {
      loopStateBar.innerHTML = DATA.patientStates.map(function (s) {
        return '<button type="button" class="hc-state-btn ' + (s.id === currentState ? 'is-active' : '') + '" data-state="' + s.id + '" style="--hc-state-color:' + s.color + '">' + escapeHtml(s.label) + '</button>';
      }).join('');
      loopStateBar.querySelectorAll('.hc-state-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { currentState = btn.dataset.state; renderLoop(); });
      });
    }

    function renderVbcAndPrev() {
      loopVbc.innerHTML = '<div class="hc-side-h">VBC bridge</div>' +
        '<div class="hc-side-list">' + DATA.vbcBridge.map(function (v) {
          return '<button type="button" class="hc-side-item" data-loop="vbc" data-id="' + v.id + '">' +
            '<div class="hc-side-item-h">' + escapeHtml(v.label) + '</div>' +
            '<div class="hc-side-item-d">' + escapeHtml(v.description) + '</div>' +
          '</button>';
        }).join('') + '</div>';

      loopPrev.innerHTML = '<div class="hc-side-h is-prevention">Private-pay prevention orbit</div>' +
        '<div class="hc-side-list">' + DATA.preventionOrbit.map(function (p) {
          return '<button type="button" class="hc-side-item" data-loop="prev" data-id="' + p.id + '">' +
            '<div class="hc-side-item-h">' + escapeHtml(p.label) + '</div>' +
            '<div class="hc-side-item-d">' + escapeHtml(p.examples) + '</div>' +
          '</button>';
        }).join('') + '</div>' +
        '<div class="hc-private-callout">The Bryan Johnson / “Don’t Die” pattern is not mainstream healthcare yet. Treat it as an early-adopter signal: affluent, quantified, private-pay users pull prevention forward before reimbursement systems know how to pay for it. The systemic shift begins only when risk-bearing payers, employers, Medicare Advantage, ACOs, or CMS models can measure avoided downstream cost.</div>';

      loopStack.innerHTML = '<div class="hc-side-h">Shared stack — care, payment, and prevention all compete here</div>' +
        '<div class="hc-stack-grid">' + DATA.sharedStack.map(function (s) {
          return '<button type="button" class="hc-stack-cell" data-stack-id="' + s.id + '">' +
            '<div class="hc-stack-h">' + escapeHtml(s.label) + '</div>' +
            '<div class="hc-stack-c">' + escapeHtml(s.contents) + '</div>' +
          '</button>';
        }).join('') + '</div>';

      // wiring
      loopVbc.querySelectorAll('.hc-side-item').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = DATA.vbcBridge.find(function (x) { return x.id === b.dataset.id; });
          renderInsight('<div class="hc-insight-title">VBC bridge</div><div class="hc-insight-head"><h4>' + escapeHtml(v.label) + '</h4></div><div class="hc-insight-body"><p>' + escapeHtml(v.description) + '</p></div>');
        });
      });
      loopPrev.querySelectorAll('.hc-side-item').forEach(function (b) {
        b.addEventListener('click', function () {
          var p = DATA.preventionOrbit.find(function (x) { return x.id === b.dataset.id; });
          var coHtml = DATA.companies.filter(function (c) { return c.placements.indexOf(p.id) >= 0; }).map(function (c) {
            return '<button type="button" class="hc-company-card" data-action="company" data-id="' + c.id + '" style="text-align:left">' +
              '<div class="hc-company-name">' + escapeHtml(c.name) + ' ' + (c.status === 'DVC' ? '<span class="hc-badge hc-badge--dvc">DVC</span>' : '<span class="hc-badge hc-badge--bench">Benchmark</span>') + '</div>' +
              '<div class="hc-company-cat">' + escapeHtml(c.category) + '</div>' +
            '</button>';
          }).join('');
          renderInsight('<div class="hc-insight-title">Prevention orbit</div><div class="hc-insight-head"><h4>' + escapeHtml(p.label) + '</h4></div><div class="hc-insight-body"><p>' + escapeHtml(p.description) + '</p><p><em>Examples:</em> ' + escapeHtml(p.examples) + '</p>' + (coHtml ? '<h5>Companies</h5><div class="hc-company-grid">' + coHtml + '</div>' : '') + '</div>');
        });
      });
      loopStack.querySelectorAll('.hc-stack-cell').forEach(function (b) {
        b.addEventListener('click', function () {
          var s = DATA.sharedStack.find(function (x) { return x.id === b.dataset.stackId; });
          var coHtml = DATA.companies.filter(function (c) { return c.placements.indexOf(s.id) >= 0; }).map(function (c) {
            return '<button type="button" class="hc-company-card" data-action="company" data-id="' + c.id + '" style="text-align:left">' +
              '<div class="hc-company-name">' + escapeHtml(c.name) + ' ' + (c.status === 'DVC' ? '<span class="hc-badge hc-badge--dvc">DVC</span>' : '<span class="hc-badge hc-badge--bench">Benchmark</span>') + '</div>' +
              '<div class="hc-company-cat">' + escapeHtml(c.category) + '</div>' +
            '</button>';
          }).join('');
          renderInsight('<div class="hc-insight-title">Shared stack layer</div><div class="hc-insight-head"><h4>' + escapeHtml(s.label) + '</h4></div><div class="hc-insight-body"><p>' + escapeHtml(s.contents) + '</p><p><em>Why for AI:</em> ' + escapeHtml(s.why) + '</p>' + (coHtml ? '<h5>Companies</h5><div class="hc-company-grid">' + coHtml + '</div>' : '') + '</div>');
        });
      });
    }

    function renderLoop() {
      if (!loopSvg) return;
      // Compute geometry
      var W = loopSvg.clientWidth || 560;
      var H = 480;
      var cx = W / 2, cy = H / 2;
      var careR = Math.min(W, H) / 2 - 30;
      var finR = careR - 60;
      loopSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      loopSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      while (loopSvg.firstChild) loopSvg.removeChild(loopSvg.firstChild);

      var SVG_NS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs, parent) {
        var n = document.createElementNS(SVG_NS, tag);
        Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
        (parent || loopSvg).appendChild(n);
        return n;
      }

      // Ring guides
      el('circle', { cx: cx, cy: cy, r: careR, class: 'loop-arc care' });
      el('circle', { cx: cx, cy: cy, r: finR,  class: 'loop-arc fin' });

      // Ring labels
      el('text', { x: cx, y: cy - careR - 8, class: 'loop-ring-label' }).textContent = 'Care loop';
      el('text', { x: cx, y: cy + careR + 18, class: 'loop-ring-label' }).textContent = 'Financial loop';

      var stateInfo = DATA.patientStates.find(function (s) { return s.id === currentState; });
      var highlights = DATA.stateHighlights[currentState] || { care: [], financial: [], prevention: [], vbc: [] };

      // Patient center
      var center = el('g', { class: 'patient-center', transform: 'translate(' + cx + ',' + cy + ')' });
      var pulse = el('circle', { r: 36, fill: stateInfo.color, opacity: 0.18 }, center);
      el('circle', { r: 24, fill: stateInfo.color, stroke: 'rgba(255,255,255,0.4)', 'stroke-width': 2 }, center);
      el('text', { y: -2, class: 'label' }, center).textContent = stateInfo.label;
      el('text', { y: 12, class: 'prompt' }, center).textContent = stateInfo.prompt;

      // Step renderer
      function placeStep(s, radius, type) {
        var rad = (s.angle - 90) * Math.PI / 180;
        var x = cx + radius * Math.cos(rad);
        var y = cy + radius * Math.sin(rad);
        var w = 124, h = 36;
        var active = (highlights[type === 'care' ? 'care' : 'financial'] || []).indexOf(s.id) >= 0;
        var classes = 'loop-step is-' + (type === 'care' ? 'care' : 'fin');
        if (active) classes += ' is-active'; else classes += ' is-dim';
        var g = el('g', { class: classes, transform: 'translate(' + (x - w / 2) + ',' + (y - h / 2) + ')',
                          tabindex: 0, role: 'button', 'aria-label': s.label });
        el('rect', { class: 'bg', width: w, height: h, rx: 8 }, g);
        el('text', { x: w / 2, y: h / 2 + 4 }, g).textContent = s.label;

        g.addEventListener('mouseenter', function (ev) {
          showTip('<div class="hc-tooltip-title">' + escapeHtml(s.label) + '</div><div>' + escapeHtml(s.description) + '</div>', ev.clientX, ev.clientY);
        });
        g.addEventListener('mousemove', function (ev) { showTip(tipEl.innerHTML, ev.clientX, ev.clientY); });
        g.addEventListener('mouseleave', hideTip);
        g.addEventListener('click', function () { selectStep(s, type); });
        g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectStep(s, type); } });
      }

      DATA.careLoop.forEach(function (s) { placeStep(s, careR, 'care'); });
      DATA.financialLoop.forEach(function (s) { placeStep(s, finR, 'fin'); });

      function selectStep(s, type) {
        var coHtml = DATA.companies.filter(function (c) { return c.placements.indexOf(s.id) >= 0; }).map(function (c) {
          return '<button type="button" class="hc-company-card" data-action="company" data-id="' + c.id + '" style="text-align:left">' +
            '<div class="hc-company-name">' + escapeHtml(c.name) + ' ' + (c.status === 'DVC' ? '<span class="hc-badge hc-badge--dvc">DVC</span>' : '<span class="hc-badge hc-badge--bench">Benchmark</span>') + '</div>' +
            '<div class="hc-company-cat">' + escapeHtml(c.category) + '</div>' +
          '</button>';
        }).join('');
        var aiHtml = (s.ai || []).map(function (aid) {
          var a = DATA.aiSurfaces.find(function (x) { return x.id === aid; });
          return a ? '<li><strong>' + escapeHtml(a.label) + '</strong> — ' + escapeHtml(a.message) + '</li>' : '';
        }).join('');
        renderInsight('<div class="hc-insight-title">' + (type === 'care' ? 'Care loop step' : 'Financial loop step') + '</div>' +
          '<div class="hc-insight-head"><h4>' + escapeHtml(s.label) + '</h4></div>' +
          '<div class="hc-insight-body"><p>' + escapeHtml(s.description) + '</p>' +
            (aiHtml ? '<h5>AI surfaces</h5><ul>' + aiHtml + '</ul>' : '') +
            (coHtml ? '<h5>Companies</h5><div class="hc-company-grid">' + coHtml + '</div>' : '') +
          '</div>');
      }

      // Update prevention orbit + vbc state highlights
      loopPrev.querySelectorAll('.hc-side-item').forEach(function (b) {
        b.classList.toggle('is-dim', highlights.prevention.indexOf(b.dataset.id) < 0);
      });
      loopVbc.querySelectorAll('.hc-side-item').forEach(function (b) {
        b.classList.toggle('is-dim', highlights.vbc.indexOf(b.dataset.id) < 0);
      });
    }

    window._hcClearLoop = function () { /* placeholder for ESC */ };

    function highlightCompanyInLoop(c) {
      // dim non-matching loop steps and stack cells
      var hit = {}; c.placements.forEach(function (p) { hit[p] = true; });
      loopSvg && loopSvg.querySelectorAll('.loop-step').forEach(function (g) {
        var label = g.querySelector('text') && g.querySelector('text').textContent;
        var match = (function () {
          var found = false;
          DATA.careLoop.concat(DATA.financialLoop).forEach(function (s) {
            if (s.label === label && hit[s.id]) found = true;
          });
          return found;
        })();
        g.classList.toggle('is-dim', !match);
      });
      loopStack && loopStack.querySelectorAll('.hc-stack-cell').forEach(function (b) {
        b.classList.toggle('is-dim', !hit[b.dataset.stackId]);
      });
      loopVbc && loopVbc.querySelectorAll('.hc-side-item').forEach(function (b) {
        b.classList.toggle('is-dim', !hit[b.dataset.id]);
      });
      loopPrev && loopPrev.querySelectorAll('.hc-side-item').forEach(function (b) {
        b.classList.toggle('is-dim', !hit[b.dataset.id]);
      });
    }

    renderStateSelector();
    renderVbcAndPrev();
    renderLoop();
    window.addEventListener('resize', function () {
      if (!prefersReducedMotion) renderLoop();
    });

    // ====================================================================
    // 3) COMPANY EXPLORER
    // ====================================================================
    var compFilters = root.querySelector('#hc-company-filters');
    var compGrid = root.querySelector('#hc-company-grid');
    var compFilter = 'all';
    function renderCompanies() {
      if (!compGrid) return;
      var list = DATA.companies.filter(function (c) {
        if (compFilter === 'all') return true;
        if (compFilter === 'dvc') return c.status === 'DVC';
        if (compFilter === 'bench') return c.status !== 'DVC';
        return true;
      });
      compGrid.innerHTML = list.map(function (c) {
        return '<button type="button" class="hc-company-card" data-action="company" data-id="' + c.id + '" style="text-align:left">' +
          '<div class="hc-company-name">' + escapeHtml(c.name) + ' ' + (c.status === 'DVC' ? '<span class="hc-badge hc-badge--dvc">DVC</span>' : '<span class="hc-badge hc-badge--bench">Benchmark</span>') + '</div>' +
          '<div class="hc-company-cat">' + escapeHtml(c.category) + '</div>' +
          '<div class="hc-company-line">' + escapeHtml(c.one_liner) + '</div>' +
        '</button>';
      }).join('');
      compGrid.querySelectorAll('.hc-company-card').forEach(function (card) {
        card.addEventListener('click', function () {
          var c = DATA.companies.find(function (x) { return x.id === card.dataset.id; });
          if (!c) return;
          renderInsight(buildCompanyCard(c));
          if (window._hcSelectCompany) window._hcSelectCompany(c.id);
        });
      });
    }
    if (compFilters) {
      compFilters.querySelectorAll('[data-filter]').forEach(function (b) {
        b.addEventListener('click', function () {
          compFilter = b.dataset.filter;
          compFilters.querySelectorAll('[data-filter]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
          renderCompanies();
        });
      });
    }
    renderCompanies();
  });
})();
