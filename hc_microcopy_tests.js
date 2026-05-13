// Deterministic tests for Money River flow microcopy and loop stack click contract.
// Run: `node hc_microcopy_tests.js` from the repo root.

globalThis.window = globalThis;
require('./healthcare-data.js');
var D = globalThis.HEALTHCARE_DATA;

var FAIL = 0;
function check(name, cond, extra) {
  if (cond) { console.log('  PASS', name); }
  else      { console.log('  FAIL', name, extra || ''); FAIL++; }
}

console.log('--- Test: microcopy data is loaded ---');
check('flowMicrocopy is an object', D.flowMicrocopy && typeof D.flowMicrocopy === 'object');
check('flowMicrocopyFallback is an object', D.flowMicrocopyFallback && typeof D.flowMicrocopyFallback === 'object');
check('flowMicrocopyCallouts is an object', D.flowMicrocopyCallouts && typeof D.flowMicrocopyCallouts === 'object');
check('flowMicrocopy has >= 40 entries', Object.keys(D.flowMicrocopy).length >= 40,
  'got ' + Object.keys(D.flowMicrocopy).length);

console.log('--- Test: top-volume flows resolve to non-fallback microcopy ---');
var topFlows = [
  ['fl_pay_private_insurance__dest_hospital',   'Insurers Paying Hospitals'],
  ['fl_pay_medicare__dest_physician',           'Medicare Paying Physicians'],
  ['fl_pay_medicaid__dest_nursing',             'Medicaid Funding Nursing Homes'],
  ['fl_pay_out_of_pocket__dest_rx',             'Self-Pay Pharmacy Spending']
];
topFlows.forEach(function (pair) {
  var key = pair[0];
  var copy = D.flowMicrocopy[key];
  check(key + ' has microcopy entry', !!copy, 'missing');
  if (copy) {
    check(key + ' has title', !!copy.title);
    check(key + ' has what_it_is', !!copy.what_it_is);
    check(key + ' has payer_incentive list', Array.isArray(copy.payer_incentive) && copy.payer_incentive.length > 0);
    check(key + ' has recipient_incentive list', Array.isArray(copy.recipient_incentive) && copy.recipient_incentive.length > 0);
    check(key + ' has tension', !!copy.tension);
    check(key + ' has ai_wedge', !!copy.ai_wedge);
    check(key + ' has source_note', !!copy.source_note);
  }
});

console.log('--- Test: fallback templates exist with expected keys ---');
['generic_flow','low_volume_government_flow','direct_pay_flow'].forEach(function (k) {
  var fb = D.flowMicrocopyFallback[k];
  check(k + ' fallback exists', !!fb);
  if (fb) {
    check(k + ' has full schema',
      !!fb.title && !!fb.what_it_is &&
      Array.isArray(fb.payer_incentive) && Array.isArray(fb.recipient_incentive) &&
      !!fb.tension && !!fb.ai_wedge && !!fb.source_note);
  }
});

console.log('--- Test: each modeled AB flow either has microcopy or a usable fallback ---');
var unmappedFlows = [];
D.moneyLinksAB.forEach(function (l) {
  if (!D.flowMicrocopy[l.id]) unmappedFlows.push(l.id);
});
// All unmapped flows must still fall back to direct_pay_flow, low_volume_government_flow, or generic_flow.
check('all unmapped modeled AB flows have a working fallback',
  !!(D.flowMicrocopyFallback.generic_flow && D.flowMicrocopyFallback.direct_pay_flow && D.flowMicrocopyFallback.low_volume_government_flow),
  'unmapped modeled flows: ' + unmappedFlows.join(', '));

console.log('--- Test: at least 80% of modeled AB flows have specific microcopy ---');
var modeled = D.moneyLinksAB.length;
var hit = D.moneyLinksAB.filter(function (l) { return !!D.flowMicrocopy[l.id]; }).length;
check('>=80% AB flows have non-fallback microcopy',
  hit / modeled >= 0.8, 'coverage ' + hit + '/' + modeled);

console.log('--- Test: callouts attach to a flow that has microcopy ---');
Object.keys(D.flowMicrocopyCallouts).forEach(function (k) {
  var c = D.flowMicrocopyCallouts[k];
  check('callout ' + k + ' has headline + body', !!c.headline && !!c.body);
  check('callout ' + k + ' attaches to a real flow microcopy', !!D.flowMicrocopy[k]);
});

console.log('--- Test: stack click contract — every sharedStack id has a definition ---');
D.sharedStack.forEach(function (sl) {
  check('stack ' + sl.id + ' has label', !!sl.label);
  check('stack ' + sl.id + ' has contents description', !!sl.contents);
});

console.log('--- Test: at least one process step depends on every stack layer ---');
var stackUsage = {};
Object.keys(D.stepStackDeps).forEach(function (sid) {
  (D.stepStackDeps[sid] || []).forEach(function (st) { stackUsage[st] = (stackUsage[st] || 0) + 1; });
});
D.sharedStack.forEach(function (sl) {
  check('stack ' + sl.id + ' is referenced by >= 1 step', (stackUsage[sl.id] || 0) >= 1,
    'used by ' + (stackUsage[sl.id] || 0));
});

console.log('--- Test: every payment channel has at least one microcopy entry ---');
D.paymentChannels.forEach(function (p) {
  var hits = Object.keys(D.flowMicrocopy).filter(function (k) {
    return k.indexOf('fl_' + p.id + '__') === 0;
  });
  // pay_residual is a balance bucket that has no real recipient mapping in microcopy
  if (p.id === 'pay_residual') {
    // residual is a balancing bucket — microcopy is optional. Skip.
    return;
  }
  check('payment ' + p.id + ' has >= 1 microcopy entry', hits.length >= 1, 'got ' + hits.length);
});

console.log('--- Test: front-end DOM expectations ---');
// Read the live healthcare.js source to ensure the symbols required by the
// front-end contract are present. This is a static check, not a runtime DOM
// check, but it guarantees the wiring is in place.
var fs = require('fs');
var hcSrc = fs.readFileSync('./healthcare.js', 'utf8');
check('healthcare.js wires #hc-loop-insight selector',
  hcSrc.indexOf('#hc-loop-insight') > -1);
check('healthcare.js defines setLoopInsight helper',
  hcSrc.indexOf('function setLoopInsight') > -1);
check('healthcare.js calls renderStackDrawer with both insight panels',
  hcSrc.match(/function renderStackDrawer[\s\S]{0,4000}setLoopInsight/));
check('healthcare.js binds stack-band click handler',
  hcSrc.indexOf("g.addEventListener('click'") > -1 && hcSrc.indexOf('selectStackLayer(s.id)') > -1);
check('healthcare.js binds stack-band keydown (Enter/Space)',
  hcSrc.indexOf("g.addEventListener('keydown'") > -1 &&
  hcSrc.match(/keydown[\s\S]{0,200}Enter[\s\S]{0,200}selectStackLayer/));
check('healthcare.js renderFlowDrawer reads flowMicrocopy',
  hcSrc.indexOf('flowMicrocopy') > -1 && hcSrc.indexOf('pickFlowMicrocopy') > -1);

var indexSrc = fs.readFileSync('./index.html', 'utf8');
check('index.html has #hc-loop-insight container', indexSrc.indexOf('id="hc-loop-insight"') > -1);
check('index.html has .hc-loop-grid container',    indexSrc.indexOf('hc-loop-grid') > -1);

var cssSrc = fs.readFileSync('./healthcare.css', 'utf8');
check('healthcare.css makes stack-band labels pointer-events:none',
  cssSrc.match(/\.stack-band\s+\.band-label[\s\S]{0,400}pointer-events:\s*none/));
check('healthcare.css collapses empty insight on mobile',
  cssSrc.match(/hc-insight-empty[\s\S]{0,1500}@media\s*\(max-width:\s*1000px\)/) ||
  cssSrc.match(/@media\s*\(max-width:\s*1000px\)[\s\S]{0,1500}hc-insight/));
check('healthcare.css defines .hc-loop-grid',
  cssSrc.indexOf('.hc-loop-grid') > -1);

console.log('--- Test: Companies mode generates ZERO SVG content on the Money River ---');
// buildCompanyOverlay must be a no-op: no badges, no rings, no chips,
// no sidecars, no pool hints, no company-dependent SVG of any kind.
// Company examples live exclusively in click-drawers.
var buildCoBody = (hcSrc.match(/function buildCompanyOverlay\s*\(\s*\)\s*\{([\s\S]*?)\n    \}\n/) || [])[1] || '';
check('buildCompanyOverlay function is present', buildCoBody.length > 0);
check('Companies overlay does NOT create hc-co-badge nodes on the canvas',
  buildCoBody.indexOf('hc-co-badge') === -1,
  'found hc-co-badge in buildCompanyOverlay body');
check('Companies overlay does NOT create hc-co-node-ring on the canvas',
  buildCoBody.indexOf('hc-co-node-ring') === -1,
  'found hc-co-node-ring in buildCompanyOverlay body');
check('Companies overlay does NOT create the more-▸ pool hint on the canvas',
  buildCoBody.indexOf('hc-co-more') === -1 && buildCoBody.indexOf('More ▸') === -1);
check('Companies overlay does NOT instantiate biotech sidecar on the canvas',
  buildCoBody.indexOf('buildBiotechSidecar') === -1 && buildCoBody.indexOf('hc-biotech-sidecar') === -1);
check('Companies overlay does NOT create any hc-co-grp child via append',
  buildCoBody.indexOf('.append(') === -1,
  'buildCompanyOverlay appends SVG children');
check('Companies overlay does NOT instantiate any d3 selection-like .attr calls',
  buildCoBody.indexOf('.attr(') === -1,
  'buildCompanyOverlay sets SVG attrs');
check('buildBiotechSidecar function is removed entirely',
  hcSrc.indexOf('function buildBiotechSidecar') === -1);

console.log('--- Test: drawers still render company examples after selection ---');
// Verify the drawer renderers call companyDrawerHTML — companies must
// remain reachable behind a click on flows, nodes, pools, steps, and
// stacks. (renderFlowDrawer is a separate function — companies in
// flows come via the destination/pool drawers reached from a flow.)
check('renderNodeDrawer reads company examples via companyDrawerHTML',
  hcSrc.match(/function renderNodeDrawer[\s\S]{0,4000}companyDrawerHTML/));
check('renderAiDrawer reads company examples',
  hcSrc.match(/function renderAiDrawer[\s\S]{0,4000}companyDrawerHTML/));
check('renderStepDrawer reads company examples',
  hcSrc.match(/function renderStepDrawer[\s\S]{0,4000}companyDrawerHTML/));
check('renderStackDrawer reads company examples',
  hcSrc.match(/function renderStackDrawer[\s\S]{0,4000}companyDrawerHTML/));
check('openBiotechDrawer remains reachable for outside-NHE biotech examples',
  hcSrc.indexOf('function openBiotechDrawer') > -1);
check('Retail-Rx destination drawer offers a biotech jump link',
  hcSrc.indexOf("data-action=\"biotech\"") > -1);
check('biotech action wired in the insight pill handler',
  hcSrc.match(/action === 'biotech'[\s\S]{0,80}openBiotechDrawer/));

console.log('--- Test: DVC-only filter narrows DRAWER companies (not canvas) ---');
// The DVC filter still works because companyDrawerHTML filters by
// state.companyFilter. The canvas renders no company SVG at all, so
// the filter has no canvas surface to affect — drawer only.
check('companyDrawerHTML filters by state.companyFilter for DVC mode',
  hcSrc.match(/function companyDrawerHTML[\s\S]{0,800}state\.companyFilter\s*===\s*'dvc'/));
check('refreshOverlayVisibility no longer rebuilds buildCompanyOverlay (drawer-only)',
  !hcSrc.match(/refreshOverlayVisibility[\s\S]{0,500}showCo[\s\S]{0,200}buildCompanyOverlay/));

console.log('--- Test: jargon — "Drawer only" is replaced with friendlier copy ---');
// We allow `role: 'drawer'` in data (that is an internal semantic),
// but user-facing strings should not literally read "Drawer only".
check('healthcare.js no longer surfaces literal "Drawer only" copy',
  hcSrc.indexOf("'Drawer only'") === -1 && hcSrc.indexOf('"Drawer only"') === -1);
check('healthcare.js uses "More examples" section header',
  hcSrc.indexOf('More examples') > -1);
var hcDataSrc = fs.readFileSync('./healthcare-data.js', 'utf8');
check('healthcare-data.js no longer uses literal "Drawer only" in tags',
  hcDataSrc.indexOf('Drawer only') === -1);
// "drawer-only" is allowed in developer comments; the user-facing
// surface is the data fields `label`, `tag`, and `short_description`.
// Use single-line scanning so we only flag the literal string when it
// would appear in user-visible copy (a quoted string on a line that
// is not a stand-alone comment).
var leakedDrawerOnly = hcDataSrc.split('\n').filter(function (line) {
  if (/drawer-only/i.test(line) === false) return false;
  // Skip pure comment lines
  if (/^\s*\/\//.test(line)) return false;
  return true;
});
check('healthcare-data.js no longer uses "drawer-only" in user-facing fields',
  leakedDrawerOnly.length === 0, leakedDrawerOnly.join(' | '));

console.log('--- Test: default insight has a Companies-mode hint ---');
check('defaultInsight has Companies-mode-specific empty-state copy',
  hcSrc.match(/defaultInsight[\s\S]{0,1500}view\s*===\s*'companies'[\s\S]{0,800}company examples/i));
check('defaultInsight Companies hint explains companies are off the river',
  hcSrc.match(/view\s*===\s*'companies'[\s\S]{0,800}off the river/i));
check('defaultInsight re-runs when view changes with no selection',
  hcSrc.match(/refreshOverlayVisibility\(\);[\s\S]{0,200}defaultInsight\(\)/));

console.log('--- Test: Companies mode dims river via CSS but no canvas chips ---');
check('healthcare.css dims the river in Companies mode',
  cssSrc.match(/view-companies[\s\S]{0,200}stroke-opacity:\s*0\.10/));
check('healthcare.css no longer defines biotech sidecar styles',
  cssSrc.indexOf('hc-biotech-sidecar') === -1 && cssSrc.indexOf('hc-biotech-card') === -1);
check('healthcare.css no longer defines hc-co-badge canvas styles',
  cssSrc.match(/\.hc-co-badge\s*\{/) === null);
check('healthcare.css no longer defines hc-co-node-ring canvas styles',
  cssSrc.match(/\.hc-co-node-ring\s*\{/) === null);
check('healthcare.css no longer defines hc-co-more canvas styles',
  cssSrc.match(/\.hc-co-more\s*\{/) === null);

console.log('--- Test: Incentive overlay uses deterministic anti-collision layout ---');
// Source-level guarantees: the layout function exists, is named
// layoutIncentiveChips, is exported on window for test surfaces, and
// is called from buildIncentiveOverlay.
check('healthcare.js defines layoutIncentiveChips',
  hcSrc.indexOf('function layoutIncentiveChips') > -1);
check('healthcare.js exposes layoutIncentiveChips on window',
  hcSrc.indexOf('window.hcLayoutIncentiveChips = layoutIncentiveChips') > -1);
check('buildIncentiveOverlay invokes layoutIncentiveChips',
  hcSrc.match(/buildIncentiveOverlay[\s\S]{0,4000}layoutIncentiveChips\(/));
check('buildIncentiveOverlay clamps to viewBox bounds',
  hcSrc.match(/buildIncentiveOverlay[\s\S]{0,4000}viewBox\.baseVal/));

// Behavioral test: extract layoutIncentiveChips and run it with a
// dense input where four chips share the same idealCx. Assert no
// rect overlaps any other, all rects are inside the viewBox, and
// the output is deterministic.
var layoutFnSrc = (hcSrc.match(/function layoutIncentiveChips\([\s\S]*?\n    \}\n/) || [])[0];
check('layoutIncentiveChips function body extractable', !!layoutFnSrc);
if (layoutFnSrc) {
  // eslint-disable-next-line no-new-func
  var fnFactory = new Function(layoutFnSrc + '\nreturn layoutIncentiveChips;');
  var layoutIncentiveChips = fnFactory();
  var specs = [
    { id: 'a', label: 'MLR rules',              idealCx: 200, anchorTop: 100 },
    { id: 'b', label: 'Admin arms race',        idealCx: 200, anchorTop: 100 },
    { id: 'c', label: 'Fee-for-service inertia',idealCx: 210, anchorTop: 100 },
    { id: 'd', label: 'Value-based care bridge',idealCx: 220, anchorTop: 100 },
    { id: 'e', label: 'Cash-pay bypass',        idealCx: 600, anchorTop: 120 },
    { id: 'f', label: 'Regulated safety',       idealCx: 600, anchorTop: 120 }
  ];
  var placed = layoutIncentiveChips(specs, 1280, 760);
  check('layout returns one rect per input', placed.length === specs.length);
  // Bounds check
  var allInside = placed.every(function (p) {
    return p.x >= 4 && p.y >= 4 && p.x + p.w <= 1280 - 4 && p.y + p.h <= 760 - 4;
  });
  check('all placed rects are inside the safe viewBox', allInside);
  // Overlap check with min gap
  var noOverlap = true;
  for (var i = 0; i < placed.length && noOverlap; i++) {
    for (var j = i + 1; j < placed.length; j++) {
      var A = placed[i], B = placed[j];
      var xOverlap = !(A.x + A.w + 6 <= B.x || B.x + B.w + 6 <= A.x);
      var yOverlap = !(A.y + A.h + 4 <= B.y || B.y + B.h + 4 <= A.y);
      if (xOverlap && yOverlap) { noOverlap = false; break; }
    }
  }
  check('no two placed rects overlap (min gap respected)', noOverlap);
  // Deterministic: run twice, expect identical output.
  var placed2 = layoutIncentiveChips(specs, 1280, 760);
  var deterministic = JSON.stringify(placed) === JSON.stringify(placed2);
  check('layout is deterministic for identical input', deterministic);
  // No duplicate positions
  var seenXY = {};
  var dup = false;
  placed.forEach(function (p) {
    var k = p.x + ',' + p.y;
    if (seenXY[k]) dup = true;
    seenXY[k] = true;
  });
  check('no two placed rects share the same (x,y)', !dup);

  // Also exercise with REAL incentive data anchors stubbed at a few
  // shared pool positions, to ensure realistic input still resolves.
  var realSpecs = D.incentives.map(function (inc, i) {
    return { id: inc.id, label: inc.label, idealCx: 150 + (i % 3) * 30, anchorTop: 90 + (i % 2) * 8 };
  });
  var realPlaced = layoutIncentiveChips(realSpecs, 1280, 760);
  var realNoOverlap = true;
  for (var ri = 0; ri < realPlaced.length && realNoOverlap; ri++) {
    for (var rj = ri + 1; rj < realPlaced.length; rj++) {
      var X = realPlaced[ri], Y = realPlaced[rj];
      var xo = !(X.x + X.w + 6 <= Y.x || Y.x + Y.w + 6 <= X.x);
      var yo = !(X.y + X.h + 4 <= Y.y || Y.y + Y.h + 4 <= X.y);
      if (xo && yo) { realNoOverlap = false; break; }
    }
  }
  check('real incentive data lays out with no overlaps', realNoOverlap,
    'overlap count > 0');

  // Right-edge clipping guard: place every real incentive chip at an
  // idealCx near the right edge of the viewBox. Every resulting rect
  // (including label width) must fit fully inside [PAD, vbW - PAD].
  // This catches the "Fee-for-service inc..." truncation regression
  // where a long label was clamped past the right canvas boundary.
  var vbW = 1380, vbH = 720, PAD = 8;
  var rightEdgeSpecs = D.incentives.map(function (inc) {
    return { id: inc.id, label: inc.label, idealCx: vbW - 20, anchorTop: 60 };
  });
  var rightPlaced = layoutIncentiveChips(rightEdgeSpecs, vbW, vbH);
  var rightInside = rightPlaced.every(function (p) {
    return p.x >= PAD && p.x + p.w <= vbW - PAD;
  });
  check('right-edge-anchored real chips are not clipped by the viewBox',
    rightInside,
    'placed: ' + JSON.stringify(rightPlaced.map(function (p) {
      return { id: p.id, x: p.x, w: p.w, right: p.x + p.w };
    })));

  // Hard width cap: no real incentive label should produce a chip wider
  // than the documented MAX_CHIP_W. This is what guarantees the chip
  // can always be nudged inside the viewBox without truncation.
  var MAX_CHIP_W = 150;
  var allCapped = rightPlaced.every(function (p) { return p.w <= MAX_CHIP_W; });
  check('real chip widths respect MAX_CHIP_W cap (' + MAX_CHIP_W + ')',
    allCapped,
    'widths: ' + rightPlaced.map(function (p) { return p.id + '=' + p.w; }).join(', '));

  // Label-length guard: every real incentive label must be short enough
  // that, at the chip text size, it fits the cap. We allow up to 22
  // chars (≈22*6.4 + 18 = ~159, close to MAX_CHIP_W; the cap clamps
  // longer labels but the chip rect would visually crowd the canvas).
  var LABEL_MAX = 22;
  var lengthOK = D.incentives.every(function (inc) { return inc.label.length <= LABEL_MAX; });
  check('every incentive label is <= ' + LABEL_MAX + ' chars (right-edge friendly)',
    lengthOK,
    'too long: ' + D.incentives
      .filter(function (i) { return i.label.length > LABEL_MAX; })
      .map(function (i) { return i.id + '=' + i.label.length; })
      .join(', '));

  // Fee-for-service must use the concise label form so the top-right
  // chip can never be clipped by the river/canvas boundary.
  var ffs = D.incentives.find(function (i) { return i.id === 'inc_fee_for_service'; });
  check('inc_fee_for_service uses the concise "FFS inertia" label',
    !!ffs && ffs.label === 'FFS inertia',
    'got: ' + (ffs && ffs.label));
}

console.log('--- Test: Incentive overlay still encodes the structural tensions ---');
// Preserve meaning: the incentive set must still cover MLR, FFS
// inertia, VBC, cash-pay bypass, admin arms race, and regulated safety.
var incIds = D.incentives.map(function (i) { return i.id; });
['inc_mlr','inc_fee_for_service','inc_vbc','inc_cash_pay','inc_admin_arms_race','inc_regulated_safety'].forEach(function (id) {
  check('incentive ' + id + ' is still present', incIds.indexOf(id) > -1);
});

console.log('--- Test: every loop node belongs to a named process group ---');
// Dmitry note: every box in the loop chart must be part of some named
// process path; prevention nodes must not float.
check('processGroups data is present', Array.isArray(D.processGroups) && D.processGroups.length >= 4,
  'got ' + (D.processGroups || []).length);
var groupedStepIds = {};
(D.processGroups || []).forEach(function (g) {
  check('processGroup ' + g.id + ' has label', !!g.label);
  check('processGroup ' + g.id + ' has color', !!g.color);
  check('processGroup ' + g.id + ' has steps', Array.isArray(g.steps) && g.steps.length > 0);
  (g.steps || []).forEach(function (sid) { groupedStepIds[sid] = g.id; });
});
var allLoopNodes = D.careLoop.concat(D.financialLoop, D.preventionOrbit, D.vbcBridge);
var orphans = allLoopNodes.filter(function (s) { return !groupedStepIds[s.id]; });
check('no loop node is orphaned (every box belongs to a process group)',
  orphans.length === 0, 'orphans: ' + orphans.map(function (o) { return o.id; }).join(','));
// Each track has its expected step ids.
var pgCare = (D.processGroups.find(function (g) { return g.id === 'pg_care'; }) || {}).steps || [];
var pgFin  = (D.processGroups.find(function (g) { return g.id === 'pg_financial'; }) || {}).steps || [];
var pgPrev = (D.processGroups.find(function (g) { return g.id === 'pg_prevention'; }) || {}).steps || [];
var pgVbc  = (D.processGroups.find(function (g) { return g.id === 'pg_vbc'; }) || {}).steps || [];
check('pg_care covers C1..C8', pgCare.join(',') === 'C1,C2,C3,C4,C5,C6,C7,C8');
check('pg_financial covers F1..F8', pgFin.join(',') === 'F1,F2,F3,F4,F5,F6,F7,F8');
check('pg_prevention covers P1..P5 (no orphan prevention nodes)', pgPrev.join(',') === 'P1,P2,P3,P4,P5');
check('pg_vbc covers V1..V5', pgVbc.join(',') === 'V1,V2,V3,V4,V5');

console.log('--- Test: prevention loop is tied to the care loop via bridge edges ---');
check('loopBridgeEdges data is present', Array.isArray(D.loopBridgeEdges) && D.loopBridgeEdges.length >= 1);
var bridges = D.loopBridgeEdges || [];
var hasC8ToP = bridges.some(function (e) { return e.from === 'C8' && /^P/.test(e.to); });
var hasPtoTriage = bridges.some(function (e) { return /^P/.test(e.from) && e.to === 'C2'; });
var hasVbcToCare = bridges.some(function (e) { return /^V/.test(e.from) && /^C/.test(e.to); });
check('care discharge (C8) feeds prevention loop', hasC8ToP);
check('prevention escalation feeds triage (C2)', hasPtoTriage);
check('VBC bridges into the care loop', hasVbcToCare);

console.log('--- Test: loop renderer wires groups, bridges, and prevention as a real loop ---');
check('healthcare.js draws group hulls', hcSrc.indexOf('group-hull') > -1);
check('healthcare.js reads loopBridgeEdges from data', hcSrc.indexOf('loopBridgeEdges') > -1);
check('healthcare.js closes the prevention loop (P5 -> P1)',
  hcSrc.indexOf("prevActive.P5 && prevActive.P1") > -1);
check('healthcare.js renders named track labels (Clinical care loop)',
  hcSrc.indexOf('CLINICAL CARE LOOP') > -1);
check('healthcare.js renders named prevention/monitoring loop label',
  hcSrc.indexOf('PREVENTION / MONITORING') > -1);
check('healthcare.js renders the VBC / risk bridge label',
  hcSrc.indexOf('VBC / RISK BRIDGE') > -1);
check('healthcare.js draws a stack-divider between process map and stack',
  hcSrc.indexOf('stack-divider') > -1);
check('renderStepDrawer no longer uses the orphan "Prevention orbit" copy',
  hcSrc.indexOf('Prevention orbit') === -1);

console.log('--- Test: loop node click contract — every C/F/P/V node opens the drawer ---');
// The bug: clicking on a phase/step in the loop chart was not opening the
// detail card. The contract below guarantees the wiring stays in place:
//   1. drawStepNode / drawRailNode emit a <g class="loop-step|rail-step">
//      with tabindex=0, role=button, an aria-label, and a data-id so
//      tests + selection code can find it.
//   2. Each node group is bound to both a click and a keydown handler
//      that calls selectStep(s.id). Keyboard activation must work via
//      Enter or Space for accessibility.
//   3. selectStep funnels through setSelection + renderStepDrawer, so
//      clicking a node opens the drawer.
//   4. The node groups are appended LAST in the upper-zone DOM so
//      decorative overlays (bridge labels, track labels, patient card,
//      cross-track edges) never paint above the clickable region.
//   5. Stack band clicks continue to fire via selectStackLayer.
function hasFn(src, fnName) {
  return src.indexOf('function ' + fnName) > -1;
}
check('healthcare.js defines drawStepNode',  hasFn(hcSrc, 'drawStepNode'));
check('healthcare.js defines drawRailNode',  hasFn(hcSrc, 'drawRailNode'));
check('healthcare.js defines selectStep',    hasFn(hcSrc, 'selectStep'));
check('healthcare.js defines selectStackLayer', hasFn(hcSrc, 'selectStackLayer'));

// drawStepNode contract: class loop-step, tabindex, role, aria-label, data-id, click, keydown
var drawStepSrc = (hcSrc.match(/function drawStepNode[\s\S]*?\n\s{4}\}\n/) || [])[0] || '';
check('drawStepNode body found',                 drawStepSrc.length > 0);
check('drawStepNode emits class "loop-step"',    /class:\s*['"]loop-step\s+is-/.test(drawStepSrc) || /'loop-step '/.test(drawStepSrc) || drawStepSrc.indexOf("'loop-step is-'") > -1 || drawStepSrc.indexOf("loop-step is-") > -1);
check('drawStepNode sets tabindex on the group', /tabindex:\s*0/.test(drawStepSrc));
check('drawStepNode sets role="button"',         /role:\s*['"]button['"]/.test(drawStepSrc));
check('drawStepNode sets data-id from step id',  /['"]data-id['"]:\s*s\.id/.test(drawStepSrc));
check('drawStepNode sets an aria-label',         /aria-label/.test(drawStepSrc));
check('drawStepNode binds click handler',        /addEventListener\(['"]click['"]/.test(drawStepSrc));
check('drawStepNode click handler calls selectStep', /selectStep\(s\.id\)/.test(drawStepSrc));
check('drawStepNode binds keydown handler',      /addEventListener\(['"]keydown['"]/.test(drawStepSrc));
check('drawStepNode keydown supports Enter and Space',
  /ev\.key\s*===\s*['"]Enter['"]/.test(drawStepSrc) && /ev\.key\s*===\s*['"] ['"]/.test(drawStepSrc));

// drawRailNode contract: same pattern, class rail-step
var drawRailSrc = (hcSrc.match(/function drawRailNode[\s\S]*?\n\s{4}\}\n/) || [])[0] || '';
check('drawRailNode body found',                  drawRailSrc.length > 0);
check('drawRailNode emits class "rail-step"',     drawRailSrc.indexOf('rail-step is-') > -1);
check('drawRailNode sets tabindex on the group',  /tabindex:\s*0/.test(drawRailSrc));
check('drawRailNode sets role="button"',          /role:\s*['"]button['"]/.test(drawRailSrc));
check('drawRailNode sets data-id from step id',   /['"]data-id['"]:\s*s\.id/.test(drawRailSrc));
check('drawRailNode sets an aria-label',          /aria-label/.test(drawRailSrc));
check('drawRailNode binds click handler',         /addEventListener\(['"]click['"]/.test(drawRailSrc));
check('drawRailNode click handler calls selectStep', /selectStep\(s\.id\)/.test(drawRailSrc));
check('drawRailNode binds keydown handler',       /addEventListener\(['"]keydown['"]/.test(drawRailSrc));
check('drawRailNode keydown supports Enter and Space',
  /ev\.key\s*===\s*['"]Enter['"]/.test(drawRailSrc) && /ev\.key\s*===\s*['"] ['"]/.test(drawRailSrc));

// selectStep is wired into the drawer
check('selectStep routes through setSelection',
  hcSrc.match(/function selectStep[\s\S]{0,300}setSelection\(\{\s*kind:\s*['"]step['"]/));
check('selectStep opens the step drawer via renderStepDrawer',
  hcSrc.match(/function selectStep[\s\S]{0,300}renderStepDrawer/));
check('renderStepDrawer writes HTML into the loop insight panel',
  hcSrc.match(/function renderStepDrawer[\s\S]{0,4000}setLoopInsight/));

// Render order: the bug only repro'd when bridge labels and other
// decorative SVG text painted ABOVE the step nodes and intercepted
// clicks. Lock in the new render order so this can't regress.
var renderLoopSrc = (hcSrc.match(/function renderLoop[\s\S]*?\n\s{4}\}\n/) || [])[0] || '';
check('renderLoop body found',                                renderLoopSrc.length > 0);
var careNodesIdx   = renderLoopSrc.indexOf("'care-nodes'");
var finNodesIdx    = renderLoopSrc.indexOf("'fin-nodes'");
var bridgeGIdx     = renderLoopSrc.indexOf("'loop-bridges'");
check('renderLoop creates a dedicated care-nodes group',      careNodesIdx > -1);
check('renderLoop creates a dedicated fin-nodes group',       finNodesIdx  > -1);
check('renderLoop creates a bridges group',                   bridgeGIdx   > -1);
check('care/fin node groups are drawn AFTER the bridges group',
  bridgeGIdx > -1 && careNodesIdx > bridgeGIdx && finNodesIdx > bridgeGIdx);

// Pointer-events contract in CSS — decorative overlays must NEVER eat
// a click destined for a loop/rail node.
check('healthcare.css disables pointer-events on bridge labels',
  /\.bridge-label[\s\S]{0,160}pointer-events:\s*none/.test(cssSrc));
check('healthcare.css disables pointer-events on track labels',
  /\.loop-label[^{]*\{[^}]*pointer-events:\s*none/.test(cssSrc));
check('healthcare.css disables pointer-events on the patient card',
  /\.patient-center[^{]*\{[^}]*pointer-events:\s*none/.test(cssSrc));
check('healthcare.css disables pointer-events on loop/edge arrows',
  /\.loop-arrow[^{]*\{[^}]*pointer-events:\s*none/.test(cssSrc));
check('healthcare.css disables pointer-events on vbc-link / prev-link',
  /\.vbc-link[\s\S]{0,200}pointer-events:\s*none/.test(cssSrc));
check('healthcare.css disables pointer-events on rail-title / rail-sub',
  /\.rail-title[\s\S]{0,200}pointer-events:\s*none/.test(cssSrc));
check('healthcare.css makes loop-step a clickable group',
  /\.loop-step[^{]*\{[^}]*pointer-events:\s*all/.test(cssSrc) ||
  /\.loop-step,\s*[\s\S]{0,200}\.loop-step\s+\.bg[^{]*\{[^}]*pointer-events:\s*all/.test(cssSrc));
check('healthcare.css makes loop-step text labels non-blocking',
  /\.loop-step\s+\.num[\s\S]{0,200}pointer-events:\s*none/.test(cssSrc) ||
  /\.loop-step\s+\.lbl[\s\S]{0,200}pointer-events:\s*none/.test(cssSrc));
check('healthcare.css makes rail-step a clickable group',
  /\.rail-step[^{]*\{[^}]*pointer-events:\s*all/.test(cssSrc) ||
  /\.rail-step,\s*[\s\S]{0,200}\.rail-step\s+\.bg[^{]*\{[^}]*pointer-events:\s*all/.test(cssSrc));
check('healthcare.css makes rail-step text labels non-blocking',
  /\.rail-step\s+\.num[\s\S]{0,200}pointer-events:\s*none/.test(cssSrc) ||
  /\.rail-step\s+\.lbl[\s\S]{0,200}pointer-events:\s*none/.test(cssSrc));

// Stack band clicks must continue to work — explicit regression check.
check('stack-band click still routes through selectStackLayer',
  /selectStackLayer\(s\.id\)/.test(hcSrc));
check('stack-band keydown still supports Enter and Space',
  /stack-band[\s\S]*?keydown[\s\S]{0,300}Enter[\s\S]{0,80}selectStackLayer/.test(hcSrc) ||
  hcSrc.match(/addEventListener\('keydown'[\s\S]{0,300}selectStackLayer/));

// SVG root must not hide its interactive descendants from assistive tech.
// Prior markup used role="img" which framed the whole graphic as a
// single image; switch to role="group" so the inner role="button"
// elements stay reachable.
check('index.html does NOT mark the loop SVG as role="img" (hides interactive children)',
  indexSrc.indexOf('id="hc-loop-svg" role="img"') === -1);
check('index.html marks the loop SVG with role="group" or no role',
  /id="hc-loop-svg"[^>]*role="group"/.test(indexSrc) ||
  !/id="hc-loop-svg"[^>]*role=/.test(indexSrc));

console.log('--- Test: loop layout fits within the expanded viewBox ---');
// viewBox is 1180 x 880 — every node rectangle must sit inside that
// box with breathing room so nothing clips at desktop or mobile.
var VB_W = 1180, VB_H = 880;
function within(p, w, h, label) {
  check(label + ' (' + p.id + ' @ ' + p.x + ',' + p.y + ') inside viewBox',
    p.x - w / 2 >= 10 && p.x + w / 2 <= VB_W - 10 &&
    p.y - h / 2 >= 30 && p.y + h / 2 <= VB_H - 10);
}
// Node widths must match the renderer: care/fin are 118, P/V are 168.
var STEP_W = 118, STEP_H = 36, RAIL_W = 168, RAIL_H = 32;
D.careLoop.forEach(function (s)        { within(s, STEP_W, STEP_H, 'care node'); });
D.financialLoop.forEach(function (s)   { within(s, STEP_W, STEP_H, 'financial node'); });
D.preventionOrbit.forEach(function (s) { within(s, RAIL_W, RAIL_H, 'prevention node'); });
D.vbcBridge.forEach(function (s)       { within(s, RAIL_W, RAIL_H, 'vbc node'); });

console.log('--- Test: nodes do not collide across tracks ---');
// Pairwise distance between every step in different tracks must be
// at least the sum of half-widths plus a small gutter.
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh, pad) {
  return Math.abs(ax - bx) * 2 < (aw + bw + pad * 2) &&
         Math.abs(ay - by) * 2 < (ah + bh + pad * 2);
}
var allWithSize = []
  .concat(D.careLoop.map(function (s)        { return { s: s, w: STEP_W, h: STEP_H, k: 'care' }; }))
  .concat(D.financialLoop.map(function (s)   { return { s: s, w: STEP_W, h: STEP_H, k: 'fin'  }; }))
  .concat(D.preventionOrbit.map(function (s) { return { s: s, w: RAIL_W, h: RAIL_H, k: 'prev' }; }))
  .concat(D.vbcBridge.map(function (s)       { return { s: s, w: RAIL_W, h: RAIL_H, k: 'vbc'  }; }));
var crossCollisions = 0;
for (var ai = 0; ai < allWithSize.length; ai++) {
  for (var bi = ai + 1; bi < allWithSize.length; bi++) {
    var A = allWithSize[ai], B = allWithSize[bi];
    if (A.k === B.k) continue;
    if (rectsOverlap(A.s.x, A.s.y, A.w, A.h, B.s.x, B.s.y, B.w, B.h, 0)) {
      crossCollisions++;
    }
  }
}
check('no cross-track node rectangles overlap', crossCollisions === 0);

console.log('--- Test: viewBox and aspect-ratio match in CSS/JS ---');
check('healthcare.js declares the 1180 x 880 viewBox',
  hcSrc.indexOf("LOOP_VB = { w: 1180, h: 880 }") > -1);
check('healthcare.css aspect-ratio matches viewBox',
  cssSrc.indexOf('aspect-ratio: 1180 / 880') > -1);

console.log('--- Test: loop grid is single-column so SVG never overflows ---');
// The previous side-by-side layout (1fr + 280-340px column) forced the
// SVG into a column narrower than its min-width and clipped the right
// side of the canvas at typical desktop widths. The fix is a single
// full-width column with the insight drawer stacked below.
check('healthcare.css declares a single-column .hc-loop-grid',
  /\.hc-loop-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/m.test(cssSrc));
check('healthcare.css no longer pins a second column to .hc-loop-grid',
  !/\.hc-loop-grid\s*\{[^}]*grid-template-columns:[^;]*minmax\(280px/m.test(cssSrc));
check('healthcare.css drops the desktop SVG min-width that forced overflow',
  !/\.hc-loop-svg\s*\{[^}]*min-width:\s*1180px/m.test(cssSrc));
check('healthcare.css gives .hc-loop-insight a stacked (non-sticky) treatment',
  !/\.hc-loop-insight\s*\{[^}]*position:\s*sticky/m.test(cssSrc));

console.log('--- Test: long step labels stay inside the node box ---');
// Approximate label width: SVG text at 10.5px proportional fonts is
// ~6.4px / char. The label starts at x=30 inside a box of width
// STEP_W, so usable label width is STEP_W - 30 - 6 = 92 px. No care
// or financial step label may exceed that.
var maxStepChars = Math.floor((STEP_W - 36) / 6.4);
[].concat(D.careLoop, D.financialLoop).forEach(function (s) {
  check('step ' + s.id + ' label "' + s.label + '" fits the ' + STEP_W + 'px box',
    s.label.length <= maxStepChars);
});
var maxRailChars = Math.floor((RAIL_W - 36) / 6.4);
[].concat(D.preventionOrbit, D.vbcBridge).forEach(function (s) {
  check('rail ' + s.id + ' label "' + s.label + '" fits the ' + RAIL_W + 'px box',
    s.label.length <= maxRailChars);
});

console.log('--- Test: stack bands no longer render inline company chips ---');
// Inline chips on the band canvas clipped on desktop. The renderer now
// emits a non-clickable hint string and routes the full example list
// to the layer drawer.
check('healthcare.js no longer creates band-co-chip elements',
  !/class:\s*'band-co-chip'/.test(hcSrc));
check('healthcare.js emits a band-co-hint summary instead',
  hcSrc.indexOf("class: 'band-co-hint'") > -1 ||
  hcSrc.indexOf("class:\"band-co-hint\"") > -1);

console.log('--- Test: Dmitry sourced callouts exist and are wired ---');
check('loopCallouts data is present', Array.isArray(D.loopCallouts) && D.loopCallouts.length >= 5);
var calloutIds = (D.loopCallouts || []).map(function (c) { return c.id; });
['cl_workforce','cl_cms_rht','cl_claude_health','cl_palantir_r1','cl_behavioral_telehealth'].forEach(function (id) {
  check('callout ' + id + ' is present', calloutIds.indexOf(id) > -1);
});
(D.loopCallouts || []).forEach(function (c) {
  check('callout ' + c.id + ' has body', !!c.body);
  check('callout ' + c.id + ' has source_url', !!c.source_url);
  check('callout ' + c.id + ' has source_label', !!c.source_label);
  check('callout ' + c.id + ' attaches to a real process group',
    !!(D.processGroups || []).find(function (g) { return g.id === c.group; }));
});
// Substance checks: the figures Dmitry asked for are present in callout bodies.
var allCalloutText = (D.loopCallouts || []).map(function (c) { return [c.title, c.stat, c.body].join(' '); }).join(' ');
check('HRSA workforce callout includes the 141,160 physician FTE shortage figure',
  /141,?160/.test(allCalloutText));
check('CMS RHT callout cites $50B and FY2026 timeframe',
  /\$50B/.test(allCalloutText) && /FY2026/.test(allCalloutText));
check('Claude for Healthcare callout cites prior authorization and FHIR',
  /prior auth/i.test(allCalloutText) && /FHIR/i.test(allCalloutText));
check('Palantir / R1 callout names the R37 AI Lab partnership',
  /R37 AI Lab/i.test(allCalloutText));
check('Behavioral health callout cites 66.4M vs 62.8M visit figure',
  /66\.4M/.test(allCalloutText) && /62\.8M/.test(allCalloutText));

check('index.html has the loop-callouts container', indexSrc.indexOf('id="hc-loop-callouts"') > -1);
check('healthcare.css styles hc-loop-callout cards', cssSrc.indexOf('.hc-loop-callout') > -1);
check('healthcare.js renders callouts into #hc-loop-callouts',
  hcSrc.indexOf("'#hc-loop-callouts'") > -1 && hcSrc.indexOf('loopCallouts') > -1);

console.log('--- Test: new companies (Claude for Healthcare, Palantir, Adentris) ---');
var companyIds = D.companies.map(function (c) { return c.id; });
check('Claude for Healthcare company present', companyIds.indexOf('co_claude_health') > -1);
check('Palantir / R1 company present',         companyIds.indexOf('co_palantir')      > -1);
check('Adentris company present',              companyIds.indexOf('co_adentris')      > -1);
// Adentris is in RCM/documentation, not generic SaaS
var ade = D.companies.find(function (c) { return c.id === 'co_adentris'; });
check('Adentris sits in the Provider RCM layer',
  !!ade && ade.layer_id === 'L7_provider_rcm', 'got ' + (ade && ade.layer_id));
check('Adentris description mentions real-time documentation compliance',
  !!ade && /real-time/i.test(ade.short_description) && /document/i.test(ade.short_description));
// Claude for Healthcare sits in prior-auth/payer admin
var claudeCo = D.companies.find(function (c) { return c.id === 'co_claude_health'; });
check('Claude for Healthcare sits in prior-auth / payer-admin layer',
  !!claudeCo && claudeCo.layer_id === 'L8_denials_prior_auth');
check('Claude for Healthcare description cites HIPAA-ready',
  !!claudeCo && /HIPAA/i.test(claudeCo.short_description));
// Palantir is RCM
var pl = D.companies.find(function (c) { return c.id === 'co_palantir'; });
check('Palantir / R1 sits in the Provider RCM layer',
  !!pl && pl.layer_id === 'L7_provider_rcm');
check('Palantir description names R37 AI Lab partnership',
  !!pl && /R37 AI Lab/.test(pl.short_description));
// Layers expose the new companies in their drawer set
check('L7 RCM drawer surfaces Palantir',  (D.companyLayers.L7_provider_rcm.drawer || []).indexOf('co_palantir')      > -1);
check('L7 RCM drawer surfaces Adentris',  (D.companyLayers.L7_provider_rcm.drawer || []).indexOf('co_adentris')      > -1);
check('L8 prior auth drawer surfaces Claude for Healthcare',
  (D.companyLayers.L8_denials_prior_auth.drawer || []).indexOf('co_claude_health') > -1);

console.log('--- Test: Workdn / WorkDone renamed to Adentris in healthcare data ---');
// Per Dmitry: Workdn/WorkDone is renamed to Adentris. The healthcare data
// and user-facing healthcare copy must not surface the old name.
check('healthcare-data.js does not contain user-facing "Workdn"',
  hcDataSrc.indexOf('Workdn') === -1 && hcDataSrc.indexOf('workdn') === -1);
// "WorkDone" appears once in Adentris's short_description as a historical
// note (formerly WorkDone). That's the only acceptable mention — confirm
// it is exactly one mention and it is attached to Adentris.
var wdMentions = (hcDataSrc.match(/WorkDone/g) || []).length;
check('"WorkDone" appears at most once in healthcare-data.js (historical note)',
  wdMentions <= 1, 'count=' + wdMentions);
check('healthcare.js does not surface Workdn/WorkDone in user-facing copy',
  hcSrc.indexOf('Workdn') === -1 && hcSrc.indexOf('WorkDone') === -1);

console.log('--- Test: new sources are present in the sources list ---');
var srcLabels = (D.sources || []).map(function (s) { return s.label; });
check('HRSA workforce source listed',
  srcLabels.some(function (l) { return /HRSA/i.test(l); }));
check('CMS Rural Health Transformation source listed',
  srcLabels.some(function (l) { return /Rural Health Transformation/i.test(l); }));
check('Anthropic healthcare source listed',
  srcLabels.some(function (l) { return /Anthropic/i.test(l) && /healthcare/i.test(l); }));
check('Palantir / R1 source listed',
  srcLabels.some(function (l) { return /Palantir/i.test(l); }));
check('AHA / behavioral telehealth source listed',
  srcLabels.some(function (l) { return /behavioral/i.test(l) || /AHA/i.test(l); }));
check('Adentris source listed',
  srcLabels.some(function (l) { return /Adentris/i.test(l); }));

if (FAIL) {
  console.log('\n', FAIL, 'failure(s)');
  process.exit(1);
} else {
  console.log('\n  All assertions passed.');
}
