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

    // Sourced callouts beneath the patient-event loop. Drawer-style depth
    // (workforce, rural funding, model infra, RCM, behavioral telehealth)
    // surfaced as cards so the canvas stays calm.
    var loopCalloutWrap = root.querySelector('#hc-loop-callouts');
    if (loopCalloutWrap && Array.isArray(DATA.loopCallouts)) {
      loopCalloutWrap.innerHTML = DATA.loopCallouts.map(function (c) {
        return '<div class="hc-loop-callout" data-group="' + escapeHtml(c.group) + '" data-callout="' + escapeHtml(c.id) + '">' +
          '<div class="hc-loop-callout-tag">' + escapeHtml(c.tag) + '</div>' +
          '<div class="hc-loop-callout-title">' + escapeHtml(c.title) + '</div>' +
          (c.stat ? '<div class="hc-loop-callout-stat tabnum">' + escapeHtml(c.stat) + '</div>' : '') +
          '<div class="hc-loop-callout-body">' + escapeHtml(c.body) + '</div>' +
          '<div class="hc-loop-callout-src">Source: <a href="' + c.source_url + '" target="_blank" rel="noopener">' + escapeHtml(c.source_label) + '</a></div>' +
        '</div>';
      }).join('');
    }

    // ===================================================================
    // MONEY RIVER
    // ===================================================================
    var insightEl  = root.querySelector('#hc-insight');
    var loopInsightEl = root.querySelector('#hc-loop-insight');
    var moneySvgEl = root.querySelector('#hc-sankey-svg');
    var fallbackEl = root.querySelector('#hc-fallback');

    // Drawer helpers ----------------------------------------------------
    function setInsight(html) { if (insightEl) insightEl.innerHTML = html; }
    function setLoopInsight(html) { if (loopInsightEl) loopInsightEl.innerHTML = html; }
    function clearLoopInsight() { if (loopInsightEl) loopInsightEl.innerHTML = ''; }

    function defaultInsight() {
      if (state && state.view === 'companies') {
        setInsight(
          '<div class="hc-insight-empty">' +
            '<div class="hc-insight-empty-row">' +
              '<span class="hc-insight-empty-icon" aria-hidden="true">▸</span>' +
              '<span><strong>Click any flow, node, or cost pool</strong> to see company examples in context. Companies are kept off the river to avoid clutter.</span>' +
            '</div>' +
            '<div class="hc-insight-empty-row">' +
              '<span class="hc-insight-empty-icon" aria-hidden="true">▸</span>' +
              '<span>Use <em>DVC only</em> to narrow the drawer to portfolio companies.</span>' +
            '</div>' +
          '</div>'
        );
        return;
      }
      setInsight(
        '<div class="hc-insight-empty">' +
          '<div class="hc-insight-empty-row">' +
            '<span class="hc-insight-empty-icon" aria-hidden="true">▸</span>' +
            '<span><strong>Click a flow.</strong> Get the payer logic, recipient logic, structural tension, and the AI wedge for each $-stream.</span>' +
          '</div>' +
          '<div class="hc-insight-empty-row">' +
            '<span class="hc-insight-empty-icon" aria-hidden="true">▸</span>' +
            '<span><strong>Click a node.</strong> See where that channel routes, who fronts admin and labor costs, and which AI surfaces attach.</span>' +
          '</div>' +
          '<div class="hc-insight-empty-row">' +
            '<span class="hc-insight-empty-icon" aria-hidden="true">▸</span>' +
            '<span><strong>Switch view</strong> to <em>AI opportunities</em>, <em>Incentives</em>, or <em>Companies</em> for overlays.</span>' +
          '</div>' +
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

    // ===================================================================
    // LAYER RESOLUTION — visible pair + drawer per element.
    //
    // resolveLayerPair(layerIds):
    //   Given an ordered list of audit layers, returns the visible
    //   incumbent + ai-native PAIR for the FIRST layer that has one,
    //   plus a deduped drawer set drawn from that layer and any
    //   subsequent layers (capped at ~4 drawer entries).
    //
    // Visible cap: 2 companies (incumbent + ai-native). A third badge
    // is only added when a DVC company is the *most precise* leader for
    // that element AND would not otherwise appear in a visible slot,
    // up to a total of 3.
    // ===================================================================
    var coById = {};
    DATA.companies.forEach(function (c) { coById[c.id] = c; });

    function pickLayersForElement(kind, id) {
      if (kind === 'destination') return (DATA.destinationToLayers && DATA.destinationToLayers[id]) || [];
      if (kind === 'pool')        return (DATA.poolToLayers && DATA.poolToLayers[id]) || [];
      if (kind === 'step')        return (DATA.stepToLayers && DATA.stepToLayers[id]) || [];
      if (kind === 'stack')       return (DATA.stackToLayers && DATA.stackToLayers[id]) || [];
      return [];
    }

    // Returns { visible: [...co], drawer: [...co], layerIds: [...] }
    // visible has at most 2 companies (incumbent + ai-native).
    //
    // opts.exclude    — Set/object of company IDs already claimed elsewhere
    //                   in this scenario (used by the loop's band walker to
    //                   prevent the same company appearing in adjacent
    //                   stack bands). Excluded companies are skipped for the
    //                   visible slot and the resolver advances to the next
    //                   matching layer until it finds a fresh pair.
    // opts.promoteDvc — when true, allow a 3rd DVC visible slot if the DVC
    //                   pin is the most precise leader. Defaults to false
    //                   (visible cap = 2). DVC drawer pins always remain
    //                   in the drawer.
    function resolveLayerCompanies(layerIds, opts) {
      opts = opts || {};
      var maxDrawer = opts.maxDrawer != null ? opts.maxDrawer : 4;
      var promoteDvc = opts.promoteDvc === true;
      var exclude = opts.exclude || {};
      var visible = [];
      var seen = {};
      var firstLayerWithPair = null;
      for (var i = 0; i < layerIds.length; i++) {
        var L = DATA.companyLayers[layerIds[i]];
        if (!L) continue;
        var pair = (L.pair || []).filter(function (cid) {
          return cid && coById[cid] && !seen[cid] && !exclude[cid];
        });
        if (!pair.length) continue;
        firstLayerWithPair = layerIds[i];
        pair.forEach(function (cid) {
          if (!seen[cid]) { seen[cid] = true; visible.push(coById[cid]); }
        });
        break;
      }
      // Drawer: drawer entries from the first layer (with pair), then drawer
      // entries from subsequent layers, then any leftover pair members from
      // subsequent layers — all deduped, capped at maxDrawer.
      var drawer = [];
      function pushIfNew(cid) {
        if (!cid || !coById[cid] || seen[cid]) return;
        seen[cid] = true; drawer.push(coById[cid]);
      }
      if (firstLayerWithPair) {
        (DATA.companyLayers[firstLayerWithPair].drawer || []).forEach(pushIfNew);
      }
      for (var j = 0; j < layerIds.length; j++) {
        if (layerIds[j] === firstLayerWithPair) continue;
        var L2 = DATA.companyLayers[layerIds[j]];
        if (!L2) continue;
        (L2.pair || []).forEach(pushIfNew);
        (L2.drawer || []).forEach(pushIfNew);
      }
      if (state.companyFilter === 'dvc') {
        visible = visible.filter(function (c) { return c.group === 'dvc'; });
        drawer  = drawer.filter(function (c) { return c.group === 'dvc'; });
      }
      // Optional 3rd DVC slot — disabled by default. The Money River and
      // loop bands both use the default (cap = 2) to avoid heterogeneous
      // 3-badge clusters on shared infra nodes.
      if (promoteDvc && visible.length < 3 && firstLayerWithPair) {
        var dvcPin = drawer.find(function (c) {
          return c.group === 'dvc' && c.layer_id === firstLayerWithPair && !exclude[c.id];
        });
        if (dvcPin && visible.indexOf(dvcPin) < 0) {
          visible.push(dvcPin);
          drawer = drawer.filter(function (c) { return c.id !== dvcPin.id; });
        }
      }
      if (visible.length > 2 && !promoteDvc) visible = visible.slice(0, 2);
      if (visible.length > 3) visible = visible.slice(0, 3);
      drawer = drawer.slice(0, maxDrawer);
      return { visible: visible, drawer: drawer, layerIds: layerIds, primaryLayer: firstLayerWithPair };
    }

    function resolveForElement(kind, id, opts) {
      return resolveLayerCompanies(pickLayersForElement(kind, id), opts);
    }

    function companiesForPool(poolId)        { return resolveForElement('pool', poolId).visible; }
    function companiesForDestination(destId) { return resolveForElement('destination', destId).visible; }
    function companiesForStep(stepId)        { return resolveForElement('step', stepId).visible; }
    function companiesForStack(stackId)      { return resolveForElement('stack', stackId).visible; }
    function companiesForAi(aiId) {
      // AI surface visible companies: intersect attached pools + step layers
      var layerIds = [];
      var seen = {};
      var a = DATA.aiSurfaces.find(function (x) { return x.id === aiId; });
      if (a) {
        (a.attach_pools || []).forEach(function (pId) {
          ((DATA.poolToLayers || {})[pId] || []).forEach(function (lid) {
            if (!seen[lid]) { seen[lid] = true; layerIds.push(lid); }
          });
        });
        (a.attach_steps || []).forEach(function (sId) {
          ((DATA.stepToLayers || {})[sId] || []).forEach(function (lid) {
            if (!seen[lid]) { seen[lid] = true; layerIds.push(lid); }
          });
        });
      }
      return resolveLayerCompanies(layerIds).visible;
    }

    function companyChipHTML(c) {
      var roleClass = c.role === 'incumbent' ? 'incumbent'
                     : c.role === 'ai-native' ? 'ainative'
                     : c.group === 'dvc' ? 'dvc' : 'drawer';
      var groupTag = '<span class="hc-co-grouptag ' + roleClass + '">' + escapeHtml(roleTagText(c)) + '</span>';
      return '<button type="button" class="hc-co-chip" data-action="company" data-id="' + c.id + '">' +
               '<span class="hc-co-chip-name">' + escapeHtml(c.name) + '</span>' +
               groupTag +
               '<span class="hc-co-chip-desc">' + escapeHtml(c.short_description) + '</span>' +
             '</button>';
    }

    // Render visible-pair first, then the broader "More examples" set.
    // `resolved` is the return value of resolveForElement / resolveLayerCompanies.
    function companyDrawerHTML(resolved) {
      if (!resolved) return '<p class="hc-empty">No company examples linked here.</p>';
      var visible = resolved.visible || [];
      var drawer  = resolved.drawer  || [];
      if (state.companyFilter === 'dvc') {
        visible = visible.filter(function (c) { return c.group === 'dvc'; });
        drawer  = drawer.filter(function (c) { return c.group === 'dvc'; });
      }
      if (!visible.length && !drawer.length) return '<p class="hc-empty">No company examples linked here.</p>';
      var out = '';
      if (visible.length) {
        out += '<div class="hc-co-section-h">Primary pair</div>';
        out += '<div class="hc-co-list">' + visible.map(companyChipHTML).join('') + '</div>';
      }
      if (drawer.length) {
        out += '<div class="hc-co-section-h">More examples</div>';
        out += '<div class="hc-co-list">' + drawer.map(companyChipHTML).join('') + '</div>';
      }
      return out;
    }

    // Legacy shim used by AI-surface and step drawers (which previously
    // received an unstructured list). Resolves the list as a single
    // 'visible' set and renders via the structured drawer.
    function companyListHTML(list) {
      var cs = sortCompanies(filteredCompanies(list || []));
      if (!cs.length) return '<p class="hc-empty">No company examples linked here.</p>';
      // Cap to 3 visible to honour the surface rule.
      var visible = cs.slice(0, 3);
      var drawer = cs.slice(3, 7);
      return companyDrawerHTML({ visible: visible, drawer: drawer });
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
    //   Companies:  river dims and a subtle purple ring marks pools that
    //               host companies. Company examples are NEVER drawn on
    //               the canvas — they live in the drawer behind a click
    //               on a flow, destination, pool, loop step, or stack band.

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

    // Deterministic anti-collision layout for incentive chips.
    //
    // Input:  list of { id, label, idealCx, anchorTop } in viewBox coords
    //         viewBox width/height
    // Output: list of { id, label, x, y, w, h } with NO overlapping AABBs
    //         (min gap CHIP_GAP_X / CHIP_GAP_Y) and all rects fully inside
    //         the safe viewBox (4px inset).
    //
    // Rule (pure, deterministic):
    //   1. Sort by idealCx ascending (ties broken by id).
    //   2. For each chip, compute its ideal x = idealCx - w/2 and start y
    //      = anchorTop - h - 6. Clamp x into [PAD, vbW - PAD - w].
    //   3. While the chip's AABB intersects any already-placed chip's
    //      AABB (expanded by CHIP_GAP_X / CHIP_GAP_Y), move it up by one
    //      ROW. If it would leave the top, instead nudge x by one CHIP
    //      step (alternating right then left) and reset y. Bail after a
    //      bounded number of attempts and clamp to safe bounds.
    //   4. The result is stable for stable input ordering.
    function layoutIncentiveChips(specs, vbW, vbH) {
      var PAD = 8;
      var CHIP_H = 18;
      var CHIP_GAP_X = 6;
      var CHIP_GAP_Y = 4;
      // Hard width cap. A chip wider than the safe canvas is meaningless and
      // guarantees right-edge clipping when nudged. We cap to MAX_CHIP_W and
      // also to (vbW - 2*PAD) so a chip can always fit inside the viewBox.
      var MAX_CHIP_W = 150;
      var ROW = CHIP_H + CHIP_GAP_Y;
      var sorted = specs.slice().sort(function (a, b) {
        if (a.idealCx !== b.idealCx) return a.idealCx - b.idealCx;
        return a.id < b.id ? -1 : 1;
      });
      var placed = [];
      function overlaps(a, b) {
        return !(
          a.x + a.w + CHIP_GAP_X <= b.x ||
          b.x + b.w + CHIP_GAP_X <= a.x ||
          a.y + a.h + CHIP_GAP_Y <= b.y ||
          b.y + b.h + CHIP_GAP_Y <= a.y
        );
      }
      function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
      sorted.forEach(function (s) {
        var maxAllowedW = Math.max(60, vbW - 2 * PAD);
        var w = Math.min(MAX_CHIP_W, maxAllowedW,
          Math.max(80, s.label.length * 6.4 + 18));
        var h = CHIP_H;
        var idealX = s.idealCx - w / 2;
        var x = clamp(idealX, PAD, vbW - PAD - w);
        var startY = clamp(s.anchorTop - h - 6, PAD, vbH - PAD - h);
        var y = startY;
        var attempts = 0;
        var direction = 1;
        var nudgeStep = 0;
        while (attempts < 80) {
          var candidate = { x: x, y: y, w: w, h: h };
          var hit = false;
          for (var i = 0; i < placed.length; i++) {
            if (overlaps(candidate, placed[i])) { hit = true; break; }
          }
          if (!hit) break;
          // Try moving up one row.
          if (y - ROW >= PAD) {
            y -= ROW;
          } else {
            // Out of vertical room: nudge x by CHIP_GAP_X + chip width fraction
            nudgeStep += 1;
            var dx = direction * nudgeStep * (w / 2 + CHIP_GAP_X);
            x = clamp(idealX + dx, PAD, vbW - PAD - w);
            y = startY;
            direction = -direction;
          }
          attempts++;
        }
        // Final hard clamp so a chip can never exit the safe viewBox even
        // if the nudge loop bailed early. This is what prevents the right
        // edge of the rect (and its text) from being clipped by the SVG.
        x = clamp(x, PAD, vbW - PAD - w);
        y = clamp(y, PAD, vbH - PAD - h);
        placed.push({ id: s.id, label: s.label, x: x, y: y, w: w, h: h });
      });
      return placed;
    }
    // Expose for static testing.
    if (typeof window !== 'undefined') window.hcLayoutIncentiveChips = layoutIncentiveChips;

    function buildIncentiveOverlay() {
      // Group all incentive content under a single mode group so we can
      // toggle the whole layer at once.
      var grp = overlayG.append('g').attr('class', 'hc-inc-grp');

      // 1) Hatched amber stripe on each affected node (visual anchor of
      //    the constraint to the node). Stripes never overlap each other
      //    on the same node because they fill the full node rect.
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
      });

      // 2) Compute ideal anchor (idealCx, anchorTop) for each incentive
      //    chip, then run the deterministic layout to avoid collisions.
      var specs = [];
      DATA.incentives.forEach(function (inc) {
        var anchors = [];
        (inc.attach_nodes || []).forEach(function (id) { anchors.push({ id: id, kind: 'node' }); });
        (inc.attach_pools || []).forEach(function (id) { anchors.push({ id: id, kind: 'pool' }); });
        var first = anchors.find(function (a) {
          if (a.kind === 'pool') return !!poolPositions[a.id];
          return sankeyGraph && sankeyGraph.nodes.find(function (x) { return x.id === a.id; });
        });
        if (!first) return;
        var firstRect = first.kind === 'pool'
          ? poolPositions[first.id]
          : sankeyGraph.nodes.find(function (x) { return x.id === first.id; });
        specs.push({
          id: inc.id,
          label: inc.label,
          message: inc.message,
          idealCx: (firstRect.x0 + firstRect.x1) / 2,
          anchorTop: firstRect.y0
        });
      });

      var svgBBox = moneySvgEl.viewBox.baseVal;
      var vbW = svgBBox && svgBBox.width ? svgBBox.width : 1280;
      var vbH = svgBBox && svgBBox.height ? svgBBox.height : 760;
      var laid = layoutIncentiveChips(specs, vbW, vbH);
      var laidById = {};
      laid.forEach(function (p) { laidById[p.id] = p; });

      // 3) Render chip + tick line back to its ideal anchor so the user
      //    can still see which node each label refers to even when the
      //    chip has been shifted upward to clear a collision.
      specs.forEach(function (s) {
        var inc = DATA.incentives.find(function (i) { return i.id === s.id; });
        var p = laidById[s.id];
        if (!p) return;
        var chipMidX = p.x + p.w / 2;
        var chipBottomY = p.y + p.h;
        // Tick from the chip bottom to the ideal anchor (top of node).
        grp.append('line')
          .attr('class', 'hc-inc-tick')
          .attr('x1', chipMidX).attr('y1', chipBottomY)
          .attr('x2', s.idealCx).attr('y2', s.anchorTop - 1)
          .attr('stroke', 'rgba(245,197,66,0.45)')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2 2')
          .attr('pointer-events', 'none');

        var g = grp.append('g')
          .attr('class', 'hc-inc-chip')
          .attr('data-inc', inc.id)
          .attr('tabindex', 0)
          .attr('role', 'button')
          .attr('aria-label', inc.label + ' — incentive')
          .attr('transform', 'translate(' + p.x + ',' + p.y + ')');
        g.append('rect').attr('width', p.w).attr('height', p.h).attr('rx', 9);
        g.append('text').attr('x', p.w / 2).attr('y', p.h / 2 + 3.5).attr('text-anchor', 'middle').text(inc.label);
        g.on('mouseenter', function (ev) { showTip(tipText(inc.label + ' — incentive', inc.message), ev.clientX, ev.clientY); })
         .on('mouseleave', hideTip)
         .on('click', function (ev) { ev.stopPropagation(); selectIncentive(inc.id); })
         .on('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectIncentive(inc.id); } });
      });
    }

    function buildCompanyOverlay() {
      // Companies mode is intentionally ZERO-OVERLAY on the river. No
      // badges, chips, rings, pool hints, sidecars, or any company-
      // dependent SVG content is drawn on the canvas at all. The river
      // dims via CSS only; company examples live exclusively inside the
      // drawer behind a click on a flow, destination, pool, loop step,
      // or stack band. The function is preserved (as a no-op) so the
      // overlay layer wiring and refresh/visibility code remains stable.
      return null;
    }

    // The biotech sidecar (drug discovery + pharma intelligence) lives
    // OUTSIDE the $5.3T NHE system. It was previously drawn as a card on
    // the canvas in Companies mode; we now expose it only as a drawer
    // (openBiotechDrawer) reachable from the Retail-Rx destination
    // drawer to keep the canvas free of company clutter.
    function wrapText(parent, text, x, y, maxW, lineH, cls, maxLines) {
      var words = String(text).split(/\s+/);
      var lines = [];
      var current = '';
      // Approximate char width: 6.0 px @ 11px font.
      var maxChars = Math.floor(maxW / 5.8);
      words.forEach(function (w) {
        if ((current + ' ' + w).trim().length > maxChars) {
          if (current) lines.push(current);
          current = w;
        } else {
          current = (current + ' ' + w).trim();
        }
      });
      if (current) lines.push(current);
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        lines[lines.length - 1] = lines[lines.length - 1].replace(/\s\S+$/, '') + '…';
      }
      lines.forEach(function (l, i) {
        parent.append('text').attr('class', cls).attr('x', x).attr('y', y + i * lineH).text(l);
      });
    }

    function roleTagText(c) {
      if (!c) return '';
      if (c.role === 'incumbent') return 'Incumbent';
      if (c.role === 'ai-native') return 'AI-native leader';
      if (c.group === 'dvc' && c.role === 'dvc') return 'DVC emerging';
      if (c.role === 'drawer')   return 'More example';
      return c.group === 'dvc' ? 'DVC portfolio' : 'Leader';
    }
    function companyTip(c) {
      return '<div class="hc-tooltip-title">' + escapeHtml(c.name) +
             ' <span class="hc-tooltip-role">' + escapeHtml(roleTagText(c)) + '</span></div>' +
             '<div class="hc-tooltip-body">' + escapeHtml(c.short_description) + '</div>';
    }

    function refreshOverlayVisibility() {
      if (!overlayG) return;
      var showAi  = state.view === 'ai';
      var showInc = state.view === 'incentives';
      overlayG.select('.hc-ai-grp').style('display', showAi ? null : 'none');
      overlayG.select('.hc-inc-grp').style('display', showInc ? null : 'none');
      // Companies mode: nothing on the canvas — buildCompanyOverlay is a
      // no-op. The DVC filter narrows drawer content only.
      overlayG.selectAll('.hc-co-grp').remove();
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
      clearLoopInsight();
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
        // Company examples — primary pair + more examples set
        html += '<h5>Who is building here</h5>' + companyDrawerHTML(resolveForElement('destination', n.id));
        // Retail Rx is the NHE-side anchor for biotech R&D / pharma
        // intelligence (which sit OUTSIDE NHE). Offer a clearly labeled
        // jump into the biotech drawer rather than putting that content
        // on the canvas.
        if (n.id === (DATA.biotechSidecar && DATA.biotechSidecar.linked_destination)) {
          html += '<p class="hc-aside"><button type="button" class="hc-link-btn" data-action="biotech">View biotech (outside NHE) →</button> Drug discovery & pharma intelligence sit upstream of retail dispensing.</p>';
        }
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
        html += '<h5>Who is building here</h5>' + companyDrawerHTML(resolveForElement('pool', n.id));
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

    // Pick the most appropriate microcopy entry for a flow. AB links (payer →
    // destination) are keyed directly by the flow id; BC links (destination →
    // cost pool) have no payer counterpart, so we fall back to the generic
    // template. Out-of-pocket flows use the direct_pay_flow fallback.
    function pickFlowMicrocopy(f) {
      var copy = (DATA.flowMicrocopy && DATA.flowMicrocopy[f.id]) || null;
      if (copy) return { copy: copy, fallback: false };
      if (f.span === 'AB') {
        if (String(f.source).indexOf('pay_out_of_pocket') === 0) {
          return { copy: DATA.flowMicrocopyFallback.direct_pay_flow, fallback: true };
        }
        if (String(f.source).indexOf('pay_medicare') === 0 || String(f.source).indexOf('pay_medicaid') === 0 ||
            String(f.source).indexOf('pay_other_public_private') === 0 || String(f.source).indexOf('pay_residual') === 0) {
          return { copy: DATA.flowMicrocopyFallback.low_volume_government_flow, fallback: true };
        }
      }
      return { copy: DATA.flowMicrocopyFallback.generic_flow, fallback: true };
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
      var relevantResolved = null;
      if (t) {
        if (DATA.costPools.find(function (p) { return p.id === t.id; })) relevantResolved = resolveForElement('pool', t.id);
        else relevantResolved = resolveForElement('destination', t.id);
      }

      var picked = pickFlowMicrocopy(f);
      var copy = picked.copy;
      var callout = (DATA.flowMicrocopyCallouts && DATA.flowMicrocopyCallouts[f.id]) || null;

      function bullets(arr) {
        if (!arr || !arr.length) return '';
        return '<ul class="hc-flow-bullets">' +
          arr.map(function (b) { return '<li>' + escapeHtml(b) + '</li>'; }).join('') +
          '</ul>';
      }

      var title = (copy && copy.title) || ((s ? s.label : f.source) + ' → ' + (t ? t.label : f.target));
      var pathLabel = (s ? s.label : f.source) + ' → ' + (t ? t.label : f.target);

      var html = '<div class="hc-drawer hc-flow-drawer">' +
        '<div class="hc-drawer-kind">Flow' + (picked.fallback ? ' · summary' : '') + '</div>' +
        '<div class="hc-drawer-title">' + escapeHtml(title) + '</div>' +
        '<div class="hc-drawer-sub">' + escapeHtml(pathLabel) + '</div>' +
        '<div class="hc-drawer-value tabnum">' + fmtUSD(f.value_b) + ' modeled' +
          (srcShare != null ? ' · <span class="hc-flow-share">' + srcShare + '% of ' + escapeHtml(s ? s.label : '') + '</span>' : '') +
          (tgtShare != null ? ' · <span class="hc-flow-share">' + tgtShare + '% of ' + escapeHtml(t ? t.label : '') + '</span>' : '') +
        '</div>' +
        (copy && copy.what_it_is ? '<p>' + escapeHtml(copy.what_it_is) + '</p>' : '') +
        (callout
          ? '<div class="hc-flow-callout"><span class="hc-flow-callout-tag">' + escapeHtml(callout.type.replace(/_/g, ' ')) + '</span>' +
            '<strong>' + escapeHtml(callout.headline) + '</strong>' +
            '<p>' + escapeHtml(callout.body) + '</p></div>'
          : '') +
        (copy && copy.payer_incentive && copy.payer_incentive.length
          ? '<h5>Payer logic</h5>' + bullets(copy.payer_incentive) : '') +
        (copy && copy.recipient_incentive && copy.recipient_incentive.length
          ? '<h5>Recipient logic</h5>' + bullets(copy.recipient_incentive) : '') +
        (copy && copy.tension ? '<h5>Tension</h5><p>' + escapeHtml(copy.tension) + '</p>' : '') +
        (copy && copy.ai_wedge ? '<h5>AI wedge</h5><p>' + escapeHtml(copy.ai_wedge) + '</p>' : '') +
        (relevantAi.length
          ? '<h5>AI surfaces nearby</h5><div class="hc-pill-row">' +
            relevantAi.slice(0, 4).map(function (a) {
              return '<button type="button" class="hc-pill" data-action="ai" data-id="' + a.id + '">' + escapeHtml(a.label) + '</button>';
            }).join('') + '</div>'
          : '') +
        (relevantResolved && (relevantResolved.visible.length || relevantResolved.drawer.length)
          ? '<h5>Who is building here</h5>' + companyDrawerHTML(relevantResolved) : '') +
        (copy && copy.source_note
          ? '<p class="hc-evidence">' + escapeHtml(copy.source_note) + '</p>'
          : methodNote()) +
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
      // Resolve via layer logic: union of pool-layers + step-layers
      var layerIds = []; var seen = {};
      (a.attach_pools || []).forEach(function (pId) {
        ((DATA.poolToLayers || {})[pId] || []).forEach(function (lid) { if (!seen[lid]) { seen[lid] = true; layerIds.push(lid); } });
      });
      (a.attach_steps || []).forEach(function (sId) {
        ((DATA.stepToLayers || {})[sId] || []).forEach(function (lid) { if (!seen[lid]) { seen[lid] = true; layerIds.push(lid); } });
      });
      var resolved = resolveLayerCompanies(layerIds);

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
        ((resolved.visible.length || resolved.drawer.length)
          ? '<h5>Who is building here</h5>' + companyDrawerHTML(resolved) : '') +
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
      // Concise: role tag + 1-sentence description + buyer + value capture.
      // Cross-links to pool / step / AI surface kept as small pills.
      var roleClass = c.role === 'incumbent' ? 'incumbent'
                     : c.role === 'ai-native' ? 'ainative'
                     : c.group === 'dvc' ? 'dvc' : 'drawer';
      var groupTag = '<span class="hc-co-grouptag ' + roleClass + '">' + escapeHtml(roleTagText(c)) + '</span>';
      var layer = c.layer_id && DATA.companyLayers[c.layer_id] ? DATA.companyLayers[c.layer_id] : null;
      var pools = (c.money_pool_ids || []).slice(0, 3).map(function (id) { return DATA.costPools.find(function (p) { return p.id === id; }); }).filter(Boolean);
      var steps = (c.process_step_ids || []).slice(0, 4).map(findStep).filter(Boolean);
      var html = '<div class="hc-drawer">' +
        '<div class="hc-drawer-kind">Company' + (c.outside_nhe ? ' · outside NHE' : '') + '</div>' +
        '<div class="hc-drawer-title">' + escapeHtml(c.name) + ' ' + groupTag + '</div>' +
        (layer ? '<div class="hc-drawer-sub">Layer: ' + escapeHtml(layer.label) + '</div>' : '') +
        '<p>' + escapeHtml(c.short_description) + '</p>' +
        (c.buyer_user || c.value_capture
          ? '<p class="hc-co-meta-line">' +
              (c.buyer_user   ? '<span><strong>Buyer:</strong> ' + escapeHtml(c.buyer_user) + '</span>' : '') +
              (c.value_capture? '<span><strong>Value:</strong> ' + escapeHtml(c.value_capture) + '</span>' : '') +
            '</p>'
          : '') +
        (pools.length
          ? '<div class="hc-pill-row">' +
            pools.map(function (p) { return '<button type="button" class="hc-pill" data-action="pool" data-id="' + p.id + '">' + escapeHtml(p.label) + '</button>'; }).join('') +
            '</div>' : '') +
        (steps.length
          ? '<div class="hc-pill-row">' +
            steps.map(function (s) { return '<button type="button" class="hc-pill" data-action="step" data-id="' + s.id + '">' + escapeHtml(s.id) + '</button>'; }).join('') +
            '</div>' : '') +
        '</div>';
      setInsight(html);
      maybeOpenSheet(html);
    }

    function renderStepDrawer(s) {
      if (!s) return;
      var kind = DATA.careLoop.indexOf(s) >= 0 ? 'Clinical care loop · C1–C8'
              : DATA.financialLoop.indexOf(s) >= 0 ? 'Financial / reimbursement loop · F1–F8'
              : DATA.preventionOrbit.indexOf(s) >= 0 ? 'Prevention / monitoring loop · P1–P5'
              : 'VBC / risk bridge · V1–V5';
      var deps = (DATA.stepStackDeps[s.id] || []).map(findStackLayer).filter(Boolean);
      var ais  = (s.ai || []).map(findAi).filter(Boolean);
      var resolved = resolveForElement('step', s.id);
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
        ((resolved.visible.length || resolved.drawer.length)
          ? '<h5>Who is building here</h5>' + companyDrawerHTML(resolved) : '') +
        '</div>';
      setInsight(html);
      setLoopInsight(html);
      maybeOpenSheet(html);
    }

    function whyStackLayerMatters(stackId) {
      switch (stackId) {
        case 'stack_ai':         return 'This is the application surface — copilots, agents, predictions. Without it nothing automates; with it, every workflow above can be reshaped.';
        case 'stack_workflow':   return 'Where tasks actually happen. Most measurable ROI lives here: scheduling, intake, notes, orders, refills, billing.';
        case 'stack_decision':   return 'Guidelines, payer rules, risk scores. Whoever owns the rules decides what gets paid and what gets done.';
        case 'stack_data':       return 'EHR, claims, labs, imaging, wearables. Whoever owns the data substrate owns the model’s reach.';
        case 'stack_admin':      return 'Benefits, prior auth, coding, claims, RCM. The largest dollar drag in the system and the most direct AI wedge.';
        case 'stack_governance': return 'HIPAA, FDA, audit logs, human oversight. The gate that decides whether an AI feature can ship in clinical settings.';
        case 'stack_infra':      return 'APIs, cloud, identity, interoperability, security. The substrate every other layer assumes.';
        default: return '';
      }
    }

    function renderStackDrawer(sl) {
      if (!sl) return;
      var scenario = DATA.stateScenarios[currentLoopState] || { care: [], financial: [], prevention: [], vbc: [] };
      var activeStepIds = scenario.care.concat(scenario.financial, scenario.prevention, scenario.vbc);
      var activeForThisLayer = activeStepIds.filter(function (sid) {
        return (DATA.stepStackDeps[sid] || []).indexOf(sl.id) >= 0;
      });
      var resolved = resolveForElement('stack', sl.id, { maxDrawer: 5 });

      var stepsHere = [];
      Object.keys(DATA.stepStackDeps).forEach(function (sid) {
        if (DATA.stepStackDeps[sid].indexOf(sl.id) >= 0) stepsHere.push(sid);
      });

      var scenarioLabel = (DATA.patientStates.find(function (x) { return x.id === currentLoopState; }) || {}).label || '';
      var isActive = activeForThisLayer.length > 0;

      var html = '<div class="hc-drawer">' +
        '<div class="hc-drawer-kind">Stack layer' + (isActive ? ' · active' : '') + '</div>' +
        '<div class="hc-drawer-title">' + escapeHtml(sl.label) + '</div>' +
        '<p>' + escapeHtml(sl.contents) + '</p>' +
        (whyStackLayerMatters(sl.id)
          ? '<h5>Why this layer matters</h5><p>' + escapeHtml(whyStackLayerMatters(sl.id)) + '</p>' : '') +
        '<h5>In this scenario · ' + escapeHtml(scenarioLabel) + '</h5>' +
        (activeForThisLayer.length
          ? '<p>Active for ' + activeForThisLayer.length + ' step' + (activeForThisLayer.length === 1 ? '' : 's') + ' in this scenario.</p>' +
            '<div class="hc-pill-row">' +
            activeForThisLayer.map(function (sid) {
              var st = findStep(sid);
              return '<button type="button" class="hc-pill" data-action="step" data-id="' + sid + '">' +
                escapeHtml(sid + (st ? ' · ' + st.label : '')) + '</button>';
            }).join('') + '</div>'
          : '<p class="hc-empty">Not directly activated for the current patient state.</p>') +
        ((resolved.visible.length || resolved.drawer.length)
          ? '<h5>Who is building here</h5>' + companyDrawerHTML(resolved) : '') +
        (stepsHere.length
          ? '<h5>All loop steps that depend on this layer</h5><div class="hc-pill-row">' +
            stepsHere.map(function (sid) {
              var st = findStep(sid);
              return '<button type="button" class="hc-pill" data-action="step" data-id="' + sid + '">' +
                escapeHtml(sid + (st ? ' · ' + st.label : '')) + '</button>';
            }).join('') + '</div>' : '') +
        '</div>';
      setInsight(html);
      setLoopInsight(html);
      maybeOpenSheet(html);
    }

    // ===================================================================
    // BIOTECH SIDECAR DRAWER (combines L13 + L14 — both OUTSIDE NHE)
    // ===================================================================
    function openBiotechDrawer() {
      var sc = DATA.biotechSidecar;
      var combined = { visible: [], drawer: [], primaryLayer: 'L14_drug_discovery' };
      var seen = {};
      function push(arr, cid) {
        if (!cid || !coById[cid] || seen[cid]) return;
        seen[cid] = true; arr.push(coById[cid]);
      }
      (sc.layers || []).forEach(function (lid) {
        var L = DATA.companyLayers[lid]; if (!L) return;
        (L.pair || []).forEach(function (cid) { push(combined.visible, cid); });
      });
      // Cap visible at 3
      if (combined.visible.length > 3) combined.visible = combined.visible.slice(0, 3);
      (sc.layers || []).forEach(function (lid) {
        var L = DATA.companyLayers[lid]; if (!L) return;
        (L.drawer || []).forEach(function (cid) { push(combined.drawer, cid); });
      });
      combined.drawer = combined.drawer.slice(0, 5);

      state.selection = { kind: 'biotech', id: 'biotech_sidecar' };
      reflectResetButton();

      var html = '<div class="hc-drawer">' +
        '<div class="hc-drawer-kind">Outside NHE</div>' +
        '<div class="hc-drawer-title">' + escapeHtml(sc.title) + '</div>' +
        '<p>' + escapeHtml(sc.body) + '</p>' +
        '<p class="hc-aside">These layers are visually linked to Retail Rx because commercialized drugs enter NHE through retail dispensing — but the R&D capital and pharma-intelligence SaaS sit outside the $5.3T system.</p>' +
        '<h5>Who is building here</h5>' + companyDrawerHTML(combined) +
        '<p class="hc-evidence">Pharma R&D and pharma intelligence are B2B markets to pharma/biotech, not healthcare-payer reimbursement. Do not place these companies inside hospital/clinical/claims flows.</p>' +
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
          // Switching view does not count as a selection but refreshes
          // the empty-state hint so Companies mode shows its message.
          if (!state.selection) defaultInsight();
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
      else if (s.kind === 'biotech') openBiotechDrawer();
    }

    // Insight panel pill/button delegation (shared handler for both the
    // global Money River insight panel and the per-loop drawer panel).
    function pillClickHandler(ev) {
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
      else if (action === 'biotech') openBiotechDrawer();
    }
    if (insightEl) insightEl.addEventListener('click', pillClickHandler);
    if (loopInsightEl) loopInsightEl.addEventListener('click', pillClickHandler);

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

    // Geometry: 1180 x 880 viewBox.
    //   Top zone   y <= 595   — care loop, financial loop, VBC rail, prevention loop
    //   Stack zone y >= 660   — tech stack bands, visually separated by divider
    var LOOP_VB = { w: 1180, h: 880 };
    var STACK = { x: 60, y: 695, w: 1060, h: 175, bands: 7 };

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

      // Per-group active counts drive whether a group renders as
      // "active" (full colour) or "inactive" (muted outline only).
      var groupActiveCount = {
        pg_care:       scenario.care.length,
        pg_financial:  scenario.financial.length,
        pg_prevention: scenario.prevention.length,
        pg_vbc:        scenario.vbc.length
      };
      function groupIsActive(gid) { return (groupActiveCount[gid] || 0) > 0; }

      // arrow defs
      var defs = svgEl('defs', {});
      function marker(id, fill) {
        var m = svgEl('marker', { id: id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
        svgEl('path', { d: 'M0,0 L10,5 L0,10 z', fill: fill }, m);
      }
      marker('hcl-arrow-care', '#4ECDC4');
      marker('hcl-arrow-fin',  '#F5C542');
      marker('hcl-arrow-prev', '#FF8C42');
      marker('hcl-arrow-vbc',  '#7C4DFF');
      marker('hcl-arrow-bridge','#7C4DFF');

      // ----- Group hulls (subtle outlines for each named process path)
      // These give every node a visible group membership even when its
      // group is inactive for the current patient state. No floating
      // boxes: every step belongs to exactly one named track.
      var hullG = svgEl('g', { class: 'loop-hulls' });
      function hullPath(d, cls) {
        return svgEl('path', { class: cls, d: d, fill: 'none' }, hullG);
      }
      // Care loop hull — upper arc around C1..C7 with C8 tucked inside.
      var careHullActive = groupIsActive('pg_care');
      hullPath('M 285 285 Q 285 70 620 70 Q 955 70 955 285 Q 955 415 800 415',
        'group-hull is-care' + (careHullActive ? ' is-active' : ' is-dim'));
      // Financial loop hull — lower arc.
      var finHullActive = groupIsActive('pg_financial');
      hullPath('M 285 360 Q 285 580 620 580 Q 955 580 955 360',
        'group-hull is-fin' + (finHullActive ? ' is-active' : ' is-dim'));
      // Prevention loop hull — right-side closed loop, set off from
      // the care loop by a clear gutter and wide enough to contain the
      // full P node rectangles.
      var prevHullActive = groupIsActive('pg_prevention');
      hullPath('M 950 195 Q 1170 195 1170 360 Q 1170 525 960 555 Q 870 540 895 480',
        'group-hull is-prev' + (prevHullActive ? ' is-active' : ' is-dim'));
      // VBC bridge hull — left rail, flush-left so V1 doesn't crowd Triage.
      // Hull is wider at the bottom because V3..V5 cascade rightward.
      var vbcHullActive = groupIsActive('pg_vbc');
      hullPath('M 12 180 L 195 180 L 260 555 L 12 555 Z',
        'group-hull is-vbc' + (vbcHullActive ? ' is-active' : ' is-dim'));

      // Track labels — every node belongs to a named process group.
      // Placed in dedicated gutters so they never collide with nodes or
      // bridge edges.
      svgEl('text', { class: 'loop-label care', x: 620, y: 52, 'text-anchor': 'middle' })
        .textContent = '① CLINICAL CARE LOOP · C1–C8 — patient workflow, clockwise';
      svgEl('text', { class: 'loop-label fin',  x: 620, y: 622, 'text-anchor': 'middle' })
        .textContent = '② FINANCIAL / REIMBURSEMENT LOOP · F1–F8 — counterclockwise';
      svgEl('text', { class: 'loop-label prev', x: 1115, y: 170, 'text-anchor': 'end' })
        .textContent = '③ PREVENTION / MONITORING · P1–P5';
      svgEl('text', { class: 'loop-label prev sub', x: 1115, y: 183, 'text-anchor': 'end' })
        .textContent = 'feeds C2 triage · receives C8 discharge';
      svgEl('text', { class: 'loop-label vbc',  x: 115, y: 170, 'text-anchor': 'middle' })
        .textContent = '④ VBC / RISK BRIDGE · V1–V5';
      svgEl('text', { class: 'loop-label vbc sub', x: 115, y: 183, 'text-anchor': 'middle' })
        .textContent = 'funds prevention via V5 → C8';

      // Center patient card
      var cardX = 510, cardY = 245, cardW = 220, cardH = 115;
      var cg = svgEl('g', { class: 'patient-center', transform: 'translate(' + (cardX + cardW/2) + ',' + (cardY + cardH/2) + ')' });
      svgEl('rect', { x: -cardW/2, y: -cardH/2, width: cardW, height: cardH, rx: 14, fill: 'rgba(0,0,0,0.55)', stroke: stateInfo ? stateInfo.color : '#4ECDC4', 'stroke-width': 2 }, cg);
      svgEl('text', { class: 'patient-label', x: 0, y: -34, 'text-anchor': 'middle' }, cg).textContent = 'Patient state';
      svgEl('text', { class: 'patient-state', x: 0, y: -10, 'text-anchor': 'middle', fill: stateInfo ? stateInfo.color : '#4ECDC4' }, cg).textContent = stateInfo ? stateInfo.label : '';
      svgEl('text', { class: 'patient-prompt', x: 0, y: 14, 'text-anchor': 'middle' }, cg).textContent = stateInfo ? stateInfo.prompt : '';
      svgEl('text', { class: 'patient-scenario', x: 0, y: 38, 'text-anchor': 'middle' }, cg).textContent = scenario.scenario || '';

      // Loop arc geometry (used only for routing — no dashed guide ellipses)
      var careCx = 620, careCy = 245, careRx = 360, careRy = 175;
      var finCx  = 620, finCy  = 385, finRx  = 360, finRy  = 175;

      // Active-only arrows along ellipse paths
      drawLoopActiveArrows(DATA.careLoop, careActive, careCx, careCy, careRx, careRy, true,  'care', 'hcl-arrow-care');
      drawLoopActiveArrows(DATA.financialLoop, finActive, finCx, finCy, finRx, finRy, false, 'fin',  'hcl-arrow-fin');

      // Step nodes
      DATA.careLoop.forEach(function (s) { drawStepNode(s, 'care', !!careActive[s.id]); });
      DATA.financialLoop.forEach(function (s) { drawStepNode(s, 'fin', !!finActive[s.id]); });

      // VBC bridge (left rail) — drawn as part of the named VBC track
      var vbcG = svgEl('g', { class: 'vbc-bridge' });
      DATA.vbcBridge.forEach(function (v) { drawRailNode(v, 'vbc', !!vbcActive[v.id], vbcG); });
      for (var i = 0; i < DATA.vbcBridge.length - 1; i++) {
        var a = DATA.vbcBridge[i], b = DATA.vbcBridge[i + 1];
        var aOn = !!vbcActive[a.id], bOn = !!vbcActive[b.id];
        if (!(aOn && bOn)) continue;
        svgEl('path', { class: 'vbc-link is-active',
          d: 'M ' + a.x + ' ' + (a.y + 16) + ' Q ' + ((a.x + b.x)/2 - 18) + ' ' + ((a.y + b.y)/2) + ' ' + b.x + ' ' + (b.y - 16),
          fill: 'none', stroke: 'rgba(124,77,255,0.7)', 'stroke-width': 1.6, 'marker-end': 'url(#hcl-arrow-vbc)' }, vbcG);
      }

      // Prevention loop — drawn as a real loop on the right.
      // Sequence: P1 → P2 → P3 → P4 → P5 → (close back to P1).
      var preG = svgEl('g', { class: 'prevention-orbit' });
      DATA.preventionOrbit.forEach(function (p) { drawRailNode(p, 'prev', !!prevActive[p.id], preG); });
      function preventionEdge(pa, pb) {
        if (!(prevActive[pa.id] && prevActive[pb.id])) return;
        var mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
        // Bulge outward (to the right) so the arrows clearly trace a loop.
        var bx = mx + 36, by = my;
        svgEl('path', { class: 'prev-link is-active',
          d: 'M ' + pa.x + ' ' + (pa.y + 16) + ' Q ' + bx + ' ' + by + ' ' + pb.x + ' ' + (pb.y - 16),
          fill: 'none', stroke: 'rgba(255,140,66,0.75)', 'stroke-width': 1.6, 'marker-end': 'url(#hcl-arrow-prev)' }, preG);
      }
      for (var j = 0; j < DATA.preventionOrbit.length - 1; j++) {
        preventionEdge(DATA.preventionOrbit[j], DATA.preventionOrbit[j + 1]);
      }
      // Close the prevention loop: P5 → P1 (when both active)
      if (prevActive.P5 && prevActive.P1) {
        var p5 = DATA.preventionOrbit[4], p1 = DATA.preventionOrbit[0];
        svgEl('path', { class: 'prev-link is-active',
          d: 'M ' + (p5.x - 70) + ' ' + p5.y + ' C ' + 905 + ' ' + 420 + ' ' + 940 + ' ' + 230 + ' ' + (p1.x - 70) + ' ' + p1.y,
          fill: 'none', stroke: 'rgba(255,140,66,0.55)', 'stroke-width': 1.4, 'marker-end': 'url(#hcl-arrow-prev)', 'stroke-dasharray': '4 4' }, preG);
      }

      // Cross-track bridge edges (data-driven). These remove the
      // "prevention orbits in space" impression by tying prevention to
      // Signal/Triage and to Monitor/Discharge.
      var bridgeG = svgEl('g', { class: 'loop-bridges' });
      function findAnyStep(id) {
        return DATA.careLoop.concat(DATA.financialLoop, DATA.preventionOrbit, DATA.vbcBridge)
          .find(function (s) { return s.id === id; });
      }
      function isStepActive(id) {
        return !!(careActive[id] || finActive[id] || prevActive[id] || vbcActive[id]);
      }
      // Route bridge edges so the control point bows away from the
      // patient card and the loop nodes. Label sits offset from the
      // control point along the perpendicular so it never overlaps
      // either the edge or the node text.
      var patientCx = cardX + cardW / 2, patientCy = cardY + cardH / 2;
      (DATA.loopBridgeEdges || []).forEach(function (e) {
        if (!isStepActive(e.from) || !isStepActive(e.to)) return;
        var a = findAnyStep(e.from), b = findAnyStep(e.to);
        if (!a || !b) return;
        var stroke = e.kind === 'bridge' ? 'rgba(124,77,255,0.65)' : 'rgba(255,140,66,0.55)';
        var marker = e.kind === 'bridge' ? 'url(#hcl-arrow-bridge)' : 'url(#hcl-arrow-prev)';
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var ax = mx - patientCx, ay = my - patientCy;
        var alen = Math.hypot(ax, ay) || 1;
        // Push control point outward from patient card center.
        var bow = 38;
        var cx = mx + (ax / alen) * bow;
        var cy = my + (ay / alen) * bow;
        // Trim endpoints to the node rims so arrowheads do not collide
        // with the node rectangles.
        function trim(p, tx, ty, r) {
          var vx = tx - p.x, vy = ty - p.y;
          var l = Math.hypot(vx, vy) || 1;
          return { x: p.x + (vx / l) * r, y: p.y + (vy / l) * r };
        }
        var startR = 28, endR = 28;
        var s = trim(a, cx, cy, startR);
        var t = trim(b, cx, cy, endR);
        svgEl('path', {
          class: 'loop-bridge-edge is-' + e.kind,
          d: 'M ' + s.x + ' ' + s.y + ' Q ' + cx + ' ' + cy + ' ' + t.x + ' ' + t.y,
          fill: 'none', stroke: stroke, 'stroke-width': 1.4,
          'stroke-dasharray': '5 4', 'marker-end': marker
        }, bridgeG);
        // Place the label outside the control point, perpendicular to
        // the chord, so it doesn't sit on top of the curve.
        var lx = cx + (ax / alen) * 8;
        var ly = cy + (ay / alen) * 8 - 4;
        svgEl('text', {
          class: 'bridge-label', x: lx, y: ly, 'text-anchor': 'middle',
          fill: e.kind === 'bridge' ? 'rgba(124,77,255,0.85)' : 'rgba(255,140,66,0.85)'
        }, bridgeG).textContent = e.label;
      });

      // ----- Tech stack underneath the process visual -----
      // Explicit divider so the stack reads as a separate panel below the
      // process map, not a sixth track competing for attention. The
      // divider sits between the financial loop label and the stack
      // header, with breathing room on either side.
      var bandH = STACK.h / STACK.bands;
      var dividerY = STACK.y - 38;
      svgEl('line', {
        class: 'stack-divider',
        x1: 40, x2: LOOP_VB.w - 40, y1: dividerY, y2: dividerY,
        stroke: 'rgba(160,168,188,0.22)', 'stroke-width': 1
      });
      var stackG = svgEl('g', { class: 'stack-group' });
      svgEl('text', { class: 'rail-title', x: STACK.x + 6, y: STACK.y - 16, 'text-anchor': 'start' }, stackG).textContent =
        'TECH STACK — every process above depends on these layers';
      svgEl('text', { class: 'rail-sub', x: STACK.x + STACK.w - 6, y: STACK.y - 16, 'text-anchor': 'end' }, stackG)
        .textContent = 'Click any band to see the layer drawer';

      // Company examples are drawer-only on stack bands. Showing chips
      // inline forced narrow scenes that clipped on desktop; the band
      // now shows the layer name, its contents, and a quiet "N companies"
      // count that opens the drawer with the full list.
      DATA.sharedStack.forEach(function (s, idx) {
        var y = bandY(idx);
        var active = !!stackActive[s.id];
        var g = svgEl('g', { class: 'stack-band' + (active ? ' is-active' : ''), 'data-id': s.id, tabindex: 0, role: 'button', 'aria-label': s.label + ' stack layer' + (active ? ' (active for this scenario)' : '') }, stackG);
        svgEl('rect', { class: 'band-bg', x: STACK.x, y: y, width: STACK.w, height: bandH - 3, rx: 6 }, g);
        svgEl('text', { class: 'band-label', x: STACK.x + 12, y: y + bandH / 2 + 4 }, g).textContent = s.label;
        svgEl('text', { class: 'band-contents', x: STACK.x + 170, y: y + bandH / 2 + 4 }, g).textContent = s.contents;

        var bandLayers = (DATA.stackToLayers && DATA.stackToLayers[s.id]) || [];
        var activeLayerSet = {};
        activeStepIds.forEach(function (sid) {
          ((DATA.stepToLayers || {})[sid] || []).forEach(function (lid) { activeLayerSet[lid] = true; });
        });
        var matchedLayers = bandLayers.filter(function (lid) { return !!activeLayerSet[lid]; });
        var bandResolved = resolveLayerCompanies(matchedLayers, { maxDrawer: 8 });
        var coCount = bandResolved.visible.length;
        var hintTxt = coCount === 0
          ? '— no examples in this scenario'
          : coCount + (coCount === 1 ? ' example' : ' examples') + ' · click for drawer';
        svgEl('text', {
          class: 'band-co-hint',
          x: STACK.x + STACK.w - 14,
          y: y + bandH / 2 + 4,
          'text-anchor': 'end'
        }, g).textContent = hintTxt;

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
          listFor(DATA.careLoop, careActive, 'Clinical care loop · C1–C8') +
          listFor(DATA.financialLoop, finActive, 'Financial / reimbursement loop · F1–F8') +
          listFor(DATA.preventionOrbit, prevActive, 'Prevention / monitoring loop · P1–P5') +
          listFor(DATA.vbcBridge, vbcActive, 'VBC / risk bridge · V1–V5');
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
      var w = 118, h = 36;
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
      var w = 168, h = 32;
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
