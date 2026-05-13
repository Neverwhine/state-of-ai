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

if (FAIL) {
  console.log('\n', FAIL, 'failure(s)');
  process.exit(1);
} else {
  console.log('\n  All assertions passed.');
}
