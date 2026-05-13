/* =====================================================================
   HEALTHCARE AI — DATA MODEL (multi-stop rebuild)
   Three-layer Sankey:
     A) Payment channels      (Official, 2024 CMS NHE)
     B) Destination categories(Official, 2024 CMS NHE)
     C) Operating cost pools  (Modeled, constrained to Layer B totals)
   Plus: AI surfaces (overlay, not a money layer), patient loop, companies.
   ===================================================================== */
(function (root) {
  'use strict';

  // ------- Sources -------------------------------------------------------
  var SRC = {
    nhe:        'https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet',
    highlights: 'https://www.cms.gov/files/document/highlights.pdf',
    historical: 'https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/historical',
    mlr:        'https://www.cms.gov/marketplace/private-health-insurance/medical-loss-ratio',
    kff:        'https://www.kff.org/health-costs/key-facts-about-hospitals/?entry=hospital-finances-profit-margins',
    kff2024:    'https://www.healthsystemtracker.org/chart-collection/u-s-spending-healthcare-changed-time/',
    phti:       'https://phti.org/administrative-ai-current-use-and-potential-impact/',
    mgma:       'https://www.mgma.com/mgma-stat/medical-practice-operating-costs-are-still-rising-in-2025-heres-how-to-control-them',
    aspe_pharma:'https://www.ncbi.nlm.nih.gov/books/NBK611842/',
    menlo:      'https://menlovc.com/perspective/2025-the-state-of-ai-in-healthcare/',
    rock:       'https://rockhealth.com/insights/2025-year-end-digital-health-funding-overview-a-tale-of-two-markets/',
    access:     'https://www.cms.gov/priorities/innovation/innovation-models/access',
    doctronic:  'https://commerce.utah.gov/2026/01/06/news-release-utah-and-doctronic-announce-groundbreaking-partnership-for-ai-prescription-medication-renewals/'
  };

  // ------- Headline stats ------------------------------------------------
  var headlineStats = [
    { label: 'US national health expenditure', value: '$5.3T',   sub: '2024 CMS NHE',  evidence: 'official', src: SRC.nhe },
    { label: 'Per person',                     value: '$15,474', sub: '2024 CMS NHE',  evidence: 'official', src: SRC.nhe },
    { label: 'Share of GDP',                   value: '18.0%',   sub: '2024 CMS NHE',  evidence: 'official', src: SRC.nhe },
    { label: 'Healthcare AI spend (survey)',   value: '$1.4B',   sub: 'Menlo 2025',    evidence: 'vc_survey', src: SRC.menlo },
    { label: 'US digital health funding, 2025',value: '$14.2B',  sub: 'Rock Health',   evidence: 'context',   src: SRC.rock }
  ];

  // ------- Sponsor strip (context, not Sankey) ---------------------------
  var sponsors = [
    { id: 'sponsor_federal', label: 'Federal government', display: '$1.7T', value_b: 1700, evidence: 'official',
      tooltip: 'Federal programs and subsidies are the largest ultimate sponsor of US healthcare spending. 2024 CMS NHE.' },
    { id: 'sponsor_households', label: 'Households', display: '$1.5T', value_b: 1500, evidence: 'official',
      tooltip: 'Households fund healthcare through premiums, taxes, out-of-pocket payments, and payroll contributions. 2024 CMS NHE.' },
    { id: 'sponsor_private_business', label: 'Private business / employers', display: '$967B', value_b: 967, evidence: 'official',
      tooltip: 'Employers fund a large share of private insurance and sit upstream of commercial healthcare incentives. 2024 CMS NHE.' },
    { id: 'sponsor_state_local', label: 'State / local governments', display: '$860B', value_b: 860, evidence: 'official',
      tooltip: 'State and local governments fund Medicaid, public programs, and public employee coverage. 2024 CMS NHE.' },
    { id: 'sponsor_other_private', label: 'Other private revenues', display: '$318B', value_b: 318, evidence: 'official',
      tooltip: 'Philanthropy, research funds, and other private sources. 2024 CMS NHE.' }
  ];

  // =====================================================================
  // LAYER A — Payment channels (Official 2024 CMS NHE source-of-funds)
  // =====================================================================
  var paymentChannels = [
    { id: 'pay_private_insurance', label: 'Private health insurance', value_b: 1644.6, display: '$1,644.6B',
      evidence: 'official', src: SRC.nhe, tooltip_id: 'tt_private_insurance',
      description: 'Commercial insurance, often employer-sponsored, that pays for covered medical care.' },
    { id: 'pay_medicare', label: 'Medicare', value_b: 1118.0, display: '$1,118.0B',
      evidence: 'official', src: SRC.nhe, tooltip_id: 'tt_medicare',
      description: 'Federal health insurance program primarily for people 65+ and some disabled people.' },
    { id: 'pay_medicaid', label: 'Medicaid', value_b: 931.7, display: '$931.7B',
      evidence: 'official', src: SRC.nhe, tooltip_id: 'tt_medicaid',
      description: 'Joint federal-state program for low-income and eligible populations.' },
    { id: 'pay_out_of_pocket', label: 'Out-of-pocket', value_b: 556.6, display: '$556.6B',
      evidence: 'official', src: SRC.nhe, tooltip_id: 'tt_out_of_pocket',
      description: 'Spending paid directly by patients — deductibles, copays, coinsurance, uncovered services.' },
    { id: 'pay_other_public_private', label: 'Other third-party payers, programs & public health', value_b: 590.5, display: '$590.5B',
      evidence: 'official', src: SRC.nhe,
      description: 'VA, IHS, workers\' compensation, public health activity, and other third-party programs.' },
    { id: 'pay_residual', label: 'Other NHE / reconciliation', value_b: 458.6, display: '$458.6B',
      evidence: 'modeled_residual',
      description: 'Residual derived as $5.3T minus listed source-of-funds categories so the graph balances to total NHE.' }
  ];

  // =====================================================================
  // LAYER B — Destination categories (Official 2024 CMS type-of-service)
  // =====================================================================
  var destinations = [
    { id: 'dest_hospital', label: 'Hospital care', value_b: 1634.7, display: '$1,634.7B',
      evidence: 'official', src: SRC.highlights,
      description: 'Inpatient, outpatient, and emergency services delivered by hospitals.' },
    { id: 'dest_physician', label: 'Physician & clinical services', value_b: 1109.7, display: '$1,109.7B',
      evidence: 'official', src: SRC.highlights,
      description: 'Office visits, procedures, and clinical services billed by physicians and clinical groups.' },
    { id: 'dest_rx', label: 'Retail prescription drugs', value_b: 467.0, display: '$467.0B',
      evidence: 'official', src: SRC.highlights,
      description: 'Outpatient prescription drugs dispensed by retail pharmacies.' },
    { id: 'dest_residential_personal', label: 'Other health, residential & personal care', value_b: 320.5, display: '$320.5B',
      evidence: 'official', src: SRC.highlights,
      description: 'Home- and community-based care, residential and personal services. ~62% Medicaid funded.' },
    { id: 'dest_nursing', label: 'Nursing care facilities & CCRCs', value_b: 219.9, display: '$219.9B',
      evidence: 'official', src: SRC.highlights,
      description: 'Skilled nursing facilities and continuing care retirement communities.' },
    { id: 'dest_dental', label: 'Dental services', value_b: 189.2, display: '$189.2B',
      evidence: 'official', src: SRC.highlights,
      description: 'Dental services. ~80% paid by out-of-pocket + private insurance.' },
    { id: 'dest_other_professional', label: 'Other professional services', value_b: 184.9, display: '$184.9B',
      evidence: 'official', src: SRC.highlights,
      description: 'Services from non-physician professionals (PT/OT, optometry, podiatry).' },
    { id: 'dest_home_health', label: 'Home health care', value_b: 169.4, display: '$169.4B',
      evidence: 'official', src: SRC.highlights,
      description: 'Skilled medical services and personal care delivered in the home.' },
    { id: 'dest_nondurable', label: 'Other non-durable medical products', value_b: 128.7, display: '$128.7B',
      evidence: 'official', src: SRC.highlights,
      description: 'OTC drugs and other non-durable medical goods. ~96% out-of-pocket.' },
    { id: 'dest_dme', label: 'Durable medical equipment', value_b: 86.4, display: '$86.4B',
      evidence: 'official', src: SRC.highlights,
      description: 'Long-use medical equipment such as wheelchairs, CPAPs, glucose monitors.' },
    { id: 'dest_residual', label: 'Admin, public health, investment & other NHE', value_b: 789.6, display: '$789.6B',
      evidence: 'modeled_residual',
      description: 'Residual derived as $5.3T minus listed type-of-service/product categories. Includes net cost of insurance, public health, structures, equipment, and research.' }
  ];

  // =====================================================================
  // LAYER C — Operating cost pools (Modeled, totals constrained to Layer B)
  // =====================================================================
  var costPools = [
    { id: 'pool_clinical_labor',       label: 'Clinical labor & professional comp',
      description: 'Physicians, nurses, APPs, dentists, pharmacists, therapists, care teams. The wages that show up at the bedside, the chair, or the exam room.',
      ai_relevance: 'Copilots, ambient documentation, clinical decision support, throughput.' },
    { id: 'pool_provider_admin',       label: 'Provider admin, RCM, coding & compliance',
      description: 'Billing staff, coders, prior-auth teams, schedulers, compliance, and provider-side bureaucracy.',
      ai_relevance: 'RCM automation, coding, prior auth, patient billing.' },
    { id: 'pool_payer_admin',          label: 'Payer operations & insurance admin',
      description: 'Claims processing, utilization management, plan admin, fraud review, customer service.',
      ai_relevance: 'Claims AI, payment integrity, prior-auth review, downcoding.' },
    { id: 'pool_drugs_biologics',      label: 'Drugs, biologics & therapeutic products',
      description: 'Retail Rx, provider-administered drugs, vaccines, injectables, specialty therapies.',
      ai_relevance: 'Drug discovery, formulary AI, adherence, precision therapies.' },
    { id: 'pool_supplies_devices',     label: 'Supplies, diagnostics, equipment & devices',
      description: 'Consumables, DME, imaging equipment, lab supplies, dental equipment.',
      ai_relevance: 'Diagnostics AI, device/wearable data, inventory automation.' },
    { id: 'pool_facilities_capital',   label: 'Facilities, capital & site-of-care',
      description: 'Hospitals, clinics, rent, utilities, depreciation, beds, ORs, imaging suites.',
      ai_relevance: 'Capacity optimization, site-of-care shift, remote monitoring.' },
    { id: 'pool_it_data',              label: 'IT, EHR, data & cybersecurity',
      description: 'EHRs, data warehouses, interoperability, security, cloud, workflow systems.',
      ai_relevance: 'AI deployment substrate and platform layer.' },
    { id: 'pool_pharma_channel',       label: 'Pharmacy / PBM / wholesale channel',
      description: 'Pharmacies, wholesalers, PBM services, rebates and discount infrastructure, channel economics.',
      ai_relevance: 'PBM analytics, drug access, cash-pay bypass, transparency.' },
    { id: 'pool_public_health_research',label: 'Public health, research & investment',
      description: 'Public health activity, research, facilities investment.',
      ai_relevance: 'Population health AI, surveillance, R&D infrastructure.' },
    { id: 'pool_margin_other',         label: 'Margin, retained earnings & other overhead',
      description: 'Residual economics not cleanly allocated. Explains why cost savings do not always become lower prices.',
      ai_relevance: 'Margin transparency and downstream economic capture.' }
  ];

  // Destination → cost pool modeled allocations (rows sum to 1.0)
  var destToPoolWeights = {
    dest_hospital:              { pool_clinical_labor: 0.43, pool_provider_admin: 0.13, pool_drugs_biologics: 0.10, pool_supplies_devices: 0.12, pool_facilities_capital: 0.14, pool_it_data: 0.03, pool_margin_other: 0.05 },
    dest_physician:             { pool_clinical_labor: 0.52, pool_provider_admin: 0.18, pool_drugs_biologics: 0.06, pool_supplies_devices: 0.05, pool_facilities_capital: 0.08, pool_it_data: 0.03, pool_margin_other: 0.08 },
    dest_rx:                    { pool_drugs_biologics: 0.65, pool_pharma_channel: 0.25, pool_margin_other: 0.10 },
    dest_residential_personal:  { pool_clinical_labor: 0.45, pool_provider_admin: 0.18, pool_drugs_biologics: 0.02, pool_supplies_devices: 0.05, pool_facilities_capital: 0.20, pool_it_data: 0.02, pool_margin_other: 0.08 },
    dest_nursing:               { pool_clinical_labor: 0.55, pool_provider_admin: 0.15, pool_drugs_biologics: 0.03, pool_supplies_devices: 0.05, pool_facilities_capital: 0.16, pool_it_data: 0.01, pool_margin_other: 0.05 },
    dest_dental:                { pool_clinical_labor: 0.48, pool_provider_admin: 0.18, pool_drugs_biologics: 0.02, pool_supplies_devices: 0.14, pool_facilities_capital: 0.08, pool_it_data: 0.02, pool_margin_other: 0.08 },
    dest_other_professional:    { pool_clinical_labor: 0.55, pool_provider_admin: 0.15, pool_drugs_biologics: 0.03, pool_supplies_devices: 0.07, pool_facilities_capital: 0.07, pool_it_data: 0.03, pool_margin_other: 0.10 },
    dest_home_health:           { pool_clinical_labor: 0.60, pool_provider_admin: 0.18, pool_drugs_biologics: 0.02, pool_supplies_devices: 0.03, pool_facilities_capital: 0.07, pool_it_data: 0.03, pool_margin_other: 0.07 },
    dest_nondurable:            { pool_drugs_biologics: 0.60, pool_supplies_devices: 0.30, pool_pharma_channel: 0.05, pool_margin_other: 0.05 },
    dest_dme:                   { pool_clinical_labor: 0.05, pool_provider_admin: 0.05, pool_supplies_devices: 0.70, pool_facilities_capital: 0.05, pool_it_data: 0.03, pool_pharma_channel: 0.05, pool_margin_other: 0.07 },
    dest_residual:              { pool_payer_admin: 0.47, pool_facilities_capital: 0.12, pool_it_data: 0.08, pool_public_health_research: 0.23, pool_margin_other: 0.10 }
  };

  // Payment → destination modeled weights (used for layer A→B IPF)
  var paymentToDestWeights = {
    pay_private_insurance: {
      dest_hospital: 0.34, dest_physician: 0.30, dest_rx: 0.10, dest_dental: 0.06, dest_other_professional: 0.05,
      dest_home_health: 0.02, dest_dme: 0.01, dest_residual: 0.12
    },
    pay_medicare: {
      dest_hospital: 0.36, dest_physician: 0.27, dest_rx: 0.09, dest_home_health: 0.05, dest_nursing: 0.05,
      dest_dme: 0.02, dest_residual: 0.16
    },
    pay_medicaid: {
      dest_hospital: 0.25, dest_physician: 0.15, dest_residential_personal: 0.2135, dest_nursing: 0.09,
      dest_home_health: 0.05, dest_rx: 0.07, dest_residual: 0.1765
    },
    pay_out_of_pocket: {
      dest_dental: 0.15, dest_nondurable: 0.222, dest_rx: 0.13, dest_physician: 0.12, dest_hospital: 0.09,
      dest_other_professional: 0.06, dest_dme: 0.03, dest_residual: 0.198
    },
    pay_other_public_private: {
      dest_hospital: 0.24, dest_physician: 0.16, dest_residential_personal: 0.08, dest_home_health: 0.04,
      dest_rx: 0.05, dest_residual: 0.43
    },
    pay_residual: { dest_residual: 1.0 }
  };

  // ------- Build balanced links via iterative proportional fitting -------
  function buildAB(payments, dests, w) {
    var rowT = {}, colT = {};
    payments.forEach(function (p) { rowT[p.id] = p.value_b; });
    dests.forEach(function (d) { colT[d.id] = d.value_b; });
    var links = [];
    payments.forEach(function (p) {
      var row = w[p.id] || {};
      Object.keys(row).forEach(function (dId) {
        links.push({ source: p.id, target: dId, value_b: rowT[p.id] * row[dId], evidence: 'modeled' });
      });
    });
    for (var i = 0; i < 16; i++) {
      payments.forEach(function (p) {
        var s = 0; links.forEach(function (l) { if (l.source === p.id) s += l.value_b; });
        if (s > 0) { var f = rowT[p.id] / s; links.forEach(function (l) { if (l.source === p.id) l.value_b *= f; }); }
      });
      dests.forEach(function (d) {
        var s = 0; links.forEach(function (l) { if (l.target === d.id) s += l.value_b; });
        if (s > 0) { var f = colT[d.id] / s; links.forEach(function (l) { if (l.target === d.id) l.value_b *= f; }); }
      });
    }
    return links;
  }
  function buildBC(dests, w) {
    var links = [];
    dests.forEach(function (d) {
      var row = w[d.id] || {};
      // Normalise weights to 1.0 first
      var ws = 0; Object.keys(row).forEach(function (k) { ws += row[k]; });
      if (ws <= 0) return;
      Object.keys(row).forEach(function (poolId) {
        links.push({ source: d.id, target: poolId, value_b: d.value_b * (row[poolId] / ws), evidence: 'modeled' });
      });
    });
    return links;
  }

  var moneyLinksAB = buildAB(paymentChannels, destinations, paymentToDestWeights);
  var moneyLinksBC = buildBC(destinations, destToPoolWeights);

  // =====================================================================
  // AI SURFACES (overlay, not money-balanced)
  // =====================================================================
  var aiSurfaces = [
    { id: 'ai_scribes_copilots', label: 'Clinical copilots & scribes',
      attach_pools: ['pool_clinical_labor','pool_it_data'],
      attach_steps: ['C4','C5','F3'],
      message: 'Near-term ROI comes from clinician time, documentation, and safer access to evidence.' },
    { id: 'ai_admin_rcm', label: 'Admin, RCM, coding & prior auth',
      attach_pools: ['pool_provider_admin','pool_payer_admin'],
      attach_steps: ['F2','F3','F4','F5','F6'],
      message: 'The first major automation battleground. Can become an arms race between provider and payer AI.' },
    { id: 'ai_patient_access', label: 'Patient access & navigation',
      attach_pools: ['pool_provider_admin','pool_it_data'],
      attach_steps: ['C2','C3','F1'],
      message: 'AI changes the front door before it changes the hospital core.' },
    { id: 'ai_financial_engagement', label: 'Patient financial engagement',
      attach_pools: ['pool_provider_admin','pool_payer_admin'],
      attach_steps: ['F6','F7'],
      message: 'Collecting patient responsibility and explaining bills is a software workflow.' },
    { id: 'ai_diagnostics', label: 'Diagnostics & signal interpretation',
      attach_pools: ['pool_supplies_devices','pool_clinical_labor','pool_it_data'],
      attach_steps: ['C1','C5','C8'],
      message: 'AI reads signals from images, labs, dental scans, pathology, and devices.' },
    { id: 'ai_prevention', label: 'Prevention & continuous monitoring',
      attach_pools: ['pool_clinical_labor','pool_it_data','pool_supplies_devices'],
      attach_steps: ['C8','P1','P2','P3','P4','V2','V3','V5'],
      message: 'Prevention becomes systemic only when someone can capture avoided downstream cost.' },
    { id: 'ai_techbio', label: 'Techbio, drug discovery & precision medicine',
      attach_pools: ['pool_drugs_biologics','pool_public_health_research','pool_it_data'],
      attach_steps: ['C5','C6','P3'],
      message: 'AI moves upstream into target discovery, molecule design, diagnostics, and personalized treatment.' },
    { id: 'ai_site_of_care', label: 'Site-of-care shift & capacity',
      attach_pools: ['pool_facilities_capital','pool_clinical_labor','pool_it_data'],
      attach_steps: ['C3','C6','C7'],
      message: 'AI can route care away from expensive settings when incentives and clinical safety allow.' }
  ];

  // ------- Money River callouts -----------------------------------------
  var moneyCallouts = [
    { id: 'callout_buyer_user_payer', title: 'Buyer, user, payer, beneficiary split',
      copy: 'Healthcare AI adoption depends on who pays, who uses, and who benefits. These are often different actors.' },
    { id: 'callout_admin_paradox', title: 'Admin savings ≠ system savings',
      copy: 'AI can reduce internal task cost, but it can also increase coding, claim volume, denial volume, and utilization review. This is an arms race, not a guaranteed cost cure.' },
    { id: 'callout_mlr', title: 'Insurer MLR is not provider margin',
      copy: 'ACA medical loss ratio rules govern many insurers (80% / 85% of premium on care + quality). Hospitals and physicians are not bound by the same rule. Different incentives.' },
    { id: 'callout_private_pay', title: 'Private pay is the experimental frontier',
      copy: 'Consumer health, longevity, lab uploads, CGMs, and AI coaching scale first where consumers pay directly. Reimbursement may follow when outcomes are measurable.' },
    { id: 'callout_vbc', title: 'Value-based care is the bridge to prevention',
      copy: 'Prevention becomes systemic when someone takes risk for downstream cost. VBC, Medicare Advantage, ACOs, employers, and CMS digital models can make prevention rational.' }
  ];

  // =====================================================================
  // PATIENT LOOP — canonical IDs C1-C8 / F1-F8 / P1-P5 / V1-V5
  // =====================================================================
  var patientStates = [
    { id: 'state_healthy',     label: 'Healthy',     prompt: 'No acute event. Continuous consumer signal.', color: '#4ECDC4' },
    { id: 'state_at_risk',     label: 'At risk',     prompt: 'Lab, wearable, family history, or genomics indicates elevated risk.', color: '#F5C542' },
    { id: 'state_symptomatic', label: 'Symptomatic', prompt: 'Patient experiences symptoms and seeks help.', color: '#FF8C42' },
    { id: 'state_diagnosed',   label: 'Diagnosed',   prompt: 'A condition is now named and treatment begins.', color: '#4A90D9' },
    { id: 'state_chronic',     label: 'Chronic',     prompt: 'Longitudinal management across visits and data streams.', color: '#7C4DFF' },
    { id: 'state_acute',       label: 'Acute',       prompt: 'High-intensity episode mobilizes hospital/urgent workflow.', color: '#E8837C' }
  ];

  // Care loop — clockwise upper half (canonical positions per spec)
  var careLoop = [
    { id: 'C1', n: 1, label: 'Signal',            x: 220, y: 260, description: 'Symptom, wearable alert, lab abnormality, patient concern.', ai: ['ai_diagnostics','ai_prevention'] },
    { id: 'C2', n: 2, label: 'Search / triage',   x: 285, y: 145, description: 'Patient or clinician seeks guidance.', ai: ['ai_patient_access','ai_scribes_copilots'] },
    { id: 'C3', n: 3, label: 'Access / scheduling',x: 420, y: 85,  description: 'Find the right care setting.', ai: ['ai_patient_access','ai_site_of_care'] },
    { id: 'C4', n: 4, label: 'Encounter',         x: 560, y: 65,  description: 'Visit, telehealth, hospital, dental, diagnostic event.', ai: ['ai_scribes_copilots'] },
    { id: 'C5', n: 5, label: 'Diagnosis / orders',x: 700, y: 85,  description: 'Labs, imaging, Rx, referral, treatment plan.', ai: ['ai_diagnostics','ai_techbio','ai_scribes_copilots'] },
    { id: 'C6', n: 6, label: 'Treatment',         x: 835, y: 145, description: 'Medication, procedure, therapy, behavior change, digital tool.', ai: ['ai_techbio','ai_site_of_care'] },
    { id: 'C7', n: 7, label: 'Follow-up',         x: 900, y: 260, description: 'Refill, referral, escalation, monitoring, adherence.', ai: ['ai_site_of_care'] },
    { id: 'C8', n: 8, label: 'Monitor / prevent', x: 760, y: 365, description: 'Continuous or episodic monitoring and risk reduction.', ai: ['ai_prevention','ai_diagnostics'] }
  ];

  // Financial loop — counterclockwise lower half
  var financialLoop = [
    { id: 'F1', n: 1, label: 'Eligibility / benefits',     x: 220, y: 340, description: 'Determine coverage, network, deductible, and patient responsibility.', ai: ['ai_patient_access'] },
    { id: 'F2', n: 2, label: 'Prior authorization',        x: 285, y: 455, description: 'Payer approval before selected care, tests, or drugs.', ai: ['ai_admin_rcm'] },
    { id: 'F3', n: 3, label: 'Documentation / coding',     x: 420, y: 515, description: 'Convert care into notes, codes, quality measures, billable records.', ai: ['ai_admin_rcm','ai_scribes_copilots'] },
    { id: 'F4', n: 4, label: 'Claim submission',           x: 560, y: 535, description: 'Provider submits claim to payer or patient.', ai: ['ai_admin_rcm'] },
    { id: 'F5', n: 5, label: 'Adjudication / denial',      x: 700, y: 515, description: 'Payer pays, adjusts, denies, requests more info, or downcodes.', ai: ['ai_admin_rcm'] },
    { id: 'F6', n: 6, label: 'Patient bill',               x: 835, y: 455, description: 'Remaining patient responsibility becomes bill or payment plan.', ai: ['ai_financial_engagement','ai_admin_rcm'] },
    { id: 'F7', n: 7, label: 'Payment / collection',       x: 900, y: 340, description: 'Payment is collected, reconciled, or written off.', ai: ['ai_financial_engagement'] },
    { id: 'F8', n: 8, label: 'Quality / risk / outcomes',  x: 760, y: 235, description: 'Outcomes, risk, and quality data feed future payment.', ai: ['ai_prevention'] }
  ];

  // Private-pay prevention orbit (right rail)
  var preventionOrbit = [
    { id: 'P1', label: 'Health AI assistant',           x: 990, y: 165, description: 'Patient asks questions, uploads labs, summarizes symptoms, tracks goals.', examples: 'OpenEvidence-like workflows, consumer AI assistants' },
    { id: 'P2', label: 'Wearables & home signals',      x: 990, y: 240, description: 'Continuous signals from WHOOP, Oura, Apple Watch, CGM, BP cuffs.', examples: 'WHOOP, Oura, Nutrisense, Neera' },
    { id: 'P3', label: 'Labs · genetics · omics',       x: 990, y: 315, description: 'Consumers or clinicians use richer biological data to personalize guidance.', examples: 'Function Health, genomics, precision diagnostics' },
    { id: 'P4', label: 'Personalized coaching',         x: 990, y: 390, description: 'AI or human coaches turn data into behavior, nutrition, sleep, exercise.', examples: 'Nutrisense, Curex, wellness apps' },
    { id: 'P5', label: 'Escalation to clinician',       x: 990, y: 465, description: 'AI flags risk or symptoms that require licensed clinician review.', examples: 'Doctronic, telehealth, primary care' }
  ];

  // VBC bridge (left rail — annotation, not money flow)
  var vbcBridge = [
    { id: 'V1', label: 'Fee-for-service default',       x: 130, y: 165, description: 'System mostly pays when care is delivered after an event.' },
    { id: 'V2', label: 'Risk-bearing contracts',        x: 130, y: 240, description: 'Payers, providers, or employers have financial upside from avoided events.' },
    { id: 'V3', label: 'MA / ACO / employer risk',      x: 130, y: 315, description: 'Places where prevention, care management, and risk scoring affect economics.' },
    { id: 'V4', label: 'Digital reimbursement',         x: 130, y: 390, description: 'RTM, digital mental health codes, CMS ACCESS, similar models.' },
    { id: 'V5', label: 'Prevention becomes financeable',x: 130, y: 465, description: 'Prevention scales when someone can measure and capture avoided cost.' }
  ];

  // Shared stack (bottom rail)
  var sharedStack = [
    { id: 'stack_data',       label: 'Data',                contents: 'EHR · claims · labs · imaging · genomics · pharmacy · wearables', why: 'AI performance depends on access to complete, timely, permissioned data.' },
    { id: 'stack_workflow',   label: 'Workflow',            contents: 'Scheduling · intake · orders · referrals · documentation · refills', why: 'Healthcare AI wins when it changes workflow, not just answers questions.' },
    { id: 'stack_admin',      label: 'Admin / reimbursement',contents: 'Benefits · prior auth · coding · claims · denials · RCM · billing', why: 'Near-term AI ROI but also arms-race risk.' },
    { id: 'stack_decision',   label: 'Decision',            contents: 'Guidelines · evidence · payer rules · risk scores', why: 'AI systems must reason inside clinical and reimbursement rules.' },
    { id: 'stack_ai',         label: 'AI / app layer',      contents: 'Copilots · agents · retrieval · automation · prediction', why: 'The visible product layer, but only works if connected to the stack below.' },
    { id: 'stack_governance', label: 'Governance & trust',  contents: 'HIPAA · FDA · audit · liability · safety', why: 'Healthcare AI needs trust, control, auditability, and regulated deployment.' },
    { id: 'stack_infra',      label: 'Infrastructure',      contents: 'APIs · cloud · identity · interoperability · security', why: 'The substrate that makes AI deployable across fragmented systems.' }
  ];

  // Step ↔ stack dependency hints (used to draw dependency lines)
  var stepStackDeps = {
    C1: ['stack_data','stack_infra'],
    C2: ['stack_ai','stack_decision','stack_workflow'],
    C3: ['stack_workflow','stack_admin'],
    C4: ['stack_workflow','stack_data','stack_ai'],
    C5: ['stack_data','stack_decision','stack_ai'],
    C6: ['stack_workflow','stack_decision'],
    C7: ['stack_workflow','stack_data'],
    C8: ['stack_data','stack_ai','stack_infra'],
    F1: ['stack_admin','stack_data'],
    F2: ['stack_admin','stack_decision','stack_ai'],
    F3: ['stack_admin','stack_ai','stack_workflow'],
    F4: ['stack_admin'],
    F5: ['stack_admin','stack_ai','stack_decision'],
    F6: ['stack_admin','stack_workflow'],
    F7: ['stack_admin'],
    F8: ['stack_data','stack_decision','stack_governance']
  };

  // State-driven scenario paths (canonical IDs)
  var stateScenarios = {
    state_healthy:     { care: ['C8','C2'],                         financial: ['F1'],                                  prevention: ['P1','P2','P4'],                  vbc: ['V1'],          private_pay_emphasis: true,  scenario: 'Continuous consumer monitoring with no acute event. Risk reduction is private-pay.' },
    state_at_risk:     { care: ['C1','C2','C5','C8'],               financial: ['F1','F8'],                              prevention: ['P2','P3'],                       vbc: ['V2','V3','V5'],private_pay_emphasis: true,  scenario: 'Risk signals trigger consultation and monitoring. VBC bridge is the lever that funds prevention.' },
    state_symptomatic: { care: ['C1','C2','C3','C4'],               financial: ['F1','F2','F3'],                         prevention: ['P1','P5'],                       vbc: ['V1'],          private_pay_emphasis: false, scenario: 'Patient seeks help. Front-door AI shapes triage and access while admin gates activate.' },
    state_diagnosed:   { care: ['C5','C6','C7'],                    financial: ['F3','F4','F5','F6'],                    prevention: ['P4'],                            vbc: ['V4'],          private_pay_emphasis: false, scenario: 'Condition is named. Diagnosis, treatment, and claims/billing run in parallel.' },
    state_chronic:     { care: ['C8','C7','C6','C5'],               financial: ['F8','F4','F5','F6'],                    prevention: ['P2','P4'],                       vbc: ['V2','V3','V5'],private_pay_emphasis: false, scenario: 'Longitudinal management. Risk and quality reporting feed future payment.' },
    state_acute:       { care: ['C1','C3','C4','C5','C6'],          financial: ['F1','F2','F3','F4','F5'],               prevention: ['P5'],                            vbc: ['V1'],          private_pay_emphasis: false, scenario: 'High-intensity episode. Hospital workflow and full admin chain activate.' }
  };

  // =====================================================================
  // TOOLTIPS (term dictionary)
  // =====================================================================
  var tooltips = {
    tt_nhe:               { term: 'National Health Expenditure', def: 'Official CMS estimate of total US healthcare spending across goods, services, administration, public health, and investment.', why: 'This is the size of the system AI is entering, but not the size of the AI market.' },
    tt_private_insurance: { term: 'Private health insurance', def: 'Commercial insurance, often employer-sponsored, that pays for covered medical care.', why: 'Large software budgets and administrative workflows make this a major AI target.' },
    tt_medicare:          { term: 'Medicare', def: 'Federal health insurance program primarily for people 65+ and some disabled people.', why: 'Medicare shapes reimbursement, risk models, and provider economics.' },
    tt_medicaid:          { term: 'Medicaid', def: 'Joint federal-state program for low-income and eligible populations.', why: 'Medicaid-heavy categories create different budget constraints and adoption paths.' },
    tt_out_of_pocket:     { term: 'Out-of-pocket', def: 'Spending paid directly by patients — deductibles, copays, coinsurance, uncovered services.', why: 'Private-pay AI can scale here without waiting for reimbursement.' },
    tt_mlr:               { term: 'Medical loss ratio (MLR)', def: 'ACA rule requiring many insurers to spend 80% or 85% of premium dollars on care and quality.', why: 'It changes insurer incentives: cost savings do not behave like ordinary SaaS margins.' },
    tt_pbm:               { term: 'Pharmacy benefit manager', def: 'Intermediary that manages drug benefits, formularies, rebates, and pharmacy networks.', why: 'PBMs sit between payers, pharma, pharmacies, and patients.' },
    tt_prior_auth:        { term: 'Prior authorization', def: 'Payer approval required before certain drugs, tests, or services are covered.', why: 'AI attacks both sides: providers automate submissions, payers automate review.' },
    tt_rcm:               { term: 'Revenue cycle management', def: 'Provider-side process for coding, billing, collecting, and reconciling payment.', why: 'High-labor workflow with direct ROI, making it a near-term AI wedge.' },
    tt_vbc:               { term: 'Value-based care', def: 'Payment model where economics depend on outcomes, quality, risk, or total cost.', why: 'It is the bridge that can make prevention financially rational.' },
    tt_modeled:           { term: 'Modeled allocation', def: 'Link width constrained to official CMS node totals but allocated using cost-structure assumptions.', why: 'CMS does not publish a complete payer-to-service or service-to-cost-pool matrix.' }
  };

  // =====================================================================
  // COMPANIES — normalized to spec schema, neutral by default
  // =====================================================================
  // group: 'dvc' | 'benchmark'
  // money_pool_ids point to Layer C pool ids; destination_ids point to Layer B
  // ai_surface_ids to AI surface ids; process_step_ids to canonical C/F/P/V ids
  var companies = [
    // --- DVC portfolio ---
    { id: 'company_qualified_health', name: 'Qualified Health', group: 'dvc',
      short_description: 'Enterprise AI operating layer for health systems — agent dev, automation, safeguards, monitoring.',
      money_pool_ids: ['pool_provider_admin','pool_it_data','pool_clinical_labor'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['C4','F3','F4','F5'],
      ai_surface_ids: ['ai_admin_rcm','ai_scribes_copilots'],
      buyer_user: 'Health system',
      value_capture: 'workflow control',
      evidence: 'company_claim',
      public_note: 'Reported $125M Series B and 500,000+ users (company-disclosed).' },
    { id: 'company_doctronic', name: 'Doctronic', group: 'dvc',
      short_description: 'AI primary care / access layer; Utah partnership for guideline-based Rx renewals under licensed oversight.',
      money_pool_ids: ['pool_clinical_labor','pool_provider_admin'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C2','C3','P5'],
      ai_surface_ids: ['ai_patient_access'],
      buyer_user: 'Patient / clinician',
      value_capture: 'private pay',
      evidence: 'official',
      public_note: 'Utah Department of Commerce announced partnership for AI prescription renewals.' },
    { id: 'company_collectly', name: 'Collectly', group: 'dvc',
      short_description: 'Patient billing & financial engagement / RCM workflow.',
      money_pool_ids: ['pool_provider_admin'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F6','F7'],
      ai_surface_ids: ['ai_financial_engagement'],
      buyer_user: 'Health system',
      value_capture: 'revenue capture',
      evidence: 'company_claim',
      public_note: 'Patient billing automation; category placement only.' },
    { id: 'company_redskyhealth', name: 'RedSkyHealth', group: 'dvc',
      short_description: 'Denial remediation and claims automation; provider-side financial workflow.',
      money_pool_ids: ['pool_provider_admin','pool_payer_admin'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F4','F5'],
      ai_surface_ids: ['ai_admin_rcm'],
      buyer_user: 'Health system',
      value_capture: 'revenue capture',
      evidence: 'context',
      public_note: 'Claims/denials automation; category placement.' },
    { id: 'company_workdn', name: 'Workdn / WorkDone', group: 'dvc',
      short_description: 'Hospital and workforce workflow automation.',
      money_pool_ids: ['pool_provider_admin','pool_it_data'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C4','F3'],
      ai_surface_ids: ['ai_admin_rcm'],
      buyer_user: 'Health system',
      value_capture: 'labor leverage',
      evidence: 'context',
      public_note: 'Hospital workflow operations automation; category placement.' },
    { id: 'company_denti_ai', name: 'Denti AI', group: 'dvc',
      short_description: 'Dental imaging / charting AI for provider workflow.',
      money_pool_ids: ['pool_clinical_labor','pool_supplies_devices'],
      destination_ids: ['dest_dental'],
      process_step_ids: ['C4','C5'],
      ai_surface_ids: ['ai_diagnostics'],
      buyer_user: 'Clinician',
      value_capture: 'workflow control',
      evidence: 'context',
      public_note: 'Dental diagnostics and provider workflow.' },
    { id: 'company_curex', name: 'Curex', group: 'dvc',
      short_description: 'Online allergy care and immunotherapy pathway.',
      money_pool_ids: ['pool_clinical_labor','pool_drugs_biologics'],
      destination_ids: ['dest_physician','dest_rx'],
      process_step_ids: ['C6','C7','P5'],
      ai_surface_ids: ['ai_patient_access'],
      buyer_user: 'Patient',
      value_capture: 'private pay',
      evidence: 'context',
      public_note: 'Treatment, adherence, and consumer-pay navigation.' },
    { id: 'company_nutrisense', name: 'Nutrisense', group: 'dvc',
      short_description: 'Metabolic health platform using CGM data and coaching.',
      money_pool_ids: ['pool_it_data','pool_supplies_devices'],
      destination_ids: ['dest_dme','dest_nondurable'],
      process_step_ids: ['C8','P2','P4'],
      ai_surface_ids: ['ai_prevention'],
      buyer_user: 'Patient',
      value_capture: 'private pay',
      evidence: 'context',
      public_note: 'Consumer prevention and self-pay metabolic platform.' },
    { id: 'company_neera', name: 'Neera Lab', group: 'dvc',
      short_description: 'Sleep and prevention technology.',
      money_pool_ids: ['pool_it_data','pool_supplies_devices'],
      destination_ids: ['dest_dme'],
      process_step_ids: ['C8','P2'],
      ai_surface_ids: ['ai_prevention'],
      buyer_user: 'Patient',
      value_capture: 'private pay',
      evidence: 'context',
      public_note: 'Private-pay sleep / monitoring.' },
    { id: 'company_bioptic', name: 'Bioptic', group: 'dvc',
      short_description: 'AI-native techbio — target & molecule discovery; biological data.',
      money_pool_ids: ['pool_drugs_biologics','pool_public_health_research','pool_it_data'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C5','C6','P3'],
      ai_surface_ids: ['ai_techbio'],
      buyer_user: 'Pharma',
      value_capture: 'scientific IP',
      evidence: 'context',
      public_note: 'Upstream of pharma revenue; techbio discovery.' },
    { id: 'company_kerna', name: 'Kerna Labs', group: 'dvc',
      short_description: 'AI-enabled RNA / mRNA therapeutics; personalized therapeutics.',
      money_pool_ids: ['pool_drugs_biologics','pool_public_health_research'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C6','P3'],
      ai_surface_ids: ['ai_techbio'],
      buyer_user: 'Pharma',
      value_capture: 'scientific IP',
      evidence: 'context',
      public_note: 'Techbio / personalized therapeutics.' },
    { id: 'company_asyliadx', name: 'AsyliaDx', group: 'dvc',
      short_description: 'Precision diagnostics; immunotherapy-related risk/response analysis.',
      money_pool_ids: ['pool_it_data','pool_clinical_labor'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C5','P3'],
      ai_surface_ids: ['ai_diagnostics','ai_techbio'],
      buyer_user: 'Clinician',
      value_capture: 'scientific IP',
      evidence: 'context',
      public_note: 'Precision diagnostics.' },
    { id: 'company_novogaia', name: 'Novogaia', group: 'dvc',
      short_description: 'AI-enabled natural-product / fungi-based discovery.',
      money_pool_ids: ['pool_drugs_biologics','pool_public_health_research'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C6','P3'],
      ai_surface_ids: ['ai_techbio'],
      buyer_user: 'Pharma',
      value_capture: 'scientific IP',
      evidence: 'context',
      public_note: 'Techbio in new therapeutic search spaces.' },

    // --- Benchmarks ---
    { id: 'company_open_evidence', name: 'OpenEvidence', group: 'benchmark',
      short_description: 'Clinician-facing medical knowledge and evidence retrieval.',
      money_pool_ids: ['pool_clinical_labor','pool_it_data'],
      destination_ids: ['dest_physician','dest_hospital'],
      process_step_ids: ['C2','C5'],
      ai_surface_ids: ['ai_scribes_copilots'],
      buyer_user: 'Clinician',
      value_capture: 'labor leverage',
      evidence: 'context',
      public_note: 'Clinical decision-support evidence layer.' },
    { id: 'company_alphafold', name: 'AlphaFold / DeepMind', group: 'benchmark',
      short_description: 'Foundational protein-structure model that became biotech research infrastructure.',
      money_pool_ids: ['pool_drugs_biologics','pool_public_health_research','pool_it_data'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C5','C6','P3'],
      ai_surface_ids: ['ai_techbio'],
      buyer_user: 'Pharma / research',
      value_capture: 'scientific IP',
      evidence: 'official',
      public_note: 'Open science benchmark for AI-for-biology.' },
    { id: 'company_isomorphic', name: 'Isomorphic Labs', group: 'benchmark',
      short_description: 'AI-first drug design building on DeepMind-era scientific modeling.',
      money_pool_ids: ['pool_drugs_biologics','pool_public_health_research'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C6','P3'],
      ai_surface_ids: ['ai_techbio'],
      buyer_user: 'Pharma',
      value_capture: 'scientific IP',
      evidence: 'context',
      public_note: 'Upstream of pharma revenue.' },
    { id: 'company_abridge', name: 'Abridge', group: 'benchmark',
      short_description: 'Ambient clinical documentation and encounter summarization.',
      money_pool_ids: ['pool_clinical_labor','pool_provider_admin'],
      destination_ids: ['dest_physician','dest_hospital'],
      process_step_ids: ['C4','F3'],
      ai_surface_ids: ['ai_scribes_copilots','ai_admin_rcm'],
      buyer_user: 'Clinician',
      value_capture: 'labor leverage',
      evidence: 'context',
      public_note: 'Benchmark for near-term provider ROI.' }
  ];

  // ------- Key takeaways -------------------------------------------------
  var takeaways = [
    { title: 'Follow the money, then the patient', copy: 'Healthcare AI adoption depends less on technical elegance than on who pays, who uses, and who captures the value.' },
    { title: 'Admin AI is an arms race', copy: 'Prior auth, coding, claims, and RCM are high-ROI AI surfaces, but automation on one side often triggers automation on the other.' },
    { title: 'Prevention needs a payer', copy: 'Consumer prevention scales through private pay. Systemic prevention requires VBC, employers, Medicare Advantage, ACOs, or CMS reimbursement.' },
    { title: 'The data layer is shared, not separate', copy: 'Care, payment, prevention, research, and admin loops all compete over the same records, claims, labs, devices, and workflow data.' },
    { title: 'AI moves both downstream and upstream', copy: 'Near-term wins are documentation and admin. The long-term shift is upstream into diagnostics, drug discovery, precision medicine, and continuous prevention.' }
  ];

  // ------- Sources -------------------------------------------------------
  var sources = [
    { label: 'CMS NHE Fact Sheet (2024)',          url: SRC.nhe },
    { label: 'CMS 2024 NHE Highlights PDF',        url: SRC.highlights },
    { label: 'CMS historical NHE data',            url: SRC.historical },
    { label: 'CMS Medical Loss Ratio',             url: SRC.mlr },
    { label: 'KFF / Health System Tracker',        url: SRC.kff2024 },
    { label: 'PHTI — Administrative AI',           url: SRC.phti },
    { label: 'MGMA — medical practice op costs',   url: SRC.mgma },
    { label: 'HHS/ASPE pharmaceutical supply chain', url: SRC.aspe_pharma },
    { label: 'Menlo Ventures — AI in Healthcare',  url: SRC.menlo },
    { label: 'Rock Health — 2025 digital health funding', url: SRC.rock },
    { label: 'CMS ACCESS model',                   url: SRC.access },
    { label: 'Utah · Doctronic partnership',       url: SRC.doctronic }
  ];

  // ------- Export --------------------------------------------------------
  root.HEALTHCARE_DATA = {
    SRC: SRC,
    headlineStats: headlineStats,
    sponsors: sponsors,

    paymentChannels: paymentChannels,
    destinations: destinations,
    costPools: costPools,
    moneyLinksAB: moneyLinksAB,
    moneyLinksBC: moneyLinksBC,

    aiSurfaces: aiSurfaces,
    moneyCallouts: moneyCallouts,

    patientStates: patientStates,
    careLoop: careLoop,
    financialLoop: financialLoop,
    preventionOrbit: preventionOrbit,
    vbcBridge: vbcBridge,
    sharedStack: sharedStack,
    stepStackDeps: stepStackDeps,
    stateScenarios: stateScenarios,

    tooltips: tooltips,
    companies: companies,
    takeaways: takeaways,
    sources: sources
  };
})(typeof window !== 'undefined' ? window : this);
