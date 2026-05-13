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

if (FAIL) {
  console.log('\n', FAIL, 'failure(s)');
  process.exit(1);
} else {
  console.log('\n  All assertions passed.');
}
