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
    doctronic:  'https://commerce.utah.gov/2026/01/06/news-release-utah-and-doctronic-announce-groundbreaking-partnership-for-ai-prescription-medication-renewals/'
  };

  var headlineStats = [
    { label: 'US national health expenditure', value: '$5.3T',   sub: '2024 CMS NHE', evidence: 'official', src: SRC.nhe },
    { label: 'Per person',                     value: '$15,474', sub: '2024 CMS NHE', evidence: 'official', src: SRC.nhe },
    { label: 'Share of GDP',                   value: '18.0%',   sub: '2024 CMS NHE', evidence: 'official', src: SRC.nhe },
    { label: 'Healthcare AI spend (survey)',   value: '$1.4B',   sub: 'Menlo 2025',   evidence: 'vc_survey', src: SRC.menlo },
    { label: 'US digital health funding, 2025',value: '$14.2B',  sub: 'Rock Health',  evidence: 'context',   src: SRC.rock }
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
      what: 'Prior auth, coding, billing, claims, denials, collections.',
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
      message: 'Insurer margins are constrained by medical loss ratio rules, so cost reduction does not behave like ordinary SaaS margin expansion. Applies to insurers, not hospitals.' },
    { id: 'inc_admin_arms_race', label: 'Admin arms race',
      attach_pools: ['pool_provider_admin','pool_payer_admin'],
      attach_nodes: [],
      message: 'AI can lower task cost but increase transaction volume: more coding, more prior-auth packets, more denials, more appeals.' },
    { id: 'inc_fee_for_service', label: 'Fee-for-service inertia',
      attach_pools: ['pool_clinical_labor'],
      attach_nodes: ['dest_hospital','dest_physician'],
      message: 'If payment is tied to events and services, prevention has weak economics unless risk shifts.' },
    { id: 'inc_vbc', label: 'Value-based care bridge',
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
  var careLoop = [
    { id: 'C1', n: 1, label: 'Signal',           x: 230, y: 270, description: 'Symptom, wearable alert, lab abnormality, patient concern.', ai: ['ai_diagnostics','ai_prevention'] },
    { id: 'C2', n: 2, label: 'Triage',           x: 305, y: 150, description: 'Patient or clinician asks what to do next.', ai: ['ai_patient_access','ai_scribes_copilots'] },
    { id: 'C3', n: 3, label: 'Access',           x: 445, y: 95,  description: 'Scheduling, routing, telehealth, right site of care.', ai: ['ai_patient_access','ai_site_of_care'] },
    { id: 'C4', n: 4, label: 'Encounter',        x: 560, y: 80,  description: 'Visit, admission, dental visit, diagnostic appointment.', ai: ['ai_scribes_copilots'] },
    { id: 'C5', n: 5, label: 'Diagnosis/orders', x: 675, y: 95,  description: 'Labs, imaging, prescription, referral, treatment plan.', ai: ['ai_diagnostics','ai_techbio','ai_scribes_copilots'] },
    { id: 'C6', n: 6, label: 'Treatment',        x: 815, y: 150, description: 'Drug, procedure, therapy, behavior change, digital tool.', ai: ['ai_techbio','ai_site_of_care'] },
    { id: 'C7', n: 7, label: 'Follow-up',        x: 890, y: 270, description: 'Refill, adherence, escalation, monitoring, care plan adjustment.', ai: ['ai_site_of_care'] },
    { id: 'C8', n: 8, label: 'Monitor/prevent',  x: 770, y: 390, description: 'Continuous or episodic risk management.', ai: ['ai_prevention','ai_diagnostics'] }
  ];

  // Financial loop — counterclockwise lower ellipse
  var financialLoop = [
    { id: 'F1', n: 1, label: 'Eligibility',  x: 230, y: 355, description: 'Coverage, network, deductible, patient responsibility.', ai: ['ai_patient_access'] },
    { id: 'F2', n: 2, label: 'Prior auth',   x: 305, y: 475, description: 'Approval before selected care, tests, or drugs.', ai: ['ai_admin_rcm'] },
    { id: 'F3', n: 3, label: 'Coding',       x: 445, y: 530, description: 'Translate care into documentation and billable codes.', ai: ['ai_admin_rcm','ai_scribes_copilots'] },
    { id: 'F4', n: 4, label: 'Claim',        x: 560, y: 545, description: 'Submit claim to payer or patient.', ai: ['ai_admin_rcm'] },
    { id: 'F5', n: 5, label: 'Adjudication', x: 675, y: 530, description: 'Pay, deny, downcode, audit, or request more information.', ai: ['ai_admin_rcm'] },
    { id: 'F6', n: 6, label: 'Patient bill', x: 815, y: 475, description: 'Remaining responsibility becomes bill or payment plan.', ai: ['ai_financial_engagement','ai_admin_rcm'] },
    { id: 'F7', n: 7, label: 'Collection',   x: 890, y: 355, description: 'Payment, reconciliation, collection, write-off.', ai: ['ai_financial_engagement'] },
    { id: 'F8', n: 8, label: 'Quality/risk', x: 770, y: 235, description: 'Outcomes, quality, risk adjustment, VBC reporting.', ai: ['ai_prevention'] }
  ];

  // Private-pay prevention orbit (right rail)
  var preventionOrbit = [
    { id: 'P1', label: 'Consumer AI assistant', x: 955, y: 155, description: 'Patient asks questions, uploads labs, tracks goals.', ai: ['ai_patient_access','ai_prevention'] },
    { id: 'P2', label: 'Wearables/home signals',x: 1000, y: 235, description: 'Sleep, HRV, CGM, activity, BP, recovery, symptoms.', ai: ['ai_prevention','ai_diagnostics'] },
    { id: 'P3', label: 'Labs/omics',            x: 1015, y: 315, description: 'Rich biological data for risk and personalization.', ai: ['ai_diagnostics','ai_techbio'] },
    { id: 'P4', label: 'Coaching/adherence',    x: 990, y: 395, description: 'Behavior, nutrition, sleep, allergy care, follow-up.', ai: ['ai_prevention'] },
    { id: 'P5', label: 'Escalation',            x: 940, y: 475, description: 'AI routes to licensed clinician or care setting.', ai: ['ai_patient_access'] }
  ];

  // VBC bridge (left rail)
  var vbcBridge = [
    { id: 'V1', label: 'FFS default',           x: 80,  y: 170, description: 'Fee-for-service pays when services happen. Prevention has weak economics.' },
    { id: 'V2', label: 'Risk contract',         x: 115, y: 250, description: 'Someone bears downstream cost and can benefit from avoided events.' },
    { id: 'V3', label: 'MA / ACO / employer',   x: 145, y: 330, description: 'Common places where risk, quality, and prevention can matter.' },
    { id: 'V4', label: 'Digital reimbursement', x: 175, y: 410, description: 'RTM, digital mental health, and CMS models create partial reimbursement paths.' },
    { id: 'V5', label: 'Prevention financeable',x: 205, y: 490, description: 'Prevention becomes investable when outcomes and avoided cost are measurable.' }
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
    tt_provider_admin:    { title: 'Provider admin',           body: 'Provider-side coding, billing, scheduling, prior auth, compliance, and collections. A near-term AI battleground.' },
    tt_payer_admin:       { title: 'Payer operations',         body: 'Claims, utilization management, payment integrity, customer service, fraud review, and plan administration. Often responds defensively to provider automation.' },
    tt_drugs_biologics:   { title: 'Drugs and biologics',      body: 'Therapeutic product value. AI can move upstream into discovery, trial design, precision medicine, and adherence.' },
    tt_supplies_devices:  { title: 'Supplies and devices',     body: 'Medical supplies, equipment, diagnostics, wearables, dental devices, and DME. AI often enters through signal interpretation and monitoring.' },
    tt_it_data:           { title: 'IT and data',              body: 'EHRs, data warehouses, interoperability, cybersecurity, cloud, and workflow software. A small cost pool but huge control point.' },
    tt_mlr:               { title: 'Medical loss ratio',       body: 'Many insurers must spend 80% or 85% of premiums on care and quality improvement. This shapes savings incentives.' },
    tt_vbc:               { title: 'Value-based care',         body: 'Payment tied to outcomes, quality, risk, or total cost. It is the bridge from event-driven care to prevention.' }
  };

  // =====================================================================
  // COMPANIES — market leaders FIRST, DVC examples second.
  // group: 'leader' | 'dvc'.  Companies are neutral by default; group label
  // only appears inside drawer (Market leader / benchmark vs DVC portfolio).
  // =====================================================================
  var companies = [
    // ----- Clinical copilots / clinical labor -----
    { id: 'co_openevidence',    name: 'OpenEvidence',     group: 'leader',
      short_description: 'Clinician-facing medical knowledge and evidence retrieval.',
      money_pool_ids: ['pool_clinical_labor','pool_it_data'],
      destination_ids: ['dest_physician','dest_hospital'],
      process_step_ids: ['C2','C5'],
      ai_surface_ids: ['ai_scribes_copilots'],
      stack_ids: ['stack_ai','stack_decision'],
      buyer_user: 'Clinician',
      value_capture: 'Subscription / per-user clinical workflow' },
    { id: 'co_abridge',         name: 'Abridge',          group: 'leader',
      short_description: 'Ambient clinical documentation and encounter summarization.',
      money_pool_ids: ['pool_clinical_labor','pool_provider_admin'],
      destination_ids: ['dest_physician','dest_hospital'],
      process_step_ids: ['C4','F3'],
      ai_surface_ids: ['ai_scribes_copilots','ai_admin_rcm'],
      stack_ids: ['stack_ai','stack_workflow'],
      buyer_user: 'Clinician / health system',
      value_capture: 'Enterprise software seat' },
    { id: 'co_nuance_dax',      name: 'Nuance DAX',       group: 'leader',
      short_description: 'Voice-driven ambient documentation embedded in the EHR.',
      money_pool_ids: ['pool_clinical_labor','pool_it_data'],
      destination_ids: ['dest_physician','dest_hospital'],
      process_step_ids: ['C4','F3'],
      ai_surface_ids: ['ai_scribes_copilots'],
      stack_ids: ['stack_ai','stack_workflow'],
      buyer_user: 'Health system',
      value_capture: 'Per-encounter or per-seat license' },

    // ----- Provider admin / RCM / payer admin -----
    { id: 'co_waystar',         name: 'Waystar',          group: 'leader',
      short_description: 'Provider revenue cycle, claims, denials, and patient payments platform.',
      money_pool_ids: ['pool_provider_admin','pool_payer_admin'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F2','F3','F4','F5','F6'],
      ai_surface_ids: ['ai_admin_rcm','ai_financial_engagement'],
      stack_ids: ['stack_admin','stack_workflow'],
      buyer_user: 'Provider RCM',
      value_capture: 'Transaction + SaaS fees' },
    { id: 'co_cedar',           name: 'Cedar',            group: 'leader',
      short_description: 'Patient payments, billing, and financial engagement.',
      money_pool_ids: ['pool_provider_admin'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F6','F7'],
      ai_surface_ids: ['ai_financial_engagement'],
      stack_ids: ['stack_admin','stack_workflow'],
      buyer_user: 'Provider RCM',
      value_capture: 'Per-account / transaction' },

    // ----- Patient access / navigation -----
    { id: 'co_ada',             name: 'Ada Health',       group: 'leader',
      short_description: 'AI symptom assessment and patient navigation.',
      money_pool_ids: ['pool_provider_admin','pool_it_data'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C2','C3','F1'],
      ai_surface_ids: ['ai_patient_access'],
      stack_ids: ['stack_ai','stack_workflow'],
      buyer_user: 'Health system / employer',
      value_capture: 'Enterprise / consumer' },
    { id: 'co_included',        name: 'Included Health',  group: 'leader',
      short_description: 'Care navigation and concierge for employers and members.',
      money_pool_ids: ['pool_provider_admin','pool_it_data'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C2','C3','F1','P5'],
      ai_surface_ids: ['ai_patient_access'],
      stack_ids: ['stack_workflow','stack_admin'],
      buyer_user: 'Employer / plan',
      value_capture: 'PMPM' },

    // ----- Diagnostics -----
    { id: 'co_vizai',           name: 'Viz.ai',           group: 'leader',
      short_description: 'Clinical workflow + imaging triage for time-sensitive conditions.',
      money_pool_ids: ['pool_clinical_labor','pool_supplies_devices'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C5','C1'],
      ai_surface_ids: ['ai_diagnostics'],
      stack_ids: ['stack_ai','stack_decision'],
      buyer_user: 'Hospital service line',
      value_capture: 'Enterprise license + procedure pull-through' },
    { id: 'co_pathai',          name: 'PathAI',           group: 'leader',
      short_description: 'AI-powered pathology for diagnostic accuracy and trials.',
      money_pool_ids: ['pool_clinical_labor','pool_supplies_devices','pool_public_health_research'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C5'],
      ai_surface_ids: ['ai_diagnostics','ai_techbio'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Lab / pharma',
      value_capture: 'Per-slide + biopharma services' },

    // ----- Prevention / monitoring -----
    { id: 'co_oura',            name: 'Oura',             group: 'leader',
      short_description: 'Wearable ring with continuous sleep, HRV, and activity signals.',
      money_pool_ids: ['pool_supplies_devices','pool_it_data'],
      destination_ids: ['dest_dme'],
      process_step_ids: ['C8','P2'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_data','stack_infra'],
      buyer_user: 'Consumer',
      value_capture: 'Device + subscription' },
    { id: 'co_whoop',           name: 'WHOOP',            group: 'leader',
      short_description: 'Recovery and strain monitoring via continuous wearable signals.',
      money_pool_ids: ['pool_supplies_devices','pool_it_data'],
      destination_ids: ['dest_dme'],
      process_step_ids: ['C8','P2'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_data','stack_infra'],
      buyer_user: 'Consumer',
      value_capture: 'Membership' },
    { id: 'co_function',        name: 'Function Health',  group: 'leader',
      short_description: 'Comprehensive consumer lab testing with longitudinal tracking.',
      money_pool_ids: ['pool_it_data','pool_supplies_devices'],
      destination_ids: ['dest_other_professional'],
      process_step_ids: ['P3','C8'],
      ai_surface_ids: ['ai_prevention','ai_diagnostics'],
      stack_ids: ['stack_data','stack_decision'],
      buyer_user: 'Consumer',
      value_capture: 'Membership' },

    // ----- Techbio / drug discovery -----
    { id: 'co_alphafold',       name: 'AlphaFold',        group: 'leader',
      short_description: 'Open protein-structure model that reshaped computational biology.',
      money_pool_ids: ['pool_drugs_biologics','pool_public_health_research'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C5','C6','P3'],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Pharma / research',
      value_capture: 'Open science' },
    { id: 'co_isomorphic',      name: 'Isomorphic Labs',  group: 'leader',
      short_description: 'AI-first drug design building on DeepMind-era scientific modeling.',
      money_pool_ids: ['pool_drugs_biologics','pool_public_health_research'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C6','P3'],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_ai','stack_decision'],
      buyer_user: 'Pharma',
      value_capture: 'Pharma deals / royalties' },
    { id: 'co_recursion',       name: 'Recursion',        group: 'leader',
      short_description: 'AI-led drug discovery with industrial-scale phenomics.',
      money_pool_ids: ['pool_drugs_biologics','pool_public_health_research'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C6','P3'],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Pharma',
      value_capture: 'Pipeline + partnerships' },
    { id: 'co_insitro',         name: 'Insitro',          group: 'leader',
      short_description: 'Machine learning–driven discovery for diseases with unmet need.',
      money_pool_ids: ['pool_drugs_biologics','pool_public_health_research'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C6','P3'],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Pharma',
      value_capture: 'Pipeline + partnerships' },

    // =================== DVC portfolio ===================
    { id: 'co_qualified',       name: 'Qualified Health', group: 'dvc',
      short_description: 'Enterprise AI operating layer for health systems — agent dev, automation, safeguards, monitoring.',
      money_pool_ids: ['pool_provider_admin','pool_it_data','pool_clinical_labor'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['C4','F2','F3','F8'],
      ai_surface_ids: ['ai_admin_rcm','ai_scribes_copilots'],
      stack_ids: ['stack_ai','stack_governance','stack_infra'],
      buyer_user: 'Health system',
      value_capture: 'Enterprise platform' },
    { id: 'co_doctronic',       name: 'Doctronic',        group: 'dvc',
      short_description: 'AI primary-care access; Utah partnership for guideline-based Rx renewals under licensed oversight.',
      money_pool_ids: ['pool_clinical_labor','pool_provider_admin'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C2','C3','F1','P1','P5'],
      ai_surface_ids: ['ai_patient_access'],
      stack_ids: ['stack_workflow','stack_ai'],
      buyer_user: 'Patient / clinician',
      value_capture: 'Cash-pay consumer' },
    { id: 'co_collectly',       name: 'Collectly',        group: 'dvc',
      short_description: 'Patient billing and financial engagement / RCM workflow.',
      money_pool_ids: ['pool_provider_admin'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F6','F7'],
      ai_surface_ids: ['ai_financial_engagement'],
      stack_ids: ['stack_admin','stack_workflow'],
      buyer_user: 'Provider RCM',
      value_capture: 'Per-account fee' },
    { id: 'co_redsky',          name: 'RedSkyHealth',     group: 'dvc',
      short_description: 'Denial remediation and claims automation; provider-side financial workflow.',
      money_pool_ids: ['pool_provider_admin','pool_payer_admin'],
      destination_ids: ['dest_hospital','dest_physician'],
      process_step_ids: ['F4','F5'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_admin','stack_ai'],
      buyer_user: 'Provider RCM',
      value_capture: 'Performance-based RCM' },
    { id: 'co_workdn',          name: 'Workdn',           group: 'dvc',
      short_description: 'Hospital and workforce workflow automation.',
      money_pool_ids: ['pool_provider_admin','pool_it_data'],
      destination_ids: ['dest_hospital'],
      process_step_ids: ['C4','F3'],
      ai_surface_ids: ['ai_admin_rcm'],
      stack_ids: ['stack_workflow','stack_ai'],
      buyer_user: 'Health system',
      value_capture: 'Workflow automation' },
    { id: 'co_denti',           name: 'Denti AI',         group: 'dvc',
      short_description: 'Dental imaging and charting AI for provider workflow.',
      money_pool_ids: ['pool_clinical_labor','pool_supplies_devices'],
      destination_ids: ['dest_dental'],
      process_step_ids: ['C4','C5'],
      ai_surface_ids: ['ai_diagnostics'],
      stack_ids: ['stack_ai','stack_workflow'],
      buyer_user: 'Dental practice',
      value_capture: 'Per-chair subscription' },
    { id: 'co_asyliadx',        name: 'AsyliaDx',         group: 'dvc',
      short_description: 'Precision diagnostics; immunotherapy-related risk and response analysis.',
      money_pool_ids: ['pool_it_data','pool_clinical_labor'],
      destination_ids: ['dest_physician'],
      process_step_ids: ['C5','P3'],
      ai_surface_ids: ['ai_diagnostics','ai_techbio'],
      stack_ids: ['stack_data','stack_decision'],
      buyer_user: 'Specialist / pharma',
      value_capture: 'Test + pharma partnerships' },
    { id: 'co_nutrisense',      name: 'Nutrisense',       group: 'dvc',
      short_description: 'Metabolic health platform using CGM data and coaching.',
      money_pool_ids: ['pool_it_data','pool_supplies_devices'],
      destination_ids: ['dest_dme','dest_nondurable'],
      process_step_ids: ['C8','P2','P4'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_data','stack_workflow'],
      buyer_user: 'Consumer',
      value_capture: 'Membership + device' },
    { id: 'co_neera',           name: 'Neera Lab',        group: 'dvc',
      short_description: 'Sleep and prevention technology.',
      money_pool_ids: ['pool_it_data','pool_supplies_devices'],
      destination_ids: ['dest_dme'],
      process_step_ids: ['C8','P2'],
      ai_surface_ids: ['ai_prevention'],
      stack_ids: ['stack_data','stack_ai'],
      buyer_user: 'Consumer',
      value_capture: 'Consumer device + service' },
    { id: 'co_curex',           name: 'Curex',            group: 'dvc',
      short_description: 'Online allergy care and immunotherapy pathway.',
      money_pool_ids: ['pool_clinical_labor','pool_drugs_biologics'],
      destination_ids: ['dest_physician','dest_rx'],
      process_step_ids: ['C6','C7','P4','P5'],
      ai_surface_ids: ['ai_patient_access','ai_prevention'],
      stack_ids: ['stack_workflow','stack_ai'],
      buyer_user: 'Patient',
      value_capture: 'Cash-pay therapy plan' },
    { id: 'co_bioptic',         name: 'Bioptic',          group: 'dvc',
      short_description: 'AI-native techbio — target and molecule discovery; biological data.',
      money_pool_ids: ['pool_drugs_biologics','pool_public_health_research','pool_it_data'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C5','C6','P3'],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Pharma',
      value_capture: 'Pharma partnerships' },
    { id: 'co_kerna',           name: 'Kerna Labs',       group: 'dvc',
      short_description: 'AI-enabled RNA and mRNA therapeutics; personalized therapeutics.',
      money_pool_ids: ['pool_drugs_biologics','pool_public_health_research'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C6','P3'],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Pharma',
      value_capture: 'Pipeline / partnerships' },
    { id: 'co_novogaia',        name: 'Novogaia',         group: 'dvc',
      short_description: 'AI-enabled natural-product / fungi-based discovery.',
      money_pool_ids: ['pool_drugs_biologics','pool_public_health_research'],
      destination_ids: ['dest_rx'],
      process_step_ids: ['C6','P3'],
      ai_surface_ids: ['ai_techbio'],
      stack_ids: ['stack_ai','stack_data'],
      buyer_user: 'Pharma',
      value_capture: 'Discovery partnerships' }
  ];

  var takeaways = [
    { title: 'Follow the money, then the patient', copy: 'Adoption depends less on technical elegance than on who pays, who uses, and who captures the value.' },
    { title: 'Admin AI is an arms race', copy: 'Prior auth, coding, claims, and RCM are high-ROI surfaces — automation on one side often triggers automation on the other.' },
    { title: 'Prevention needs a payer', copy: 'Consumer prevention scales through private pay. Systemic prevention requires VBC, employers, Medicare Advantage, ACOs, or CMS reimbursement.' },
    { title: 'The data layer is shared', copy: 'Care, payment, prevention, research, and admin all compete over the same records, claims, labs, devices, and workflow data.' },
    { title: 'Near-term wins differ from long-term shift', copy: 'Near-term wins are documentation and admin. The long-term shift is upstream into diagnostics, drug discovery, and continuous prevention.' }
  ];

  var sources = [
    { label: 'CMS NHE Fact Sheet',                       url: SRC.nhe },
    { label: 'CMS 2024 NHE Highlights',                  url: SRC.highlights },
    { label: 'Health System Tracker / KFF',              url: SRC.kff2024 },
    { label: 'PHTI — Administrative AI',                 url: SRC.phti },
    { label: 'MGMA — medical practice operating costs',  url: SRC.mgma },
    { label: 'HHS/ASPE pharmaceutical supply chain',     url: SRC.aspe_pharma }
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
    takeaways: takeaways,
    sources: sources
  };
})(typeof window !== 'undefined' ? window : this);
