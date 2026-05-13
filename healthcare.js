/* =====================================================================
   HEALTHCARE AI — INTERACTIVE MODULES (clean rebuild)
     1) Money River (D3 Sankey) with segmented View toolbar, invisible
        16px flow hit-targets, node + flow drawers, AI/incentive overlays,
        company filter ("All examples" / "DVC only").
     2) Integrated patient loop SVG: care loop, financial loop, prevention
        orbit, VBC bridge, and a literal stacked seven-band stack with
        active step-to-band dependency lines.
   Requires d3 v7 + d3-sankey, window.HEALTHCARE_DATA.
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
  function fmtUSD(b) {
    if (b == null || isNaN(b)) return '';
    if (b >= 1000) return '$' + (b / 1000).toFixed(2).replace(/\.?0+$/, '') + 'T';
    return '$' + Math.round(b).toLocaleString() + 'B';
  }

  ready(function () {
    var root = document.getElementById('sec-healthcare-ai');
    if (!root) return;
    var DATA = window.HEALTHCARE_DATA;
    if (!DATA) return;

    // ===================================================================
    // SHARED TOOLTIP (desktop hover/focus only)
    // ===================================================================
    var isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var tipEl = document.createElement('div');
    tipEl.className = 'hc-tooltip';
    tipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tipEl);
    var tipTimer = null;

    function showTip(html, x, y) {
      if (isCoarsePointer) return;
      if (tipTimer) { clearTimeout(tipTimer); tipTimer = null; }
      tipEl.innerHTML = html;
      tipEl.classList.add('is-visible');
      var pad = 12;
      var w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      var maxX = window.innerWidth - w - pad;
      var maxY = window.innerHeight - h - pad;
      tipEl.style.left = Math.max(pad, Math.min(maxX, x + 14)) + 'px';
      tipEl.style.top  = Math.max(pad, Math.min(maxY, y + 14)) + 'px';
    }
    function hideTip() {
      if (isCoarsePointer) return;
      if (tipTimer) clearTimeout(tipTimer);
      tipTimer = setTimeout(function () { tipEl.classList.remove('is-visible'); }, 80);
    }
    function tipText(title, body) {
      return '<div class="hc-tooltip-title">' + escapeHtml(title) + '</div>' +
             '<div class="hc-tooltip-body">' + escapeHtml(body) + '</div>';
    }

    // ===================================================================
    // STATE
    // ===================================================================
    var state = {
      view: 'money',          // 'money' | 'ai' | 'incentives' | 'companies'
      companyFilter: 'all',   // 'all' | 'dvc'
      selection: null         // { kind, id }  kind in: node, pool, flow, ai, incentive, step, company, stack
    };

    // ===================================================================
    // HEADLINE STATS, SOURCES, TAKEAWAYS
    // ===================================================================
    var statsRow = root.querySelector('#hc-stats-row');
    if (statsRow) {
      statsRow.innerHTML = DATA.headlineStats.map(function (s) {
        return '<div class="hc-stat">' +
                 '<div class="hc-stat-value tabnum">' + escapeHtml(s.value) + '</div>' +
                 '<div class="hc-stat-label">' + escapeHtml(s.label) + '</div>' +
                 (s.sub ? '<div class="hc-stat-sub">' + escapeHtml(s.sub) + '</div>' : '') +
               '</div>';
      }).join('');
    }

    function renderSourceList(elId) {
      var ul = root.querySelector('#' + elId);
      if (!ul) return;
      ul.innerHTML = DATA.sources.map(function (s) {
        return '<li><a href="' + s.url + '" target="_blank" rel="noopener">' + escapeHtml(s.label) + '</a></li>';
      }).join('');
    }
    renderSourceList('hc-sources-list');
    renderSourceList('hc-sources-list-bottom');

    var takeawayWrap = root.querySelector('#hc-takeaways');
    if (takeawayWrap) {
      takeawayWrap.innerHTML = DATA.takeaways.map(function (t) {
        return '<div class="hc-takeaway"><div class="hc-takeaway-h">' + escapeHtml(t.title) + '</div>' +
                 '<div class="hc-takeaway-c">' + escapeHtml(t.copy) + '</div></div>';
      }).join('');
    }

    // ===================================================================
    // MONEY RIVER
    // ===================================================================
    var insightEl  = root.querySelector('#hc-insight');
    var moneySvgEl = root.querySelector('#hc-sankey-svg');
    var fallbackEl = root.querySelector('#hc-fallback');

    // Drawer helpers ----------------------------------------------------
    function setInsight(html) { if (insightEl) insightEl.innerHTML = html; }

    function defaultInsight() {
      setInsight(
        '<div class="hc-insight-empty">' +
          '<p>Click any payment, destination, cost pool, or flow to see what it means and what AI does there.</p>' +
          '<p class="hc-insight-hint">Switch view to <strong>AI opportunities</strong>, <strong>Incentives</strong>, or <strong>Companies</strong> for overlays.</p>' +
        '</div>'
      );
    }

    // Resolve helpers ---------------------------------------------------
    function findNode(id) {
      var p = DATA.paymentChannels.find(function (n) { return n.id === id; });
      if (p) return Object.assign({ layer: 0 }, p);
      var d = DATA.destinations.find(function (n) { return n.id === id; });
      if (d) return Object.assign({ layer: 1 }, d);
      var c = DATA.costPools.find(function (n) { return n.id === id; });
      if (c) return Object.assign({ layer: 2 }, c);
      return null;
    }
    function findCompany(id) { return DATA.companies.find(function (c) { return c.id === id; }); }
    function findAi(id)      { return DATA.aiSurfaces.find(function (a) { return a.id === id; }); }
    function findIncentive(id){ return DATA.incentives.find(function (i) { return i.id === id; }); }
    function findStep(id) {
      return DATA.careLoop.concat(DATA.financialLoop, DATA.preventionOrbit, DATA.vbcBridge)
        .find(function (s) { return s.id === id; });
    }
    function findStackLayer(id) { return DATA.sharedStack.find(function (s) { return s.id === id; }); }
    function findFlow(id) {
      return DATA.moneyLinksAB.concat(DATA.moneyLinksBC).find(function (l) { return l.id === id; });
    }

    function filteredCompanies(arr) {
      if (!arr) return [];
      if (state.companyFilter === 'dvc') return arr.filter(function (c) { return c.group === 'dvc'; });
      return arr;
    }
    // market leaders first, then dvc
    function sortCompanies(arr) {
      return arr.slice().sort(function (a, b) {
        if (a.group === b.group) return 0;
        return a.group === 'leader' ? -1 : 1;
      });
    }

    function companiesForPool(poolId) {
      return DATA.companies.filter(function (c) { return (c.money_pool_ids || []).indexOf(poolId) >= 0; });
    }
    function companiesForDestination(destId) {
      return DATA.companies.filter(function (c) { return (c.destination_ids || []).indexOf(destId) >= 0; });
    }
    function companiesForStep(stepId) {
      return DATA.companies.filter(function (c) { return (c.process_step_ids || []).indexOf(stepId) >= 0; });
    }
    function companiesForAi(aiId) {
      return DATA.companies.filter(function (c) { return (c.ai_surface_ids || []).indexOf(aiId) >= 0; });
    }
    function companiesForStack(stackId) {
      return DATA.companies.filter(function (c) { return (c.stack_ids || []).indexOf(stackId) >= 0; });
    }

    function companyChipHTML(c) {
      var groupLabel = c.tag || (c.group === 'dvc' ? 'DVC portfolio' : 'Market leader');
      var groupTag = '<span class="hc-co-grouptag ' + (c.group === 'dvc' ? 'dvc' : 'leader') + '">' + escapeHtml(groupLabel) + '</span>';
      return '<button type="button" class="hc-co-chip" data-action="company" data-id="' + c.id + '">' +
               '<span class="hc-co-chip-name">' + escapeHtml(c.name) + '</span>' +
               groupTag +
               '<span class="hc-co-chip-desc">' + escapeHtml(c.short_description) + '</span>' +
             '</button>';
    }

    function companyListHTML(list) {
      var cs = sortCompanies(filteredCompanies(list));
      if (!cs.length) return '<p class="hc-empty">No company examples linked here.</p>';
      return '<div class="hc-co-list">' + cs.map(companyChipHTML).join('') + '</div>';
    }

    function compositionRows(rows, totalForShare, totalForTarget, mode) {
      // rows: array of { label, value_b, otherId, why }
      // mode: 'destination' or 'pool' for share label
      return '<table class="hc-comp"><thead><tr>' +
               '<th>' + (mode === 'inbound' ? 'From' : 'To') + '</th>' +
               '<th class="num">$B</th>' +
               '<th class="num">Share</th>' +
             '</tr></thead><tbody>' +
             rows.map(function (r) {
               var sharePct = totalForShare > 0 ? (100 * r.value_b / totalForShare) : 0;
               return '<tr>' +
                        '<td><button type="button" class="hc-link-btn" data-action="' + r.action + '" data-id="' + r.otherId + '">' + escapeHtml(r.label) + '</button></td>' +
                        '<td class="num tabnum">' + Math.round(r.value_b).toLocaleString() + '</td>' +
                        '<td class="num tabnum">' + sharePct.toFixed(0) + '%</td>' +
                      '</tr>';
             }).join('') +
             '</tbody></table>';
    }

    function methodNote() {
      return '<p class="hc-evidence">Modeled allocation constrained to official 2024 CMS NHE node totals. ' +
             '<a href="' + DATA.SRC.nhe + '" target="_blank" rel="noopener">CMS source ↗</a></p>';
    }

    // ===================================================================
    // SANKEY RENDER
    // ===================================================================
    var sankeyGraph = null;
    var d3LinkGSel = null;     // selection over <g class="hc-link-group">
    var d3HitSel   = null;     // selection over invisible hit paths
    var d3NodeSel  = null;
    var overlayG   = null;     // d3 selection of overlay <g>
    var poolPositions = {};    // id -> {x0,x1,y0,y1}

    function renderSankey() {
      var d3 = window.d3;
      var svg = d3.select(moneySvgEl);
      svg.selectAll('*').remove();

      var bbox = moneySvgEl.getBoundingClientRect();
      // Force a wide viewBox so labels on either side never clip.
      // Container is overflow-x:auto so narrower viewports horizontally scroll.
      // Width must fit the longest left payment label (~300px), all 3 columns,
      // and the right pool labels + chip gutter (~260px).
      var width = Math.max(1380, bbox.width || moneySvgEl.parentNode.clientWidth || 1380);
      var height = 720;
      var isMobile = window.innerWidth < 768;
      if (isMobile) { width = Math.max(1420, width); height = 820; }

      svg.attr('viewBox', '0 0 ' + width + ' ' + height);
      svg.attr('preserveAspectRatio', 'xMinYMin meet');

      var defs = svg.append('defs');
      defs.append('marker').attr('id','hc-arrow').attr('viewBox','0 0 10 10').attr('refX',8).attr('refY',5).attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto-start-reverse')
        .append('path').attr('d','M0,0 L10,5 L0,10 z').attr('fill','rgba(232,233,237,0.6)');
      // Diagonal hatch pattern for incentive overlay stripes on nodes.
      var hatch = defs.append('pattern')
        .attr('id', 'hc-inc-hatch')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 8).attr('height', 8)
        .attr('patternTransform', 'rotate(45)');
      hatch.append('rect').attr('width', 8).attr('height', 8).attr('fill', 'rgba(245,197,66,0.10)');
      hatch.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 8)
        .attr('stroke', 'rgba(245,197,66,0.85)').attr('stroke-width', 2);

      var layerA = DATA.paymentChannels.map(function (n) { return Object.assign({}, n, { layer: 0 }); });
      var layerB = DATA.destinations.map(function (n) { return Object.assign({}, n, { layer: 1 }); });
      var poolTotals = {};
      DATA.moneyLinksBC.forEach(function (l) {
        poolTotals[l.target] = (poolTotals[l.target] || 0) + l.value_b;
      });
      var layerC = DATA.costPools
        .filter(function (p) { return (poolTotals[p.id] || 0) > 0; })
        .map(function (p) {
          return Object.assign({}, p, {
            layer: 2,
            value_b: poolTotals[p.id] || 0,
            display: fmtUSD(poolTotals[p.id] || 0)
          });
        });

      var allNodes = layerA.concat(layerB, layerC);
      var allLinks = []
        .concat(DATA.moneyLinksAB.map(function (l) {
          return { id: l.id, source: l.source, target: l.target, value: l.value_b, span: 'AB' };
        }))
        .concat(DATA.moneyLinksBC.map(function (l) {
          return { id: l.id, source: l.source, target: l.target, value: l.value_b, span: 'BC' };
        }));

      // Margins: leave room on the LEFT for payment-channel labels and on
      // the RIGHT for pool labels + overlay chips/badges. Long payment
      // labels (e.g. "Other third-party payers & programs $590.5B") need
      // ~290px to render without clipping at desktop scale.
      var leftMargin  = 300;
      var rightMargin = 260;
      var sankey = d3.sankey()
        .nodeId(function (d) { return d.id; })
        .nodeWidth(16)
        .nodePadding(10)
        .nodeAlign(d3.sankeyJustify || d3.sankeyLeft)
        .extent([[leftMargin, 30], [width - rightMargin, height - 30]]);

      sankeyGraph = sankey({
        nodes: allNodes.map(function (n) { return Object.assign({}, n); }),
        links: allLinks.map(function (l) { return Object.assign({}, l); })
      });

      // Cache pool positions for overlays
      poolPositions = {};
      sankeyGraph.nodes.forEach(function (n) {
        if (n.layer === 2) {
          poolPositions[n.id] = { x0: n.x0, x1: n.x1, y0: n.y0, y1: n.y1 };
        }
      });

      // Role color for payment-channel-rooted links
      function paymentRoleOf(sId) {
        var p = DATA.paymentChannels.find(function (x) { return x.id === sId; });
        return p ? p.role : null;
      }
      function nodeFill(n) {
        if (n.layer === 0) {
          if (n.role === 'oop')     return 'rgba(255, 159, 90, 0.55)';
          if (n.role === 'public')  return 'rgba(96, 144, 200, 0.55)';
          if (n.role === 'private') return 'rgba(96, 184, 200, 0.55)';
          return 'rgba(160, 168, 188, 0.40)';
        }
        if (n.layer === 1) return 'rgba(210, 214, 224, 0.55)';
        return 'rgba(210, 214, 224, 0.32)';
      }
      function linkStroke(l) {
        var sId = (typeof l.source === 'object') ? l.source.id : l.source;
        if (l.span === 'BC') return 'rgba(170, 178, 195, 0.32)';
        var role = paymentRoleOf(sId);
        if (role === 'oop')     return 'rgba(255, 159, 90, 0.40)';
        if (role === 'public')  return 'rgba(96, 144, 200, 0.36)';
        if (role === 'private') return 'rgba(96, 184, 200, 0.36)';
        return 'rgba(170, 178, 195, 0.28)';
      }

      // Visible link layer
      var linkG = svg.append('g').attr('fill', 'none').attr('class', 'hc-links');
      d3LinkGSel = linkG.selectAll('g.hc-link-group')
        .data(sankeyGraph.links).enter().append('g')
        .attr('class', 'hc-link-group')
        .attr('data-id', function (d) { return d.id; });

      d3LinkGSel.append('path')
        .attr('class', 'link link-base')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke', linkStroke)
        .attr('stroke-width', function (d) { return Math.max(1, d.width); });

      // Invisible hit-target layer (above links): 16px min hit area, click anywhere on flow
      var hitG = svg.append('g').attr('class', 'hc-link-hits').attr('fill', 'none');
      d3HitSel = hitG.selectAll('path.hc-hit')
        .data(sankeyGraph.links).enter().append('path')
        .attr('class', 'hc-hit')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke', 'transparent')
        .attr('stroke-width', function (d) { return Math.max(16, d.width); })
        .attr('pointer-events', 'stroke')
        .style('cursor', 'pointer')
        .attr('data-id', function (d) { return d.id; })
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr('aria-label', function (d) {
          var s = sankeyGraph.nodes.find(function (n) { return n.id === d.source.id || n.id === d.source; });
          var t = sankeyGraph.nodes.find(function (n) { return n.id === d.target.id || n.id === d.target; });
          return (s ? s.label : '') + ' to ' + (t ? t.label : '') + ', flow';
        });

      d3HitSel
        .on('mouseenter', function (event, d) {
          var sId = (typeof d.source === 'object') ? d.source.id : d.source;
          var tId = (typeof d.target === 'object') ? d.target.id : d.target;
          var s = findNode(sId), t = findNode(tId);
          showTip(tipText(
            (s ? s.label : '') + ' → ' + (t ? t.label : ''),
            'Modeled $' + Math.round(d.value).toLocaleString() + 'B. Click for detail.'
          ), event.clientX, event.clientY);
          highlightFlow(d.id);
        })
        .on('mousemove', function (event) {
          if (!tipEl.classList.contains('is-visible')) return;
          tipEl.style.left = Math.max(12, event.clientX + 14) + 'px';
          tipEl.style.top  = Math.max(12, event.clientY + 14) + 'px';
        })
        .on('mouseleave', function () { hideTip(); if (!state.selection || state.selection.kind !== 'flow') clearHighlight(); })
        .on('click', function (event, d) {
          event.stopPropagation();
          selectFlow(d.id);
        })
        .on('keydown', function (event, d) {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectFlow(d.id); }
        });

      // Nodes
      var nodeG = svg.append('g').attr('class', 'hc-nodes');
      d3NodeSel = nodeG.selectAll('g.node')
        .data(sankeyGraph.nodes).enter().append('g')
        .attr('class', function (d) { return 'node node-l' + d.layer; })
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr('aria-label', function (d) { return d.label + ', ' + (d.display || ''); })
        .attr('data-id', function (d) { return d.id; });

      d3NodeSel.append('rect')
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('height', function (d) { return Math.max(2, d.y1 - d.y0); })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('fill', nodeFill);

      d3NodeSel.append('text')
        .attr('class', 'node-label')
        .attr('x', function (d) {
          if (d.layer === 0) return d.x0 - 8;   // payment labels OUTSIDE on the left
          if (d.layer === 2) return d.x1 + 8;   // pool labels OUTSIDE on the right
          return d.x0 - 8;                       // destination labels to the left (anchored end)
        })
        .attr('y', function (d) { return (d.y0 + d.y1) / 2; })
        .attr('dy', '0.35em')
        .attr('text-anchor', function (d) { return d.layer === 2 ? 'start' : 'end'; })
        .each(function (d) {
          var t = d3.select(this);
          t.append('tspan').text(d.label);
          if (d.display) t.append('tspan').attr('class', 'val').attr('dx', '0.4em').text(d.display);
        });

      d3NodeSel
        .on('mouseenter', function (event, d) {
          var tt = d.tooltip_id && DATA.tooltips[d.tooltip_id];
          if (tt) showTip(tipText(tt.title, tt.body), event.clientX, event.clientY);
          else showTip(tipText(d.label, d.description || ''), event.clientX, event.clientY);
        })
        .on('mouseleave', hideTip)
        .on('click', function (event, d) { event.stopPropagation(); selectNode(d.id); })
        .on('keydown', function (event, d) {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectNode(d.id); }
        });

      // Overlay layer (AI/incentive chips + company badges)
      overlayG = svg.append('g').attr('class', 'hc-overlay-layer');
      buildAiOverlay();
      buildIncentiveOverlay();
      buildCompanyOverlay();
      refreshOverlayVisibility();
      reflectViewClass();
    } // renderSankey

    function reflectViewClass() {
      if (!moneySvgEl) return;
      moneySvgEl.classList.remove('view-money','view-ai','view-incentives','view-companies');
      moneySvgEl.classList.add('view-' + state.view);
    }

    // ----- Overlays -----------------------------------------------------
    // Each mode renders a structurally different overlay so that AI,
    // Incentives, and Companies are visually distinct on the same chart.
    //
    //   AI:         teal flow halos on AI-relevant BC links + teal pool
    //               rings + teal chips on the right gutter
    //   Incentives: amber HATCHED stripe drawn on top of each anchored
    //               node (no flow halos), plus amber chips above the node
    //   Companies:  on-chart badge clusters next to each pool with the
    //               company initials visible; DVC vs leader tinting

    function poolLabelGap() { return 130; } // approx pool label width
    function poolOverlayX(p) {
      // Place pool-side overlays just past the right edge of the pool
      // label. The pool label is text-anchor:start at d.x1+8.
      return p.x1 + 8 + poolLabelGap();
    }

    function buildAiOverlay() {
      var grp = overlayG.append('g').attr('class', 'hc-ai-grp');

      // 1. Teal flow halos on BC flows whose target pool has any AI surface.
      var aiPools = {};
      DATA.aiSurfaces.forEach(function (a) {
        (a.attach_pools || []).forEach(function (pId) { aiPools[pId] = true; });
      });
      var d3 = window.d3;
      sankeyGraph.links.forEach(function (l) {
        if (l.span !== 'BC') return;
        var tId = (typeof l.target === 'object') ? l.target.id : l.target;
        if (!aiPools[tId]) return;
        grp.append('path')
          .attr('class', 'hc-ai-flow-halo')
          .attr('d', d3.sankeyLinkHorizontal()(l))
          .attr('fill', 'none')
          .attr('stroke', 'rgba(78,205,196,0.55)')
          .attr('stroke-width', Math.max(2, l.width))
          .attr('pointer-events', 'none');
      });

      // 2. Teal node rings on AI-relevant pool nodes.
      Object.keys(aiPools).forEach(function (pId) {
        var p = poolPositions[pId];
        if (!p) return;
        grp.append('rect')
          .attr('class', 'hc-ai-node-ring')
          .attr('x', p.x0 - 3).attr('y', p.y0 - 3)
          .attr('width', (p.x1 - p.x0) + 6)
          .attr('height', (p.y1 - p.y0) + 6)
          .attr('rx', 3)
          .attr('fill', 'none')
          .attr('stroke', 'rgba(78,205,196,0.85)')
          .attr('stroke-width', 1.5)
          .attr('pointer-events', 'none');
      });

      // 3. Teal AI opportunity chips on the right gutter, anchored to pool y.
      var byPool = {};
      DATA.aiSurfaces.forEach(function (a) {
        (a.attach_pools || []).forEach(function (pId) {
          (byPool[pId] = byPool[pId] || []).push(a);
        });
      });
      Object.keys(byPool).forEach(function (pId) {
        var p = poolPositions[pId];
        if (!p) return;
        var list = byPool[pId].slice(0, 3);
        var bandH = 18, gap = 3;
        var totalH = list.length * bandH + (list.length - 1) * gap;
        var startY = (p.y0 + p.y1) / 2 - totalH / 2;
        var gutterX = poolOverlayX(p);
        // connector tick from pool label to chip stack
        grp.append('line')
          .attr('class', 'hc-overlay-tick hc-ai-tick')
          .attr('x1', p.x1 + 4).attr('y1', (p.y0 + p.y1) / 2)
          .attr('x2', gutterX - 2).attr('y2', (p.y0 + p.y1) / 2)
          .attr('stroke', 'rgba(78,205,196,0.5)').attr('stroke-width', 1)
          .attr('stroke-dasharray', '2 2')
          .attr('pointer-events', 'none');
        list.forEach(function (a, i) {
          var w = Math.max(110, a.label.length * 6.4 + 14);
          var x = gutterX;
          var y = startY + i * (bandH + gap);
          var g = grp.append('g')
            .attr('class', 'hc-ai-chip')
            .attr('data-ai', a.id)
            .attr('tabindex', 0)
            .attr('role', 'button')
            .attr('aria-label', a.label + ' — AI opportunity')
            .attr('transform', 'translate(' + x + ',' + y + ')');
          g.append('rect').attr('width', w).attr('height', bandH).attr('rx', 9);
          g.append('text').attr('x', w / 2).attr('y', bandH / 2 + 3.5).attr('text-anchor', 'middle').text(a.label);
          g.on('mouseenter', function (ev) { showTip(tipText(a.label + ' — AI opportunity', a.what), ev.clientX, ev.clientY); })
           .on('mouseleave', hideTip)
           .on('click', function (ev) { ev.stopPropagation(); selectAi(a.id); })
           .on('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectAi(a.id); } });
        });
      });
    }

    function buildIncentiveOverlay() {
      // Group all incentive content under a single mode group so we can
      // toggle the whole layer at once.
      var grp = overlayG.append('g').attr('class', 'hc-inc-grp');

      // For each incentive, render a hatched amber STRIPE across the
      // affected node (so the constraint is visibly attached to the node)
      // plus a chip above the node.
      DATA.incentives.forEach(function (inc) {
        var anchors = [];
        (inc.attach_nodes || []).forEach(function (id) { anchors.push({ id: id, kind: 'node' }); });
        (inc.attach_pools || []).forEach(function (id) { anchors.push({ id: id, kind: 'pool' }); });
        anchors.forEach(function (a) {
          var nodeRect = null;
          if (a.kind === 'pool' && poolPositions[a.id]) {
            nodeRect = poolPositions[a.id];
          } else if (sankeyGraph) {
            var n = sankeyGraph.nodes.find(function (x) { return x.id === a.id; });
            if (n) nodeRect = { x0: n.x0, x1: n.x1, y0: n.y0, y1: n.y1 };
          }
          if (!nodeRect) return;

          // Stripe overlay on top of the node.
          grp.append('rect')
            .attr('class', 'hc-inc-node-stripe')
            .attr('data-inc', inc.id)
            .attr('data-anchor', a.id)
            .attr('x', nodeRect.x0 - 2)
            .attr('y', nodeRect.y0)
            .attr('width', (nodeRect.x1 - nodeRect.x0) + 4)
            .attr('height', nodeRect.y1 - nodeRect.y0)
            .attr('fill', 'url(#hc-inc-hatch)')
            .attr('stroke', 'rgba(245,197,66,0.85)')
            .attr('stroke-width', 1)
            .attr('pointer-events', 'none');
        });

        // Single chip per incentive — anchor to first anchor's position.
        var first = anchors.find(function (a) {
          if (a.kind === 'pool') return !!poolPositions[a.id];
          return sankeyGraph && sankeyGraph.nodes.find(function (x) { return x.id === a.id; });
        });
        if (!first) return;
        var firstRect;
        if (first.kind === 'pool') firstRect = poolPositions[first.id];
        else firstRect = sankeyGraph.nodes.find(function (x) { return x.id === first.id; });
        var cx = (firstRect.x0 + firstRect.x1) / 2;
        var w = Math.max(120, inc.label.length * 6.4 + 18);
        var h = 18;
        var x = cx - w / 2;
        var svgBBox = moneySvgEl.viewBox.baseVal;
        var vbW = svgBBox && svgBBox.width ? svgBBox.width : 1280;
        if (x < 4) x = 4;
        if (x + w > vbW - 4) x = vbW - 4 - w;
        var y = firstRect.y0 - h - 6;
        if (y < 4) y = 4;
        var g = grp.append('g')
          .attr('class', 'hc-inc-chip')
          .attr('data-inc', inc.id)
          .attr('tabindex', 0)
          .attr('role', 'button')
          .attr('aria-label', inc.label + ' — incentive')
          .attr('transform', 'translate(' + x + ',' + y + ')');
        g.append('rect').attr('width', w).attr('height', h).attr('rx', 9);
        g.append('text').attr('x', w / 2).attr('y', h / 2 + 3.5).attr('text-anchor', 'middle').text(inc.label);
        g.on('mouseenter', function (ev) { showTip(tipText(inc.label + ' — incentive', inc.message), ev.clientX, ev.clientY); })
         .on('mouseleave', hideTip)
         .on('click', function (ev) { ev.stopPropagation(); selectIncentive(inc.id); })
         .on('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectIncentive(inc.id); } });
      });
    }

    function buildCompanyOverlay() {
      // ON-CHART badge clusters: place a tight cluster of company badges
      // LEFT of each pool node so they sit in the central, always-visible
      // BC-flow area of the chart canvas (the previous build placed them
      // in the far-right gutter beyond the visible scroll region on
      // common desktop widths).
      var grp = overlayG.append('g').attr('class', 'hc-co-grp');

      function shortName(name) {
        // Keep the chip readable: short labels render the full name;
        // longer ones are truncated to 12 chars + ellipsis. The full name
        // is still on the tooltip + aria-label.
        var t = name.replace(/\s*\+\s*/g, '+').trim();
        return t.length > 12 ? t.slice(0, 11) + '…' : t;
      }

      // 1. Purple ring on pool nodes that have any companies.
      var byPool = {};
      DATA.companies.forEach(function (c) {
        (c.money_pool_ids || []).forEach(function (pId) {
          (byPool[pId] = byPool[pId] || []).push(c);
        });
      });
      Object.keys(byPool).forEach(function (pId) {
        var p = poolPositions[pId];
        if (!p) return;
        grp.append('rect')
          .attr('class', 'hc-co-node-ring')
          .attr('data-pool', pId)
          .attr('x', p.x0 - 3).attr('y', p.y0 - 3)
          .attr('width', (p.x1 - p.x0) + 6)
          .attr('height', (p.y1 - p.y0) + 6)
          .attr('rx', 3)
          .attr('fill', 'none')
          .attr('stroke', 'rgba(124,77,255,0.85)')
          .attr('stroke-width', 2)
          .attr('pointer-events', 'none');
      });

      // 2. Badge cluster anchored to the LEFT of each pool node so the
      // cluster sits inside the BC-flow region (visible on the chart
      // canvas, not a right gutter that scrolls off-screen at desktop
      // widths). Uses 1 or 2 columns depending on count.
      var pillW = 90, pillH = 18, gapX = 4, gapY = 3;
      var clusterRightInset = 8;          // gap between cluster and pool
      var vbBox = moneySvgEl.viewBox.baseVal;
      var vbHeight = (vbBox && vbBox.height) ? vbBox.height : 720;
      var maxBadgesPerPool = 8;           // hard cap, more accessible via drawer
      Object.keys(byPool).forEach(function (pId) {
        var p = poolPositions[pId]; if (!p) return;
        var fullList = sortCompanies(byPool[pId]); // DVC-first sort respected
        var list = fullList.slice(0, maxBadgesPerPool);
        var overflow = fullList.length - list.length;
        var midY = (p.y0 + p.y1) / 2;
        var poolGrp = grp.append('g').attr('class', 'hc-co-pool').attr('data-pool', pId);

        // 1 column up to 4 entries; 2 columns when > 4.
        var cols = list.length > 4 ? 2 : 1;
        var rows = Math.ceil(list.length / cols);
        var clusterW = cols * pillW + (cols - 1) * gapX;
        var clusterH = rows * pillH + (rows - 1) * gapY;
        var startX = p.x0 - clusterRightInset - clusterW;
        var startY = midY - clusterH / 2;
        // Clamp Y so the cluster stays inside the SVG viewBox.
        if (startY < 4) startY = 4;
        if (startY + clusterH > vbHeight - 4) startY = vbHeight - 4 - clusterH;

        list.forEach(function (c, i) {
          var col = i % cols;
          var row = Math.floor(i / cols);
          var x = startX + col * (pillW + gapX);
          var y = startY + row * (pillH + gapY);
          var g = poolGrp.append('g')
            .attr('class', 'hc-co-badge')
            .attr('data-company', c.id)
            .attr('data-group', c.group)
            .attr('tabindex', 0)
            .attr('role', 'button')
            .attr('aria-label', c.name + ' (' + (c.group === 'dvc' ? 'DVC portfolio' : 'market leader') + ')')
            .attr('transform', 'translate(' + x + ',' + y + ')');
          g.append('rect').attr('width', pillW).attr('height', pillH).attr('rx', 4);
          g.append('text').attr('x', pillW / 2).attr('y', pillH / 2 + 3.5)
            .attr('text-anchor', 'middle').text(shortName(c.name));
          g.on('mouseenter', function (ev) { showTip(tipText(c.name, c.short_description), ev.clientX, ev.clientY); })
           .on('mouseleave', hideTip)
           .on('click', function (ev) { ev.stopPropagation(); selectCompany(c.id); })
           .on('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectCompany(c.id); } });
        });

        // "+N more" indicator beneath the cluster (clicks the pool node
        // drawer which lists ALL companies for this pool).
        if (overflow > 0) {
          var moreY = startY + clusterH + gapY + 2;
          if (moreY + pillH > vbHeight - 4) moreY = vbHeight - 4 - pillH;
          var moreG = poolGrp.append('g')
            .attr('class', 'hc-co-badge hc-co-more')
            .attr('data-pool', pId)
            .attr('tabindex', 0)
            .attr('role', 'button')
            .attr('aria-label', overflow + ' more companies in ' + pId)
            .attr('transform', 'translate(' + startX + ',' + moreY + ')');
          moreG.append('rect').attr('width', cols === 2 ? clusterW : pillW).attr('height', pillH).attr('rx', 4);
          moreG.append('text').attr('x', (cols === 2 ? clusterW : pillW) / 2).attr('y', pillH / 2 + 3.5)
            .attr('text-anchor', 'middle').text('+ ' + overflow + ' more');
          moreG.on('click', function (ev) { ev.stopPropagation(); selectNode(pId); })
            .on('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectNode(pId); } });
        }
      });
    }

    function refreshOverlayVisibility() {
      if (!overlayG) return;
      var showAi  = state.view === 'ai';
      var showInc = state.view === 'incentives';
      var showCo  = state.view === 'companies';
      overlayG.select('.hc-ai-grp').style('display', showAi ? null : 'none');
      overlayG.select('.hc-inc-grp').style('display', showInc ? null : 'none');
      overlayG.select('.hc-co-grp').style('display', showCo ? null : 'none');
      // DVC filter — hide non-DVC badges and the corresponding pool ring is
      // unaffected (pool may still host DVC companies).
      overlayG.selectAll('.hc-co-badge').style('display', function () {
        if (!showCo) return 'none';
        if (state.companyFilter === 'dvc' && this.getAttribute('data-group') !== 'dvc') return 'none';
        return null;
      });
      reflectViewClass();
    }

    // ----- Highlight ----------------------------------------------------
    function clearHighlight() {
      if (!d3LinkGSel) return;
      d3LinkGSel.classed('is-dim', false).classed('is-hi', false);
      d3NodeSel.classed('is-dim', false).classed('is-hi', false);
    }
    function highlightFlow(flowId) {
      if (!d3LinkGSel) return;
      d3LinkGSel.classed('is-hi', function (d) { return d.id === flowId; });
      d3LinkGSel.classed('is-dim', function (d) { return d.id !== flowId; });
      var f = findFlow(flowId);
      if (!f) return;
      var hit = {}; hit[f.source] = true; hit[f.target] = true;
      d3NodeSel.classed('is-hi', function (n) { return !!hit[n.id]; });
      d3NodeSel.classed('is-dim', function (n) { return !hit[n.id]; });
    }
    function highlightNode(nodeId) {
      if (!d3LinkGSel) return;
      d3LinkGSel.classed('is-hi', function (d) {
        var s = typeof d.source === 'object' ? d.source.id : d.source;
        var t = typeof d.target === 'object' ? d.target.id : d.target;
        return s === nodeId || t === nodeId;
      });
      d3LinkGSel.classed('is-dim', function (d) {
        var s = typeof d.source === 'object' ? d.source.id : d.source;
        var t = typeof d.target === 'object' ? d.target.id : d.target;
        return s !== nodeId && t !== nodeId;
      });
      var rel = {}; rel[nodeId] = true;
      DATA.moneyLinksAB.concat(DATA.moneyLinksBC).forEach(function (l) {
        if (l.source === nodeId) rel[l.target] = true;
        if (l.target === nodeId) rel[l.source] = true;
      });
      d3NodeSel.classed('is-hi', function (n) { return !!rel[n.id]; });
      d3NodeSel.classed('is-dim', function (n) { return !rel[n.id]; });
    }

    // ===================================================================
    // SELECTIONS / DRAWER
    // ===================================================================
    function setSelection(sel) {
      var same = state.selection && sel && state.selection.kind === sel.kind && state.selection.id === sel.id;
      if (same) { clearSelection(); return false; }
      state.selection = sel;
      reflectResetButton();
      updateLoopForSelection();
      return true;
    }
    function clearSelection() {
      state.selection = null;
      clearHighlight();
      defaultInsight();
      closeSheet();
      reflectResetButton();
      updateLoopForSelection();
    }
    function reflectResetButton() {
      var btn = root.querySelector('#hc-reset');
      if (!btn) return;
      if (state.selection) btn.removeAttribute('hidden');
      else btn.setAttribute('hidden', '');
    }

    function selectNode(id) {
      var n = findNode(id);
      if (!n) return;
      var kind = n.layer === 0 ? 'node' : n.layer === 1 ? 'node' : 'pool';
      if (!setSelection({ kind: kind, id: id })) return;
      highlightNode(id);
      renderNodeDrawer(n);
    }

    function selectFlow(id) {
      var f = findFlow(id);
      if (!f) return;
      if (!setSelection({ kind: 'flow', id: id })) return;
      highlightFlow(id);
      renderFlowDrawer(f);
    }

    function selectAi(id) {
      if (!setSelection({ kind: 'ai', id: id })) return;
      clearHighlight();
      var a = findAi(id);
      if (!a) return;
      // soft-highlight pools this AI surface attaches to
      var pools = a.attach_pools || [];
      d3NodeSel.classed('is-hi', function (n) { return pools.indexOf(n.id) >= 0; });
      d3NodeSel.classed('is-dim', function (n) { return n.layer === 2 && pools.indexOf(n.id) < 0; });
      renderAiDrawer(a);
    }

    function selectIncentive(id) {
      if (!setSelection({ kind: 'incentive', id: id })) return;
      clearHighlight();
      renderIncentiveDrawer(findIncentive(id));
    }

    function selectCompany(id) {
      if (!setSelection({ kind: 'company', id: id })) return;
      clearHighlight();
      var c = findCompany(id);
      if (!c) return;
      // Ring related nodes only — never color money flows by portfolio status.
      var hit = {};
      (c.money_pool_ids || []).forEach(function (x) { hit[x] = true; });
      (c.destination_ids || []).forEach(function (x) { hit[x] = true; });
      if (d3NodeSel) {
        d3NodeSel.classed('is-hi', function (n) { return !!hit[n.id]; });
      }
      renderCompanyDrawer(c);
    }

    function selectStep(stepId) {
      if (!setSelection({ kind: 'step', id: stepId })) return;
      clearHighlight();
      renderStepDrawer(findStep(stepId));
    }

    function selectStackLayer(stackId) {
      if (!setSelection({ kind: 'stack', id: stackId })) return;
      clearHighlight();
      renderStackDrawer(findStackLayer(stackId));
    }

    // ----- Drawer renderers --------------------------------------------
    function nodeBlurb(n) {
      if (!n) return '';
      var tt = n.tooltip_id && DATA.tooltips[n.tooltip_id];
      return tt ? tt.body : (n.description || '');
    }

    function renderNodeDrawer(n) {
      var kind = n.layer === 0 ? 'Payment channel' : n.layer === 1 ? 'Destination' : 'Cost pool';
      var html = '<div class="hc-drawer">' +
        '<div class="hc-drawer-kind">' + kind + '</div>' +
        '<div class="hc-drawer-title">' + escapeHtml(n.label) + '</div>' +
        '<div class="hc-drawer-value tabnum">' + escapeHtml(n.display || fmtUSD(n.value_b)) + '</div>' +
        '<p>' + escapeHtml(nodeBlurb(n)) + '</p>';

      if (n.layer === 0) {
        // Payment: composition of where it goes (top destinations)
        var rows = DATA.moneyLinksAB
          .filter(function (l) { return l.source === n.id; })
          .map(function (l) {
            var d = findNode(l.target);
            return { label: d ? d.label : l.target, otherId: l.target, value_b: l.value_b, action: 'node' };
          })
          .sort(function (a, b) { return b.value_b - a.value_b; });
        if (rows.length) html += '<h5>Top destinations</h5>' + compositionRows(rows, n.value_b, n.value_b, 'outbound');
        html += '<p class="hc-aside">AI here often becomes a payer–provider arms race: documentation, coding, prior auth, claims review, and navigation.</p>';
      } else if (n.layer === 1) {
        // Destination: inbound + outbound
        var inbound = DATA.moneyLinksAB
          .filter(function (l) { return l.target === n.id; })
          .map(function (l) {
            var p = findNode(l.source);
            return { label: p ? p.label : l.source, otherId: l.source, value_b: l.value_b, action: 'node' };
          })
          .sort(function (a, b) { return b.value_b - a.value_b; });
        var outbound = DATA.moneyLinksBC
          .filter(function (l) { return l.source === n.id; })
          .map(function (l) {
            var p = findNode(l.target);
            return { label: p ? p.label : l.target, otherId: l.target, value_b: l.value_b, action: 'pool' };
          })
          .sort(function (a, b) { return b.value_b - a.value_b; });
        if (inbound.length)  html += '<h5>Who pays in</h5>' + compositionRows(inbound, n.value_b, n.value_b, 'inbound');
        if (outbound.length) html += '<h5>What the dollars fund</h5>' + compositionRows(outbound, n.value_b, n.value_b, 'outbound');
        // AI entry points
        var surfaces = aiSurfacesForDestination(n.id);
        if (surfaces.length) {
          html += '<h5>AI entry points</h5><div class="hc-pill-row">' +
                  surfaces.map(function (a) {
                    return '<button type="button" class="hc-pill" data-action="ai" data-id="' + a.id + '">' + escapeHtml(a.label) + '</button>';
                  }).join('') + '</div>';
        }
        // Company examples
        var companies = companiesForDestination(n.id);
        html += '<h5>Who is building here</h5>' + companyListHTML(companies);
      } else {
        // Cost pool: inbound from destinations
        var feeders = DATA.moneyLinksBC
          .filter(function (l) { return l.target === n.id; })
          .map(function (l) {
            var d = findNode(l.source);
            return { label: d ? d.label : l.source, otherId: l.source, value_b: l.value_b, action: 'node' };
          })
          .sort(function (a, b) { return b.value_b - a.value_b; });
        var total = feeders.reduce(function (s, r) { return s + r.value_b; }, 0);
        if (feeders.length) html += '<h5>Destinations funding this pool</h5>' + compositionRows(feeders, total, total, 'inbound');
        var aiHere = DATA.aiSurfaces.filter(function (a) { return (a.attach_pools || []).indexOf(n.id) >= 0; });
        if (aiHere.length) {
          html += '<h5>AI opportunities here</h5><div class="hc-pill-row">' +
                  aiHere.map(function (a) {
                    return '<button type="button" class="hc-pill" data-action="ai" data-id="' + a.id + '">' + escapeHtml(a.label) + '</button>';
                  }).join('') + '</div>';
        }
        var poolCos = companiesForPool(n.id);
        html += '<h5>Who is building here</h5>' + companyListHTML(poolCos);
      }

      html += methodNote();
      html += '</div>';
      setInsight(html);
      maybeOpenSheet(html);
    }

    function aiSurfacesForDestination(destId) {
      var pools = DATA.moneyLinksBC.filter(function (l) { return l.source === destId; }).map(function (l) { return l.target; });
      var seen = {}, out = [];
      DATA.aiSurfaces.forEach(function (a) {
        if ((a.attach_pools || []).some(function (p) { return pools.indexOf(p) >= 0; })) {
          if (!seen[a.id]) { seen[a.id] = true; out.push(a); }
        }
      });
      return out;
    }

    function renderFlowDrawer(f) {
      var s = findNode(f.source), t = findNode(f.target);
      // Compute source/target shares
      var srcTotal = s ? s.value_b : 0;
      var tgtTotal = t ? t.value_b : 0;
      if (!srcTotal) {
        srcTotal = DATA.moneyLinksAB.concat(DATA.moneyLinksBC)
          .filter(function (l) { return l.source === f.source; })
          .reduce(function (a, l) { return a + l.value_b; }, 0);
      }
      if (!tgtTotal) {
        tgtTotal = DATA.moneyLinksAB.concat(DATA.moneyLinksBC)
          .filter(function (l) { return l.target === f.target; })
          .reduce(function (a, l) { return a + l.value_b; }, 0);
      }
      var srcShare = srcTotal > 0 ? Math.round(100 * f.value_b / srcTotal) : null;
      var tgtShare = tgtTotal > 0 ? Math.round(100 * f.value_b / tgtTotal) : null;

      // AI surfaces / companies relevant to the target node
      var relevantAi = [];
      if (t && t.id) {
        if (DATA.costPools.find(function (p) { return p.id === t.id; })) {
          relevantAi = DATA.aiSurfaces.filter(function (a) { return (a.attach_pools || []).indexOf(t.id) >= 0; });
        } else {
          relevantAi = aiSurfacesForDestination(t.id);
        }
      }
      var relevantCos = [];
      if (t) {
        if (DATA.costPools.find(function (p) { return p.id === t.id; })) relevantCos = companiesForPool(t.id);
        else relevantCos = companiesForDestination(t.id);
      }

      var why = whyFlowMatters(f);

      var html = '<div class="hc-drawer">' +
        '<div class="hc-drawer-kind">Flow</div>' +
        '<div class="hc-drawer-title">' + escapeHtml(s ? s.label : f.source) + ' → ' + escapeHtml(t ? t.label : f.target) + '</div>' +
        '<div class="hc-drawer-value tabnum">' + fmtUSD(f.value_b) + ' modeled</div>' +
        '<div class="hc-flow-shares">' +
          (srcShare != null ? '<span><strong class="tabnum">' + srcShare + '%</strong> of ' + escapeHtml(s ? s.label : '') + '</span>' : '') +
          (tgtShare != null ? '<span><strong class="tabnum">' + tgtShare + '%</strong> of ' + escapeHtml(t ? t.label : '') + '</span>' : '') +
        '</div>' +
        (why ? '<p>' + escapeHtml(why) + '</p>' : '') +
        (relevantAi.length
          ? '<h5>AI opportunities</h5><div class="hc-pill-row">' +
            relevantAi.map(function (a) {
              return '<button type="button" class="hc-pill" data-action="ai" data-id="' + a.id + '">' + escapeHtml(a.label) + '</button>';
            }).join('') + '</div>'
          : '') +
        (relevantCos.length ? '<h5>Who is building here</h5>' + companyListHTML(relevantCos) : '') +
        methodNote() +
        '</div>';
      setInsight(html);
      maybeOpenSheet(html);
    }

    function whyFlowMatters(f) {
      var sId = f.source, tId = f.target;
      if (tId === 'pool_clinical_labor') return 'This is where scribes, clinical copilots, staffing, throughput, and care-team automation attach.';
      if (tId === 'pool_provider_admin') return 'Near-term AI ROI for providers: documentation, coding, billing, prior auth, and patient billing. Note the visible CMS admin line is ~$371B but the broader provider+payer admin drag is ~$800-900B (Commonwealth Fund / JAMA).';
      if (tId === 'pool_payer_admin')    return 'Payer-side ops: claims, utilization management, fraud, and customer service. Often defensive AI against provider automation. The CMS admin line is the visible piece; addressable admin drag is broader.';
      if (tId === 'pool_drugs_biologics')return 'Therapeutic value. AI moves upstream into discovery, trial design, precision medicine, and adherence.';
      if (tId === 'pool_supplies_devices') return 'Diagnostics, imaging, wearables, and devices. AI enters via signal interpretation and monitoring.';
      if (tId === 'pool_it_data')        return 'Small in dollars, huge in control: EHRs, interoperability, security, and the AI deployment substrate.';
      if (tId === 'pool_pharma_channel') return 'PBM, wholesale, and pharmacy economics — where rebates, formularies, and access decisions sit.';
      if (sId === 'pay_out_of_pocket')   return 'Out-of-pocket spending is the channel where consumer AI, wellness, labs, and CGMs scale without waiting for reimbursement.';
      return '';
    }

    function renderAiDrawer(a) {
      // No TAM/opportunity dollars in AI surface drawers
      var pools = (a.attach_pools || []).map(function (id) { return DATA.costPools.find(function (p) { return p.id === id; }); }).filter(Boolean);
      var steps = (a.attach_steps || []).map(function (id) { return findStep(id); }).filter(Boolean);
      var cos = companiesForAi(a.id);

      var html = '<div class="hc-drawer">' +
        '<div class="hc-drawer-kind">AI opportunity</div>' +
        '<div class="hc-drawer-title">' + escapeHtml(a.label) + '</div>' +
        '<p>' + escapeHtml(a.what) + '</p>' +
        (pools.length
          ? '<h5>Cost pools it touches</h5><div class="hc-pill-row">' +
            pools.map(function (p) { return '<button type="button" class="hc-pill" data-action="pool" data-id="' + p.id + '">' + escapeHtml(p.label) + '</button>'; }).join('') +
            '</div>'
          : '') +
        (steps.length
          ? '<h5>Patient/financial loop steps it touches</h5><div class="hc-pill-row">' +
            steps.map(function (s) { return '<button type="button" class="hc-pill" data-action="step" data-id="' + s.id + '">' + escapeHtml(s.id + ' · ' + s.label) + '</button>'; }).join('') +
            '</div>'
          : '') +
        (a.buyer ? '<p><strong>Likely buyer:</strong> ' + escapeHtml(a.buyer) + '</p>' : '') +
        (a.adoption ? '<p><strong>Why adoption is easy or hard:</strong> ' + escapeHtml(a.adoption) + '</p>' : '') +
        (cos.length ? '<h5>Who is building here</h5>' + companyListHTML(cos) : '') +
        '<p class="hc-evidence">AI overlay describes placement and mechanism, not market sizing.</p>' +
        '</div>';
      setInsight(html);
      maybeOpenSheet(html);
    }

    function renderIncentiveDrawer(inc) {
      if (!inc) return;
      var pools = (inc.attach_pools || []).map(function (id) { return DATA.costPools.find(function (p) { return p.id === id; }); }).filter(Boolean);
      var nodes = (inc.attach_nodes || []).map(findNode).filter(Boolean);
      var html = '<div class="hc-drawer">' +
        '<div class="hc-drawer-kind">Incentive</div>' +
        '<div class="hc-drawer-title">' + escapeHtml(inc.label) + '</div>' +
        '<p>' + escapeHtml(inc.message) + '</p>' +
        (pools.length
          ? '<h5>Where this attaches</h5><div class="hc-pill-row">' +
            pools.map(function (p) { return '<button type="button" class="hc-pill" data-action="pool" data-id="' + p.id + '">' + escapeHtml(p.label) + '</button>'; }).join('') +
            '</div>'
          : '') +
        (nodes.length
          ? '<div class="hc-pill-row">' +
            nodes.map(function (n) { return '<button type="button" class="hc-pill" data-action="node" data-id="' + n.id + '">' + escapeHtml(n.label) + '</button>'; }).join('') +
            '</div>'
          : '') +
        '<p class="hc-evidence">Incentives explain forces that shape whether AI creates savings, revenue, or more complexity.</p>' +
        '</div>';
      setInsight(html);
      maybeOpenSheet(html);
    }

    function renderCompanyDrawer(c) {
      if (!c) return;
      var groupLabel = c.tag || (c.group === 'dvc' ? 'DVC portfolio' : 'Market leader / benchmark');
      var groupTag = '<span class="hc-co-grouptag ' + (c.group === 'dvc' ? 'dvc' : 'leader') + '">' + escapeHtml(groupLabel) + '</span>';
      var pools = (c.money_pool_ids || []).map(function (id) { return DATA.costPools.find(function (p) { return p.id === id; }); }).filter(Boolean);
      var steps = (c.process_step_ids || []).map(findStep).filter(Boolean);
      var ais = (c.ai_surface_ids || []).map(findAi).filter(Boolean);
      var html = '<div class="hc-drawer">' +
        '<div class="hc-drawer-kind">Company</div>' +
        '<div class="hc-drawer-title">' + escapeHtml(c.name) + ' ' + groupTag + '</div>' +
        '<p>' + escapeHtml(c.short_description) + '</p>' +
        (c.buyer_user ? '<p><strong>Buyer/user:</strong> ' + escapeHtml(c.buyer_user) + '</p>' : '') +
        (c.value_capture ? '<p><strong>Value capture:</strong> ' + escapeHtml(c.value_capture) + '</p>' : '') +
        (pools.length
          ? '<h5>Money placement</h5><div class="hc-pill-row">' +
            pools.map(function (p) { return '<button type="button" class="hc-pill" data-action="pool" data-id="' + p.id + '">' + escapeHtml(p.label) + '</button>'; }).join('') +
            '</div>' : '') +
        (steps.length
          ? '<h5>Process placement</h5><div class="hc-pill-row">' +
            steps.map(function (s) { return '<button type="button" class="hc-pill" data-action="step" data-id="' + s.id + '">' + escapeHtml(s.id + ' · ' + s.label) + '</button>'; }).join('') +
            '</div>' : '') +
        (ais.length
          ? '<h5>AI opportunities</h5><div class="hc-pill-row">' +
            ais.map(function (a) { return '<button type="button" class="hc-pill" data-action="ai" data-id="' + a.id + '">' + escapeHtml(a.label) + '</button>'; }).join('') +
            '</div>' : '') +
        '<p class="hc-evidence">Company examples are illustrative. See company sites for current claims.</p>' +
        '</div>';
      setInsight(html);
      maybeOpenSheet(html);
    }

    function renderStepDrawer(s) {
      if (!s) return;
      var kind = DATA.careLoop.indexOf(s) >= 0 ? 'Care loop'
              : DATA.financialLoop.indexOf(s) >= 0 ? 'Financial loop'
              : DATA.preventionOrbit.indexOf(s) >= 0 ? 'Prevention orbit'
              : 'VBC bridge';
      var deps = (DATA.stepStackDeps[s.id] || []).map(findStackLayer).filter(Boolean);
      var ais  = (s.ai || []).map(findAi).filter(Boolean);
      var cos  = companiesForStep(s.id);
      var html = '<div class="hc-drawer">' +
        '<div class="hc-drawer-kind">' + kind + '</div>' +
        '<div class="hc-drawer-title">' + escapeHtml(s.id + ' · ' + s.label) + '</div>' +
        '<p>' + escapeHtml(s.description || '') + '</p>' +
        (deps.length
          ? '<h5>Stack dependencies</h5><div class="hc-pill-row">' +
            deps.map(function (d) { return '<button type="button" class="hc-pill" data-action="stack" data-id="' + d.id + '">' + escapeHtml(d.label) + '</button>'; }).join('') +
            '</div>' : '') +
        (ais.length
          ? '<h5>AI surfaces here</h5><div class="hc-pill-row">' +
            ais.map(function (a) { return '<button type="button" class="hc-pill" data-action="ai" data-id="' + a.id + '">' + escapeHtml(a.label) + '</button>'; }).join('') +
            '</div>' : '') +
        (cos.length ? '<h5>Who is building here</h5>' + companyListHTML(cos) : '') +
        '</div>';
      setInsight(html);
      maybeOpenSheet(html);
    }

    function renderStackDrawer(sl) {
      if (!sl) return;
      var cos = companiesForStack(sl.id);
      var stepsHere = [];
      Object.keys(DATA.stepStackDeps).forEach(function (sid) {
        if (DATA.stepStackDeps[sid].indexOf(sl.id) >= 0) stepsHere.push(sid);
      });
      var html = '<div class="hc-drawer">' +
        '<div class="hc-drawer-kind">Stack layer</div>' +
        '<div class="hc-drawer-title">' + escapeHtml(sl.label) + '</div>' +
        '<p>' + escapeHtml(sl.contents) + '</p>' +
        (stepsHere.length
          ? '<h5>Loop steps that depend on this layer</h5><div class="hc-pill-row">' +
            stepsHere.map(function (sid) {
              var st = findStep(sid);
              return '<button type="button" class="hc-pill" data-action="step" data-id="' + sid + '">' + escapeHtml(sid + (st ? ' · ' + st.label : '')) + '</button>';
            }).join('') + '</div>' : '') +
        (cos.length ? '<h5>Who is building here</h5>' + companyListHTML(cos) : '') +
        '</div>';
      setInsight(html);
      maybeOpenSheet(html);
    }

    // ===================================================================
    // CONTROLS — segmented View, company filter, reset
    // ===================================================================
    function wireControls() {
      var segView = root.querySelectorAll('.hc-segmented[role="radiogroup"] .hc-seg[data-view]');
      segView.forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.view = btn.dataset.view;
          root.querySelectorAll('.hc-seg[data-view]').forEach(function (b) {
            var on = b.dataset.view === state.view;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-checked', on ? 'true' : 'false');
          });
          var filter = root.querySelector('#hc-company-filter');
          if (filter) {
            if (state.view === 'companies') filter.removeAttribute('hidden');
            else filter.setAttribute('hidden', '');
          }
          refreshOverlayVisibility();
          // Switching view does not count as a selection
          // but preserves selected element if it still exists
        });
      });
      var segFilter = root.querySelectorAll('#hc-company-filter .hc-seg[data-filter]');
      segFilter.forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.companyFilter = btn.dataset.filter;
          root.querySelectorAll('#hc-company-filter .hc-seg').forEach(function (b) {
            var on = b.dataset.filter === state.companyFilter;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-checked', on ? 'true' : 'false');
          });
          refreshOverlayVisibility();
          // Refresh open drawer to reflect filter
          if (state.selection) reopenSelection();
        });
      });
      var resetBtn = root.querySelector('#hc-reset');
      if (resetBtn) resetBtn.addEventListener('click', clearSelection);
    }

    function reopenSelection() {
      var sel = state.selection; if (!sel) return;
      var s = state.selection; state.selection = null; // avoid the toggle-off path
      if (s.kind === 'node' || s.kind === 'pool') selectNode(s.id);
      else if (s.kind === 'flow') selectFlow(s.id);
      else if (s.kind === 'ai') selectAi(s.id);
      else if (s.kind === 'incentive') selectIncentive(s.id);
      else if (s.kind === 'company') selectCompany(s.id);
      else if (s.kind === 'step') selectStep(s.id);
      else if (s.kind === 'stack') selectStackLayer(s.id);
    }

    // Insight panel pill/button delegation
    if (insightEl) {
      insightEl.addEventListener('click', function (ev) {
        var t = ev.target.closest('[data-action]');
        if (!t) return;
        var action = t.dataset.action, id = t.dataset.id;
        ev.stopPropagation();
        if (action === 'node' || action === 'pool') selectNode(id);
        else if (action === 'flow') selectFlow(id);
        else if (action === 'ai') selectAi(id);
        else if (action === 'incentive') selectIncentive(id);
        else if (action === 'company') selectCompany(id);
        else if (action === 'step') selectStep(id);
        else if (action === 'stack') selectStackLayer(id);
      });
    }

    // Escape clears selection
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && state.selection) clearSelection();
    });

    // Click outside section clears selection (desktop only)
    document.addEventListener('click', function (ev) {
      if (!state.selection) return;
      if (window.innerWidth < 900) return;
      if (!root.contains(ev.target)) clearSelection();
    });

    // ===================================================================
    // BOTTOM SHEET (mobile)
    // ===================================================================
    var bottomSheet = root.querySelector('#hc-bottom-sheet');
    var bottomSheetBackdrop = root.querySelector('#hc-bottom-sheet-backdrop');
    function maybeOpenSheet(html) {
      if (window.innerWidth >= 900) return;
      if (!bottomSheet) return;
      bottomSheet.querySelector('.hc-bottom-sheet-body').innerHTML = html;
      bottomSheet.classList.add('is-open');
      bottomSheet.setAttribute('aria-hidden', 'false');
      if (bottomSheetBackdrop) bottomSheetBackdrop.removeAttribute('hidden');
    }
    function closeSheet() {
      if (bottomSheet) {
        bottomSheet.classList.remove('is-open');
        bottomSheet.setAttribute('aria-hidden', 'true');
      }
      if (bottomSheetBackdrop) bottomSheetBackdrop.setAttribute('hidden', '');
    }
    var sheetClose = root.querySelector('.hc-bottom-sheet-close');
    if (sheetClose) sheetClose.addEventListener('click', clearSelection);
    if (bottomSheetBackdrop) bottomSheetBackdrop.addEventListener('click', clearSelection);

    // ===================================================================
    // INIT MONEY RIVER
    // ===================================================================
    defaultInsight();
    if (!window.d3 || !window.d3.sankey) {
      if (fallbackEl) fallbackEl.classList.remove('is-hidden');
      console.warn('[healthcare] d3-sankey unavailable; showing fallback tables.');
    } else {
      try {
        renderSankey();
        if (fallbackEl) fallbackEl.classList.add('is-hidden');
      } catch (e) {
        console.error('[healthcare] sankey render failed', e);
        if (fallbackEl) fallbackEl.classList.remove('is-hidden');
      }
    }
    wireControls();

    // ===================================================================
    // PATIENT LOOP — integrated SVG
    // ===================================================================
    var loopSvgEl = root.querySelector('#hc-loop-svg');
    var stateSelector = root.querySelector('#hc-state-selector');
    var loopOrderedFallback = root.querySelector('#hc-loop-fallback');
    var currentLoopState = 'state_at_risk';

    // Geometry per spec: viewBox 1120 x 820
    var LOOP_VB = { w: 1120, h: 820 };
    var STACK = { x: 160, y: 590, w: 800, h: 190, bands: 7 };

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
        if (k === 'text') n.textContent = attrs[k];
        else n.setAttribute(k, attrs[k]);
      });
      (parent || loopSvgEl).appendChild(n);
      return n;
    }

    function bandY(idx) {
      // top band idx 0 at top
      var bandH = STACK.h / STACK.bands;
      return STACK.y + idx * bandH;
    }

    function renderLoop() {
      if (!loopSvgEl) return;
      while (loopSvgEl.firstChild) loopSvgEl.removeChild(loopSvgEl.firstChild);
      loopSvgEl.setAttribute('viewBox', '0 0 ' + LOOP_VB.w + ' ' + LOOP_VB.h);
      loopSvgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      var scenario = DATA.stateScenarios[currentLoopState] || { care: [], financial: [], prevention: [], vbc: [] };
      var stateInfo = DATA.patientStates.find(function (x) { return x.id === currentLoopState; });
      var careActive = {}; scenario.care.forEach(function (id) { careActive[id] = true; });
      var finActive = {};  scenario.financial.forEach(function (id) { finActive[id] = true; });
      var prevActive = {}; scenario.prevention.forEach(function (id) { prevActive[id] = true; });
      var vbcActive = {};  scenario.vbc.forEach(function (id) { vbcActive[id] = true; });
      var stackActive = {};
      var activeStepIds = scenario.care.concat(scenario.financial, scenario.prevention, scenario.vbc);
      activeStepIds.forEach(function (sid) {
        (DATA.stepStackDeps[sid] || []).forEach(function (st) { stackActive[st] = true; });
      });

      // arrow defs
      var defs = svgEl('defs', {});
      function marker(id, fill) {
        var m = svgEl('marker', { id: id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
        svgEl('path', { d: 'M0,0 L10,5 L0,10 z', fill: fill }, m);
      }
      marker('hcl-arrow-care', '#4ECDC4');
      marker('hcl-arrow-fin',  '#F5C542');
      marker('hcl-arrow-prev', '#FF8C42');
      marker('hcl-arrow-vbc',  '#F5C542');
      marker('hcl-arrow-bridge','#7C4DFF');

      // Center patient card
      var cardX = 450, cardY = 235, cardW = 220, cardH = 115;
      var cg = svgEl('g', { class: 'patient-center', transform: 'translate(' + (cardX + cardW/2) + ',' + (cardY + cardH/2) + ')' });
      svgEl('rect', { x: -cardW/2, y: -cardH/2, width: cardW, height: cardH, rx: 14, fill: 'rgba(0,0,0,0.55)', stroke: stateInfo ? stateInfo.color : '#4ECDC4', 'stroke-width': 2 }, cg);
      svgEl('text', { class: 'patient-label', x: 0, y: -34, 'text-anchor': 'middle' }, cg).textContent = 'Patient state';
      svgEl('text', { class: 'patient-state', x: 0, y: -10, 'text-anchor': 'middle', fill: stateInfo ? stateInfo.color : '#4ECDC4' }, cg).textContent = stateInfo ? stateInfo.label : '';
      svgEl('text', { class: 'patient-prompt', x: 0, y: 14, 'text-anchor': 'middle' }, cg).textContent = stateInfo ? stateInfo.prompt : '';
      svgEl('text', { class: 'patient-scenario', x: 0, y: 38, 'text-anchor': 'middle' }, cg).textContent = scenario.scenario || '';

      // Loop geometry (no dashed guide ellipses — QA confirmed they read
      // as "always-on connectors". Labels alone suffice).
      var careCx = 560, careCy = 230, careRx = 380, careRy = 170;
      var finCx  = 560, finCy  = 380, finRx  = 380, finRy  = 170;
      svgEl('text', { class: 'loop-label care', x: 560, y: 50, 'text-anchor': 'middle' }).textContent = 'CARE LOOP — clinical workflow, clockwise';
      svgEl('text', { class: 'loop-label fin',  x: 560, y: 575, 'text-anchor': 'middle' }).textContent = 'FINANCIAL LOOP — reimbursement, counterclockwise';

      // Active-only arrows along ellipse paths
      drawLoopActiveArrows(DATA.careLoop, careActive, careCx, careCy, careRx, careRy, true,  'care', 'hcl-arrow-care');
      drawLoopActiveArrows(DATA.financialLoop, finActive, finCx, finCy, finRx, finRy, false, 'fin',  'hcl-arrow-fin');

      // Step nodes
      DATA.careLoop.forEach(function (s) { drawStepNode(s, 'care', !!careActive[s.id]); });
      DATA.financialLoop.forEach(function (s) { drawStepNode(s, 'fin', !!finActive[s.id]); });

      // VBC bridge (left rail)
      var vbcG = svgEl('g', { class: 'vbc-bridge' });
      svgEl('text', { class: 'rail-title', x: 130, y: 125, 'text-anchor': 'middle' }, vbcG).textContent = 'VBC BRIDGE';
      svgEl('text', { class: 'rail-sub',   x: 130, y: 142, 'text-anchor': 'middle' }, vbcG).textContent = 'Reimbursement model';
      DATA.vbcBridge.forEach(function (v) { drawRailNode(v, 'vbc', !!vbcActive[v.id], vbcG); });
      // VBC path connectors — only show between sequentially-active steps
      for (var i = 0; i < DATA.vbcBridge.length - 1; i++) {
        var a = DATA.vbcBridge[i], b = DATA.vbcBridge[i + 1];
        var aOn = !!vbcActive[a.id], bOn = !!vbcActive[b.id];
        if (!(aOn && bOn)) continue;
        svgEl('path', { class: 'vbc-link is-active',
          d: 'M ' + a.x + ' ' + (a.y + 16) + ' Q ' + ((a.x + b.x)/2 - 18) + ' ' + ((a.y + b.y)/2) + ' ' + b.x + ' ' + (b.y - 16),
          fill: 'none', stroke: 'rgba(245,197,66,0.7)', 'stroke-width': 1.6, 'marker-end': 'url(#hcl-arrow-vbc)' }, vbcG);
      }

      // Prevention orbit (right rail)
      var preG = svgEl('g', { class: 'prevention-orbit' });
      svgEl('text', { class: 'rail-title', x: 990, y: 125, 'text-anchor': 'middle' }, preG).textContent = 'PRIVATE-PAY PREVENTION';
      svgEl('text', { class: 'rail-sub',   x: 990, y: 142, 'text-anchor': 'middle' }, preG).textContent = 'Out-of-pocket orbit';
      DATA.preventionOrbit.forEach(function (p) { drawRailNode(p, 'prev', !!prevActive[p.id], preG); });
      // P1->P5 curved connectors — only between sequentially-active orbit nodes
      for (var j = 0; j < DATA.preventionOrbit.length - 1; j++) {
        var pa = DATA.preventionOrbit[j], pb = DATA.preventionOrbit[j + 1];
        if (!(prevActive[pa.id] && prevActive[pb.id])) continue;
        svgEl('path', { class: 'prev-link is-active',
          d: 'M ' + pa.x + ' ' + (pa.y + 16) + ' Q ' + ((pa.x + pb.x)/2 + 18) + ' ' + ((pa.y + pb.y)/2) + ' ' + pb.x + ' ' + (pb.y - 16),
          fill: 'none', stroke: 'rgba(255,140,66,0.7)', 'stroke-width': 1.6, 'marker-end': 'url(#hcl-arrow-prev)' }, preG);
      }

      // VBC bridge → C8 bridge connector when V5 active and care C8 active
      if (vbcActive.V5 && careActive.C8) {
        svgEl('path', {
          class: 'vbc-c8-bridge',
          d: 'M 205 490 C 360 470 600 430 770 390',
          fill: 'none', stroke: 'rgba(124,77,255,0.6)', 'stroke-width': 1.6,
          'stroke-dasharray': '5 4', 'marker-end': 'url(#hcl-arrow-bridge)'
        });
        svgEl('text', { class: 'bridge-label', x: 470, y: 432, 'text-anchor': 'middle', fill: 'rgba(124,77,255,0.85)' }).textContent = 'VBC funds prevention';
      }

      // ----- Tech stack underneath the process visual -----
      var bandH = STACK.h / STACK.bands;
      var stackG = svgEl('g', { class: 'stack-group' });
      svgEl('text', { class: 'rail-title', x: STACK.x + 6, y: STACK.y - 18, 'text-anchor': 'start' }, stackG).textContent =
        'TECH STACK — what every process above depends on';
      svgEl('text', { class: 'rail-sub', x: STACK.x + STACK.w - 6, y: STACK.y - 18, 'text-anchor': 'end' }, stackG)
        .textContent = 'Highlighted bands and companies update with patient scenario';

      DATA.sharedStack.forEach(function (s, idx) {
        var y = bandY(idx);
        var active = !!stackActive[s.id];
        var g = svgEl('g', { class: 'stack-band' + (active ? ' is-active' : ''), 'data-id': s.id, tabindex: 0, role: 'button', 'aria-label': s.label + ' stack layer' + (active ? ' (active for this scenario)' : '') }, stackG);
        svgEl('rect', { class: 'band-bg', x: STACK.x, y: y, width: STACK.w, height: bandH - 3, rx: 6 }, g);
        svgEl('text', { class: 'band-label', x: STACK.x + 12, y: y + bandH / 2 + 4 }, g).textContent = s.label;
        svgEl('text', { class: 'band-contents', x: STACK.x + 170, y: y + bandH / 2 + 4 }, g).textContent = s.contents;

        // Companies for this band MUST be both:
        //   (a) listed against this stack layer (companiesForStack), AND
        //   (b) participate in at least one active scenario step.
        // No fallback to the unfiltered list — bands without any
        // scenario-relevant company examples render the empty sentinel
        // so the chips visibly differ across scenarios.
        var stackCos = sortCompanies(filteredCompanies(companiesForStack(s.id)));
        var cosForBand = stackCos.filter(function (c) {
          return (c.process_step_ids || []).some(function (sid) { return activeStepIds.indexOf(sid) >= 0; });
        }).slice(0, 4);

        if (cosForBand.length === 0) {
          svgEl('text', { class: 'band-co-empty', x: STACK.x + STACK.w - 12, y: y + bandH / 2 + 4, 'text-anchor': 'end' }, g)
            .textContent = '—';
        } else {
          var chipW = 90, chipH = 18, chipGap = 6;
          var totalChipsW = cosForBand.length * chipW + (cosForBand.length - 1) * chipGap;
          var startCX = STACK.x + STACK.w - 12 - totalChipsW;
          cosForBand.forEach(function (c, ci) {
            var cx = startCX + ci * (chipW + chipGap);
            var chip = svgEl('g', {
              class: 'band-co-chip',
              'data-company': c.id,
              'data-group': c.group,
              tabindex: 0, role: 'button',
              'aria-label': c.name + ' — example for ' + s.label,
              transform: 'translate(' + cx + ',' + (y + bandH / 2 - chipH / 2) + ')'
            }, g);
            svgEl('rect', { width: chipW, height: chipH, rx: 4 }, chip);
            var label = c.name.length > 14 ? c.name.slice(0, 13) + '…' : c.name;
            svgEl('text', { x: chipW / 2, y: chipH / 2 + 3.5, 'text-anchor': 'middle' }, chip).textContent = label;
            chip.addEventListener('click', function (ev) { ev.stopPropagation(); selectCompany(c.id); });
            chip.addEventListener('mouseenter', function (ev) { showTip(tipText(c.name, c.short_description), ev.clientX, ev.clientY); });
            chip.addEventListener('mouseleave', hideTip);
            chip.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectCompany(c.id); } });
          });
        }
        g.addEventListener('click', function (ev) { ev.stopPropagation(); selectStackLayer(s.id); });
        g.addEventListener('mouseenter', function (ev) { showTip(tipText(s.label + ' — stack layer', s.contents), ev.clientX, ev.clientY); });
        g.addEventListener('mouseleave', hideTip);
        g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectStackLayer(s.id); } });
      });

      // ----- Mobile fallback list -----
      if (loopOrderedFallback) {
        function listFor(arr, act, label) {
          var items = arr.filter(function (s) { return act[s.id]; });
          if (!items.length) return '';
          return '<h6>' + label + '</h6><ol class="hc-loop-list">' +
                 items.map(function (s) { return '<li><strong>' + s.id + ' · ' + escapeHtml(s.label) + '</strong> — ' + escapeHtml(s.description || '') + '</li>'; }).join('') +
                 '</ol>';
        }
        loopOrderedFallback.innerHTML =
          '<h5>Active scenario · ' + escapeHtml(stateInfo.label) + '</h5>' +
          '<p>' + escapeHtml(scenario.scenario) + '</p>' +
          listFor(DATA.careLoop, careActive, 'Care loop') +
          listFor(DATA.financialLoop, finActive, 'Financial loop') +
          listFor(DATA.preventionOrbit, prevActive, 'Prevention orbit') +
          listFor(DATA.vbcBridge, vbcActive, 'VBC bridge');
      }
    }

    // Draws arrows ONLY between consecutive active steps in the scenario,
    // routed along the loop's guide ellipse so flow reads as one clean loop.
    // For the care loop (upperHalf=true) we follow the TOP arc; for the
    // financial loop we follow the BOTTOM arc.
    function drawLoopActiveArrows(steps, active, cx, cy, rx, ry, upperHalf, kind, markerId) {
      // `steps` is already in canonical loop order (C1..C8 / F1..F8). Filter
      // by active so arrows only connect consecutive active steps in loop order.
      var ordered = steps.filter(function (s) { return !!active[s.id]; });
      if (ordered.length < 2) return;
      // node radius along the ellipse for trimming so arrowheads don't sit
      // inside the step boxes
      var nodeRadius = 56;
      for (var i = 0; i < ordered.length - 1; i++) {
        var a = ordered[i], b = ordered[i + 1];
        // Approximate the chord along the ellipse with a quadratic that
        // bulges outward away from the center of the loop.
        var mx = (a.x + b.x) / 2;
        var my = (a.y + b.y) / 2;
        var dx = mx - cx, dy = my - cy;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        // bow magnitude proportional to chord length and the half (top/bottom)
        var chord = Math.hypot(b.x - a.x, b.y - a.y);
        var bow = Math.min(60, Math.max(18, chord * 0.16));
        var bx = mx + (dx / len) * bow;
        var by = my + (dy / len) * bow;
        // Trim endpoints away from node centers
        var v1x = bx - a.x, v1y = by - a.y;
        var l1 = Math.hypot(v1x, v1y) || 1;
        var sx = a.x + (v1x / l1) * nodeRadius;
        var sy = a.y + (v1y / l1) * nodeRadius;
        var v2x = bx - b.x, v2y = by - b.y;
        var l2 = Math.hypot(v2x, v2y) || 1;
        var ex = b.x + (v2x / l2) * nodeRadius;
        var ey = b.y + (v2y / l2) * nodeRadius;
        svgEl('path', {
          class: 'loop-arrow is-' + kind + ' is-active',
          d: 'M ' + sx + ' ' + sy + ' Q ' + bx + ' ' + by + ' ' + ex + ' ' + ey,
          fill: 'none',
          stroke: kind === 'care' ? '#4ECDC4' : '#F5C542',
          'stroke-width': 2.2,
          'stroke-linecap': 'round',
          'marker-end': 'url(#' + markerId + ')'
        });
      }
    }

    function drawStepNode(s, kind, isActive) {
      var classes = 'loop-step is-' + kind + (isActive ? ' is-active' : ' is-dim');
      var w = 110, h = 36;
      var g = svgEl('g', {
        class: classes,
        transform: 'translate(' + (s.x - w / 2) + ',' + (s.y - h / 2) + ')',
        tabindex: 0, role: 'button', 'aria-label': s.id + ' ' + s.label,
        'data-id': s.id
      });
      svgEl('rect', { class: 'bg', width: w, height: h, rx: 8 }, g);
      svgEl('text', { class: 'num', x: 12, y: h / 2 + 4 }, g).textContent = s.id;
      svgEl('text', { class: 'lbl', x: 30, y: h / 2 + 4 }, g).textContent = s.label;
      // Tooltip + click
      g.addEventListener('mouseenter', function (ev) { showTip(tipText(s.id + ' · ' + s.label, s.description || ''), ev.clientX, ev.clientY); });
      g.addEventListener('mouseleave', hideTip);
      g.addEventListener('click', function (ev) { ev.stopPropagation(); selectStep(s.id); });
      g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectStep(s.id); } });
    }

    function drawRailNode(s, kind, isActive, parent) {
      var classes = 'rail-step is-' + kind + (isActive ? ' is-active' : ' is-dim');
      var w = 150, h = 32;
      var g = svgEl('g', {
        class: classes,
        transform: 'translate(' + (s.x - w / 2) + ',' + (s.y - h / 2) + ')',
        tabindex: 0, role: 'button', 'aria-label': s.id + ' ' + s.label,
        'data-id': s.id
      }, parent);
      svgEl('rect', { class: 'bg', width: w, height: h, rx: 8 }, g);
      svgEl('text', { class: 'num', x: 10, y: h / 2 + 4 }, g).textContent = s.id;
      svgEl('text', { class: 'lbl', x: 30, y: h / 2 + 4 }, g).textContent = s.label;
      g.addEventListener('mouseenter', function (ev) { showTip(tipText(s.id + ' · ' + s.label, s.description || ''), ev.clientX, ev.clientY); });
      g.addEventListener('mouseleave', hideTip);
      g.addEventListener('click', function (ev) { ev.stopPropagation(); selectStep(s.id); });
      g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectStep(s.id); } });
    }

    function updateLoopForSelection() {
      if (!loopSvgEl) return;
      loopSvgEl.querySelectorAll('.loop-step, .rail-step, .stack-band, .band-co-chip').forEach(function (el) {
        el.classList.remove('is-focus');
      });
      var sel = state.selection; if (!sel) return;
      if (sel.kind === 'step') {
        loopSvgEl.querySelectorAll('[data-id="' + sel.id + '"]').forEach(function (el) { el.classList.add('is-focus'); });
      } else if (sel.kind === 'stack') {
        loopSvgEl.querySelectorAll('.stack-band[data-id="' + sel.id + '"]').forEach(function (el) { el.classList.add('is-focus'); });
      } else if (sel.kind === 'company') {
        loopSvgEl.querySelectorAll('.band-co-chip[data-company="' + sel.id + '"]').forEach(function (el) { el.classList.add('is-focus'); });
        var c = findCompany(sel.id);
        if (c) (c.process_step_ids || []).forEach(function (sid) {
          loopSvgEl.querySelectorAll('[data-id="' + sid + '"]').forEach(function (el) { el.classList.add('is-focus'); });
        });
      } else if (sel.kind === 'ai') {
        var a = findAi(sel.id);
        if (a) (a.attach_steps || []).forEach(function (sid) {
          loopSvgEl.querySelectorAll('[data-id="' + sid + '"]').forEach(function (el) { el.classList.add('is-focus'); });
        });
      }
    }

    renderStateSelector();
    renderLoop();
  });
})();
