/* =====================================================================
   HEALTHCARE AI — DATA MODEL
   Money River: payments -> destinations -> cost pools
   Node totals are 2024 CMS NHE; internal routing is modeled and
   constrained to official totals.
   ===================================================================== */
(function (root) {
  'use strict';

  var SRC = {
    nhe:        'https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet',
    highlights: 'https://www.cms.gov/files/document/highlights.pdf',
    historical: 'https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/historical',
    mlr:        'https://www.cms.gov/marketplace/private-health-insurance/medical-loss-ratio',
    kff2024:    'https://www.healthsystemtracker.org/chart-collection/u-s-spending-healthcare-changed-time/',
    phti:       'https://phti.org/administrative-ai-current-use-and-potential-impact/',
    mgma:       'https://www.mgma.com/mgma-stat/medical-practice-operating-costs-are-still-rising-in-2025-heres-how-to-control-them',
    aspe_pharma:'https://www.ncbi.nlm.nih.gov/books/NBK611842/',
    menlo:      'https://menlovc.com/perspective/2025-the-state-of-ai-in-healthcare/',
    rock:       'https://rockhealth.com/insights/2025-year-end-digital-health-funding-overview-a-tale-of-two-markets/',
    access:     'https://www.cms.gov/priorities/innovation/innovation-models/access',
    doctronic:  'https://www.statnews.com/2026/03/23/ai-doctor-startup-doctronic-raises-40-million/',
    commonwealth:'https://www.commonwealthfund.org/publications/issue-briefs/2023/oct/high-us-health-care-spending-where-is-it-all-going',
    naic_mlr:   'https://content.naic.org/insurance-topics/medical-loss-ratio',
    hrsa_workforce:'https://bhw.hrsa.gov/data-research/projecting-health-workforce-supply-demand',
    cms_rht:    'https://www.cms.gov/priorities/innovation/innovation-models/rural-health-transformation-program',
    anthropic_health:'https://www.anthropic.com/solutions/healthcare-life-sciences',
    palantir_r1:'https://investors.palantir.com/news-details/2025/R1-Launches-R37-AI-Lab-with-Palantir/default.aspx',
    aha_telehealth:'https://www.aha.org/aha-center-health-innovation-market-scan/2025-02-04-behavioral-health-visits-surpass-primary-care',
    adentris:   'https://www.adentris.com/'
  };

  var headlineStats = [
    { label: 'US national health expenditure', value: '$5.3T',   sub: '2024 CMS NHE (final)', evidence: 'official', src: SRC.nhe },
    { label: 'Year-over-year growth',          value: '7.2%',    sub: '2024 final; CMS earlier projected 8.2%', evidence: 'official', src: SRC.nhe },
    { label: 'Per person',                     value: '$15,474', sub: '2024 CMS NHE', evidence: 'official', src: SRC.nhe },
    { label: 'Share of GDP',                   value: '18.0%',   sub: '2024 CMS NHE', evidence: 'official', src: SRC.nhe },
    { label: 'Healthcare AI spend (survey)',   value: '$1.4B',   sub: 'Menlo 2025',   evidence: 'vc_survey', src: SRC.menlo }
  ];

  // =====================================================================
  // PAYMENT CHANNELS (2024 CMS NHE source-of-funds)
  // =====================================================================
  var paymentChannels = [
    { id: 'pay_private_insurance', label: 'Private health insurance', value_b: 1644.6, display: '$1,644.6B',
      role: 'private', evidence: 'official', src: SRC.nhe, tooltip_id: 'tt_private_insurance',
      description: 'Commercial coverage, often employer-sponsored.' },
    { id: 'pay_medicare', label: 'Medicare', value_b: 1118.0, display: '$1,118.0B',
      role: 'public', evidence: 'official', src: SRC.nhe, tooltip_id: 'tt_medicare',
      description: 'Federal coverage for older adults and some disabled people.' },
    { id: 'pay_medicaid', label: 'Medicaid', value_b: 931.7, display: '$931.7B',
      role: 'public', evidence: 'official', src: SRC.nhe, tooltip_id: 'tt_medicaid',
      description: 'Joint federal-state coverage for eligible low-income populations.' },
    { id: 'pay_out_of_pocket', label: 'Out-of-pocket', value_b: 556.6, display: '$556.6B',
      role: 'oop', evidence: 'official', src: SRC.nhe, tooltip_id: 'tt_out_of_pocket',
      description: 'Direct patient spending.' },
    { id: 'pay_other_public_private', label: 'Other third-party payers & programs', value_b: 590.5, display: '$590.5B',
      role: 'other', evidence: 'official', src: SRC.nhe,
      description: 'VA, IHS, workers compensation, public health activity, and other third-party programs.' },
    { id: 'pay_residual', label: 'Other NHE / reconciliation', value_b: 458.6, display: '$458.6B',
      role: 'other', evidence: 'modeled_residual',
      description: 'Residual so the graph balances to total NHE.' }
  ];

  // =====================================================================
  // DESTINATION CATEGORIES (2024 CMS type-of-service)
  // =====================================================================
  var destinations = [
    { id: 'dest_hospital', label: 'Hospital care', value_b: 1634.7, display: '$1,634.7B',
      evidence: 'official', src: SRC.highlights, tooltip_id: 'tt_hospital',
      description: 'Inpatient, outpatient, and emergency services delivered by hospitals.' },
    { id: 'dest_physician', label: 'Physician & clinical services', value_b: 1109.7, display: '$1,109.7B',
      evidence: 'official', src: SRC.highlights, tooltip_id: 'tt_physician',
      description: 'Office visits, procedures, and clinical services billed by physicians and clinical groups.' },
    { id: 'dest_rx', label: 'Retail prescription drugs', value_b: 467.0, display: '$467.0B',
      evidence: 'official', src: SRC.highlights, tooltip_id: 'tt_rx',
      description: 'Outpatient prescription drugs dispensed by retail pharmacies.' },
    { id: 'dest_residential_personal', label: 'Other health, residential & personal care', value_b: 320.5, display: '$320.5B',
      evidence: 'official', src: SRC.highlights,
      description: 'Home- and community-based care, residential and personal services.' },
    { id: 'dest_nursing', label: 'Nursing care facilities & CCRCs', value_b: 219.9, display: '$219.9B',
      evidence: 'official', src: SRC.highlights,
      description: 'Skilled nursing facilities and continuing care retirement communities.' },
    { id: 'dest_dental', label: 'Dental services', value_b: 189.2, display: '$189.2B',
      evidence: 'official', src: SRC.highlights,
      description: 'Dental services.' },
    { id: 'dest_other_professional', label: 'Other professional services', value_b: 184.9, display: '$184.9B',
      evidence: 'official', src: SRC.highlights,
      description: 'Services from non-physician professionals (PT, OT, optometry, podiatry).' },
    { id: 'dest_home_health', label: 'Home health care', value_b: 169.4, display: '$169.4B',
      evidence: 'official', src: SRC.highlights,
      description: 'Skilled medical services and personal care delivered in the home.' },
    { id: 'dest_nondurable', label: 'Other non-durable medical products', value_b: 128.7, display: '$128.7B',
      evidence: 'official', src: SRC.highlights,
      description: 'OTC drugs and other non-durable medical goods.' },
    { id: 'dest_dme', label: 'Durable medical equipment', value_b: 86.4, display: '$86.4B',
      evidence: 'official', src: SRC.highlights,
      description: 'Long-use medical equipment such as wheelchairs, CPAPs, glucose monitors.' },
    { id: 'dest_residual', label: 'Admin, public health, investment & other', value_b: 789.6, display: '$789.6B',
      evidence: 'modeled_residual',
      description: 'Net cost of insurance, public health, structures, equipment, and research.' }
  ];

  // =====================================================================
  // COST POOLS (modeled, balanced to destination totals)
  // =====================================================================
  var costPools = [
    { id: 'pool_clinical_labor', label: 'Clinical labor', tooltip_id: 'tt_clinical_labor',
      description: 'Doctors, nurses, APPs, dentists, therapists, pharmacists, and care teams.' },
    { id: 'pool_provider_admin', label: 'Provider admin', tooltip_id: 'tt_provider_admin',
      description: 'Provider-side coding, billing, scheduling, prior auth, compliance, and collections.' },
    { id: 'pool_payer_admin', label: 'Payer operations', tooltip_id: 'tt_payer_admin',
      description: 'Claims, utilization management, payment integrity, customer service, and plan admin.' },
    { id: 'pool_drugs_biologics', label: 'Drugs & biologics', tooltip_id: 'tt_drugs_biologics',
      description: 'Therapeutic product value.' },
    { id: 'pool_supplies_devices', label: 'Supplies & devices', tooltip_id: 'tt_supplies_devices',
      description: 'Medical supplies, equipment, diagnostics, wearables, dental devices, and DME.' },
    { id: 'pool_facilities_capital', label: 'Facilities & capital',
      description: 'Hospitals, clinics, rent, utilities, depreciation, beds, ORs, imaging suites.' },
    { id: 'pool_it_data', label: 'IT & data', tooltip_id: 'tt_it_data',
      description: 'EHRs, data warehouses, interoperability, security, cloud, and workflow software.' },
    { id: 'pool_pharma_channel', label: 'Pharmacy / PBM channel',
      description: 'Pharmacies, wholesalers, PBM services, rebates, and channel economics.' },
    { id: 'pool_public_health_research', label: 'Public health & research',
      description: 'Public health activity, research, and facilities investment.' },
    { id: 'pool_margin_other', label: 'Margin & other',
      description: 'Residual economics not cleanly allocated; helps explain why cost savings do not always become lower prices.' }
  ];

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

  function buildAB(payments, dests, w) {
    var rowT = {}, colT = {};
    payments.forEach(function (p) { rowT[p.id] = p.value_b; });
    dests.forEach(function (d) { colT[d.id] = d.value_b; });
    var links = [];
    payments.forEach(function (p) {
      var row = w[p.id] || {};
      Object.keys(row).forEach(function (dId) {
        links.push({ source: p.id, target: dId, value_b: rowT[p.id] * row[dId], span: 'AB' });
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
    links.forEach(function (l) { l.id = 'fl_' + l.source + '__' + l.target; });
    return links;
  }
  function buildBC(dests, w) {
    var links = [];
    dests.forEach(function (d) {
      var row = w[d.id] || {};
      var ws = 0; Object.keys(row).forEach(function (k) { ws += row[k]; });
      if (ws <= 0) return;
      Object.keys(row).forEach(function (poolId) {
        links.push({ id: 'fl_' + d.id + '__' + poolId, source: d.id, target: poolId, value_b: d.value_b * (row[poolId] / ws), span: 'BC' });
      });
    });
    return links;
  }

  var moneyLinksAB = buildAB(paymentChannels, destinations, paymentToDestWeights);
  var moneyLinksBC = buildBC(destinations, destToPoolWeights);

  // =====================================================================
  // AI SURFACES (overlay, not money nodes; no TAM)
  // =====================================================================
  var aiSurfaces = [
    { id: 'ai_scribes_copilots', label: 'Clinical copilots',
      attach_pools: ['pool_clinical_labor','pool_it_data'],
      attach_steps: ['C4','C5','F3'],
      what: 'Evidence search, scribing, decision support, encounter documentation.',
      buyer: 'Clinician / health system.',
      adoption: 'Near-term ROI from clinician time. Workflow fit and liability gate adoption.' },
    { id: 'ai_admin_rcm', label: 'Admin / RCM',
      attach_pools: ['pool_provider_admin','pool_payer_admin'],
      attach_steps: ['F2','F3','F4','F5','F6'],
      what: 'Prior auth, coding, billing, claims, denials, collections. CMS NHE shows admin/insurance at ~$371B; the total addressable admin drag (provider billing + payer ops + clinical documentation) is ~$800-900B per Commonwealth Fund / JAMA.',
      buyer: 'Provider RCM teams; payer ops.',
      adoption: 'High ROI per workflow; can become an arms race between provider and payer AI.' },
    { id: 'ai_patient_access', label: 'Access / navigation',
      attach_pools: ['pool_provider_admin','pool_it_data'],
      attach_steps: ['C2','C3','F1'],
      what: 'Triage, scheduling, routing, benefits navigation.',
      buyer: 'Health system / employer / patient.',
      adoption: 'Changes the front door before it changes the hospital core.' },
    { id: 'ai_financial_engagement', label: 'Patient payments',
      attach_pools: ['pool_provider_admin','pool_payer_admin'],
      attach_steps: ['F6','F7'],
      what: 'Bills, payment plans, collections, eligibility, affordability.',
      buyer: 'Provider RCM teams.',
      adoption: 'Operational ROI is direct; consumer trust matters.' },
    { id: 'ai_diagnostics', label: 'Diagnostics',
      attach_pools: ['pool_supplies_devices','pool_clinical_labor','pool_it_data'],
      attach_steps: ['C1','C5','C8'],
      what: 'Imaging, labs, pathology, dental, signal interpretation.',
      buyer: 'Health system / specialist.',
      adoption: 'Regulated; needs evidence, oversight, auditability.' },
    { id: 'ai_prevention', label: 'Prevention',
      attach_pools: ['pool_clinical_labor','pool_it_data','pool_supplies_devices'],
      attach_steps: ['C8','P1','P2','P3','P4','V2','V3','V5'],
      what: 'Monitoring, coaching, adherence, risk management.',
      buyer: 'Consumer (private pay) or risk-bearing entity.',
      adoption: 'Systemic only when someone captures avoided downstream cost.' },
    { id: 'ai_techbio', label: 'Techbio',
      attach_pools: ['pool_drugs_biologics','pool_public_health_research','pool_it_data'],
      attach_steps: ['C5','C6','P3'],
      what: 'Target discovery, molecule design, diagnostics, precision medicine.',
      buyer: 'Pharma / research.',
      adoption: 'Long cycles; gated by trial design and regulation.' },
    { id: 'ai_site_of_care', label: 'Site of care',
      attach_pools: ['pool_facilities_capital','pool_clinical_labor','pool_it_data'],
      attach_steps: ['C3','C6','C7'],
      what: 'Routing, capacity, home/virtual shift, utilization management.',
      buyer: 'Health system / payer.',
      adoption: 'Hard without incentive to move volume off the highest-margin site.' }
  ];

  // =====================================================================
  // INCENTIVE CHIPS (regulatory / structural)
  // =====================================================================
  var incentives = [
    { id: 'inc_mlr', label: 'MLR rules',
      attach_pools: ['pool_payer_admin'],
      attach_nodes: ['pay_private_insurance'],
      message: 'ACA medical-loss-ratio rules cap insurer margin: 80% of premiums in individual/small-group, 85% in large-group must go to care and quality. Cost-reduction software is not SaaS-style margin expansion for insurers — it primarily benefits provider-side admin.' },
    { id: 'inc_admin_arms_race', label: 'Admin arms race',
      attach_pools: ['pool_provider_admin','pool_payer_admin'],
      attach_nodes: [],
      message: 'CMS counts ~$371B of admin/insurance overhead in NHE, but Commonwealth Fund / JAMA estimate the true addressable admin drag at ~$800-900B once provider billing complexity is added. AI can lower per-task cost but raise transaction volume: more coding, more prior-auth packets, more denials, more appeals.' },
    { id: 'inc_fee_for_service', label: 'FFS inertia',
      attach_pools: ['pool_clinical_labor'],
      attach_nodes: ['dest_hospital','dest_physician'],
      message: 'If payment is tied to events and services, prevention has weak economics unless risk shifts.' },
    { id: 'inc_vbc', label: 'VBC bridge',
      attach_pools: ['pool_clinical_labor','pool_payer_admin'],
      attach_nodes: [],
      message: 'Prevention becomes financeable when someone bears risk for downstream cost and can measure avoided events.' },
    { id: 'inc_cash_pay', label: 'Cash-pay bypass',
      attach_pools: ['pool_supplies_devices','pool_pharma_channel'],
      attach_nodes: ['pay_out_of_pocket','dest_rx'],
      message: 'Consumers can adopt wellness, labs, CGMs, and AI guidance faster than reimbursement systems can approve them.' },
    { id: 'inc_regulated_safety', label: 'Regulated safety',
      attach_pools: ['pool_clinical_labor','pool_it_data'],
      attach_nodes: [],
      message: 'Clinical claims require evidence, oversight, auditability, and sometimes FDA or regulatory pathways.' }
  ];

  // =====================================================================
  // PATIENT LOOP
  // =====================================================================
  var patientStates = [
    { id: 'state_healthy',     label: 'Healthy',     prompt: 'No acute event. Continuous consumer signal.', color: '#4ECDC4' },
    { id: 'state_at_risk',     label: 'At risk',     prompt: 'Lab, wearable, family history, or genomics indicates elevated risk.', color: '#F5C542' },
    { id: 'state_symptomatic', label: 'Symptomatic', prompt: 'Patient experiences symptoms and seeks help.', color: '#FF8C42' },
    { id: 'state_diagnosed',   label: 'Diagnosed',   prompt: 'A condition is named and treatment begins.', color: '#4A90D9' },
    { id: 'state_chronic',     label: 'Chronic',     prompt: 'Longitudinal management across visits and data streams.', color: '#7C4DFF' },
    { id: 'state_acute',       label: 'Acute',       prompt: 'High-intensity episode mobilizes hospital/urgent workflow.', color: '#E8837C' }
  ];

  // Care loop — clockwise upper ellipse
  // Centred on x=620 so VBC rail on the left and prevention loop on the
  // right both have clear gutters at desktop widths.
  var careLoop = [
    { id: 'C1', n: 1, label: 'Signal',           x: 320, y: 280, description: 'Symptom, wearable alert, lab abnormality, patient concern.', ai: ['ai_diagnostics','ai_prevention'] },
    { id: 'C2', n: 2, label: 'Triage',           x: 380, y: 165, description: 'Patient or clinician asks what to do next.', ai: ['ai_patient_access','ai_scribes_copilots'] },
    { id: 'C3', n: 3, label: 'Access',           x: 500, y: 110, description: 'Scheduling, routing, telehealth, right site of care.', ai: ['ai_patient_access','ai_site_of_care'] },
    { id: 'C4', n: 4, label: 'Encounter',        x: 620, y: 95,  description: 'Visit, admission, dental visit, diagnostic appointment.', ai: ['ai_scribes_copilots'] },
    { id: 'C5', n: 5, label: 'Dx / orders',      x: 740, y: 110, description: 'Labs, imaging, prescription, referral, treatment plan.', ai: ['ai_diagnostics','ai_techbio','ai_scribes_copilots'] },
    { id: 'C6', n: 6, label: 'Treatment',        x: 860, y: 165, description: 'Drug, procedure, therapy, behavior change, digital tool.', ai: ['ai_techbio','ai_site_of_care'] },
    { id: 'C7', n: 7, label: 'Follow-up',        x: 920, y: 280, description: 'Refill, adherence, escalation, monitoring, care plan adjustment.', ai: ['ai_site_of_care'] },
    { id: 'C8', n: 8, label: 'Monitor',          x: 800, y: 395, description: 'Continuous or episodic risk management — discharge to prevention or escalation.', ai: ['ai_prevention','ai_diagnostics'] }
  ];

  // Financial loop — counterclockwise lower ellipse
  var financialLoop = [
    { id: 'F1', n: 1, label: 'Eligibility',  x: 320, y: 360, description: 'Coverage, network, deductible, patient responsibility.', ai: ['ai_patient_access'] },
    { id: 'F2', n: 2, label: 'Prior auth',   x: 380, y: 475, description: 'Approval before selected care, tests, or drugs.', ai: ['ai_admin_rcm'] },
    { id: 'F3', n: 3, label: 'Coding',       x: 500, y: 530, description: 'Translate care into documentation and billable codes.', ai: ['ai_admin_rcm','ai_scribes_copilots'] },
    { id: 'F4', n: 4, label: 'Claim',        x: 620, y: 545, description: 'Submit claim to payer or patient.', ai: ['ai_admin_rcm'] },
    { id: 'F5', n: 5, label: 'Adjudication', x: 740, y: 530, description: 'Pay, deny, downcode, audit, or request more information.', ai: ['ai_admin_rcm'] },
    { id: 'F6', n: 6, label: 'Patient bill', x: 860, y: 475, description: 'Remaining responsibility becomes bill or payment plan.', ai: ['ai_financial_engagement','ai_admin_rcm'] },
    { id: 'F7', n: 7, label: 'Collection',   x: 920, y: 360, description: 'Payment, reconciliation, collection, write-off.', ai: ['ai_financial_engagement'] },
    { id: 'F8', n: 8, label: 'Quality/risk', x: 800, y: 245, description: 'Outcomes, quality, risk adjustment, VBC reporting.', ai: ['ai_prevention'] }
  ];

  // Prevention / monitoring loop — drawn as a closed loop to the right of
  // the care loop. P1..P5 step clockwise and P5 closes back to P1. The
  // loop is linked to the care loop at C8 → P1/P2 and P5 → C2 so it
  // never reads as a floating orbit.
  var preventionOrbit = [
    { id: 'P1', label: 'AI assistant',          x: 1040, y: 200, description: 'Patient-facing AI: asks questions, uploads labs, tracks goals.', ai: ['ai_patient_access','ai_prevention'] },
    { id: 'P2', label: 'Wearables / home',      x: 1075, y: 290, description: 'Sleep, HRV, CGM, activity, BP, recovery, symptoms.', ai: ['ai_prevention','ai_diagnostics'] },
    { id: 'P3', label: 'Labs / omics',          x: 1075, y: 365, description: 'Rich biological data for risk and personalization.', ai: ['ai_diagnostics','ai_techbio'] },
    { id: 'P4', label: 'Coaching',              x: 1040, y: 440, description: 'Behavior, nutrition, sleep, allergy care, follow-up, adherence.', ai: ['ai_prevention'] },
    { id: 'P5', label: 'Escalate → triage',     x: 970, y: 520, description: 'AI routes to licensed clinician or care setting. Feeds the care loop at triage.', ai: ['ai_patient_access'] }
  ];

  // VBC / risk bridge (left rail). Drawn flush-left so the rail label and
  // V1 box never crowd C2/Triage. Hull sits well to the left of the care
  // loop.
  var vbcBridge = [
    { id: 'V1', label: 'FFS default',           x: 100, y: 200, description: 'Fee-for-service pays when services happen. Prevention has weak economics.' },
    { id: 'V2', label: 'Risk contract',         x: 110, y: 285, description: 'Someone bears downstream cost and can benefit from avoided events.' },
    { id: 'V3', label: 'MA / ACO / employer',   x: 130, y: 365, description: 'Common places where risk, quality, and prevention can matter.' },
    { id: 'V4', label: 'Digital reimburse',     x: 145, y: 445, description: 'RTM, digital mental health, and CMS models create partial reimbursement paths.' },
    { id: 'V5', label: 'Prevention fundable',   x: 165, y: 525, description: 'Prevention becomes investable when outcomes and avoided cost are measurable.' }
  ];

  // Shared stack — order matches spec (top to bottom = layer 1 to 7)
  var sharedStack = [
    { id: 'stack_ai',         label: 'AI application',       contents: 'Copilots, agents, prediction, summarization, automation' },
    { id: 'stack_workflow',   label: 'Workflow',             contents: 'Scheduling, intake, notes, orders, referrals, refills, billing workflows' },
    { id: 'stack_decision',   label: 'Decision',             contents: 'Guidelines, evidence, payer rules, risk scores, clinical pathways' },
    { id: 'stack_data',       label: 'Data',                 contents: 'EHR, claims, labs, imaging, genomics, pharmacy, wearables' },
    { id: 'stack_admin',      label: 'Admin / reimbursement',contents: 'Benefits, prior auth, coding, claims, RCM, patient bills' },
    { id: 'stack_governance', label: 'Governance / trust',   contents: 'HIPAA, FDA, audit logs, liability, model monitoring, human oversight' },
    { id: 'stack_infra',      label: 'Infrastructure',       contents: 'APIs, cloud, identity, interoperability, security, devices' }
  ];

  // Step ↔ stack dependency mapping (per spec)
  var stepStackDeps = {
    C1: ['stack_data','stack_ai','stack_infra'],
    C2: ['stack_ai','stack_decision','stack_data','stack_governance'],
    C3: ['stack_workflow','stack_admin','stack_data'],
    C4: ['stack_workflow','stack_ai','stack_data','stack_governance'],
    C5: ['stack_decision','stack_data','stack_ai','stack_governance'],
    C6: ['stack_decision','stack_workflow','stack_data'],
    C7: ['stack_workflow','stack_data','stack_admin'],
    C8: ['stack_data','stack_ai','stack_workflow','stack_infra'],
    F1: ['stack_admin','stack_data','stack_workflow'],
    F2: ['stack_admin','stack_decision','stack_data'],
    F3: ['stack_admin','stack_workflow','stack_ai','stack_data'],
    F4: ['stack_admin','stack_workflow','stack_data'],
    F5: ['stack_admin','stack_decision','stack_ai','stack_data'],
    F6: ['stack_admin','stack_workflow'],
    F7: ['stack_admin','stack_workflow'],
    F8: ['stack_decision','stack_data','stack_admin'],
    P1: ['stack_ai','stack_data','stack_governance'],
    P2: ['stack_data','stack_infra','stack_ai'],
    P3: ['stack_data','stack_decision','stack_governance'],
    P4: ['stack_workflow','stack_ai','stack_data'],
    P5: ['stack_workflow','stack_admin','stack_governance'],
    V1: ['stack_admin'],
    V2: ['stack_admin','stack_decision'],
    V3: ['stack_admin','stack_data','stack_decision'],
    V4: ['stack_admin','stack_workflow'],
    V5: ['stack_decision','stack_data','stack_ai']
  };

  var stateScenarios = {
    state_healthy:     { care: ['C8'],                              financial: [],                                       prevention: ['P1','P2','P3','P4'], vbc: ['V1'],          scenario: 'Health starts outside the system: consumer data, labs, coaching, and self-pay prevention.' },
    state_at_risk:     { care: ['C1','C2','C5','C8'],               financial: ['F1','F8'],                              prevention: ['P2','P3'],           vbc: ['V2','V3','V5'],scenario: 'Risk signals become valuable when someone can fund prevention before an event.' },
    state_symptomatic: { care: ['C1','C2','C3','C4'],               financial: ['F1','F2','F3'],                         prevention: ['P1','P5'],           vbc: ['V1'],          scenario: 'A symptom triggers both care access and coverage/admin checks.' },
    state_diagnosed:   { care: ['C5','C6','C7'],                    financial: ['F3','F4','F6'],                         prevention: ['P4'],                vbc: ['V4'],          scenario: 'Treatment creates documentation, claims, follow-up, and patient responsibility.' },
    state_chronic:     { care: ['C8','C7','C6','C5'],               financial: ['F8','F4','F5','F6'],                    prevention: ['P2','P4'],           vbc: ['V2','V3','V5'],scenario: 'Chronic care is a loop: monitoring, adjustment, claims, and risk reporting.' },
    state_acute:       { care: ['C1','C3','C4','C5','C6'],          financial: ['F1','F2','F3','F4','F5'],               prevention: ['P5'],                vbc: ['V1'],          scenario: 'Acute care compresses the whole system into speed, triage, documentation, and payment.' }
  };

  // =====================================================================
  // TOOLTIPS — title + body (<= 45 words) only
  // =====================================================================
  var tooltips = {
    tt_private_insurance: { title: 'Private health insurance', body: 'Commercial coverage, often employer-sponsored. A major channel for provider revenue, payer operations, prior auth, claims, and patient navigation.' },
    tt_medicare:          { title: 'Medicare',                 body: 'Federal coverage mainly for older adults and some disabled people. Important for reimbursement, risk scoring, chronic care, and value-based models.' },
    tt_medicaid:          { title: 'Medicaid',                 body: 'Joint federal-state coverage for eligible low-income populations. Often shapes long-term care, home health, and safety-net economics.' },
    tt_out_of_pocket:     { title: 'Out-of-pocket',            body: 'Direct patient spending: deductibles, copays, uncovered care, cash-pay wellness, labs, devices, and supplements.' },
    tt_hospital:          { title: 'Hospital care',            body: 'The largest destination category. It contains labor, facilities, supplies, drugs, administration, IT, and margin, not one single AI market.' },
    tt_physician:         { title: 'Physician & clinical services', body: 'Clinics and professional services. Labor-heavy, workflow-heavy, and a major surface for copilots, access, documentation, and billing.' },
    tt_rx:                { title: 'Retail prescription drugs',body: 'Pharmacy-dispensed drugs. The value chain includes manufacturers, pharmacies, wholesalers, PBMs, rebates, formularies, and patient cost-sharing.' },
    tt_clinical_labor:    { title: 'Clinical labor',           body: 'Doctors, nurses, APPs, dentists, therapists, pharmacists, and care teams. AI can augment time and decisions but must fit workflow and liability.' },
    tt_provider_admin:    { title: 'Provider admin',           body: 'Provider-side coding, billing, scheduling, prior auth, compliance, and collections. The CMS NHE insurance/admin line is ~$371B (7% of NHE); provider+payer admin drag together is ~$800-900B (Commonwealth Fund / JAMA).' },
    tt_payer_admin:       { title: 'Payer operations',         body: 'Claims, utilization management, payment integrity, customer service, fraud review, and plan administration. The CMS NHE admin line (~$371B) captures insurer overhead only; total addressable admin drag is closer to $800-900B once provider billing complexity is included.' },
    tt_drugs_biologics:   { title: 'Drugs and biologics',      body: 'Therapeutic product value. AI can move upstream into discovery, trial design, precision medicine, and adherence.' },
    tt_supplies_devices:  { title: 'Supplies and devices',     body: 'Medical supplies, equipment, diagnostics, wearables, dental devices, and DME. AI often enters through signal interpretation and monitoring.' },
    tt_it_data:           { title: 'IT and data',              body: 'EHRs, data warehouses, interoperability, cybersecurity, cloud, and workflow software. A small cost pool but huge control point.' },
    tt_mlr:               { title: 'Medical loss ratio',       body: 'ACA MLR rules require insurers to spend 80% (individual/small group) or 85% (large group) of premiums on care and quality improvement, capping the margin available from cost-reduction software alone. Provider-side admin savings primarily benefit providers, not insurers.' },
    tt_vbc:               { title: 'Value-based care',         body: 'Payment tied to outcomes, quality, risk, or total cost. It is the bridge from event-driven care to prevention.' }
  };

  // =====================================================================
  // COMPANIES — precise placement per healthcare_ai_layer_audit_2025.md.
  //
  // role:
  //   'incumbent'  → market incumbent / installed-base owner for one layer
  //   'ai-native'  → AI-native leader for one layer (the "challenger" pair)
  //   'dvc'        → DVC portfolio company; precise to one layer only
  //   'drawer'     → relevant but too narrow/early/contested for surface
  //
  // group: kept for legacy CSS hooks ('leader' for incumbent / ai-native,
  // 'dvc' for DVC and drawer-only DVC pins).
  //
  // layer_id: matches a key in `companyLayers` below. Each (layer_id, role)
  // pair is unique among 'incumbent' and 'ai-native' roles; that's how the
  // surface picks the visible pair without repeating companies across
  // unrelated charts.
  //
  // outside_nhe: true marks pharma R&D / pharma intelligence companies that
  // live in the upstream biotech sidecar, not the NHE money river.
  // =====================================================================
  // Helper: build companies array from a compact spec keyed by layer.
  // Each entry uses layer_id + role to pin company to one place.
  var companies = [
    // ===================================================================
    // LAYER 1 — Hospital ops
    // ===================================================================
    { id: 'co_epic',            name: 'Epic',                 group: 'leader', role: 'incumbent', layer_id: 'L1_hospital_ops', tag: 'Incumbent · EHR backbone',
      short_description: '~38% of US hospital EHR market; Epic AI agents embedded in scheduling, capacity, early-warning workflows.',
      money_pool_ids: ['pool_it_data','pool_provider_admin'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C3','C4','C5','F3','F4'],
      ai_surface_ids: ['ai_scribes_copilots','ai_admin_rcm'],
      stack_ids: ['stack_data','stack_workflow','stack_infra'],
      buyer_user: 'Health system', value_capture: 'Enterprise EHR + AI add-ons' },
    { id: 'co_oracle_health',   name: 'Oracle Health',        group: 'leader', role: 'incumbent', layer_id: 'L1_hospital_ops', tag: 'Incumbent · #2 EHR',
      short_description: 'Oracle Health (Cerner) — #2 hospital EHR; Oracle AI Agent (2024) automates clinical workflows on Millennium.',
      money_pool_ids: ['pool_it_data','pool_provider_admin'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C4','C5','F3','F4'],
      ai_surface_ids: ['ai_admin_rcm','ai_scribes_copilots'],
      stack_ids: ['stack_data','stack_workflow'],
      buyer_user: 'Health system', value_capture: 'Enterprise EHR + cloud + AI' },
    { id: 'co_qventus',         name: 'Qventus',              group: 'leader', role: 'ai-native', layer_id: 'L1_hospital_ops', tag: 'AI-native leader',
      short_description: 'AI surgical scheduling and capacity automation deployed in 50+ health systems; $105M Series D 2024.',
      money_pool_ids: ['pool_provider_admin','pool_clinical_labor'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C3','C4'],
      ai_surface_ids: ['ai_patient_access','ai_admin_rcm'],
      stack_ids: ['stack_workflow','stack_ai'],
      buyer_user: 'Health system', value_capture: 'Enterprise SaaS' },
    { id: 'co_notable',         name: 'Notable',              group: 'leader', role: 'drawer', layer_id: 'L1_hospital_ops', tag: 'AI-native challenger',
      short_description: 'AI agents for patient access, care ops, and RCM workflow across health systems.',
      money_pool_ids: ['pool_provider_admin'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C3','F2','F3'],
      ai_surface_ids: ['ai_patient_access','ai_admin_rcm'],
      stack_ids: ['stack_workflow','stack_ai'],
      buyer_user: 'Health system', value_capture: 'Enterprise SaaS' },
    { id: 'co_qualified',       name: 'Qualified Health',     group: 'dvc',    role: 'dvc',       layer_id: 'L1_hospital_ops', tag: 'DVC portfolio · Hospital AI OS',
      short_description: 'Enterprise AI governance and deployment OS for health systems; ~$125M Series B; 500K+ users.',
      money_pool_ids: ['pool_it_data','pool_provider_admin'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C4','F2','F3','F8'],
      ai_surface_ids: ['ai_admin_rcm','ai_scribes_copilots'],
      stack_ids: ['stack_governance','stack_ai','stack_infra'],
      buyer_user: 'Health system', value_capture: 'Enterprise platform' },

    // ===================================================================
    // LAYER 2 — Physician groups / clinical services
    // ===================================================================
    { id: 'co_optum_care',      name: 'Optum Care',           group: 'leader', role: 'incumbent', layer_id: 'L2_physician_groups', tag: 'Incumbent · Largest physician employer',
      short_description: 'Largest US physician employer (~90,000 providers); UHG vertical integration of payer + provider.',
      money_pool_ids: ['pool_clinical_labor','pool_payer_admin'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C4','C5','C6','F8'],
      ai_surface_ids: ['ai_scribes_copilots'],
      stack_ids: ['stack_workflow','stack_data'],
      buyer_user: 'Health plan / employer', value_capture: 'Capitation + FFS' },
    { id: 'co_privia',          name: 'Privia Health',        group: 'leader', role: 'ai-native', layer_id: 'L2_physician_groups', tag: 'AI-native leader · Physician enablement',
      short_description: 'Tech-enabled physician enablement; $6.5B care under management; 2025 GenAI cut admin ~20%; 96% retention.',
      money_pool_ids: ['pool_clinical_labor','pool_provider_admin'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C4','C5','F3','F8'],
      ai_surface_ids: ['ai_scribes_copilots','ai_admin_rcm'],
      stack_ids: ['stack_workflow','stack_admin'],
      buyer_user: 'Independent physician group', value_capture: 'Risk + enablement fees' },
    { id: 'co_agilon',          name: 'Agilon Health',        group: 'leader', role: 'drawer',    layer_id: 'L2_physician_groups', tag: 'Drawer · MA risk enabler',
      short_description: 'Transforms independent PCPs into full-risk Medicare Advantage; ~500k attributed lives.',
      money_pool_ids: ['pool_clinical_labor','pool_payer_admin'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C7','F8'],
      ai_surface_ids: [],
      stack_ids: ['stack_admin','stack_decision'],
      buyer_user: 'PCP groups', value_capture: 'Capitation' },
    { id: 'co_navina',          name: 'Navina',               group: 'leader', role: 'drawer',    layer_id: 'L2_physician_groups', tag: 'Drawer · AI patient summaries',
      short_description: 'AI-generated patient summaries for primary care; strategic alliance with Agilon (2024).',
      money_pool_ids: ['pool_clinical_labor'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C4','C5'],
      ai_surface_ids: ['ai_scribes_copilots'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Primary-care physicians', value_capture: 'Per-provider SaaS' },

    // ===================================================================
    // LAYER 3 — Ambient documentation
    // ===================================================================
    { id: 'co_nuance_dax',      name: 'Nuance DAX',           group: 'leader', role: 'incumbent', layer_id: 'L3_ambient_doc', tag: 'Incumbent · Microsoft DAX Copilot',
      short_description: '#1 enterprise ambient scribe by deployment volume; deep Epic integration via Microsoft Dragon Copilot.',
      money_pool_ids: ['pool_clinical_labor','pool_it_data'],
      destination_ids: ['dest_physician','dest_hospital'],
      process_step_ids: ['C4','C5','F3'],
      ai_surface_ids: ['ai_scribes_copilots'],
      stack_ids: ['stack_ai','stack_workflow'],
      buyer_user: 'Health system', value_capture: 'Per-encounter / per-seat' },
    { id: 'co_abridge',         name: 'Abridge',              group: 'leader', role: 'ai-native', layer_id: 'L3_ambient_doc', tag: 'AI-native leader',
      short_description: 'GPT-4 + clinical corpus; $250M Feb 2025; deep Epic partnership; nursing scribe with Mayo in development.',
      money_pool_ids: ['pool_clinical_labor','pool_provider_admin'],
      destination_ids: ['dest_physician','dest_hospital'],
      process_step_ids: ['C4','C5','F3'],
      ai_surface_ids: ['ai_scribes_copilots'],
      stack_ids: ['stack_ai','stack_workflow'],
      buyer_user: 'Health system', value_capture: 'Enterprise per-clinician seat' },
    { id: 'co_ambience',        name: 'Ambience Healthcare',  group: 'leader', role: 'drawer',    layer_id: 'L3_ambient_doc', tag: 'Drawer · Specialty-tuned scribe',
      short_description: 'Selected by Cleveland Clinic over 5 competitors; 4,000+ providers in 15 weeks; specialty-tuned models.',
      money_pool_ids: ['pool_clinical_labor'],
      destination_ids: ['dest_physician','dest_hospital'],
      process_step_ids: ['C4','C5'],
      ai_surface_ids: ['ai_scribes_copilots'],
      stack_ids: ['stack_ai','stack_workflow'],
      buyer_user: 'Health system', value_capture: 'Enterprise SaaS' },
    { id: 'co_suki',            name: 'Suki',                 group: 'leader', role: 'drawer',    layer_id: 'L3_ambient_doc', tag: 'Drawer · Mid-market scribe',
      short_description: 'Broad EHR integrations (Epic, Oracle, athena, MEDITECH); strong in physician group / mid-market.',
      money_pool_ids: ['pool_clinical_labor'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C4','C5'],
      ai_surface_ids: ['ai_scribes_copilots'],
      stack_ids: ['stack_ai','stack_workflow'],
      buyer_user: 'Physician group', value_capture: 'Per-provider SaaS' },

    // ===================================================================
    // LAYER 4 — CDS / evidence search
    // ===================================================================
    { id: 'co_uptodate',        name: 'UpToDate',             group: 'leader', role: 'incumbent', layer_id: 'L4_cds_evidence', tag: 'Incumbent · Wolters Kluwer',
      short_description: '#1 point-of-care CDS globally; 40,000+ hospitals/clinics; UpToDate Expert AI launched on top.',
      money_pool_ids: ['pool_clinical_labor','pool_it_data'],
      destination_ids: ['dest_physician','dest_hospital'],
      process_step_ids: ['C2','C5'],
      ai_surface_ids: ['ai_scribes_copilots'],
      stack_ids: ['stack_decision','stack_data'],
      buyer_user: 'Hospital / physician', value_capture: 'Subscription' },
    { id: 'co_openevidence',    name: 'OpenEvidence',         group: 'leader', role: 'ai-native', layer_id: 'L4_cds_evidence', tag: 'AI-native leader',
      short_description: '$210M raise Aug 2025 at $3.5B valuation; AMA partnership; DeepConsult agent over 35M+ peer-reviewed papers.',
      money_pool_ids: ['pool_clinical_labor','pool_it_data'],
      destination_ids: ['dest_physician','dest_hospital'],
      process_step_ids: ['C2','C5'],
      ai_surface_ids: ['ai_scribes_copilots'],
      stack_ids: ['stack_ai','stack_decision'],
      buyer_user: 'Clinician', value_capture: 'Per-user subscription' },
    { id: 'co_evidencecare',    name: 'EvidenceCare',         group: 'leader', role: 'drawer',    layer_id: 'L4_cds_evidence', tag: 'Drawer · EHR-embedded CDS',
      short_description: 'EHR-embedded CDS (BetterCare); $100M+ financial impact for health-system clients in 2024; Series B 2025.',
      money_pool_ids: ['pool_provider_admin','pool_clinical_labor'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C5','F2'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_decision','stack_workflow'],
      buyer_user: 'Hospital service line', value_capture: 'Enterprise SaaS' },
    { id: 'co_atropos',         name: 'Atropos Health',       group: 'leader', role: 'drawer',    layer_id: 'L4_cds_evidence', tag: 'Drawer · Real-world evidence',
      short_description: 'Stanford spinout; real-world evidence at bedside; point-of-care evidence generation for clinicians.',
      money_pool_ids: ['pool_clinical_labor','pool_it_data'],
      destination_ids: ['dest_physician','dest_hospital'],
      process_step_ids: ['C5'],
      ai_surface_ids: ['ai_diagnostics'],
      stack_ids: ['stack_data','stack_decision'],
      buyer_user: 'Health system', value_capture: 'Enterprise SaaS' },

    // ===================================================================
    // LAYER 5 — Imaging AI
    // ===================================================================
    { id: 'co_siemens',         name: 'Siemens Healthineers', group: 'leader', role: 'incumbent', layer_id: 'L5_imaging', tag: 'Incumbent · Imaging hardware + AI',
      short_description: 'AI-Rad Companion suite; hardware + software bundled AI; global radiology platform.',
      money_pool_ids: ['pool_supplies_devices'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C5'],
      ai_surface_ids: ['ai_diagnostics'],
      stack_ids: ['stack_infra','stack_data'],
      buyer_user: 'Hospital / radiology', value_capture: 'Hardware + software bundle' },
    { id: 'co_aidoc',           name: 'Aidoc',                group: 'leader', role: 'ai-native', layer_id: 'L5_imaging', tag: 'AI-native leader',
      short_description: '"AI Operating System" for radiology; 30+ FDA clearances; 1,000+ medical centers; worklist + care coordination.',
      money_pool_ids: ['pool_supplies_devices','pool_clinical_labor'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C1','C5'],
      ai_surface_ids: ['ai_diagnostics'],
      stack_ids: ['stack_ai','stack_decision'],
      buyer_user: 'Hospital service line', value_capture: 'Enterprise license' },
    { id: 'co_vizai',           name: 'Viz.ai',               group: 'leader', role: 'drawer',    layer_id: 'L5_imaging', tag: 'Drawer · Stroke/neurovascular AI',
      short_description: 'Pioneer in stroke AI; first CPT codes for AI radiology analysis; Medicare NTAP reimbursement achieved.',
      money_pool_ids: ['pool_clinical_labor','pool_supplies_devices'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C1','C5'],
      ai_surface_ids: ['ai_diagnostics'],
      stack_ids: ['stack_ai','stack_decision'],
      buyer_user: 'Hospital service line', value_capture: 'Enterprise + procedure pull-through' },
    { id: 'co_radai',           name: 'Rad AI',               group: 'leader', role: 'drawer',    layer_id: 'L5_imaging', tag: 'Drawer · Radiology workflow',
      short_description: 'Radiology-specific AI reports, impression generation, workflow automation; radiologist-designed.',
      money_pool_ids: ['pool_clinical_labor'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C5'],
      ai_surface_ids: ['ai_diagnostics','ai_scribes_copilots'],
      stack_ids: ['stack_ai','stack_workflow'],
      buyer_user: 'Radiology group', value_capture: 'Per-radiologist SaaS' },

    // ===================================================================
    // LAYER 6 — Lab / genomics / precision diagnostics
    // ===================================================================
    { id: 'co_roche_foundation',name: 'Roche / Foundation',   group: 'leader', role: 'incumbent', layer_id: 'L6_lab_genomics', tag: 'Incumbent · CGP leader',
      short_description: 'Comprehensive genomic profiling leader; liquid biopsy + tissue testing; companion diagnostic standard.',
      money_pool_ids: ['pool_supplies_devices','pool_drugs_biologics'],
      destination_ids: ['dest_other_professional'],
      process_step_ids: ['C5','P3'],
      ai_surface_ids: ['ai_diagnostics'],
      stack_ids: ['stack_data','stack_decision'],
      buyer_user: 'Oncology center / pharma', value_capture: 'Per-test reimbursement + pharma services' },
    { id: 'co_tempus',          name: 'Tempus AI',            group: 'leader', role: 'ai-native', layer_id: 'L6_lab_genomics', tag: 'AI-native leader',
      short_description: 'Multimodal clinical + molecular data platform; FDA de novo; Illumina collaboration 2025; biopharma + clinic.',
      money_pool_ids: ['pool_supplies_devices','pool_it_data'],
      destination_ids: ['dest_other_professional'],
      process_step_ids: ['C5','P3'],
      ai_surface_ids: ['ai_diagnostics'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Oncology center / biopharma', value_capture: 'Lab fees + pharma data deals' },
    { id: 'co_guardant',        name: 'Guardant Health',      group: 'leader', role: 'drawer',    layer_id: 'L6_lab_genomics', tag: 'Drawer · Liquid biopsy',
      short_description: 'Liquid biopsy leader (Guardant360, Shield CRC screening); Medicare coverage; AI for ctDNA interpretation.',
      money_pool_ids: ['pool_supplies_devices'],
      destination_ids: ['dest_other_professional'],
      process_step_ids: ['C5','P3'],
      ai_surface_ids: ['ai_diagnostics'],
      stack_ids: ['stack_data','stack_decision'],
      buyer_user: 'Oncologist', value_capture: 'Per-test reimbursement' },
    { id: 'co_pathai',          name: 'PathAI',               group: 'leader', role: 'drawer',    layer_id: 'L6_lab_genomics', tag: 'Drawer · Digital pathology',
      short_description: 'AI-powered tissue analysis at scale for clinical labs and biopharma R&D.',
      money_pool_ids: ['pool_clinical_labor','pool_supplies_devices'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C5'],
      ai_surface_ids: ['ai_diagnostics'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Lab / pharma', value_capture: 'Per-slide + pharma services' },
    { id: 'co_asyliadx',        name: 'AsyliaDx',             group: 'dvc',    role: 'drawer',    layer_id: 'L6_lab_genomics', tag: 'DVC portfolio · Drawer (early stage)',
      short_description: 'Generative AI biomarker platform predicting PD-1 immunotherapy response in metastatic melanoma; pilot stage.',
      money_pool_ids: ['pool_it_data','pool_clinical_labor'],
      destination_ids: ['dest_other_professional'],
      process_step_ids: ['C5','P3'],
      ai_surface_ids: ['ai_diagnostics'],
      stack_ids: ['stack_data','stack_decision'],
      buyer_user: 'Specialist / pharma', value_capture: 'Test + pharma partnerships' },

    // ===================================================================
    // LAYER 7 — Provider RCM
    // ===================================================================
    { id: 'co_r1rcm',           name: 'R1 RCM',               group: 'leader', role: 'incumbent', layer_id: 'L7_provider_rcm', tag: 'Incumbent · Health-system RCM',
      short_description: 'End-to-end RCM outsourcing for health systems; AI-augmented coding + claims; ~$2.3B revenue.',
      money_pool_ids: ['pool_provider_admin'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F3','F4','F5','F6','F7'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_workflow'],
      buyer_user: 'Health system', value_capture: 'Outsourced RCM contract' },
    { id: 'co_thoughtful',      name: 'Thoughtful AI',        group: 'leader', role: 'ai-native', layer_id: 'L7_provider_rcm', tag: 'AI-native leader',
      short_description: 'AI agents for eligibility, prior auth, claim submission, denial management; full automation play.',
      money_pool_ids: ['pool_provider_admin'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F1','F2','F3','F4','F5'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_ai'],
      buyer_user: 'Provider RCM', value_capture: 'Performance-based RCM' },
    { id: 'co_waystar',         name: 'Waystar',              group: 'leader', role: 'drawer',    layer_id: 'L7_provider_rcm', tag: 'Drawer · Clearinghouse + RCM',
      short_description: 'AI-powered claims clearinghouse + RCM software; IPO 2024; $5T+ claims processed.',
      money_pool_ids: ['pool_provider_admin'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F2','F3','F4','F5','F6'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_workflow'],
      buyer_user: 'Provider RCM', value_capture: 'Transaction + SaaS fees' },
    { id: 'co_fathom',          name: 'Fathom',               group: 'leader', role: 'drawer',    layer_id: 'L7_provider_rcm', tag: 'Drawer · Autonomous coding',
      short_description: 'Autonomous medical coding; CVS Health Ventures strategic investment 2025; 95%+ code prediction accuracy.',
      money_pool_ids: ['pool_provider_admin'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F3'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_ai'],
      buyer_user: 'Provider RCM', value_capture: 'Per-encounter coding fee' },
    { id: 'co_smarterdx',       name: 'SmarterDx',            group: 'leader', role: 'drawer',    layer_id: 'L7_provider_rcm', tag: 'Drawer · CDI + denials',
      short_description: 'AI-powered clinical documentation improvement (CDI) + denials; SmarterDenials product.',
      money_pool_ids: ['pool_provider_admin'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['F3','F5'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_ai'],
      buyer_user: 'Health system', value_capture: 'SaaS + outcomes' },

    // ===================================================================
    // LAYER 7b — Patient billing (out-of-pocket collection)
    // ===================================================================
    { id: 'co_cedar',           name: 'Cedar',                group: 'leader', role: 'incumbent', layer_id: 'L7b_patient_billing', tag: 'Incumbent · Patient finance',
      short_description: 'AI patient financial engagement; $10B+ payments; 1.5B+ patient interactions.',
      money_pool_ids: ['pool_provider_admin'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F6','F7'],
      ai_surface_ids: ['ai_financial_engagement'],
      stack_ids: ['stack_admin','stack_workflow'],
      buyer_user: 'Provider RCM', value_capture: 'Per-account fee' },
    { id: 'co_collectly',       name: 'Collectly',            group: 'dvc',    role: 'ai-native', layer_id: 'L7b_patient_billing', tag: 'DVC portfolio · AI patient billing',
      short_description: 'AI patient billing across 3,000+ facilities; $1B+ managed; "Billie" voice/chat agent for out-of-pocket collection.',
      money_pool_ids: ['pool_provider_admin'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F6','F7'],
      ai_surface_ids: ['ai_financial_engagement'],
      stack_ids: ['stack_admin','stack_workflow'],
      buyer_user: 'Provider RCM', value_capture: 'Per-account fee' },

    // ===================================================================
    // LAYER 8 — Denials / prior auth
    // ===================================================================
    { id: 'co_surescripts',     name: 'Surescripts',          group: 'leader', role: 'incumbent', layer_id: 'L8_denials_prior_auth', tag: 'Incumbent · ePA network',
      short_description: 'Electronic prior auth for pharmacy; 1.5B+ transactions/yr; touchless PA network.',
      money_pool_ids: ['pool_provider_admin','pool_payer_admin'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['F2'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_infra'],
      buyer_user: 'Pharmacy / payer', value_capture: 'Transaction fees' },
    { id: 'co_cohere',          name: 'Cohere Health',        group: 'leader', role: 'ai-native', layer_id: 'L8_denials_prior_auth', tag: 'AI-native leader · Payer-side',
      short_description: 'Payer-side prior auth AI; 85% real-time approvals; clinically grounded — never uses AI to deny.',
      money_pool_ids: ['pool_payer_admin'],
      destination_ids: ['dest_residual'],
      process_step_ids: ['F2','F5'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_decision'],
      buyer_user: 'Health plan', value_capture: 'PMPM / SaaS' },
    { id: 'co_infinitus',       name: 'Infinitus',            group: 'leader', role: 'drawer',    layer_id: 'L8_denials_prior_auth', tag: 'Drawer · Voice AI for PA calls',
      short_description: 'Voice AI agents for prior-auth phone calls; reduced call time ~90%; used by major pharma/specialty pharmacy.',
      money_pool_ids: ['pool_provider_admin','pool_payer_admin'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['F2'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_workflow','stack_ai'],
      buyer_user: 'Specialty pharmacy / pharma', value_capture: 'Per-call SaaS' },
    { id: 'co_redsky',          name: 'RedSkyHealth',         group: 'dvc',    role: 'dvc',       layer_id: 'L8_denials_prior_auth', tag: 'DVC portfolio · Provider-side denials',
      short_description: 'AI claim-denial identification, remediation, and resubmission — provider side of the AI-vs-AI admin loop.',
      money_pool_ids: ['pool_provider_admin'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F4','F5'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_ai'],
      buyer_user: 'Provider RCM', value_capture: 'Performance-based RCM' },

    // ===================================================================
    // LAYER 9 — Payer ops
    // ===================================================================
    { id: 'co_cotiviti',        name: 'Cotiviti',             group: 'leader', role: 'incumbent', layer_id: 'L9_payer_ops', tag: 'Incumbent · Payment integrity',
      short_description: 'Payment accuracy + population health analytics for payers; processes billions of clinical/financial records.',
      money_pool_ids: ['pool_payer_admin'],
      destination_ids: ['dest_residual'],
      process_step_ids: ['F5','F8'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_data'],
      buyer_user: 'Health plan', value_capture: 'Performance fees + SaaS' },
    { id: 'co_healthedge',      name: 'HealthEdge',           group: 'leader', role: 'ai-native', layer_id: 'L9_payer_ops', tag: 'AI-native leader',
      short_description: 'Next-gen core admin processing system with agentic AI for claims routing, prior auth, VBC configuration.',
      money_pool_ids: ['pool_payer_admin'],
      destination_ids: ['dest_residual'],
      process_step_ids: ['F4','F5'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_ai'],
      buyer_user: 'Health plan', value_capture: 'Enterprise platform' },
    { id: 'co_zelis',           name: 'Zelis',                group: 'leader', role: 'drawer',    layer_id: 'L9_payer_ops', tag: 'Drawer · Payment integrity',
      short_description: 'Payment integrity, network analytics, claims editing; AI force-multiplier for existing payer systems.',
      money_pool_ids: ['pool_payer_admin'],
      destination_ids: ['dest_residual'],
      process_step_ids: ['F4','F5'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_data'],
      buyer_user: 'Health plan', value_capture: 'Performance fees' },
    { id: 'co_innovaccer',      name: 'Innovaccer',           group: 'leader', role: 'drawer',    layer_id: 'L9_payer_ops', tag: 'Drawer · Population health',
      short_description: 'Payer analytics + population health platform; cloud-native; data activation from EHR, pharmacy, SDOH, claims.',
      money_pool_ids: ['pool_payer_admin','pool_it_data'],
      destination_ids: ['dest_residual'],
      process_step_ids: ['F8'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_data','stack_admin'],
      buyer_user: 'Health plan / health system', value_capture: 'Enterprise platform' },

    // ===================================================================
    // LAYER 10 — VBC / MA / Medicaid
    // ===================================================================
    { id: 'co_uhg_optum',       name: 'UnitedHealth / Optum', group: 'leader', role: 'incumbent', layer_id: 'L10_vbc_ma', tag: 'Incumbent · Largest MA payer',
      short_description: 'Largest MA payer; vertical integration of payer, provider, PBM, and pharmacy.',
      money_pool_ids: ['pool_payer_admin','pool_clinical_labor','pool_pharma_channel'],
      destination_ids: ['dest_residual'],
      process_step_ids: ['F8'],
      ai_surface_ids: [],
      stack_ids: ['stack_admin','stack_data'],
      buyer_user: 'Members / employers', value_capture: 'Premiums + capitation' },
    { id: 'co_arcadia',         name: 'Arcadia',              group: 'leader', role: 'ai-native', layer_id: 'L10_vbc_ma', tag: 'AI-native leader',
      short_description: 'Population health + VBC analytics; serves 30%+ of Newsweek Best Hospitals; top MSSP/ACO REACH platform.',
      money_pool_ids: ['pool_it_data','pool_payer_admin'],
      destination_ids: ['dest_residual'],
      process_step_ids: ['F8'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_data','stack_decision'],
      buyer_user: 'Health system / payer', value_capture: 'Enterprise SaaS' },
    { id: 'co_evolent',         name: 'Evolent Health',       group: 'leader', role: 'drawer',    layer_id: 'L10_vbc_ma', tag: 'Drawer · Specialty risk',
      short_description: 'Specialty risk management for MA / Medicaid; oncology + cardiology capitation models.',
      money_pool_ids: ['pool_payer_admin'],
      destination_ids: ['dest_residual'],
      process_step_ids: ['F8'],
      ai_surface_ids: [],
      stack_ids: ['stack_admin','stack_decision'],
      buyer_user: 'Health plan', value_capture: 'Capitation' },
    { id: 'co_pearl_health',    name: 'Pearl Health',         group: 'leader', role: 'drawer',    layer_id: 'L10_vbc_ma', tag: 'Drawer · ACO REACH platform',
      short_description: 'AI-powered ACO REACH / MSSP platform for primary-care physicians; predictive analytics for Medicare risk.',
      money_pool_ids: ['pool_clinical_labor','pool_payer_admin'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['F8'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_data','stack_decision'],
      buyer_user: 'PCP / ACO', value_capture: 'Risk-share' },

    // ===================================================================
    // LAYER 11 — Retail pharmacy
    // ===================================================================
    { id: 'co_cvs_health',      name: 'CVS Health',           group: 'leader', role: 'incumbent', layer_id: 'L11_retail_pharmacy', tag: 'Incumbent · Largest retail pharmacy',
      short_description: 'Largest retail pharmacy chain; AI-driven inventory, adherence analytics, MinuteClinic integration.',
      money_pool_ids: ['pool_pharma_channel','pool_drugs_biologics'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C6','C7'],
      ai_surface_ids: [],
      stack_ids: ['stack_workflow','stack_data'],
      buyer_user: 'Patients / payers', value_capture: 'Dispensing margin' },
    { id: 'co_amazon_pharmacy', name: 'Amazon Pharmacy',      group: 'leader', role: 'ai-native', layer_id: 'L11_retail_pharmacy', tag: 'AI-native leader',
      short_description: 'Tech-first mail pharmacy + adherence packaging (PillPack); ML-driven refill prediction; insurer/prescriber APIs.',
      money_pool_ids: ['pool_pharma_channel','pool_drugs_biologics'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C6','C7'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_workflow','stack_infra'],
      buyer_user: 'Patient', value_capture: 'Dispensing + Prime bundle' },
    { id: 'co_plenful',         name: 'Plenful',              group: 'leader', role: 'drawer',    layer_id: 'L11_retail_pharmacy', tag: 'Drawer · 340B + pharmacy ops AI',
      short_description: 'AI workflow automation for 340B pharmacy operations + health-system pharmacy compliance.',
      money_pool_ids: ['pool_pharma_channel','pool_provider_admin'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['F3'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_workflow','stack_admin'],
      buyer_user: 'Hospital pharmacy / 340B', value_capture: 'Enterprise SaaS' },
    { id: 'co_scriptpro',       name: 'ScriptPro',            group: 'leader', role: 'drawer',    layer_id: 'L11_retail_pharmacy', tag: 'Drawer · Robotic dispensing',
      short_description: 'Robotic dispensing systems (99.7% accuracy); 150 Rx/hr throughput; 91% of 1998 robots still running.',
      money_pool_ids: ['pool_pharma_channel'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C6'],
      ai_surface_ids: [],
      stack_ids: ['stack_infra'],
      buyer_user: 'Pharmacy', value_capture: 'Hardware + service' },
    { id: 'co_curex',           name: 'Curex',                group: 'dvc',    role: 'drawer',    layer_id: 'L20_specialty_telehealth', tag: 'DVC portfolio · More example · Specialty (allergy)',
      short_description: 'Specialty allergy telehealth: AI-assisted sublingual immunotherapy. Narrow vertical, not a generic Rx leader.',
      money_pool_ids: ['pool_clinical_labor','pool_drugs_biologics'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C6','C7','P4'],
      ai_surface_ids: ['ai_patient_access','ai_prevention'],
      stack_ids: ['stack_workflow','stack_ai'],
      buyer_user: 'Patient', value_capture: 'Cash-pay or insured therapy plan' },

    // ===================================================================
    // LAYER 12 — PBM / specialty drug spend
    // ===================================================================
    { id: 'co_express_scripts', name: 'Express Scripts',      group: 'leader', role: 'incumbent', layer_id: 'L12_pbm', tag: 'Incumbent · #1 standalone PBM',
      short_description: 'Largest standalone PBM (Evernorth/Cigna); specialty pharmacy management; AI formulary optimization.',
      money_pool_ids: ['pool_pharma_channel','pool_drugs_biologics'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['F2','F8'],
      ai_surface_ids: [],
      stack_ids: ['stack_admin','stack_data'],
      buyer_user: 'Health plan / employer', value_capture: 'Spread + admin fees' },
    { id: 'co_capital_rx',      name: 'Capital Rx',           group: 'leader', role: 'ai-native', layer_id: 'L12_pbm', tag: 'AI-native challenger · Transparent PBM',
      short_description: 'Transparent / pass-through PBM challenger with AI-driven specialty optimization.',
      money_pool_ids: ['pool_pharma_channel'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['F2','F8'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_data'],
      buyer_user: 'Employer / health plan', value_capture: 'Pass-through + admin' },
    { id: 'co_navitus',         name: 'Navitus',              group: 'leader', role: 'drawer',    layer_id: 'L12_pbm', tag: 'Drawer · Pass-through PBM',
      short_description: 'Pass-through PBM (employer-facing); growing as transparent PBM alternative.',
      money_pool_ids: ['pool_pharma_channel'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['F2','F8'],
      ai_surface_ids: [],
      stack_ids: ['stack_admin'],
      buyer_user: 'Employer', value_capture: 'Admin fees' },
    { id: 'co_realrx',          name: 'RealRx',               group: 'leader', role: 'drawer',    layer_id: 'L12_pbm', tag: 'Drawer · Specialty AI optimization',
      short_description: 'Regional PBM using AI to direct specialty fills to lowest-net-cost pharmacy; AMCP 2025 study showed savings on top-10 drugs.',
      money_pool_ids: ['pool_pharma_channel','pool_drugs_biologics'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['F2'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_decision'],
      buyer_user: 'Plan sponsor', value_capture: 'Per-fill optimization' },

    // ===================================================================
    // LAYER 13 — Pharma intelligence (OUTSIDE NHE — biotech sidecar)
    // ===================================================================
    { id: 'co_iqvia',           name: 'IQVIA',                group: 'leader', role: 'incumbent', layer_id: 'L13_pharma_intel', tag: 'Incumbent · Pharma data + analytics',
      short_description: 'Largest life-sciences data/analytics globally; NPA/Xponent prescription data; IQVIA AI Assistant; AWS strategic cloud.',
      outside_nhe: true,
      money_pool_ids: ['pool_drugs_biologics','pool_it_data'],
      destination_ids: [],
      process_step_ids: [],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_data','stack_decision'],
      buyer_user: 'Pharma BD&L / commercial', value_capture: 'Enterprise SaaS / data subscriptions' },
    { id: 'co_alphasense',      name: 'AlphaSense',           group: 'leader', role: 'ai-native', layer_id: 'L13_pharma_intel', tag: 'AI-native leader · CI search',
      short_description: 'AI-powered competitive intelligence search; $500M+ ARR; 6,500+ customers; used by pharma CI teams.',
      outside_nhe: true,
      money_pool_ids: ['pool_drugs_biologics','pool_it_data'],
      destination_ids: [],
      process_step_ids: [],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_data','stack_ai'],
      buyer_user: 'Pharma / financial CI', value_capture: 'Enterprise subscriptions' },
    { id: 'co_bioptic',         name: 'Bioptic',              group: 'dvc',    role: 'dvc',       layer_id: 'L13_pharma_intel', tag: 'DVC portfolio · Pharma BD&L AI',
      short_description: 'AI engine for pharma business development; monitors 50+ global sources including Chinese patent databases.',
      outside_nhe: true,
      money_pool_ids: ['pool_drugs_biologics','pool_it_data'],
      destination_ids: [],
      process_step_ids: [],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_data','stack_decision'],
      buyer_user: 'Pharma BD&L', value_capture: 'Enterprise SaaS' },

    // ===================================================================
    // LAYER 14 — Drug discovery / techbio (OUTSIDE NHE — biotech sidecar)
    // ===================================================================
    { id: 'co_recursion',       name: 'Recursion + Exscientia',group: 'leader', role: 'incumbent', layer_id: 'L14_drug_discovery', tag: 'AI-native incumbent · Drug discovery',
      short_description: 'Phenomic screening + automated precision chemistry; merged 2024; end-to-end AI drug discovery; NASDAQ: RXRX.',
      outside_nhe: true,
      money_pool_ids: ['pool_drugs_biologics'],
      destination_ids: [],
      process_step_ids: [],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Pharma', value_capture: 'Pipeline + partnerships' },
    { id: 'co_isomorphic',      name: 'Isomorphic Labs',      group: 'leader', role: 'ai-native', layer_id: 'L14_drug_discovery', tag: 'AI-native leader · DeepMind spinout',
      short_description: 'AlphaFold successor; in active trials 2025-26; Eli Lilly + Novartis partnerships.',
      outside_nhe: true,
      money_pool_ids: ['pool_drugs_biologics'],
      destination_ids: [],
      process_step_ids: [],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Pharma', value_capture: 'Pharma deals + royalties' },
    { id: 'co_insilico',        name: 'Insilico Medicine',    group: 'leader', role: 'drawer',    layer_id: 'L14_drug_discovery', tag: 'Drawer · End-to-end AI pipeline',
      short_description: 'IPF drug ISM001-055 in Phase IIa; AI-designed molecule from target ID through IND in 18 months.',
      outside_nhe: true,
      money_pool_ids: ['pool_drugs_biologics'],
      destination_ids: [],
      process_step_ids: [],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Pharma', value_capture: 'Pipeline + partnerships' },
    { id: 'co_kerna',           name: 'Kerna Labs',           group: 'dvc',    role: 'drawer',    layer_id: 'L14_drug_discovery', tag: 'DVC portfolio · Drawer · Early stage',
      short_description: 'AI-designed mRNA therapeutics; foundation models of RNA optimize half-life, translatability, tissue specificity.',
      outside_nhe: true,
      money_pool_ids: ['pool_drugs_biologics'],
      destination_ids: [],
      process_step_ids: [],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Pharma', value_capture: 'Pipeline / partnerships' },
    { id: 'co_novogaia',        name: 'Novogaia',             group: 'dvc',    role: 'drawer',    layer_id: 'L14_drug_discovery', tag: 'DVC portfolio · Drawer · Early stage',
      short_description: 'AI decoding drug-like molecules from fungi mapped to validated targets; natural-products niche.',
      outside_nhe: true,
      money_pool_ids: ['pool_drugs_biologics'],
      destination_ids: [],
      process_step_ids: [],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Pharma', value_capture: 'Discovery partnerships' },

    // ===================================================================
    // LAYER 15 — EHR / interoperability / data exchange
    // ===================================================================
    { id: 'co_athena',          name: 'athenahealth',         group: 'leader', role: 'incumbent', layer_id: 'L15_ehr_data', tag: 'Incumbent · Ambulatory EHR',
      short_description: 'Ambulatory EHR; FHIR-compliant; CMS-aligned national network.',
      money_pool_ids: ['pool_it_data','pool_provider_admin'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C4','F3','F4'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_data','stack_workflow'],
      buyer_user: 'Ambulatory practice', value_capture: 'Per-encounter cloud EHR' },
    { id: 'co_datavant',        name: 'Datavant',             group: 'leader', role: 'ai-native', layer_id: 'L15_ehr_data', tag: 'AI-native leader · Health data exchange',
      short_description: 'Largest US health-data exchange; privacy-preserving record linkage; CMS TEFCA early adopter.',
      money_pool_ids: ['pool_it_data'],
      destination_ids: [],
      process_step_ids: [],
      ai_surface_ids: [],
      stack_ids: ['stack_data','stack_infra'],
      buyer_user: 'Pharma / payer / health system', value_capture: 'Enterprise platform' },
    { id: 'co_particle',        name: 'Particle Health',      group: 'leader', role: 'drawer',    layer_id: 'L15_ehr_data', tag: 'Drawer · FHIR retrieval',
      short_description: 'FHIR-based patient data retrieval at scale; TEFCA-aligned; used by digital health startups and payers.',
      money_pool_ids: ['pool_it_data'],
      destination_ids: [],
      process_step_ids: [],
      ai_surface_ids: [],
      stack_ids: ['stack_data','stack_infra'],
      buyer_user: 'Digital health / payer', value_capture: 'API + SaaS' },
    { id: 'co_health_gorilla',  name: 'Health Gorilla',       group: 'leader', role: 'drawer',    layer_id: 'L15_ehr_data', tag: 'Drawer · Clinical data API',
      short_description: 'Clinical data exchange API connecting labs, imaging, prescriptions via FHIR.',
      money_pool_ids: ['pool_it_data'],
      destination_ids: [],
      process_step_ids: [],
      ai_surface_ids: [],
      stack_ids: ['stack_data','stack_infra'],
      buyer_user: 'Digital health', value_capture: 'API + SaaS' },

    // ===================================================================
    // LAYER 16 — Consumer prevention / wearables / metabolic
    // ===================================================================
    { id: 'co_apple_health',    name: 'Apple Health',         group: 'leader', role: 'incumbent', layer_id: 'L16_consumer_prevention', tag: 'Incumbent · Wearable platform',
      short_description: 'Apple Watch — dominant consumer wearable; AFib detection FDA-cleared; ECG; health records integration.',
      money_pool_ids: ['pool_supplies_devices','pool_it_data'],
      destination_ids: ['dest_dme'],
      process_step_ids: ['C8','P2'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_data','stack_infra'],
      buyer_user: 'Consumer', value_capture: 'Device + ecosystem' },
    { id: 'co_dexcom',          name: 'Dexcom',               group: 'leader', role: 'incumbent', layer_id: 'L16_consumer_prevention', tag: 'Incumbent · CGM',
      short_description: '#1 medical CGM (~40% market); Stelo OTC CGM for non-diabetics; Oura integration.',
      money_pool_ids: ['pool_supplies_devices'],
      destination_ids: ['dest_dme'],
      process_step_ids: ['C8','P2'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_data','stack_infra'],
      buyer_user: 'Consumer / clinician', value_capture: 'Device + subscription' },
    { id: 'co_oura',            name: 'Oura',                 group: 'leader', role: 'ai-native', layer_id: 'L16_consumer_prevention', tag: 'AI-native leader',
      short_description: 'Smart ring with 40+ biometrics; Veri (metabolic) acquired 2024; Stelo CGM integration; ~$5B+ valuation.',
      money_pool_ids: ['pool_supplies_devices','pool_it_data'],
      destination_ids: ['dest_dme'],
      process_step_ids: ['C8','P2'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_data','stack_infra'],
      buyer_user: 'Consumer', value_capture: 'Device + subscription' },
    { id: 'co_levels',          name: 'Levels Health',        group: 'leader', role: 'drawer',    layer_id: 'L16_consumer_prevention', tag: 'Drawer · CGM + AI metabolic',
      short_description: 'CGM + AI metabolic coaching platform; ~$200/month DTC; real-time food-glucose response tracking.',
      money_pool_ids: ['pool_supplies_devices','pool_it_data'],
      destination_ids: ['dest_dme'],
      process_step_ids: ['C8','P2','P4'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_data','stack_workflow'],
      buyer_user: 'Consumer', value_capture: 'Membership + device' },
    { id: 'co_signos',          name: 'Signos',               group: 'leader', role: 'drawer',    layer_id: 'L16_consumer_prevention', tag: 'Drawer · CGM + AI weight',
      short_description: 'CGM + AI for weight management; personalized nutrition via blood-sugar patterns.',
      money_pool_ids: ['pool_supplies_devices','pool_it_data'],
      destination_ids: ['dest_dme'],
      process_step_ids: ['C8','P2','P4'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_data','stack_workflow'],
      buyer_user: 'Consumer', value_capture: 'Membership + device' },
    { id: 'co_nutrisense',      name: 'Nutrisense',           group: 'dvc',    role: 'drawer',    layer_id: 'L16_consumer_prevention', tag: 'DVC portfolio · Drawer · CGM + RD coaching',
      short_description: 'CGM paired with registered-dietitian coaching for metabolic health; coaching often $0 OOP for eligible users.',
      money_pool_ids: ['pool_it_data','pool_supplies_devices'],
      destination_ids: ['dest_dme'],
      process_step_ids: ['C8','P2','P4'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_data','stack_workflow'],
      buyer_user: 'Consumer', value_capture: 'Membership + device' },

    // ===================================================================
    // LAYER 17 — Direct-pay AI doctor / virtual primary care
    // ===================================================================
    { id: 'co_teladoc',         name: 'Teladoc',              group: 'leader', role: 'incumbent', layer_id: 'L17_virtual_pcp', tag: 'Incumbent · Largest telehealth',
      short_description: 'Largest telehealth platform globally; primary care, mental health, chronic care; payer/employer-contracted.',
      money_pool_ids: ['pool_clinical_labor','pool_provider_admin'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C2','C3','C4','P5'],
      ai_surface_ids: ['ai_patient_access'],
      stack_ids: ['stack_workflow','stack_admin'],
      buyer_user: 'Employer / payer', value_capture: 'PMPM + fee per visit' },
    { id: 'co_hippocratic',     name: 'Hippocratic AI',       group: 'leader', role: 'ai-native', layer_id: 'L17_virtual_pcp', tag: 'AI-native leader · AI staffing',
      short_description: 'AI health agents for patient education, navigation, chronic care support; staffing layer, not diagnostic replacement.',
      money_pool_ids: ['pool_clinical_labor','pool_provider_admin'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C2','C3','P1','P5'],
      ai_surface_ids: ['ai_patient_access','ai_prevention'],
      stack_ids: ['stack_ai','stack_workflow'],
      buyer_user: 'Health system / payer', value_capture: 'Enterprise SaaS' },
    { id: 'co_doctronic',       name: 'Doctronic',            group: 'dvc',    role: 'dvc',       layer_id: 'L17_virtual_pcp', tag: 'DVC portfolio · Direct-pay AI doctor',
      short_description: 'Multi-agent AI physician consultation (UCSF-validated); $40M+ raised; first US AI authorized to issue Rx renewals (Utah supervised pilot, 2025).',
      money_pool_ids: ['pool_clinical_labor','pool_provider_admin'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C2','C3','F1','P1','P5'],
      ai_surface_ids: ['ai_patient_access'],
      stack_ids: ['stack_workflow','stack_ai'],
      buyer_user: 'Patient / clinician', value_capture: 'Cash-pay consumer' },
    { id: 'co_healthtap',       name: 'HealthTap',            group: 'leader', role: 'drawer',    layer_id: 'L17_virtual_pcp', tag: 'Drawer · AI-DPC',
      short_description: 'AI-powered Direct Primary Care; HSA-compatible under H.R. 1 (2025).',
      money_pool_ids: ['pool_clinical_labor'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C2','C3'],
      ai_surface_ids: ['ai_patient_access'],
      stack_ids: ['stack_workflow','stack_ai'],
      buyer_user: 'Consumer / employer', value_capture: 'Subscription' },

    // ===================================================================
    // LAYER 18 — Dental AI
    // ===================================================================
    { id: 'co_henry_schein',    name: 'Henry Schein',         group: 'leader', role: 'incumbent', layer_id: 'L18_dental', tag: 'Incumbent · Dental distributor',
      short_description: 'Largest dental distributor; Dentrix + Ascend practice management; embeds VideaHealth AI.',
      money_pool_ids: ['pool_supplies_devices','pool_provider_admin'],
      destination_ids: ['dest_dental'],
      process_step_ids: ['C4','F3'],
      ai_surface_ids: [],
      stack_ids: ['stack_workflow','stack_data'],
      buyer_user: 'Dental practice', value_capture: 'Distribution + PMS license' },
    { id: 'co_pearl_dental',    name: 'Pearl',                group: 'leader', role: 'ai-native', layer_id: 'L18_dental', tag: 'AI-native leader · Global dental AI',
      short_description: 'Global dental AI leader; FDA-cleared 2D + 3D (CBCT); ADA strategic investment Dec 2024; 160+ DSOs.',
      money_pool_ids: ['pool_supplies_devices','pool_clinical_labor'],
      destination_ids: ['dest_dental'],
      process_step_ids: ['C5'],
      ai_surface_ids: ['ai_diagnostics'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Dental practice / DSO', value_capture: 'Per-chair SaaS' },
    { id: 'co_videa',           name: 'VideaHealth',          group: 'leader', role: 'drawer',    layer_id: 'L18_dental', tag: 'Drawer · Caries detection',
      short_description: 'FDA-cleared caries detection; Caries 3.0 model Jan 2025; embedded in Dentrix/Ascend.',
      money_pool_ids: ['pool_supplies_devices'],
      destination_ids: ['dest_dental'],
      process_step_ids: ['C5'],
      ai_surface_ids: ['ai_diagnostics'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Dental practice', value_capture: 'Per-chair SaaS' },
    { id: 'co_overjet',         name: 'Overjet',              group: 'leader', role: 'drawer',    layer_id: 'L18_dental', tag: 'Drawer · Caries + bone-loss AI',
      short_description: 'FDA-cleared for caries + radiographic bone loss; Overjet for Educators (June 2024).',
      money_pool_ids: ['pool_supplies_devices'],
      destination_ids: ['dest_dental'],
      process_step_ids: ['C5'],
      ai_surface_ids: ['ai_diagnostics'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Dental practice', value_capture: 'Per-chair SaaS' },
    { id: 'co_denti',           name: 'Denti AI',             group: 'dvc',    role: 'drawer',    layer_id: 'L18_dental', tag: 'DVC portfolio · Drawer · Multi-modal dental AI',
      short_description: 'Multi-modal dental AI: voice perio charting, AI notes, imaging analysis, AI receptionist; since 2018.',
      money_pool_ids: ['pool_clinical_labor','pool_supplies_devices','pool_provider_admin'],
      destination_ids: ['dest_dental'],
      process_step_ids: ['C4','C5','F3'],
      ai_surface_ids: ['ai_diagnostics','ai_scribes_copilots'],
      stack_ids: ['stack_ai','stack_workflow','stack_data'],
      buyer_user: 'Dental practice', value_capture: 'Per-chair subscription' },

    // ===================================================================
    // LAYER 19 — Mental health
    // ===================================================================
    { id: 'co_optum_behavioral',name: 'Optum Behavioral',     group: 'leader', role: 'incumbent', layer_id: 'L19_mental_health', tag: 'Incumbent · MBHO',
      short_description: 'Largest managed behavioral-health organization; employer + health-plan contracts; ~51M members.',
      money_pool_ids: ['pool_clinical_labor','pool_payer_admin'],
      destination_ids: ['dest_other_professional'],
      process_step_ids: ['C2','C3','C6'],
      ai_surface_ids: [],
      stack_ids: ['stack_admin','stack_data'],
      buyer_user: 'Employer / health plan', value_capture: 'Carve-out admin fees' },
    { id: 'co_spring_health',   name: 'Spring Health',        group: 'leader', role: 'ai-native', layer_id: 'L19_mental_health', tag: 'AI-native leader',
      short_description: 'Employer mental-health benefits with AI matching; ~$3.3B valuation 2025; 23M+ covered lives; 200 countries.',
      money_pool_ids: ['pool_clinical_labor'],
      destination_ids: ['dest_other_professional'],
      process_step_ids: ['C2','C3','C6'],
      ai_surface_ids: ['ai_patient_access','ai_prevention'],
      stack_ids: ['stack_workflow','stack_ai'],
      buyer_user: 'Employer', value_capture: 'PMPM + utilization' },
    { id: 'co_lyra',            name: 'Lyra Health',          group: 'leader', role: 'drawer',    layer_id: 'L19_mental_health', tag: 'Drawer · Triage + therapy',
      short_description: '30K+ providers; AI-enhanced triage + matching; evidence-based therapy with clinical oversight.',
      money_pool_ids: ['pool_clinical_labor'],
      destination_ids: ['dest_other_professional'],
      process_step_ids: ['C2','C3','C6'],
      ai_surface_ids: ['ai_patient_access'],
      stack_ids: ['stack_workflow','stack_ai'],
      buyer_user: 'Employer / health plan', value_capture: 'PMPM' },
    { id: 'co_modern_health',   name: 'Modern Health',        group: 'leader', role: 'drawer',    layer_id: 'L19_mental_health', tag: 'Drawer · Coaching + therapy',
      short_description: 'Global employer mental-health platform; coaching + therapy + psychiatry.',
      money_pool_ids: ['pool_clinical_labor'],
      destination_ids: ['dest_other_professional'],
      process_step_ids: ['C2','C3','C6'],
      ai_surface_ids: ['ai_patient_access'],
      stack_ids: ['stack_workflow'],
      buyer_user: 'Employer', value_capture: 'PMPM' },
    { id: 'co_lovon',           name: 'Lovon',                group: 'dvc',    role: 'drawer',    layer_id: 'L19_mental_health', tag: 'DVC portfolio · Drawer · Consumer mental wellbeing',
      short_description: 'Voice-first AI mental wellbeing app built with PhD psychologists; complement to therapy, not replacement.',
      money_pool_ids: ['pool_clinical_labor','pool_it_data'],
      destination_ids: ['dest_other_professional'],
      process_step_ids: ['P1','P4'],
      ai_surface_ids: ['ai_prevention','ai_patient_access'],
      stack_ids: ['stack_ai','stack_workflow'],
      buyer_user: 'Consumer', value_capture: 'Subscription' },
    { id: 'co_aurora',          name: 'Aurora',               group: 'dvc',    role: 'drawer',    layer_id: 'L19_mental_health', tag: 'DVC portfolio · Drawer · Consumer mental wellbeing',
      short_description: 'AI mental wellbeing app combining private conversations with peer-community layer; complement to therapy.',
      money_pool_ids: ['pool_clinical_labor','pool_it_data'],
      destination_ids: ['dest_other_professional'],
      process_step_ids: ['P1','P4'],
      ai_surface_ids: ['ai_prevention','ai_patient_access'],
      stack_ids: ['stack_ai','stack_workflow'],
      buyer_user: 'Consumer', value_capture: 'Subscription' },

    // ===================================================================
    // LAYER 21 — Sleep / nervous system
    // ===================================================================
    { id: 'co_resmed',          name: 'ResMed',               group: 'leader', role: 'incumbent', layer_id: 'L21_sleep', tag: 'Incumbent · CPAP + AirView',
      short_description: '#2 CPAP; AirView remote monitoring; AI-powered adherence management.',
      money_pool_ids: ['pool_supplies_devices'],
      destination_ids: ['dest_dme'],
      process_step_ids: ['C8','P2'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_infra','stack_data'],
      buyer_user: 'Patient / DME supplier', value_capture: 'Device + cloud subscription' },
    { id: 'co_eight_sleep',     name: 'Eight Sleep',          group: 'leader', role: 'ai-native', layer_id: 'L21_sleep', tag: 'AI-native leader',
      short_description: 'AI-powered smart mattress; $100M raise 2025; pursuing FDA clearance for sleep apnea + menopausal sleep.',
      money_pool_ids: ['pool_supplies_devices'],
      destination_ids: ['dest_dme'],
      process_step_ids: ['C8','P2'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_infra','stack_data'],
      buyer_user: 'Consumer', value_capture: 'Hardware + subscription' },
    { id: 'co_big_health',      name: 'Big Health (SleepioRx)',group: 'leader', role: 'drawer',   layer_id: 'L21_sleep', tag: 'Drawer · FDA-cleared PDT',
      short_description: 'FDA-cleared prescription digital therapeutic for chronic insomnia (Aug 2024); CBT-I; 25+ trials.',
      money_pool_ids: ['pool_drugs_biologics','pool_clinical_labor'],
      destination_ids: ['dest_other_professional'],
      process_step_ids: ['C6','P4'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_decision','stack_workflow'],
      buyer_user: 'Employer / payer', value_capture: 'PDT reimbursement' },
    { id: 'co_neera',           name: 'Neera Lab',            group: 'dvc',    role: 'drawer',    layer_id: 'L21_sleep', tag: 'DVC portfolio · Drawer · Early stage',
      short_description: 'Sleep and prevention technology for consumer health.',
      money_pool_ids: ['pool_supplies_devices','pool_it_data'],
      destination_ids: ['dest_dme'],
      process_step_ids: ['C8','P2'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_data','stack_ai'],
      buyer_user: 'Consumer', value_capture: 'Consumer device + service' },

    // ===================================================================
    // LAYER 22 — Skincare / beauty (DRAWER ONLY — outside scope)
    // ===================================================================
    { id: 'co_lovi',            name: 'Lovi',                 group: 'dvc',    role: 'drawer',    layer_id: 'L22_skincare', tag: 'DVC portfolio · More example · Consumer wellness',
      short_description: 'Consumer wellness AI: skin analysis and skincare recommendations. Wellness app, not regulated diagnostics.',
      money_pool_ids: ['pool_supplies_devices','pool_it_data'],
      destination_ids: ['dest_nondurable'],
      process_step_ids: ['P1','P4'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Consumer', value_capture: 'Subscription' },

    // ===================================================================
    // INFRASTRUCTURE / MODEL EXAMPLES — added to RCM, prior auth, and
    // payer-admin layers. Companies are surfaced in drawers, not on the
    // Money River canvas.
    // ===================================================================
    { id: 'co_claude_health',   name: 'Claude for Healthcare', group: 'leader', role: 'ai-native', layer_id: 'L8_denials_prior_auth', tag: 'Model infrastructure · HIPAA-ready',
      short_description: 'Anthropic Claude is HIPAA-ready for healthcare; prior-authorization review, claims appeals, CMS Coverage Database, ICD-10, NPI, and FHIR skills/connectors.',
      money_pool_ids: ['pool_payer_admin','pool_provider_admin'],
      destination_ids: ['dest_residual','dest_hospital','dest_physician'],
      process_step_ids: ['F2','F3','F5','F8','C5'],
      ai_surface_ids: ['ai_admin_rcm','ai_scribes_copilots'],
      stack_ids: ['stack_ai','stack_governance','stack_admin','stack_decision'],
      buyer_user: 'Payer / provider admin', value_capture: 'Model API + skills' },
    { id: 'co_palantir',        name: 'Palantir / R1 R37 AI Lab', group: 'leader', role: 'ai-native', layer_id: 'L7_provider_rcm', tag: 'Enterprise RCM AI · Exclusive R1 partner',
      short_description: 'R1 RCM launched R37 AI Lab in exclusive partnership with Palantir to transform healthcare financial performance.',
      money_pool_ids: ['pool_provider_admin'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F3','F4','F5','F7'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_ai','stack_data'],
      buyer_user: 'Health system', value_capture: 'Enterprise platform + RCM services' },
    { id: 'co_adentris',        name: 'Adentris',             group: 'dvc',    role: 'drawer',    layer_id: 'L7_provider_rcm', tag: 'DVC portfolio · Early stage · Documentation compliance',
      short_description: 'Real-time AI compliance for medical documentation. EHR-integrated; catches documentation issues before denials, audits, or lawsuits. Formerly WorkDone (YC).',
      money_pool_ids: ['pool_provider_admin','pool_clinical_labor'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F3','F4','F8'],
      ai_surface_ids: ['ai_admin_rcm','ai_scribes_copilots'],
      stack_ids: ['stack_admin','stack_workflow','stack_ai'],
      buyer_user: 'Health system / physician group', value_capture: 'SaaS / per-encounter' }
  ];

  // =====================================================================
  // COMPANY LAYERS — precise per-layer pair (incumbent + ai-native) +
  // drawer set. The visible-overlay code reads this to render at most
  // 2 badges on any element; drawers can show the broader set.
  // =====================================================================
  var companyLayers = {
    L1_hospital_ops:           { label: 'Hospital operations',          destinations: ['dest_hospital'],            pools: ['pool_provider_admin'],     stack_ids: ['stack_workflow','stack_data','stack_infra','stack_admin'],
      pair: ['co_epic','co_qventus'], drawer: ['co_oracle_health','co_notable','co_qualified'] },
    L2_physician_groups:       { label: 'Physician groups / clinical services', destinations: ['dest_physician'],   pools: ['pool_clinical_labor'],     stack_ids: ['stack_workflow','stack_decision'],
      pair: ['co_optum_care','co_privia'], drawer: ['co_agilon','co_navina'] },
    L3_ambient_doc:            { label: 'Ambient documentation',        destinations: ['dest_physician','dest_hospital'], pools: ['pool_clinical_labor'], stack_ids: ['stack_ai','stack_workflow'],
      pair: ['co_nuance_dax','co_abridge'], drawer: ['co_ambience','co_suki'] },
    L4_cds_evidence:           { label: 'Clinical decision support',    destinations: ['dest_physician','dest_hospital'], pools: ['pool_clinical_labor','pool_it_data'], stack_ids: ['stack_decision','stack_data'],
      pair: ['co_uptodate','co_openevidence'], drawer: ['co_evidencecare','co_atropos'] },
    L5_imaging:                { label: 'Imaging AI',                   destinations: ['dest_hospital'],            pools: ['pool_supplies_devices'],   stack_ids: ['stack_ai','stack_data'],
      pair: ['co_siemens','co_aidoc'], drawer: ['co_vizai','co_radai'] },
    L6_lab_genomics:           { label: 'Lab / genomics / precision diagnostics', destinations: ['dest_other_professional'], pools: ['pool_supplies_devices'], stack_ids: ['stack_ai','stack_data'],
      pair: ['co_roche_foundation','co_tempus'], drawer: ['co_guardant','co_pathai','co_asyliadx'] },
    L7_provider_rcm:           { label: 'Provider RCM',                 destinations: ['dest_hospital','dest_physician'], pools: ['pool_provider_admin'], stack_ids: ['stack_admin','stack_workflow'],
      pair: ['co_r1rcm','co_thoughtful'], drawer: ['co_palantir','co_waystar','co_fathom','co_smarterdx','co_adentris'] },
    L7b_patient_billing:       { label: 'Patient billing / out-of-pocket collection', destinations: ['dest_hospital','dest_physician'], pools: ['pool_provider_admin'], stack_ids: ['stack_admin','stack_workflow'],
      pair: ['co_cedar','co_collectly'], drawer: [] },
    L8_denials_prior_auth:     { label: 'Denials / prior auth',         destinations: ['dest_rx','dest_residual','dest_hospital','dest_physician'], pools: ['pool_provider_admin','pool_payer_admin'], stack_ids: ['stack_admin','stack_decision','stack_ai'],
      pair: ['co_surescripts','co_cohere'], drawer: ['co_claude_health','co_infinitus','co_redsky'] },
    L9_payer_ops:              { label: 'Payer claims / admin',         destinations: ['dest_residual'],            pools: ['pool_payer_admin'],        stack_ids: ['stack_admin','stack_data'],
      pair: ['co_cotiviti','co_healthedge'], drawer: ['co_zelis','co_innovaccer'] },
    L10_vbc_ma:                { label: 'MA / Medicaid / VBC',          destinations: ['dest_residual','dest_physician'], pools: ['pool_payer_admin','pool_clinical_labor'], stack_ids: ['stack_admin','stack_data','stack_decision'],
      pair: ['co_uhg_optum','co_arcadia'], drawer: ['co_evolent','co_pearl_health'] },
    L11_retail_pharmacy:       { label: 'Retail pharmacy',              destinations: ['dest_rx'],                  pools: ['pool_pharma_channel','pool_drugs_biologics'], stack_ids: ['stack_workflow','stack_infra'],
      pair: ['co_cvs_health','co_amazon_pharmacy'], drawer: ['co_plenful','co_scriptpro'] },
    L12_pbm:                   { label: 'PBM / specialty drug spend',   destinations: ['dest_rx'],                  pools: ['pool_pharma_channel','pool_drugs_biologics'], stack_ids: ['stack_admin','stack_decision'],
      pair: ['co_express_scripts','co_capital_rx'], drawer: ['co_navitus','co_realrx'] },
    L13_pharma_intel:          { label: 'Pharma intelligence', outside_nhe: true, destinations: [], pools: ['pool_drugs_biologics','pool_it_data'], stack_ids: ['stack_data','stack_decision','stack_ai'],
      pair: ['co_iqvia','co_alphasense'], drawer: ['co_bioptic'] },
    L14_drug_discovery:        { label: 'Drug discovery / techbio', outside_nhe: true, destinations: [], pools: ['pool_drugs_biologics'], stack_ids: ['stack_ai','stack_data'],
      pair: ['co_recursion','co_isomorphic'], drawer: ['co_insilico','co_kerna','co_novogaia'] },
    L15_ehr_data:              { label: 'EHR / data exchange',          destinations: ['dest_physician','dest_hospital'], pools: ['pool_it_data'], stack_ids: ['stack_data','stack_infra'],
      pair: ['co_athena','co_datavant'], drawer: ['co_particle','co_health_gorilla'] },
    L16_consumer_prevention:   { label: 'Consumer prevention / wearables', destinations: ['dest_dme'],              pools: ['pool_supplies_devices','pool_it_data'], stack_ids: ['stack_data','stack_infra'],
      pair: ['co_apple_health','co_oura'], drawer: ['co_dexcom','co_levels','co_signos','co_nutrisense'] },
    L17_virtual_pcp:           { label: 'Direct-pay AI doctor',         destinations: ['dest_physician'],           pools: ['pool_clinical_labor'],     stack_ids: ['stack_workflow','stack_ai'],
      pair: ['co_teladoc','co_hippocratic'], drawer: ['co_doctronic','co_healthtap'] },
    L18_dental:                { label: 'Dental AI',                    destinations: ['dest_dental'],              pools: ['pool_supplies_devices','pool_clinical_labor'], stack_ids: ['stack_ai','stack_data'],
      pair: ['co_henry_schein','co_pearl_dental'], drawer: ['co_videa','co_overjet','co_denti'] },
    L19_mental_health:         { label: 'Mental health',                destinations: ['dest_other_professional'],  pools: ['pool_clinical_labor'],     stack_ids: ['stack_workflow','stack_ai'],
      pair: ['co_optum_behavioral','co_spring_health'], drawer: ['co_lyra','co_modern_health','co_lovon','co_aurora'] },
    L20_specialty_telehealth:  { label: 'Specialty telehealth (allergy)',destinations: ['dest_physician'],          pools: ['pool_clinical_labor'],     stack_ids: ['stack_workflow'],
      pair: [null, null], drawer: ['co_curex'] },
    L21_sleep:                 { label: 'Sleep / rest',                 destinations: ['dest_dme'],                 pools: ['pool_supplies_devices'],   stack_ids: ['stack_infra','stack_data'],
      pair: ['co_resmed','co_eight_sleep'], drawer: ['co_big_health','co_neera'] },
    L22_skincare:              { label: 'Skincare / beauty (more examples)', destinations: ['dest_nondurable'],       pools: [],                          stack_ids: [],
      pair: [null, null], drawer: ['co_lovi'] }
  };

  // ---------------------------------------------------------------------
  // ELEMENT → LAYER MAPPINGS (priority-ordered).
  // The first layer in each list seeds the visible pair; the rest are
  // pulled into the drawer.
  // ---------------------------------------------------------------------
  var destinationToLayers = {
    dest_hospital:             ['L1_hospital_ops','L3_ambient_doc','L7_provider_rcm','L5_imaging'],
    dest_physician:            ['L2_physician_groups','L3_ambient_doc','L17_virtual_pcp','L15_ehr_data'],
    dest_rx:                   ['L11_retail_pharmacy','L12_pbm','L8_denials_prior_auth'],
    dest_dental:               ['L18_dental'],
    dest_other_professional:   ['L19_mental_health','L6_lab_genomics'],
    // home health / nursing / residential_personal don't have a dedicated
    // audit layer; leave empty so the visible overlay doesn't accidentally
    // plaster physician-group leaders across those destinations.
    dest_home_health:          [],
    dest_dme:                  ['L16_consumer_prevention','L21_sleep'],
    dest_residential_personal: [],
    dest_nursing:              [],
    dest_nondurable:           ['L11_retail_pharmacy','L22_skincare'],
    dest_residual:             ['L9_payer_ops','L10_vbc_ma','L8_denials_prior_auth']
  };

  var poolToLayers = {
    pool_clinical_labor:       ['L3_ambient_doc','L2_physician_groups','L17_virtual_pcp','L19_mental_health'],
    pool_provider_admin:       ['L7_provider_rcm','L7b_patient_billing','L8_denials_prior_auth','L1_hospital_ops'],
    pool_payer_admin:          ['L9_payer_ops','L8_denials_prior_auth','L10_vbc_ma'],
    // Therapeutic product value is upstream — biotech sidecar owns this
    // pool's leadership; don't repeat retail-pharmacy leaders here.
    pool_drugs_biologics:      [],
    pool_supplies_devices:     ['L5_imaging','L16_consumer_prevention','L18_dental','L21_sleep','L6_lab_genomics'],
    // Facilities/capital has no AI-native leader pair; leave empty so the
    // overlay doesn't bleed hospital-ops badges into a pool where they
    // don't precisely belong (hospital ops still surfaces on dest_hospital).
    pool_facilities_capital:   [],
    pool_it_data:              ['L15_ehr_data','L4_cds_evidence','L9_payer_ops'],
    pool_pharma_channel:       ['L11_retail_pharmacy','L12_pbm'],
    pool_public_health_research:[],
    pool_margin_other:         []
  };

  var stepToLayers = {
    C1: ['L5_imaging','L16_consumer_prevention'],
    C2: ['L17_virtual_pcp','L19_mental_health','L4_cds_evidence'],
    C3: ['L17_virtual_pcp','L1_hospital_ops'],
    C4: ['L3_ambient_doc','L2_physician_groups'],
    C5: ['L4_cds_evidence','L5_imaging','L6_lab_genomics'],
    C6: ['L11_retail_pharmacy','L19_mental_health','L21_sleep'],
    C7: ['L11_retail_pharmacy','L2_physician_groups'],
    C8: ['L16_consumer_prevention','L21_sleep'],
    F1: ['L7_provider_rcm','L7b_patient_billing'],
    F2: ['L8_denials_prior_auth','L12_pbm'],
    F3: ['L7_provider_rcm','L3_ambient_doc'],
    F4: ['L7_provider_rcm','L9_payer_ops'],
    F5: ['L9_payer_ops','L8_denials_prior_auth'],
    F6: ['L7b_patient_billing'],
    F7: ['L7b_patient_billing'],
    F8: ['L10_vbc_ma','L9_payer_ops'],
    P1: ['L17_virtual_pcp','L19_mental_health'],
    P2: ['L16_consumer_prevention','L21_sleep'],
    P3: ['L6_lab_genomics','L16_consumer_prevention'],
    P4: ['L16_consumer_prevention','L19_mental_health'],
    P5: ['L17_virtual_pcp'],
    V1: ['L10_vbc_ma'], V2: ['L10_vbc_ma'], V3: ['L10_vbc_ma'], V4: ['L10_vbc_ma'], V5: ['L10_vbc_ma']
  };

  var stackToLayers = {
    stack_ai:         ['L3_ambient_doc','L4_cds_evidence','L5_imaging','L7_provider_rcm','L8_denials_prior_auth','L17_virtual_pcp','L19_mental_health','L18_dental'],
    stack_workflow:   ['L1_hospital_ops','L7_provider_rcm','L7b_patient_billing','L17_virtual_pcp','L3_ambient_doc','L2_physician_groups'],
    stack_decision:   ['L4_cds_evidence','L10_vbc_ma','L8_denials_prior_auth','L12_pbm'],
    stack_data:       ['L15_ehr_data','L6_lab_genomics','L16_consumer_prevention','L9_payer_ops'],
    stack_admin:      ['L7_provider_rcm','L7b_patient_billing','L8_denials_prior_auth','L9_payer_ops','L12_pbm','L10_vbc_ma'],
    stack_governance: ['L1_hospital_ops'],
    stack_infra:      ['L15_ehr_data','L16_consumer_prevention','L21_sleep','L11_retail_pharmacy','L5_imaging']
  };

  // Biotech sidecar copy (rendered alongside the river, OUTSIDE NHE)
  var biotechSidecar = {
    title: 'Biotech & pharma R&D — upstream of NHE',
    body: 'Drug discovery and biotech R&D sit upstream of the $5.3T NHE. NHE counts drugs when they reach patients: retail Rx ($467B); pharma R&D capital is outside NHE. Pharma intelligence (BD&L SaaS) is also outside NHE.',
    linked_destination: 'dest_rx',
    layers: ['L14_drug_discovery','L13_pharma_intel']
  };

  var flowMicrocopy = {
      "fl_pay_medicaid__dest_dental": {
        title: "Medicaid Dental (Adults & CHIP)",
        what_it_is: "Medicaid covers dental for children (EPSDT mandate) and offers optional adult dental benefits that vary by state; CHIP covers pediatric dental comprehensively.",
        payer_incentive: ["EPSDT mandates comprehensive preventive and restorative dental for all Medicaid children; states must cover it even if below cost.", "Adult dental is optional; most states offer limited benefits (emergency extraction only in some); expansion of adult dental is a key equity policy lever."],
        recipient_incentive: ["Dentist participation in Medicaid is low due to low fees and administrative burden; FQHCs and community health centers are primary dental access points for Medicaid patients.", "Children's dental practices specializing in Medicaid patients (often corporate-affiliated) earn volume-based revenue under EPSDT."],
        tension: "EPSDT guarantees pediatric dental coverage, but provider shortage and low rates create access gaps; adult Medicaid dental coverage is a state-by-state patchwork.",
        ai_wedge: "AI dental triage via telehealth enables FQHC-based dental care navigation and early-stage intervention before expensive ER dental visits.",
        source_note: "Dental = $189.2B in 2024; Medicaid adult dental coverage varies widely by state. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_medicaid__dest_dme": {
        title: "Medicaid Covering Medical Equipment",
        what_it_is: "Medicaid pays DME suppliers for prescribed devices—power wheelchairs, home ventilators, orthotics, hearing aids—often at rates higher than Medicare competitive bid prices due to complex patient populations.",
        payer_incentive: ["States set DME fees; prior auth is required for most high-cost items; Medicaid MCOs often have their own DME formularies.", "Medicaid covers hearing aids and pediatric equipment that Medicare excludes—a broader benefit that reflects the population's needs."],
        recipient_incentive: ["Complex rehab technology (CRT) suppliers argue Medicaid rates don't cover cost of service for highly customized equipment for disabled populations.", "Pediatric DME suppliers face particular margin pressure; some exit Medicaid markets, creating access deserts."],
        tension: "DME access for disabled Medicaid beneficiaries is genuinely constrained by low rates and supplier market withdrawal—a policy tension with ADA obligations.",
        ai_wedge: "AI clinical documentation tools for complex rehab technology streamline the prior auth and appeal process, reducing delays for vulnerable beneficiaries.",
        source_note: "Medicaid covers a broader DME benefit than Medicare (e.g., hearing aids, pediatric equipment); DME total = $86.4B in 2024. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_medicaid__dest_home_health": {
        title: "Medicaid Funding Home & HCBS",
        what_it_is: "Medicaid funds skilled home health visits and, more significantly, a broad array of Home and Community-Based Services (HCBS) through 1915(c) waivers—including personal care aides, adult day services, and supported living—for elderly and disabled beneficiaries.",
        payer_incentive: ["HCBS is structurally cheaper than nursing home care; states actively seek HCBS waiver expansion to shift Medicaid long-term care spending.", "State-directed payments through MCOs allow states to fund higher aide wages to address workforce shortages."],
        recipient_incentive: ["Home health agencies and HCBS providers face severe workforce challenges—aide wages are low relative to competing labor markets.", "Personal care organizations earn per-hour rates; high aide turnover is a persistent quality and cost problem."],
        tension: "HCBS wait lists in many states mean eligible beneficiaries cannot access community care and default to more expensive institutional settings.",
        ai_wedge: "AI-enabled care coordination platforms match beneficiaries to available HCBS providers and flag care plan gaps before crises escalate to hospitalization.",
        source_note: "Medicaid home health spending grew faster in 2024 than prior year; HCBS now a majority of Medicaid long-term care spending in most states. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_medicaid__dest_hospital": {
        title: "Medicaid Paying Hospitals",
        what_it_is: "Medicaid (federal-state partnership) pays hospitals for inpatient and outpatient care for low-income, disabled, and dual-eligible beneficiaries through state fee schedules and managed care organization (MCO) contracts.",
        payer_incentive: ["States set Medicaid fee schedules, often significantly below Medicare and commercial rates; hospitals serving high Medicaid populations rely on Disproportionate Share Hospital (DSH) payments as a supplement.", "MCO capitation shifts risk to managed care plans; states benefit when MCOs manage utilization and avoid hospitalization through preventive care."],
        recipient_incentive: ["Hospitals lose money on many Medicaid cases at fee schedule rates; they cross-subsidize from commercial and Medicare volume.", "Safety-net hospitals and FQHCs have mission obligation to serve Medicaid populations even at financial loss; DSH payments partially compensate."],
        tension: "Medicaid rates below cost create access barriers; hospitals accept Medicaid partly for DSH payments, partly for mission, partly because EMTALA requires emergency care regardless of payer.",
        ai_wedge: "AI care management platforms targeting Medicaid high-utilizers (super-users driving disproportionate cost) reduce avoidable ED visits and hospitalizations.",
        source_note: "Medicaid = $931.7B (18% of 2024 NHE), grew 6.6%; hospital care is primary Medicaid spending category. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_medicaid__dest_nursing": {
        title: "Medicaid: Long-Term Care Giant",
        what_it_is: "Medicaid is by far the largest payer for long-term custodial nursing home care, covering beneficiaries who have spent down assets below state thresholds—a program that effectively serves as the US's de facto long-term care insurance system.",
        payer_incentive: ["States pay SNF daily rates that are below private-pay rates; HCBS (Home and Community-Based Services) waivers are the preferred state strategy to shift care to lower-cost settings.", "Money Follows the Person and HCBS expansion under ARP represents a structural shift away from institutional nursing home care."],
        recipient_incentive: ["Nursing homes rely on private-pay residents and Medicare SNF stays for financial survival; Medicaid-only residents often generate negative margins.", "The Medicaid nursing home bed supply has been declining as facilities close or convert; HCBS providers are expanding into the gap."],
        tension: "Medicaid is the payer of last resort for the most expensive, most vulnerable population; states face structural fiscal pressure between bed-based and community care models.",
        ai_wedge: "AI-assisted functional assessment and care planning in HCBS settings enables earlier intervention, better outcomes, and delayed or avoided nursing home placement.",
        source_note: "Medicaid is the dominant payer for custodial nursing home care; nursing & CCRC = ~$230B (4% of NHE). HCBS now exceeds institutional spend in many states. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_medicaid__dest_other_professional": {
        title: "Medicaid: Allied Health Providers",
        what_it_is: "Medicaid pays for physical therapy, occupational therapy, speech therapy, behavioral health counselors, and other non-physician licensed professionals for eligible beneficiaries through state fee schedules.",
        payer_incentive: ["EPSDT mandates coverage of any medically necessary service for children, including PT/OT/SLP—states cannot limit these services for kids.", "For adults, states have more flexibility to limit frequency and scope; coverage varies widely."],
        recipient_incentive: ["Medicaid rates for therapy services are among the lowest in the market; many private PT and mental health practices do not participate.", "School districts receive Medicaid reimbursement for school-based services (IEP-mandated PT, OT, SLP) under Early Periodic Screening provisions."],
        tension: "EPSDT mandate creates open-ended children's coverage obligation; state budget pressure leads to administrative barriers and prior auth that delay access.",
        ai_wedge: "AI-powered digital therapy tools (virtual PT, app-based speech therapy) extend reach for Medicaid populations with limited in-person provider access.",
        source_note: "Other professional services = $184.9B total in 2024; Medicaid and private insurance all grew double-digits for this category. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_medicaid__dest_physician": {
        title: "Medicaid Paying Physicians",
        what_it_is: "Medicaid pays physicians through state fee schedules—typically the lowest payer in the market—and through Medicaid MCOs that reimburse participating providers at negotiated rates.",
        payer_incentive: ["States control rates; when rates are below cost of care, physician participation is voluntarily constrained, creating access problems.", "Section 1115 waivers and FQHC prospective payment systems (PPS) provide enhanced rates to safety-net providers."],
        recipient_incentive: ["Many specialists refuse Medicaid due to low reimbursement; primary care and FQHCs are primary access points, often under financial strain.", "Medicaid VBC/ACO programs (in participating states) create shared savings incentives for care coordination and prevention."],
        tension: "Medicaid physician rates are structurally inadequate relative to cost of care—access barriers are the direct result, not an accident of the system.",
        ai_wedge: "AI clinical decision support in FQHCs and safety-net clinics improves care quality without adding physician headcount; virtual care expands access in low-provider areas.",
        source_note: "Medicaid enrollee count declined to ~84.5M in 2024 post-continuous enrollment unwinding. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_medicaid__dest_residential_personal": {
        title: "Medicaid: Behavioral & Residential Care",
        what_it_is: "Medicaid is the dominant payer (62% share) for non-traditional care settings—residential SUD treatment, community mental health, supported employment, school-based services—where no other payer exists at scale.",
        payer_incentive: ["States use 1915(i) and 1115 waivers to fund community behavioral health; capitated MCOs manage behavioral health carve-outs under behavioral health organization (BHO) contracts.", "Section 1115 SUD waivers expanded Medicaid coverage of residential treatment (IMD exclusion partially waived), increasing state investment in SUD care."],
        recipient_incentive: ["Residential SUD and mental health facilities earn daily/episode rates; many are non-profits with mission-driven, not profit-maximizing, behavior.", "Community mental health centers (CMHCs) and certified community behavioral health clinics (CCBHCs) have bundled/enhanced rate structures."],
        tension: "Demand for behavioral health residential and community services vastly exceeds supply; Medicaid rates have been too low to attract for-profit capital at scale.",
        ai_wedge: "AI crisis line triage and mobile crisis team routing reduce unnecessary ED psychiatric holds and improve placement in appropriate level-of-care settings.",
        source_note: "Other health, residential & personal care = $320.5B in 2024; Medicaid = 62% share ($~199B). Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_medicaid__dest_rx": {
        title: "Medicaid Covering Prescriptions",
        what_it_is: "Medicaid pays retail pharmacies for covered outpatient drugs through the Medicaid Drug Rebate Program (MDRP), where manufacturers pay rebates to CMS and states in exchange for formulary inclusion.",
        payer_incentive: ["MDRP rebates—minimum 23.1% of AMP for brand drugs—are the primary cost-control mechanism; states can negotiate supplemental rebates beyond the federal floor.", "Preferred Drug Lists (PDLs) in Medicaid MCOs create tiered access with lower-cost alternatives first."],
        recipient_incentive: ["Pharmacies earn dispensing fees; mail order is less dominant in Medicaid than in commercial due to population mobility and access issues.", "Drug manufacturers must participate in MDRP to have drugs covered by Medicaid—exclusion is commercially unacceptable for mainstream drugs."],
        tension: "MDRP rebates create a complex net price dynamic; high-list-price drugs may still be preferred after rebates, and rebate calculations create transparency gaps.",
        ai_wedge: "AI medication adherence tools and automated pharmacy outreach improve chronic disease management in a population with high non-adherence rates.",
        source_note: "Medicaid Drug Rebate Program covers nearly all FDA-approved outpatient drugs. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_medicare__dest_dental": {
        title: "Medicare & Dental (Limited Coverage)",
        what_it_is: "Traditional Medicare does not cover routine dental; some Medicare Advantage plans offer supplemental dental benefits as a competitive differentiator, paying contracted dentists for covered services.",
        payer_incentive: ["MA plans offer dental as an enrollment sweetener; actual covered benefits vary widely and are often limited in scope (preventive only in many plans).", "IRA/Build Back Better attempts to add dental to traditional Medicare have stalled; the coverage gap remains a policy debate."],
        recipient_incentive: ["Dentists participating in MA dental networks trade lower reimbursement for volume; many opt out due to administrative complexity.", "Beneficiaries who lack dental coverage may defer care, leading to costly oral-systemic health complications."],
        tension: "Oral health is clinically linked to cardiovascular, diabetic, and perioperative outcomes—but Medicare's structural exclusion of dental creates a gap in whole-person care.",
        ai_wedge: "AI dental diagnostics embedded in MA plan apps can flag oral health risk and connect beneficiaries to in-network dental care before costly complications develop.",
        source_note: "Traditional Medicare excludes routine dental; MA dental supplements vary. Dental total = $189.2B in 2024. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_medicare__dest_dme": {
        title: "Medicare Covering Medical Equipment",
        what_it_is: "Medicare Part B pays DME suppliers for physician-prescribed equipment—wheelchairs, CPAP, oxygen concentrators, infusion pumps—using competitive bidding prices for commodity items.",
        payer_incentive: ["CMS competitive bidding dramatically reduced DME prices for commodity items; fraud-prone codes are subject to prior auth and mandatory claims review.", "Medicare DME historically had high fraud rates; CMS pre-payment review and surety bonding are standard controls."],
        recipient_incentive: ["Accredited DME suppliers earn competitive bid rates; margins are thin on commodity items and suppliers compete on service/delivery.", "High-value devices (power wheelchairs, complex rehab) retain higher margins and are subject to detailed documentation requirements."],
        tension: "Competitive bidding reduced supplier margins to the point of supply-chain fragility; access problems emerged in rural areas with limited qualified suppliers.",
        ai_wedge: "AI automated prior auth—particularly for CPAP based on sleep study documentation—removes weeks of manual delay and supplier administrative burden.",
        source_note: "DME = $86.4B in 2024, grew 5.4%; Medicare and Medicaid are primary payers. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_medicare__dest_home_health": {
        title: "Medicare Funding Home Health",
        what_it_is: "Medicare pays Medicare-certified home health agencies under the Patient-Driven Groupings Model (PDGM) for skilled nursing, therapy, and aide visits to homebound beneficiaries following qualifying hospital or SNF stays.",
        payer_incentive: ["PDGM shifted payment from visit-volume to patient condition/functional status, reducing incentive for unnecessary visits.", "CMS OASIS assessments and outcome reporting drive quality measurement and star ratings used in consumer selection."],
        recipient_incentive: ["Agencies are incentivized to optimize PDGM grouping (accurate diagnosis coding and functional scoring) to maximize episodic payment.", "Workforce shortages constrain capacity; labor costs are the primary operating expense."],
        tension: "Medicare home health benefits require 'homebound' status and skilled care—criteria that constrain access and drive underutilization of a cost-effective post-acute channel.",
        ai_wedge: "AI remote monitoring combined with nurse-alert algorithms enables fewer in-person visits while catching deterioration earlier, improving PDGM outcomes scores.",
        source_note: "Home health = $169.4B (3% of 2024 NHE), grew 10.2%; Medicaid and Medicare are dominant payers. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_medicare__dest_hospital": {
        title: "Medicare Paying Hospitals",
        what_it_is: "Medicare pays hospitals through the Inpatient Prospective Payment System (IPPS) for acute inpatient care and the Outpatient Prospective Payment System (OPPS) for outpatient visits, using fixed DRG-based rates.",
        payer_incentive: ["CMS sets rates by DRG and adjusts for quality (Hospital Value-Based Purchasing, Readmissions Reduction Program); hospitals face financial penalties for excess readmissions and poor quality scores.", "Medicare Advantage (MA) plans—covering ~55% of Medicare beneficiaries—negotiate rates and use prior auth/UM tools similar to commercial insurance, creating a hybrid incentive structure."],
        recipient_incentive: ["Under fee-for-service, hospitals maximize DRG revenue through accurate coding, high-complexity case mix, and volume; under MA, they accept capitated or reduced rates in exchange for predictable volume.", "Hospital systems with market concentration negotiate higher MA rates, limiting CMS cost-containment leverage."],
        tension: "Fee-for-service DRGs incentivize complexity and volume; quality programs and readmission penalties push toward care coordination and prevention—these two logics coexist uneasily in every hospital.",
        ai_wedge: "AI-assisted clinical documentation improvement (CDI) captures accurate DRG severity; predictive readmission models drive discharge care coordination before penalties accrue.",
        source_note: "Medicare = $1.12T (21% of 2024 NHE), grew 7.8%; hospital care is the largest Medicare spend category. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_medicare__dest_nursing": {
        title: "Medicare Covering Skilled Nursing",
        what_it_is: "Medicare Part A covers up to 100 days of skilled nursing facility care following a qualifying 3-day hospital inpatient stay, paying SNFs under the Patient-Driven Payment Model (PDPM) based on clinical complexity.",
        payer_incentive: ["PDPM replaced volume-based RUG system; CMS incentivizes accurate clinical coding that reflects patient complexity without driving unnecessary therapy volume.", "CMS quality reporting (5-star) and value-based purchasing for SNFs tie a portion of payment to outcomes metrics."],
        recipient_incentive: ["SNFs optimize PDPM case-mix by accurate coding of clinical categories (PT/OT/SLP, nursing, NTA); high-complexity cases generate higher daily rates.", "After day 100, all Medicare coverage stops; long-term custodial care shifts entirely to Medicaid (post-spend-down) or private pay."],
        tension: "100-day cap creates abrupt coverage cliff; beneficiaries and families are often unaware of the transition to self-pay/Medicaid, generating ethical and financial stress.",
        ai_wedge: "AI discharge readiness scoring predicts optimal SNF-to-home transition timing, reducing unnecessary extended SNF days and preventing inappropriate returns to acute care.",
        source_note: "Nursing care & CCRC = ~$230B (4% of NHE); Medicare covers short-term skilled, Medicaid covers long-term custodial. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_medicare__dest_other_professional": {
        title: "Medicare: Allied Health & Therapy",
        what_it_is: "Medicare Part B pays for physical therapy, occupational therapy, speech-language pathology, optometry, podiatry, and chiropractic services under the physician fee schedule or separate Part B payment methodologies.",
        payer_incentive: ["Therapy caps (repealed in 2018) have been replaced by KX modifier medical necessity requirements and targeted medical review for high-volume therapy.", "Mental health parity under Medicare has expanded behavioral health coverage, including for telehealth; CMS uses coverage determinations to gate higher-cost services."],
        recipient_incentive: ["Therapists earn per-visit fees; documentation of medical necessity is burdensome and a compliance risk.", "Behavioral health providers face chronic Medicare rate inadequacy, contributing to access shortfalls."],
        tension: "Demand for mental health and PT is high; Medicare rates for these services are below market, creating access gaps and driving providers to private-pay or out-of-network billing.",
        ai_wedge: "AI-generated treatment plan documentation and progress notes reduce therapist administrative time and improve audit defensibility.",
        source_note: "Other professional services = $184.9B in 2024, +10.8%; Medicare covers PT, OT, SLP, behavioral health. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_medicare__dest_physician": {
        title: "Medicare Paying Physicians",
        what_it_is: "Medicare pays physicians and clinicians under the Medicare Physician Fee Schedule (MPFS)—a resource-based relative value scale (RBRVS) setting rates by CPT code—and through alternative payment models (APMs) including ACOs.",
        payer_incentive: ["MACRA/MIPS ties physician payment to quality, cost, and interoperability measures; ACO Shared Savings creates explicit financial incentives for reducing total cost of care.", "CMS uses prior auth for selected procedures (imaging, PT) and deploys clinical decision support via LCD/NCD coverage determinations."],
        recipient_incentive: ["RBRVS historically over-values procedural work; primary care physicians are structurally underpaid relative to specialists, creating a specialist-heavy supply imbalance.", "ACO physicians sharing savings have strong incentives for preventive care, care coordination, and avoiding avoidable specialist referrals and hospitalizations."],
        tension: "The fee schedule was designed for volume; MACRA/ACO reform is nudging toward value—but most physicians still earn primarily on activity, not outcomes.",
        ai_wedge: "AI ambient scribing reduces documentation burden enabling more patient encounters; AI-assisted care gap closure in ACOs drives quality measure performance and shared savings bonuses.",
        source_note: "Physician & clinical = $1.11T (21% of 2024 NHE); Medicare covers ~66.6 million beneficiaries. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_medicare__dest_residential_personal": {
        title: "Medicare: Ambulance & Specialty Care",
        what_it_is: "Medicare covers ambulance transport, outpatient behavioral health in community mental health centers, and selected residential treatment programs—paying per-transport or per-service under Part B.",
        payer_incentive: ["Medicare ambulance costs are subject to prior auth in certain states/situations; fraud in ambulance billing has historically been significant.", "Community mental health center (CMHC) rates and partial hospitalization programs (PHP) are covered; CMS monitors for inappropriate utilization."],
        recipient_incentive: ["Ambulance providers earn per-transport; suppliers have incentive to transport even when alternative transport is available.", "Behavioral health facilities earn per-day rates for PHP/IOP; documentation burden is high."],
        tension: "Ambulance is a high-fraud category; behavioral health is a high-access-deficit category—Medicare policy must balance fraud control with ensuring adequate access.",
        ai_wedge: "AI triage routing tools redirect behavioral health crises to community alternatives rather than ambulance/ER transport, reducing costs and improving care appropriateness.",
        source_note: "Other health, residential & personal care = $320.5B in 2024; Medicaid dominates (62% share), Medicare covers specific acute/behavioral sub-categories. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_medicare__dest_residual": {
        title: "Medicare Admin & CMS Operations",
        what_it_is: "CMS administrative costs—contractor operations, fraud prevention, IT systems, and public health activities funded through Medicare trust fund—represent the overhead cost of operating the program.",
        payer_incentive: ["CMS administrative cost ratio is ~1.4% of Medicare spending—far below private insurance—creating structural pressure on providers to prove efficiency vs. private payers.", "Program integrity investment (HEAT taskforce, RAC auditors) generates recoveries that offset admin costs."],
        recipient_incentive: ["Medicare Administrative Contractors (MACs) earn performance-based contracts for processing accuracy and timeliness.", "RAC auditors earn a contingency percentage of recovered overpayments, creating incentive for aggressive audit activity."],
        tension: "RAC audit aggressiveness creates provider burden; hospitals spend significant resources on denial management that generates no patient care value.",
        ai_wedge: "AI-powered compliance monitoring identifies coding and billing anomalies before audit, reducing recovery exposure and denials.",
        source_note: "CMS admin ratio ~1.4% vs. private insurance 15–20% non-medical spend. Source: https://www.cms.gov/marketplace/private-health-insurance/medical-loss-ratio"
      },
      "fl_pay_medicare__dest_rx": {
        title: "Medicare Part D Drug Coverage",
        what_it_is: "Medicare Part D pays PDP plans and MA-PD plans that in turn reimburse retail and mail-order pharmacies for covered outpatient drugs for beneficiaries, with CMS-negotiated prices under the IRA for selected drugs.",
        payer_incentive: ["The Inflation Reduction Act (IRA, 2022) enables Medicare to directly negotiate prices for high-cost drugs and caps beneficiary out-of-pocket at $2,000/year; the federal government bears more financial risk post-IRA.", "PDP/MA-PD plans manage formularies and negotiate rebates with manufacturers, but IRA negotiated prices override rebates for covered drugs."],
        recipient_incentive: ["Retail and mail-order pharmacies earn dispensing fees; mail order is preferred by plans for chronic maintenance drugs.", "Drug manufacturers face IRA negotiation pressure on high-revenue drugs, creating incentive to launch new indications or formulations to reset negotiation timelines."],
        tension: "IRA negotiation represents a structural shift in pricing power toward CMS; manufacturers are adapting launch and patent strategies to mitigate.",
        ai_wedge: "AI adherence prediction and automated refill outreach improve medication adherence, reducing hospitalizations attributable to poor chronic disease management.",
        source_note: "Retail Rx = $467B in 2024; IRA Part D redesign shifted cost from beneficiaries to federal government and manufacturers. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_other_public_private__dest_hospital": {
        title: "Workers' Comp & VA Paying Hospitals",
        what_it_is: "Workers' compensation insurers, the Department of Veterans Affairs, TRICARE (DoD), and other federal/state programs pay hospitals for covered populations under program-specific fee schedules.",
        payer_incentive: ["Workers' comp payers prioritize return-to-work outcomes; opioid prescribing and prolonged disability are key cost drivers that incentivize payers to invest in active case management.", "VA and TRICARE are federally administered with specific rates and community care programs when VA facilities are unavailable."],
        recipient_incentive: ["Hospitals earn program-specific rates that vary widely; VA community care rates are set by fee schedules; workers' comp rates are often above Medicare.", "Trauma centers and specialty hospitals serve disproportionate shares of VA/TRICARE volume."],
        tension: "Workers' comp payers have strong return-to-work incentives that can conflict with provider treatment decisions; utilization management is adversarial in disputed claims.",
        ai_wedge: "AI claims severity prediction and automated return-to-work assessment improve workers' comp case management efficiency and reduce prolonged disability duration.",
        source_note: "Other third-party payers = $590.5B total (11% of 2024 NHE), declined 7% in 2024 as COVID-era programs wound down. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_other_public_private__dest_physician": {
        title: "Other Programs Paying Clinicians",
        what_it_is: "TRICARE, Indian Health Service (IHS), CHAMPVA, workers' compensation, and other federal/state programs pay physicians and clinicians under program-specific rates and coverage rules.",
        payer_incentive: ["IHS serves American Indian/Alaska Native populations with a chronically underfunded appropriated budget—access is constrained by resources, not benefit design.", "TRICARE uses commercial managed care contractors; rates and access are designed to parallel private insurance for military families."],
        recipient_incentive: ["Physicians participating in IHS are often federal employees rather than contractors; mission-driven and government-pay scale.", "TRICARE-participating providers accept set rates; like Medicare, some providers limit their TRICARE volume."],
        tension: "IHS is structurally underfunded relative to the population it serves; per-capita spending for IHS beneficiaries is among the lowest of any payer in the US.",
        ai_wedge: "AI telehealth and remote diagnostic tools extend clinical reach in geographically isolated IHS and rural TRICARE settings.",
        source_note: "Other third-party programs include IHS, VA, TRICARE, workers' comp, CHAMPVA. Total category = $590.5B in 2024. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_other_public_private__dest_residential_personal": {
        title: "Other Programs: Community Care",
        what_it_is: "School-based health programs, maternal and child health (Title V), vocational rehabilitation, and Indian Health Service community programs fund non-traditional health services outside standard insurance channels.",
        payer_incentive: ["Title V MCH block grants fund state maternal and child health programs with flexible spending authority; preventive and developmental services are the focus.", "Vocational rehabilitation programs prioritize employment outcomes; medical expenditures are tied to return-to-work potential."],
        recipient_incentive: ["Community health workers, school nurses, and public health programs earn grant-funded salaries; they operate largely outside revenue-cycle incentives.", "These programs often serve as safety net access points before clinical needs escalate."],
        tension: "Fragmented funding streams (block grants, federal programs, local health departments) create administrative complexity and limit scale; COVID-era public health investment declined 7% in 2024.",
        ai_wedge: "AI population health tools identify high-risk community members for outreach by community health workers before clinical deterioration.",
        source_note: "Other third-party total = $590.5B, declined 7% in 2024 reflecting wind-down of COVID-era programs. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_other_public_private__dest_rx": {
        title: "Other Programs: Drug Benefits",
        what_it_is: "TRICARE pharmacy benefits, VA drug formulary (through VA pharmacies rather than retail), and workers' comp drug programs pay for outpatient prescriptions under program-specific pricing.",
        payer_incentive: ["VA negotiates drug prices directly with manufacturers—the most aggressive federal price negotiation outside IRA—resulting in prices below Medicare Part D.", "TRICARE pharmacy benefits are administered through Express Scripts; mail order and home delivery are primary channels."],
        recipient_incentive: ["VA pharmacies are operated directly by VA; retail is secondary (mail order for non-emergency). Pharmaceutical companies sell to VA at mandatory ceiling prices.", "Workers' comp drug programs (PBMs) manage formularies and combat opioid overprescribing, a historic cost driver in workers' comp."],
        tension: "VA's drug pricing advantage is a policy reference point—advocates use VA prices to argue for broader public drug price negotiation.",
        ai_wedge: "AI opioid risk scoring in workers' comp pharmacy programs identifies at-risk patients before dependence develops.",
        source_note: "VA drug prices are set under Section 602 of the Veterans Health Care Act, at or below FSS prices. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_out_of_pocket__dest_dental": {
        title: "Patients Paying for Dental Care",
        what_it_is: "Patients pay dentists directly—as the primary payer for major restorative, cosmetic, and orthodontic work after insurance benefits are exhausted—and as fully uninsured dental patients.",
        payer_incentive: ["Dental care is the largest category of elective health spending; patients defer care based on out-of-pocket cost, creating a price-elastic demand curve unlike most medical care.", "Dental savings plans (non-insurance discount plans) are a growing alternative for cost-sensitive consumers outside insurance networks."],
        recipient_incentive: ["Dentists earn premium margins on cash-pay patients—no insurance negotiation, no denial risk, immediate payment.", "Cosmetic dentistry (teeth whitening, veneers, aligners) is fully cash-pay and a high-margin growth segment."],
        tension: "Out-of-pocket dental spending reflects a market failure—nearly 70M Americans have no dental coverage, and cost deferral leads to preventable systemic health complications.",
        ai_wedge: "AI-powered virtual dental triage and remote monitoring enable preventive intervention and patient education before costly in-person treatment is needed.",
        source_note: "Dental OOP grew 5.8% in 2024; OOP + private insurance = 80% of total dental spending. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_out_of_pocket__dest_dme": {
        title: "Patients Buying Medical Equipment",
        what_it_is: "Patients pay for durable and non-durable medical equipment directly—over-the-counter mobility aids, CPAP supplies beyond coverage, hearing aids outside Medicare, diabetic supplies, and consumer health devices.",
        payer_incentive: ["OTC hearing aids (FDA-regulated since 2022) and direct-to-consumer CGMs have created consumer electronics-style retail markets for previously prescription-only devices.", "HSA/FSA funds allow tax-advantaged purchasing of DME, increasing effective consumer purchasing power."],
        recipient_incentive: ["Consumer medical device companies earn retail margins; Apple Watch, Dexcom, and Libre compete in direct-to-consumer health device markets.", "Traditional DME suppliers are threatened by consumer channels; specialized suppliers defend through prescription-required products and clinical services."],
        tension: "FDA OTC device liberalization (hearing aids, CGMs) is disrupting traditional DME supplier channels—consumer pricing is rapidly driving down costs.",
        ai_wedge: "AI-enabled wearables and consumer health devices generate longitudinal data streams that inform clinical care when connected to EHRs and care teams.",
        source_note: "OTC hearing aid rules effective October 2022 created a new consumer DME channel; DME total = $86.4B in 2024. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_out_of_pocket__dest_hospital": {
        title: "Patients Paying Hospitals Directly",
        what_it_is: "Patients pay hospitals directly through cost-sharing (deductibles, copays, coinsurance) for insured care, or as self-pay patients paying negotiated cash prices or inflated chargemaster rates.",
        payer_incentive: ["High-deductible health plans (HDHPs) shift substantial first-dollar cost to patients, giving consumers a cost-consciousness incentive they lack when insured.", "Price transparency regulations (Hospital Price Transparency Rule) require hospitals to publish machine-readable prices; comparison-shopping is nascent."],
        recipient_incentive: ["Hospitals have strong collection incentive; bad debt and charity care erode margins for safety-net hospitals.", "Chargemaster prices for uninsured are often 2–5x what insurers pay; the No Surprises Act limited surprise billing for emergency care."],
        tension: "Hospital pricing opacity has been systemic; price transparency mandates are legally contested but progressively enforced—consumer price sensitivity is growing but far from perfect.",
        ai_wedge: "AI-powered patient cost estimation tools (pre-service estimates, benefits check) reduce billing surprises and improve collections and patient financial experience.",
        source_note: "Out-of-pocket = $556.6B (11% of 2024 NHE); hospital cost-sharing is a major component for insured patients. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_out_of_pocket__dest_nondurable": {
        title: "Patients Buying OTC Products",
        what_it_is: "Patients purchase over-the-counter medicines, vitamins, supplements, wound care supplies, and other non-prescription health products directly at retail pharmacies, big-box stores, and online.",
        payer_incentive: ["Consumers are fully price-sensitive in OTC markets; brand loyalty, convenience, and physician recommendations drive purchasing decisions.", "CARES Act HSA/FSA expansion (2020) broadened eligible OTC product categories, increasing tax-advantaged purchasing power."],
        recipient_incentive: ["OTC manufacturers earn retail margins; private-label store brands compete aggressively on price, compressing brand margins.", "Pharmacies earn front-end margin on OTC products—higher than Rx dispensing margins—making OTC placement strategically important."],
        tension: "Supplement and wellness market sits outside insurance coverage and FDA drug regulation, creating a consumer information gap and potential safety concerns.",
        ai_wedge: "AI-powered medication interaction checkers and personalized supplement recommendation engines improve consumer product decisions and reduce adverse event risk.",
        source_note: "Other non-durable products = $128.7B in 2024, grew 4.4%. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_out_of_pocket__dest_nursing": {
        title: "Private Pay for Long-Term Care",
        what_it_is: "Seniors and families pay nursing homes and CCRCs directly from personal savings, retirement assets, and long-term care insurance until assets are depleted and Medicaid eligibility is reached.",
        payer_incentive: ["Private-pay residents subsidize Medicaid residents; facilities actively market to private-pay populations and price accordingly (~$100K+/year for memory care).", "Long-term care insurance was historically available but the market largely collapsed due to pricing misjudgment; new hybrid products are growing slowly."],
        recipient_incentive: ["CCRCs earn entrance fees ($200K–$600K) and monthly fees ($3K–$10K); they target wealthy retirees who can fund the full continuum without spend-down.", "Private-pay nursing homes compete on quality/amenities; Medicaid-dependent facilities compete on access and staff ratios."],
        tension: "Private pay is how most Americans enter nursing home care; within 12–18 months, most have spent down to Medicaid—the transition is financially devastating for middle-class families.",
        ai_wedge: "AI financial planning tools for long-term care cost estimation and care coordination help families plan transitions and avoid rushed spend-down.",
        source_note: "Nursing & CCRC = ~$230B in 2024; private pay is the entry point before Medicaid spend-down. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_out_of_pocket__dest_other_professional": {
        title: "Patients Paying Allied Providers",
        what_it_is: "Patients pay directly for physical therapy, mental health counseling, chiropractic, acupuncture, and optometry—often out-of-network or for services with limited insurance coverage.",
        payer_incentive: ["Consumers increasingly pay cash for mental health therapy (therapists opt out of insurance), PT, and integrative medicine where in-network options are scarce or have long waits.", "Telehealth platforms offer subscription or per-session cash pricing for behavioral health, creating consumer-direct markets outside insurance."],
        recipient_incentive: ["Out-of-network and cash-pay therapists and PTs earn higher per-session rates with no billing friction; patient relationship is direct and unmediated.", "Mental health providers disproportionately opt out of insurance due to low Medicaid/insurance rates relative to the cash market."],
        tension: "Behavioral health workforce shortages and low insurance rates have created a two-tier system: insured patients with limited in-network access vs. cash-pay patients with immediate access.",
        ai_wedge: "AI-powered mental health apps (text-based CBT, mood tracking, peer support) serve as effective lower-acuity digital therapy alternatives, extending reach below what licensed providers can serve.",
        source_note: "Other professional services = $184.9B, +10.8% in 2024; OOP grew double-digits in this category. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_out_of_pocket__dest_physician": {
        title: "Patients Paying Physicians Directly",
        what_it_is: "Patients pay physicians and clinics directly through co-pays, deductibles, and coinsurance for insured visits, or as direct-pay patients in cash-pay and concierge practices.",
        payer_incentive: ["HDHP design makes consumers price-sensitive for below-deductible office visits; direct primary care (DPC) subscriptions create a consumer relationship outside insurance.", "Consumer demand for telehealth convenience and transparent cash pricing is growing in the direct-pay segment."],
        recipient_incentive: ["Concierge and DPC physicians earn monthly subscription fees independent of visit volume; consumer trust, access, and preventive care drive retention.", "Traditional fee-for-service physicians value prompt payment—out-of-pocket/cash is administratively simpler than insurance billing."],
        tension: "DPC and concierge create a two-tier access dynamic: wealthier patients buy more primary care access, potentially exacerbating health equity gaps.",
        ai_wedge: "AI-powered symptom checkers and asynchronous care platforms extend physician reach in the direct-pay market and improve care navigation for consumer decisions.",
        source_note: "Out-of-pocket for physician/clinical services is significant; price transparency for outpatient services remains limited. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_out_of_pocket__dest_rx": {
        title: "Patients Paying for Prescriptions",
        what_it_is: "Patients pay retail pharmacies directly for prescription drugs through cost-sharing (co-pays, co-insurance, deductibles) or as uninsured cash-pay patients—a category where GoodRx and discount programs have become major intermediaries.",
        payer_incentive: ["Part D IRA out-of-pocket cap ($2,000 for Medicare beneficiaries in 2025) reduces catastrophic drug cost burden; no equivalent cap exists for commercial insurance patients.", "GoodRx, Mark Cuban's Cost Plus Drugs, and direct pharmacy pricing apps have created price transparency and direct-pay alternatives to insurance adjudication."],
        recipient_incentive: ["Retail pharmacies earn margin on cash transactions; GoodRx rebates have transformed the pharmacy economics landscape—some pharmacies lose money filling GoodRx prescriptions.", "Manufacturers offer patient assistance programs and co-pay cards to insured patients to offset cost-sharing, particularly for specialty drugs."],
        tension: "The insured price (with PBM adjudication) is often higher than the cash GoodRx price—a pricing anomaly that reveals systemic distortion in the rebate ecosystem.",
        ai_wedge: "AI drug price comparison engines and adherence prediction tools optimize patient medication decisions and reduce cost-driven non-adherence.",
        source_note: "Retail Rx out-of-pocket growth slowed in 2024 partly due to Part D redesign shifting cost to federal government. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_private_insurance__dest_dental": {
        title: "Insurers Covering Dental Care",
        what_it_is: "Private dental insurers pay dentists and dental practices for covered preventive, restorative, and orthodontic services up to annual benefit maximums.",
        payer_incentive: ["Annual maximum benefit caps ($1,000–$2,000 typical) limit insurer exposure and shift most major work to out-of-pocket; there is no MLR mandate for standalone dental.", "Payers benefit from preventive utilization (lower downstream restorative costs) and in-network steering."],
        recipient_incentive: ["Dentists maximize revenue through volume, higher-value restorative and cosmetic procedures, and upsell of services not covered by insurance.", "Dental practices frequently operate outside insurance altogether (fee-for-service cash) to avoid reimbursement constraints."],
        tension: "Low annual caps push patients into out-of-pocket for major procedures, limiting insurer influence and driving consumers toward dental discount plans or uninsured care.",
        ai_wedge: "AI diagnostic imaging (cavity/pathology detection from X-rays) improves detection rates and reduces unnecessary procedures.",
        source_note: "Dental services = $189B (4% of 2024 NHE); private insurance + OOP = 80% of dental spending in 2024. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_private_insurance__dest_dme": {
        title: "Insurers Covering Medical Equipment",
        what_it_is: "Private insurers reimburse durable medical equipment suppliers for devices prescribed by physicians—wheelchairs, CPAP machines, oxygen, infusion pumps—under formulary and prior auth controls.",
        payer_incentive: ["Competitive bidding programs and national mail-order contracts push commodity DME prices down; prior auth gates high-cost items.", "Fraud and billing abuse in DME is historically high, so payers invest heavily in audit and prepayment review."],
        recipient_incentive: ["DME suppliers earn on volume and per-item margins; mail-order and direct-to-consumer channels bypass traditional suppliers.", "Manufacturers of high-value devices (implantables, robotic surgery) earn separately via hospital capital budgets, not this channel."],
        tension: "Payer wants commodity pricing and generic equivalents; suppliers defend brand margins and upsell ancillary supplies.",
        ai_wedge: "AI-automated prior auth for standard DME orders (e.g., CPAP based on sleep study data) removes manual friction and reduces supplier backlogs.",
        source_note: "DME = $86.4B in 2024, grew 5.4%. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_private_insurance__dest_home_health": {
        title: "Insurers Funding Home Health",
        what_it_is: "Private insurers pay home health agencies for skilled nursing visits, physical therapy, and aide services in a patient's home, typically following hospitalization.",
        payer_incentive: ["Home health is a key post-acute cost-shifting lever: insurers prefer home-based recovery over costly skilled nursing facility days.", "Under MLR rules, payer incentive is to substitute lower-cost home care for inpatient; coordination with hospital discharge planners is key."],
        recipient_incentive: ["Home health agencies earn per-visit or episodic payment; higher visit frequency and skilled nursing mix improve revenue.", "Workforce scarcity (aide shortages) constrains supply and gives agencies pricing leverage."],
        tension: "Insurer wants minimal skilled visits; agency earns more on higher visit counts; patient safety requires adequate but not excessive skilled touch.",
        ai_wedge: "Remote patient monitoring + AI triage flags deteriorating patients before rehospitalization, reducing insurer costs and improving outcomes.",
        source_note: "Home health = $169B (3% of 2024 NHE), grew 10.2%. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_private_insurance__dest_hospital": {
        title: "Insurers Paying Hospitals",
        what_it_is: "Private health insurers reimburse hospitals for inpatient stays, surgeries, emergency visits, and outpatient procedures under negotiated contract rates.",
        payer_incentive: ["ACA MLR rules require ≥80–85% of premiums spent on care, so the lever is not blanket cost-cutting but managing medical expense through network design, prior authorization, and risk selection.", "Payers benefit from steering volume to lower-cost, higher-quality network hospitals and from denying/delaying medically unnecessary admissions."],
        recipient_incentive: ["Hospitals earn margin primarily through volume and case complexity (DRG/CPT mix) in fee-for-service; higher-acuity cases and longer stays inflate revenue.", "Hospitals negotiate chargemaster rates and strive for in-network status to protect volume, while pursuing quality bonuses in value-based contracts."],
        tension: "Insurers want to shift volume to lower-cost sites and deny high-cost admissions; hospitals want every in-network case filled to cover large fixed labor and facility costs.",
        ai_wedge: "AI-driven prior authorization triage, real-time utilization management, and discharge prediction reduce avoidable days and denials disputes.",
        source_note: "Hospital care = $1.63T (31% of 2024 NHE); private insurance hospital spending grew 10.4% in 2024. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_private_insurance__dest_nondurable": {
        title: "Insurers & OTC / Non-Durable Products",
        what_it_is: "Private insurers cover a small slice of non-durable medical products—primarily through FSA/HSA benefit structures—for items like surgical dressings, ostomy supplies, and diabetic test strips.",
        payer_incentive: ["Coverage here is narrow; most non-durable products are out-of-pocket or FSA/HSA pass-through.", "Mail-order and value-based insurance design can steer patients to lower-cost generic supplies."],
        recipient_incentive: ["Retailers and mail-order suppliers prefer volume; branded medical supply companies defend premium pricing on specialty items.", "Pharmacies bundle non-durable products with Rx pickup to drive store traffic."],
        tension: "Minimal insurer engagement; most value is consumer-direct and price-transparent in retail settings.",
        ai_wedge: "AI-powered supply recommendation engines in patient portals optimize product selection and reduce waste for chronic disease management (e.g., wound care, diabetes supplies).",
        source_note: "Other non-durable medical products = $128.7B in 2024, grew 4.4%. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_private_insurance__dest_nursing": {
        title: "Insurers & Skilled Nursing / CCRC",
        what_it_is: "Private health insurers cover short-term skilled nursing facility (SNF) stays for post-acute rehab; long-term nursing home care is almost entirely out-of-pocket or Medicaid.",
        payer_incentive: ["Benefit is typically capped at 20–100 SNF days; payers push early discharge to home health or outpatient rehab to limit exposure.", "There is minimal private insurance penetration in custodial long-term care (LTC insurance market largely collapsed)."],
        recipient_incentive: ["SNFs maximize occupied beds and daily rates; Medicare SNF rates significantly exceed Medicaid, creating payer-mix pressure.", "CCRCs earn entrance fees and monthly fees largely outside insurance, relying on private wealth."],
        tension: "For SNF stays, insurer wants rapid transition to home care; for CCRCs and custodial nursing, the flow is almost entirely self-pay or Medicaid—private insurance is nearly absent.",
        ai_wedge: "AI-based rehabilitation progress scoring accelerates discharge planning and appropriate SNF-to-home transitions.",
        source_note: "Nursing care facilities & CCRC = ~$230B (4% of 2024 NHE). Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_private_insurance__dest_other_professional": {
        title: "Insurers Paying Allied Health Providers",
        what_it_is: "Private insurers reimburse non-physician, non-dental licensed clinicians—physical therapists, optometrists, chiropractors, mental health therapists, podiatrists—for covered services.",
        payer_incentive: ["Visit limits and prior auth control utilization; payers benefit when PT and behavioral health prevent higher-cost specialist or ER use.", "Mental health parity laws (MHPAEA) require comparable limits to medical/surgical, creating compliance obligations and broadening coverage."],
        recipient_incentive: ["Therapists and optometrists earn per visit; high out-of-pocket cost-sharing pushes patients out of insurance toward cash-pay.", "Many behavioral health providers deliberately opt out of insurance panels to avoid low reimbursement and administrative burden."],
        tension: "Demand for mental health and PT far exceeds in-network supply; parity compliance remains a litigation and regulatory risk for payers.",
        ai_wedge: "AI-guided digital therapeutics (CBT apps, virtual PT) extend coverage reach and reduce cost per episode of care.",
        source_note: "Other professional services = $184.9B (4% of 2024 NHE), grew 10.8%—fastest-growing category. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_private_insurance__dest_physician": {
        title: "Insurers Paying Physicians & Clinics",
        what_it_is: "Private insurers reimburse physician offices, medical groups, outpatient clinics, and ambulatory surgery centers for office visits, diagnostics, and procedures at contracted fee schedules.",
        payer_incentive: ["MLR-constrained payers optimize by narrowing networks to lower-cost, higher-value physicians and by deploying step therapy, prior auth, and formulary controls.", "Value-based care contracts (shared savings, bundled payments) let payers shift risk to physician groups, aligning cost-reduction incentives."],
        recipient_incentive: ["Fee-for-service physicians maximize revenue through visit volume, higher-complexity codes (E&M upcoding risk), and ancillary service referrals.", "In VBC/capitation, physicians earn bonuses for preventive care, chronic disease management, and avoiding costly downstream utilization."],
        tension: "Fee-for-service incentivizes volume and complexity; value-based contracts incentivize prevention—most practices straddle both simultaneously.",
        ai_wedge: "Ambient clinical documentation (AI scribing) cuts physician admin time; AI-assisted coding reduces undercoding and compliance risk; CDS tools support evidence-based prescribing.",
        source_note: "Physician & clinical services = $1.11T (21% of 2024 NHE), grew 8.1% in 2024. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_private_insurance__dest_residential_personal": {
        title: "Insurers & Non-Traditional Care Settings",
        what_it_is: "Private insurers fund services in non-traditional care settings including school-based health, workplace clinics, ambulance services, and some residential mental health/substance abuse facilities.",
        payer_incentive: ["Workplace and school-based care can reduce downstream claims; payers contract with on-site clinic operators as a cost-containment and engagement strategy.", "Ambulance costs are a denials battleground; surprise billing rules (No Surprises Act) restrict insurer ability to deny ground ambulance claims."],
        recipient_incentive: ["Ambulance services, residential SUD facilities, and mental health programs earn largely through bed-days and encounter rates; Medicaid is the dominant payer in this category.", "On-site clinic operators earn per-employee-per-month fees from employers, partially outside insurance."],
        tension: "Private insurance covers only a fraction of this category; Medicaid-heavy mix means private payer leverage is limited.",
        ai_wedge: "AI crisis triage tools route patients to appropriate-level care (avoiding unnecessary ER use for behavioral health crises).",
        source_note: "Other health, residential & personal care = $320.5B (6% of 2024 NHE), grew 9.1%. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_private_insurance__dest_residual": {
        title: "Insurer Admin & Operating Costs",
        what_it_is: "The administrative, marketing, profit, and investment portion of private insurance premiums that does not flow to care—capped by ACA MLR rules.",
        payer_incentive: ["MLR rules cap non-medical spend at 15% (large group) or 20% (small group/individual); payers must rebate excess to enrollees, so admin efficiency is structurally mandated.", "Investment income on premium float is a secondary revenue source; larger reserves generate more investment return."],
        recipient_incentive: ["Insurer shareholders and management benefit from the 15–20% non-MLR margin; there is incentive to grow premium revenue (the base) rather than cut it.", "Brokers, consultants, and third-party administrators capture portions of the admin margin."],
        tension: "MLR caps constrain profit per premium dollar, so growth strategy shifts to enrollment volume, risk selection, and investment income rather than margin expansion.",
        ai_wedge: "AI claims automation, fraud detection, and member engagement reduce administrative cost below the cap, converting savings to profit or premium reductions.",
        source_note: "ACA MLR: 80% small-group/individual, 85% large-group. $1.1B in MLR rebates estimated for 2024. Sources: https://www.cms.gov/marketplace/private-health-insurance/medical-loss-ratio | https://www.kff.org/affordable-care-art/explaining-health-care-reform-medical-loss-ratio-mlr/"
      },
      "fl_pay_private_insurance__dest_rx": {
        title: "Insurers Covering Retail Prescriptions",
        what_it_is: "Private insurers—operating through pharmacy benefit managers (PBMs)—pay retail pharmacies for covered outpatient drugs after rebates, copays, and formulary adjudication.",
        payer_incentive: ["PBM rebate negotiations, tiered formularies, and mandatory generic/biosimilar substitution allow payers to manage net drug spend while maintaining MLR compliance.", "Prior auth and step therapy on high-cost specialty drugs (GLP-1s, biologics) gate access to the most expensive therapies."],
        recipient_incentive: ["Retail pharmacies earn dispensing fees and prefer high-volume brand drugs with better margins; specialty pharmacies capture larger revenue per fill.", "Drug manufacturers offer rebates to PBMs in exchange for preferred formulary placement, creating incentives independent of clinical efficacy."],
        tension: "The rebate-driven formulary system can favor high-list-price drugs with large rebates over lower-list-price drugs with smaller ones, misaligning drug cost and patient value.",
        ai_wedge: "AI-powered formulary optimization, adherence prediction, and automated PA approvals for evidence-based therapies accelerate access and reduce plan cost.",
        source_note: "Retail Rx = $467B (9% of 2024 NHE), grew 7.9%; GLP-1 demand a key driver. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_residual__dest_residual": {
        title: "Public Health & System Infrastructure",
        what_it_is: "Federal and state government spending on public health departments, health research (NIH), public health surveillance, health information infrastructure, and regulatory operations—distinct from clinical care expenditures.",
        payer_incentive: ["Public health spending generates broad population-level returns but is politically constrained; COVID-era surge spending has wound down, with public health share of NHE declining.", "NIH and AHRQ fund research that eventually informs clinical guidelines and coverage decisions—a long-cycle ROI."],
        recipient_incentive: ["Academic medical centers, public health labs, and federal agencies are primary recipients; grant-based funding creates different incentives than fee-for-service clinical care.", "Government administration (CMS, state Medicaid agencies) spending covers operational infrastructure that enables $5.3T in health payments."],
        tension: "Public health investment is chronically underfunded relative to its population health return; each pandemic resets political will temporarily before reverting.",
        ai_wedge: "AI epidemiological surveillance and outbreak detection systems enhance public health capacity at marginal cost versus building headcount.",
        source_note: "Government administration and public health = a smaller share of NHE in 2024 than 2022; spending on public health activities declined. Source: https://www.cms.gov/files/document/highlights.pdf"
      },
    };
  
    var flowMicrocopyFallback = {
      "generic_flow": {
        title: "Health Payment Flow",
        what_it_is: "A payer transfers funds to a healthcare provider or supplier for goods or services delivered to a covered individual.",
        payer_incentive: ["Payers optimize for clinical value, cost efficiency, and regulatory compliance for this flow.", "Coverage rules, fee schedules, and prior authorization govern what is reimbursable."],
        recipient_incentive: ["Providers and suppliers earn revenue through accurate billing, service volume, and negotiated rates.", "Quality-based or value-based contract provisions may create additional incentives tied to outcomes."],
        tension: "Payer cost-containment goals and provider revenue-maximization goals create ongoing negotiation over rates, coverage, and medical necessity.",
        ai_wedge: "AI can reduce administrative friction in claims processing, prior authorization, and care documentation in this flow.",
        source_note: "US NHE = $5.3T in 2024. For more: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "low_volume_government_flow": {
        title: "Federal / State Program Payment",
        what_it_is: "A federal or state health program pays providers under program-specific eligibility rules, fee schedules, and coverage determinations for a defined covered population.",
        payer_incentive: ["Government programs prioritize access, equity, and compliance with statutory mandates.", "Budget appropriations and matching-fund structures constrain spending growth."],
        recipient_incentive: ["Providers serving government program populations often accept below-market rates in exchange for stable volume or mission obligations.", "Documentation and compliance requirements are typically more intensive than commercial payers."],
        tension: "Rate inadequacy in government programs constrains provider participation and creates access barriers for covered populations.",
        ai_wedge: "AI-assisted compliance documentation and care gap identification help providers maximize quality performance in complex government program settings.",
        source_note: "Federal government funds 31% of US healthcare; state/local funds 16%. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "direct_pay_flow": {
        title: "Consumer Direct Payment",
        what_it_is: "An individual pays a healthcare provider or product supplier directly from personal funds, without insurance intermediation.",
        payer_incentive: ["Consumer is directly price-sensitive; convenience, trust, price transparency, and quality reputation drive provider choice.", "HSA/FSA funds provide tax-advantaged consumer purchasing power."],
        recipient_incentive: ["Cash-pay eliminates billing complexity, improves cash flow, and avoids insurance administrative burden.", "Direct-pay providers can price to market rather than accepting insurance fee schedules."],
        tension: "Direct-pay access favors consumers with financial resources; health equity implications are significant when direct-pay replaces insurance coverage.",
        ai_wedge: "AI price transparency and health navigation tools help consumers make informed direct-pay decisions and find appropriate care.",
        source_note: "Out-of-pocket = $556.6B (11% of NHE) in 2024. Source: https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
    };
  
    var flowMicrocopyCallouts = {
      "fl_pay_private_insurance__dest_hospital": {
        type: "scale_callout",
        headline: "The Biggest Flow in US Healthcare",
        body: "Private insurers + Medicare together pay for ~60% of the $1.63T in hospital spending. This single destination absorbs 40% of all NHE growth between 2022–2024. Every efficiency gain here—prior auth automation, denials reduction, discharge prediction—moves the needle at national scale.",
        source: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_private_insurance__dest_residual": {
        type: "regulatory_callout",
        headline: "MLR: The Rule That Shapes All Private Insurance Behavior",
        body: "The ACA's medical loss ratio requirement (80% for small group/individual, 85% for large group) means private insurer incentives are not simply 'deny every claim.' Payers must spend most premium revenue on care. The real game is premium pricing, risk selection, network design, and admin efficiency—not cutting medical spend below the MLR floor.",
        source: "https://www.cms.gov/marketplace/private-health-insurance/medical-loss-ratio"
      },
      "fl_pay_medicaid__dest_nursing": {
        type: "systemic_risk_callout",
        headline: "Medicaid Is America's Long-Term Care Insurance (By Default)",
        body: "No country designed its long-term care system this way. Middle-class Americans spend down savings to qualify for Medicaid nursing home coverage. HCBS waiver expansion is the policy lever to shift this—and the AI wedge is in care coordination and functional assessment that delays or avoids institutional placement.",
        source: "https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_medicare__dest_physician": {
        type: "incentive_tension_callout",
        headline: "Fee-for-Service vs. Value-Based: Most Physicians Live in Both",
        body: "The same physician group may have traditional Medicare FFS patients (incentivized by volume), MA patients (under prior auth), ACO patients (incentivized by shared savings), and commercial patients (under MLR-constrained payer). AI ambient documentation tools improve economics in all four simultaneously—the rare horizontal wedge across incentive regimes.",
        source: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_out_of_pocket__dest_rx": {
        type: "market_disruption_callout",
        headline: "The GoodRx Anomaly: Cash Is Cheaper Than Insurance",
        body: "For many generic drugs, GoodRx and Cost Plus Drugs prices are lower than the insured co-pay. This pricing inversion—impossible in a rational market—reveals how rebate economics distort list prices. AI drug price comparison tools that operate at the point of prescribing can route patients to lowest-cost options regardless of insurance adjudication.",
        source: "https://www.kff.org/affordable-care-art/explaining-health-care-reform-medical-loss-ratio-mlr/"
      },
      "fl_pay_medicaid__dest_residential_personal": {
        type: "access_gap_callout",
        headline: "Medicaid Pays 62% of Non-Traditional Care—Where AI Access Tools Matter Most",
        body: "Community behavioral health, SUD residential, crisis services, and school-based care are overwhelmingly Medicaid-funded. These settings have the lowest technology penetration and the highest unmet need. AI crisis triage, care routing, and community health worker support tools can deliver outsized impact here relative to commercial healthcare AI investments.",
        source: "https://www.cms.gov/files/document/highlights.pdf"
      },
      "fl_pay_medicare__dest_rx": {
        type: "policy_shift_callout",
        headline: "IRA Drug Negotiation: The First Structural Change to US Drug Pricing in Decades",
        body: "The Inflation Reduction Act's Medicare drug price negotiation and $2,000 out-of-pocket cap for Part D represents the most significant shift in pharmaceutical pricing policy since Part D was created in 2003. AI pharmacoeconomic modeling will help manufacturers forecast negotiation outcomes and payers optimize formulary design under the new framework.",
        source: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet"
      },
      "fl_pay_private_insurance__dest_other_professional": {
        type: "growth_trend_callout",
        headline: "Allied Health Is the Fastest-Growing Spend Category at +10.8%",
        body: "Other professional services—PT, behavioral health, optometry, chiropractic—grew 10.8% in 2024, the highest rate among all destination categories. Mental health parity enforcement, telehealth normalization, and post-pandemic behavioral health demand are driving this. AI digital therapeutics are the capital-light wedge to serve demand that licensed providers cannot meet.",
        source: "https://www.cms.gov/files/document/highlights.pdf"
      },
    };

  var takeaways = [
    { title: 'Follow the money, then the patient', copy: 'Adoption depends less on technical elegance than on who pays, who uses, and who captures the value.' },
    { title: 'Admin AI is an arms race', copy: 'The CMS NHE admin line is ~$371B; total addressable admin drag (provider billing + payer ops + clinical documentation) is ~$800-900B per Commonwealth Fund. Prior auth, coding, claims, and RCM are the highest-ROI surfaces, and automation on one side often triggers automation on the other.' },
    { title: 'Prevention needs a payer', copy: 'Consumer prevention scales through private pay. Systemic prevention requires VBC, employers, Medicare Advantage, ACOs, or CMS reimbursement.' },
    { title: 'The data layer is shared', copy: 'Care, payment, prevention, research, and admin all compete over the same records, claims, labs, devices, and workflow data.' },
    { title: 'Near-term wins differ from long-term shift', copy: 'Near-term wins are documentation and admin. The long-term shift is upstream into diagnostics, drug discovery, and continuous prevention.' }
  ];

  // =====================================================================
  // PROCESS GROUPS — every loop node belongs to exactly one named track.
  // The patient event diagram renders these as visually grouped paths so
  // there are no orphan boxes (prevention/monitoring used to "float").
  // =====================================================================
  var processGroups = [
    { id: 'pg_care',       label: 'Clinical care loop',            short: 'Care',       color: '#4ECDC4',
      steps: ['C1','C2','C3','C4','C5','C6','C7','C8'] },
    { id: 'pg_financial',  label: 'Financial / reimbursement loop', short: 'Financial',  color: '#F5C542',
      steps: ['F1','F2','F3','F4','F5','F6','F7','F8'] },
    { id: 'pg_prevention', label: 'Prevention / monitoring loop',  short: 'Prevention', color: '#FF8C42',
      steps: ['P1','P2','P3','P4','P5'] },
    { id: 'pg_vbc',        label: 'VBC / risk bridge',              short: 'VBC',        color: '#7C4DFF',
      steps: ['V1','V2','V3','V4','V5'] }
  ];

  // Cross-track edges that anchor prevention into the clinical loop and
  // close the VBC → prevention payment loop. Drawn only when both
  // endpoints are active in the current scenario.
  var loopBridgeEdges = [
    { from: 'C8', to: 'P1', label: 'Discharge → prevention', kind: 'prev' },
    { from: 'C8', to: 'P2', label: 'Remote monitoring',      kind: 'prev' },
    { from: 'P5', to: 'C2', label: 'Escalation → triage',    kind: 'prev' },
    { from: 'V5', to: 'C8', label: 'VBC funds prevention',   kind: 'bridge' }
  ];

  // Callout cards rendered as cards under the loop. Drawer-style depth,
  // not always-visible chart clutter. Sourced.
  var loopCallouts = [
    { id: 'cl_workforce',
      group: 'pg_care',
      tag: 'Workforce',
      title: 'Talent shortage is the binding constraint',
      stat: '141,160 physician FTE gap by 2038',
      body: 'HRSA State of US Health Care Workforce 2025: physician shortage 141,160 FTE by 2038; LPN shortage 245,950 FTE; nonmetro RN shortage 11% vs 3% nationally. HPSAs: mental health 137M, primary care 92M, dental 64M.',
      source_label: 'HRSA State of US Health Care Workforce 2025',
      source_url: 'https://bhw.hrsa.gov/data-research/projecting-health-workforce-supply-demand' },
    { id: 'cl_cms_rht',
      group: 'pg_prevention',
      tag: 'Rural / prevention funding',
      title: 'CMS Rural Health Transformation: $50B for FY2026–2030',
      stat: '$50B · FY2026–2030',
      body: 'CMS RHT supports AI/robotics, remote monitoring, digital health, cybersecurity, workforce, and chronic disease management in rural settings — a payer-level funding bridge that prevention has historically lacked.',
      source_label: 'CMS Rural Health Transformation Program',
      source_url: 'https://www.cms.gov/priorities/innovation/innovation-models/rural-health-transformation-program' },
    { id: 'cl_claude_health',
      group: 'pg_financial',
      tag: 'Payer / admin infrastructure',
      title: 'Claude for Healthcare: HIPAA-ready model',
      stat: 'Prior auth · claims appeals · FHIR',
      body: 'Anthropic positions Claude for healthcare with HIPAA readiness, prior authorization review, claims appeals, CMS Coverage Database, ICD-10, NPI, and FHIR skills/connectors — a model-layer wedge into payer/admin work.',
      source_label: 'Anthropic — Healthcare & life sciences',
      source_url: 'https://www.anthropic.com/solutions/healthcare-life-sciences' },
    { id: 'cl_palantir_r1',
      group: 'pg_financial',
      tag: 'Enterprise RCM',
      title: 'Palantir + R1: R37 AI Lab',
      stat: 'Exclusive partnership',
      body: 'R1 RCM launched R37 AI Lab in exclusive partnership with Palantir to transform healthcare financial performance — large-system RCM is consolidating around enterprise AI infrastructure.',
      source_label: 'Palantir investor relations',
      source_url: 'https://investors.palantir.com/news-details/2025/R1-Launches-R37-AI-Lab-with-Palantir/default.aspx' },
    { id: 'cl_behavioral_telehealth',
      group: 'pg_care',
      tag: 'Behavioral / telehealth',
      title: 'Behavioral health overtook primary care in 2024',
      stat: '66.4M behavioral vs 62.8M PCP visits',
      body: 'Among commercially insured patients, behavioral health visits surpassed primary care in 2024 (66.4M vs 62.8M); behavioral health was 67% of telehealth encounters. Patient events are no longer just acute clinical episodes.',
      source_label: 'AHA Market Scan / Trilliant Health',
      source_url: 'https://www.aha.org/aha-center-health-innovation-market-scan/2025-02-04-behavioral-health-visits-surpass-primary-care' }
  ];

  var sources = [
    { label: 'CMS NHE Fact Sheet (final 2024 data)',     url: SRC.nhe },
    { label: 'CMS 2024 NHE Highlights',                  url: SRC.highlights },
    { label: 'Health System Tracker / KFF',              url: SRC.kff2024 },
    { label: 'Commonwealth Fund — US admin spending',    url: SRC.commonwealth },
    { label: 'NAIC — Medical Loss Ratio',                url: SRC.naic_mlr },
    { label: 'PHTI — Administrative AI',                 url: SRC.phti },
    { label: 'MGMA — medical practice operating costs',  url: SRC.mgma },
    { label: 'HHS/ASPE pharmaceutical supply chain',     url: SRC.aspe_pharma },
    { label: 'HRSA — State of US Health Care Workforce 2025', url: SRC.hrsa_workforce },
    { label: 'CMS — Rural Health Transformation Program', url: SRC.cms_rht },
    { label: 'Anthropic — Healthcare & life sciences',   url: SRC.anthropic_health },
    { label: 'Palantir IR — R1 R37 AI Lab',              url: SRC.palantir_r1 },
    { label: 'AHA Market Scan — behavioral vs primary care', url: SRC.aha_telehealth },
    { label: 'Adentris (real-time medical documentation AI)', url: SRC.adentris }
  ];

  root.HEALTHCARE_DATA = {
    SRC: SRC,
    headlineStats: headlineStats,
    paymentChannels: paymentChannels,
    destinations: destinations,
    costPools: costPools,
    moneyLinksAB: moneyLinksAB,
    moneyLinksBC: moneyLinksBC,
    aiSurfaces: aiSurfaces,
    incentives: incentives,
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
    companyLayers: companyLayers,
    destinationToLayers: destinationToLayers,
    poolToLayers: poolToLayers,
    stepToLayers: stepToLayers,
    stackToLayers: stackToLayers,
    biotechSidecar: biotechSidecar,
    processGroups: processGroups,
    loopBridgeEdges: loopBridgeEdges,
    loopCallouts: loopCallouts,
    takeaways: takeaways,
    sources: sources,
    flowMicrocopy: flowMicrocopy,
    flowMicrocopyFallback: flowMicrocopyFallback,
    flowMicrocopyCallouts: flowMicrocopyCallouts
  };
})(typeof window !== 'undefined' ? window : this);
