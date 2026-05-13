/* =====================================================================
   HEALTHCARE AI — DATA MODEL
   Money River nodes/links, overlays, patient loop, tooltips, companies
   ===================================================================== */
(function (root) {
  'use strict';

  // ------- Sources -------------------------------------------------------
  var SRC = {
    nhe: 'https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet',
    highlights: 'https://www.cms.gov/files/document/highlights.pdf',
    historical: 'https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/historical',
    mlr: 'https://www.cms.gov/marketplace/private-health-insurance/medical-loss-ratio',
    kff: 'https://www.kff.org/health-costs/key-facts-about-hospitals/?entry=hospital-finances-profit-margins',
    phti: 'https://phti.org/administrative-ai-current-use-and-potential-impact/',
    menlo: 'https://menlovc.com/perspective/2025-the-state-of-ai-in-healthcare/',
    rock: 'https://rockhealth.com/insights/2025-year-end-digital-health-funding-overview-a-tale-of-two-markets/',
    access: 'https://www.cms.gov/priorities/innovation/innovation-models/access',
    doctronic: 'https://commerce.utah.gov/2026/01/06/news-release-utah-and-doctronic-announce-groundbreaking-partnership-for-ai-prescription-medication-renewals/'
  };

  // ------- Headline stats ------------------------------------------------
  var headlineStats = [
    { label: 'US national health expenditure', value: '$5.3T', evidence: 'official', src: SRC.nhe },
    { label: 'Per person', value: '$15,474', evidence: 'official', src: SRC.nhe },
    { label: 'Share of GDP', value: '18.0%', evidence: 'official', src: SRC.nhe },
    { label: 'Healthcare AI spend (Menlo survey scope)', value: '$1.4B', evidence: 'vc_survey', src: SRC.menlo },
    { label: 'US digital health funding, 2025', value: '$14.2B', evidence: 'context', src: SRC.rock }
  ];

  // ------- Sponsor strip -------------------------------------------------
  var sponsors = [
    { id: 'sponsor_federal', label: 'Federal government', display: '$1.7T', value_b: 1700, evidence: 'official',
      tooltip: 'Federal government programs and subsidies are the largest sponsor of US healthcare spending.' },
    { id: 'sponsor_households', label: 'Households', display: '$1.5T', value_b: 1500, evidence: 'official',
      tooltip: 'Households fund healthcare through premiums, taxes, out-of-pocket payments, and payroll contributions.' },
    { id: 'sponsor_private_business', label: 'Private business / employers', display: '$967B', value_b: 967, evidence: 'official',
      tooltip: 'Employers fund a large share of private insurance and therefore sit upstream of many commercial healthcare incentives.' },
    { id: 'sponsor_state_local', label: 'State / local governments', display: '$860B', value_b: 860, evidence: 'official',
      tooltip: 'State and local governments fund Medicaid, public programs, and public employee coverage.' },
    { id: 'sponsor_other_private', label: 'Other private revenues', display: '~6% share', value_b: 318, evidence: 'official',
      tooltip: 'Philanthropy, research funds, and other private sources fund a smaller but important part of the system.' }
  ];

  // ------- Money River nodes --------------------------------------------
  // Layer 1 — Payment channels (Official, except residual)
  var paymentChannels = [
    { id: 'pay_private_insurance', label: 'Private health insurance', value_b: 1644.6, display: '$1.6T',
      evidence: 'official', src: SRC.nhe, tooltip_id: 'tt_private_insurance',
      description: 'Commercial insurance, often employer-sponsored, that pays for covered medical care.',
      ai_surfaces: ['ai_admin_automation', 'ai_clinical_copilot', 'ai_patient_access'],
      related_gates: ['gate_prior_auth', 'gate_claims', 'gate_pbm'] },
    { id: 'pay_medicare', label: 'Medicare', value_b: 1118.0, display: '$1.1T',
      evidence: 'official', src: SRC.nhe, tooltip_id: 'tt_medicare',
      description: 'Federal health insurance program primarily for people 65+ and some disabled people.',
      ai_surfaces: ['ai_admin_automation', 'ai_prevention_monitoring'],
      related_gates: ['gate_quality_risk', 'gate_claims'] },
    { id: 'pay_medicaid', label: 'Medicaid', value_b: 931.7, display: '$932B',
      evidence: 'official', src: SRC.nhe, tooltip_id: 'tt_medicaid',
      description: 'Joint federal-state program for low-income and eligible populations.',
      ai_surfaces: ['ai_patient_access', 'ai_admin_automation'],
      related_gates: ['gate_claims', 'gate_prior_auth'] },
    { id: 'pay_out_of_pocket', label: 'Out-of-pocket', value_b: 556.6, display: '$557B',
      evidence: 'official', src: SRC.nhe, tooltip_id: 'tt_out_of_pocket',
      description: 'Spending paid directly by patients — deductibles, copays, coinsurance, uncovered services.',
      ai_surfaces: ['ai_financial_engagement', 'ai_prevention_monitoring', 'ai_patient_access'],
      related_gates: ['gate_rcm'] },
    { id: 'pay_other_public_private', label: 'Other third-party payers & programs', value_b: 590.5, display: '$591B',
      evidence: 'official', src: SRC.nhe,
      description: 'VA, IHS, workers\' comp, public health activity, and other third-party programs.',
      ai_surfaces: ['ai_admin_automation'],
      related_gates: ['gate_claims'] },
    { id: 'pay_residual', label: 'Other NHE categories & reconciliation', value_b: 458.6, display: '$459B',
      evidence: 'modeled',
      description: 'Residual derived as $5.3T minus listed payment channels so the chart balances to NHE.',
      ai_surfaces: [],
      related_gates: [] }
  ];

  // Layer 2 — Destinations
  var destinations = [
    { id: 'dest_hospital', label: 'Hospital care', value_b: 1634.7, display: '$1.6T',
      evidence: 'official', src: SRC.highlights,
      description: 'Inpatient, outpatient, and emergency services delivered by hospitals.',
      ai_surfaces: ['ai_clinical_copilot', 'ai_admin_automation', 'ai_diagnostics'],
      related_gates: ['gate_coding', 'gate_rcm', 'gate_prior_auth'] },
    { id: 'dest_physician', label: 'Physician & clinical services', value_b: 1109.7, display: '$1.1T',
      evidence: 'official', src: SRC.highlights,
      description: 'Office visits, procedures, and clinical services billed by physicians and clinical groups.',
      ai_surfaces: ['ai_clinical_copilot', 'ai_admin_automation', 'ai_diagnostics', 'ai_patient_access'],
      related_gates: ['gate_coding', 'gate_rcm', 'gate_prior_auth'] },
    { id: 'dest_rx', label: 'Retail prescription drugs', value_b: 467.0, display: '$467B',
      evidence: 'official', src: SRC.highlights,
      description: 'Outpatient prescription drugs dispensed by retail pharmacies.',
      ai_surfaces: ['ai_drug_discovery', 'ai_prevention_monitoring'],
      related_gates: ['gate_pbm', 'gate_prior_auth'] },
    { id: 'dest_residential_personal', label: 'Other health, residential & personal care', value_b: 320.5, display: '$321B',
      evidence: 'official', src: SRC.highlights,
      description: 'Home- and community-based care, residential and personal services. ~62% Medicaid funded.',
      ai_surfaces: ['ai_prevention_monitoring', 'ai_patient_access'],
      related_gates: [] },
    { id: 'dest_nursing', label: 'Nursing care facilities & CCRCs', value_b: 219.9, display: '$220B',
      evidence: 'official', src: SRC.highlights,
      description: 'Skilled nursing facilities and continuing care retirement communities.',
      ai_surfaces: ['ai_admin_automation', 'ai_prevention_monitoring'],
      related_gates: ['gate_quality_risk'] },
    { id: 'dest_dental', label: 'Dental services', value_b: 189.2, display: '$189B',
      evidence: 'official', src: SRC.highlights,
      description: 'Dental services. CMS reports ~80% paid by out-of-pocket + private insurance.',
      ai_surfaces: ['ai_diagnostics', 'ai_patient_access'],
      related_gates: [] },
    { id: 'dest_other_professional', label: 'Other professional services', value_b: 184.9, display: '$185B',
      evidence: 'official', src: SRC.highlights,
      description: 'Services from non-physician professionals (PT/OT, optometry, podiatry, etc.).',
      ai_surfaces: ['ai_admin_automation'],
      related_gates: [] },
    { id: 'dest_home_health', label: 'Home health care', value_b: 169.4, display: '$169B',
      evidence: 'official', src: SRC.highlights,
      description: 'Skilled medical services and personal care delivered in the home.',
      ai_surfaces: ['ai_prevention_monitoring', 'ai_patient_access'],
      related_gates: ['gate_quality_risk'] },
    { id: 'dest_nondurable', label: 'Other non-durable medical products', value_b: 128.7, display: '$129B',
      evidence: 'official', src: SRC.highlights,
      description: 'OTC drugs and other non-durable medical goods. CMS reports ~96% out-of-pocket.',
      ai_surfaces: ['ai_prevention_monitoring'],
      related_gates: [] },
    { id: 'dest_dme', label: 'Durable medical equipment', value_b: 86.4, display: '$86B',
      evidence: 'official', src: SRC.highlights,
      description: 'Long-use medical equipment such as wheelchairs, CPAPs, glucose monitors.',
      ai_surfaces: ['ai_prevention_monitoring', 'ai_diagnostics'],
      related_gates: [] },
    { id: 'dest_residual', label: 'Admin, public health, investment & other goods', value_b: 789.6, display: '$790B',
      evidence: 'modeled',
      description: 'Residual derived as $5.3T minus listed official service/product categories. Includes net cost of insurance, public health, structures, equipment, and research.',
      ai_surfaces: ['ai_admin_automation'],
      related_gates: ['gate_rcm', 'gate_claims'] }
  ];

  // ------- Modeled link weights (payment channel → destination) ----------
  var destinationWeightsByPaymentChannel = {
    pay_private_insurance: {
      dest_hospital: 0.34,
      dest_physician: 0.30,
      dest_rx: 0.10,
      dest_dental: 0.06,
      dest_other_professional: 0.05,
      dest_home_health: 0.02,
      dest_dme: 0.01,
      dest_residual: 0.12
    },
    pay_medicare: {
      dest_hospital: 0.36,
      dest_physician: 0.27,
      dest_rx: 0.09,
      dest_home_health: 0.05,
      dest_nursing: 0.05,
      dest_dme: 0.02,
      dest_residual: 0.16
    },
    pay_medicaid: {
      dest_hospital: 0.25,
      dest_physician: 0.15,
      dest_residential_personal: 0.2135,
      dest_nursing: 0.09,
      dest_home_health: 0.05,
      dest_rx: 0.07,
      dest_residual: 0.1765
    },
    pay_out_of_pocket: {
      dest_dental: 0.15,
      dest_nondurable: 0.222,
      dest_rx: 0.13,
      dest_physician: 0.12,
      dest_hospital: 0.09,
      dest_other_professional: 0.06,
      dest_dme: 0.03,
      dest_residual: 0.198
    },
    pay_other_public_private: {
      dest_hospital: 0.24,
      dest_physician: 0.16,
      dest_residential_personal: 0.08,
      dest_home_health: 0.04,
      dest_rx: 0.05,
      dest_residual: 0.43
    },
    pay_residual: {
      dest_residual: 1
    }
  };

  // Build initial links then balance both ways (IPF, 8 passes)
  function buildBalancedLinks(payments, dests, weights) {
    var paymentTotals = {};
    payments.forEach(function (p) { paymentTotals[p.id] = p.value_b; });
    var destTotals = {};
    dests.forEach(function (d) { destTotals[d.id] = d.value_b; });

    var links = [];
    payments.forEach(function (p) {
      var w = weights[p.id] || {};
      Object.keys(w).forEach(function (dId) {
        links.push({
          source: p.id,
          target: dId,
          value_b: paymentTotals[p.id] * w[dId],
          evidence: 'modeled',
          rationale: 'Modeled allocation from CMS payer mix hints; not a published CMS link value.'
        });
      });
    });

    // Iterative proportional fitting
    for (var iter = 0; iter < 12; iter++) {
      // Row scale (payment channel totals)
      payments.forEach(function (p) {
        var sum = 0;
        links.forEach(function (l) { if (l.source === p.id) sum += l.value_b; });
        if (sum > 0) {
          var scale = paymentTotals[p.id] / sum;
          links.forEach(function (l) { if (l.source === p.id) l.value_b *= scale; });
        }
      });
      // Column scale (destination totals)
      dests.forEach(function (d) {
        var sum = 0;
        links.forEach(function (l) { if (l.target === d.id) sum += l.value_b; });
        if (sum > 0) {
          var scale = destTotals[d.id] / sum;
          links.forEach(function (l) { if (l.target === d.id) l.value_b *= scale; });
        }
      });
    }
    return links;
  }

  var moneyLinks = buildBalancedLinks(paymentChannels, destinations, destinationWeightsByPaymentChannel);

  // ------- Overlays: admin gates, AI surfaces, policy --------------------
  var adminGates = [
    { id: 'gate_prior_auth', label: 'Prior authorization', tooltip_id: 'tt_prior_auth',
      attach: ['pay_private_insurance', 'pay_medicare', 'dest_hospital', 'dest_physician', 'dest_rx'],
      summary: 'A payer approval step before some care or drugs are reimbursed. AI can automate both the provider submission side and the payer review side.' },
    { id: 'gate_coding', label: 'Coding', tooltip_id: 'tt_coding',
      attach: ['dest_hospital', 'dest_physician'],
      summary: 'Clinical work must be translated into billing codes. AI can reduce documentation burden, but can also increase coding intensity.' },
    { id: 'gate_claims', label: 'Claims adjudication', tooltip_id: 'tt_claims',
      attach: ['pay_private_insurance', 'pay_medicare', 'pay_medicaid', 'dest_hospital', 'dest_physician'],
      summary: 'The payer decides what will be paid, denied, or adjusted. AI creates an arms race between claim generation and claim review.' },
    { id: 'gate_rcm', label: 'Revenue cycle management', tooltip_id: 'tt_rcm',
      attach: ['dest_hospital', 'dest_physician', 'pay_out_of_pocket'],
      summary: 'The provider process of billing, collecting, and managing payment. AI can improve cash collection and reduce manual work.' },
    { id: 'gate_pbm', label: 'PBM / formulary', tooltip_id: 'tt_pbm',
      attach: ['pay_private_insurance', 'pay_medicare', 'dest_rx'],
      summary: 'Pharmacy benefit managers shape drug access, rebates, formularies, and patient costs. AI affects drug selection, adherence, and payer review.' },
    { id: 'gate_quality_risk', label: 'Quality & risk adjustment', tooltip_id: 'tt_quality_risk',
      attach: ['pay_medicare', 'dest_home_health', 'dest_nursing'],
      summary: 'Documentation and outcomes affect payments in risk-bearing models. AI can help measure, document, and manage risk.' }
  ];

  var aiSurfaces = [
    { id: 'ai_admin_automation', label: 'Admin automation',
      attach: ['gate_prior_auth', 'gate_claims', 'gate_coding', 'gate_rcm'],
      message: 'Admin AI has obvious ROI, but not all internal savings become system-level savings.' },
    { id: 'ai_clinical_copilot', label: 'Clinical copilots',
      attach: ['dest_physician', 'dest_hospital'],
      message: 'Copilots help clinicians search evidence, document encounters, and make decisions under oversight.' },
    { id: 'ai_patient_access', label: 'Patient access & navigation',
      attach: ['dest_physician', 'dest_hospital', 'pay_out_of_pocket'],
      message: 'AI changes the front door: triage, scheduling, benefits navigation, and follow-up.' },
    { id: 'ai_financial_engagement', label: 'Patient financial engagement',
      attach: ['pay_out_of_pocket', 'gate_rcm'],
      message: 'AI can personalize billing, collections, payment plans, and eligibility discovery.' },
    { id: 'ai_prevention_monitoring', label: 'Prevention & monitoring',
      attach: ['pay_out_of_pocket', 'dest_home_health'],
      message: 'Wearables, labs, CGMs, and coaching turn health into a continuous data problem.' },
    { id: 'ai_drug_discovery', label: 'AI drug discovery & techbio',
      attach: ['dest_rx'],
      message: 'AI can move upstream into target discovery, molecule design, trial design, diagnostics, and precision medicine.' },
    { id: 'ai_diagnostics', label: 'Diagnostics & imaging',
      attach: ['dest_physician', 'dest_hospital', 'dest_dental'],
      message: 'AI detects, triages, reads, or prioritizes signals from images, labs, pathology, dentistry, and omics.' }
  ];

  // ------- Money River callouts -----------------------------------------
  var moneyCallouts = [
    { id: 'callout_buyer_user_payer', title: 'Buyer, user, payer, beneficiary split',
      copy: 'Healthcare AI adoption depends on who pays, who uses, and who benefits. These are often different actors.' },
    { id: 'callout_admin_paradox', title: 'Admin savings are not automatically system savings',
      copy: 'AI can reduce internal task cost, but it can also increase coding, claim volume, denial volume, and utilization review. This is an arms race, not a guaranteed cost cure.' },
    { id: 'callout_mlr', title: 'Insurer margin constraint (MLR)',
      copy: 'ACA medical loss ratio rules require many insurers to spend 80% or 85% of premium dollars on care and quality improvement, so insurer incentives differ from ordinary software cost-cutting incentives.' },
    { id: 'callout_provider_incentives', title: 'Providers do not share the same cap',
      copy: 'Hospitals and providers are not governed by the same MLR rule. Their incentives depend on payer mix, prices, labor, capacity, and service lines.' },
    { id: 'callout_private_pay', title: 'Private pay is the experimental frontier',
      copy: 'Consumer health, wellness, longevity, lab uploads, CGMs, supplements, and AI coaching scale first where consumers pay directly. Reimbursement may follow only when outcomes are measurable.' },
    { id: 'callout_vbc', title: 'Value-based care is the bridge to prevention',
      copy: 'Prevention becomes systemic when someone takes risk for downstream cost. VBC, Medicare Advantage, ACOs, employers, and CMS digital models can make prevention economically rational.' }
  ];

  // ------- Patient loop --------------------------------------------------
  var patientStates = [
    { id: 'state_healthy', label: 'Healthy', prompt: 'No acute complaint, but increasingly measured.', color: '#4ECDC4' },
    { id: 'state_at_risk', label: 'At risk', prompt: 'Signals suggest future disease risk.', color: '#F5C542' },
    { id: 'state_symptomatic', label: 'Symptomatic', prompt: 'Something feels wrong.', color: '#FF8C42' },
    { id: 'state_diagnosed', label: 'Diagnosed', prompt: 'A condition is now named and managed.', color: '#4A90D9' },
    { id: 'state_chronic', label: 'Chronic', prompt: 'Care becomes longitudinal.', color: '#7C4DFF' },
    { id: 'state_acute', label: 'Acute episode', prompt: 'The system mobilizes around urgency.', color: '#E8837C' }
  ];

  var careLoop = [
    { id: 'care_signal', label: 'Signal', angle: 210, description: 'Symptom, wearable alert, lab abnormality, medication issue, or patient concern.', ai: ['ai_patient_access','ai_prevention_monitoring','ai_diagnostics'] },
    { id: 'care_search_triage', label: 'Search / chat / triage', angle: 245, description: 'Patient or clinician looks for guidance. Consumer AI and clinical copilots enter here.', ai: ['ai_clinical_copilot','ai_patient_access'] },
    { id: 'care_access', label: 'Access / scheduling', angle: 285, description: 'Find the right site of care, appointment, telehealth, urgent care, or self-pay path.', ai: ['ai_patient_access'] },
    { id: 'care_encounter', label: 'Encounter', angle: 325, description: 'Visit, telehealth session, hospital admission, dental visit, or diagnostic appointment.', ai: ['ai_clinical_copilot','ai_admin_automation'] },
    { id: 'care_diagnosis_orders', label: 'Diagnosis / orders', angle: 35, description: 'Clinician orders labs, imaging, prescriptions, referrals, or treatment.', ai: ['ai_diagnostics','ai_clinical_copilot'] },
    { id: 'care_treatment', label: 'Treatment', angle: 75, description: 'Drugs, procedures, behavioral interventions, digital therapeutics, care plans, supplements, or coaching.', ai: ['ai_drug_discovery','ai_prevention_monitoring'] },
    { id: 'care_followup', label: 'Follow-up', angle: 115, description: 'Monitor response, adjust therapy, refill medications, refer, escalate, or close loop.', ai: ['ai_patient_access','ai_prevention_monitoring'] },
    { id: 'care_monitoring', label: 'Monitoring / prevention', angle: 155, description: 'Continuous or episodic monitoring using wearables, labs, questionnaires, home devices, or coaching.', ai: ['ai_prevention_monitoring','ai_diagnostics'] }
  ];

  var financialLoop = [
    { id: 'fin_eligibility', label: 'Eligibility / benefits', angle: 210, description: 'Determine coverage, network status, benefits, deductible, and patient responsibility.', ai: ['ai_patient_access','ai_financial_engagement'] },
    { id: 'fin_prior_auth', label: 'Prior authorization', angle: 245, description: 'Payer approval step before some services or drugs.', ai: ['ai_admin_automation'] },
    { id: 'fin_documentation', label: 'Documentation / coding', angle: 285, description: 'Convert care into notes, codes, quality measures, and billable records.', ai: ['ai_admin_automation','ai_clinical_copilot'] },
    { id: 'fin_claim', label: 'Claim submission', angle: 325, description: 'Provider submits claim to payer or patient.', ai: ['ai_admin_automation'] },
    { id: 'fin_adjudication', label: 'Adjudication / denial', angle: 35, description: 'Payer pays, adjusts, denies, requests more information, or downcodes.', ai: ['ai_admin_automation'] },
    { id: 'fin_patient_bill', label: 'Patient bill', angle: 75, description: 'Remaining responsibility becomes bill, payment plan, collection workflow, or write-off.', ai: ['ai_financial_engagement'] },
    { id: 'fin_collection', label: 'Payment / collection', angle: 115, description: 'Patient, employer, payer, or government payment is collected and reconciled.', ai: ['ai_financial_engagement'] },
    { id: 'fin_reporting', label: 'Quality / risk / outcomes', angle: 155, description: 'Outcomes, risk adjustment, quality reporting, and value-based measures feed future payment.', ai: ['ai_prevention_monitoring','ai_admin_automation'] }
  ];

  var sharedStack = [
    { id: 'stack_data', label: 'Data', contents: 'EHR · claims · labs · imaging · genomics · pharmacy · wearables · patient-reported', why: 'AI performance depends on access to complete, timely, permissioned data.' },
    { id: 'stack_workflow', label: 'Workflow', contents: 'Scheduling · intake · documentation · orders · referrals · care plans · refills', why: 'Healthcare AI wins when it changes workflow, not just answers questions.' },
    { id: 'stack_admin', label: 'Admin / reimbursement', contents: 'Benefits · prior auth · coding · claims · denials · RCM · patient billing', why: 'This is where much near-term AI ROI appears, but also where arms races form.' },
    { id: 'stack_decision', label: 'Decision', contents: 'Guidelines · evidence · care pathways · payer rules · quality measures · risk scores', why: 'AI systems must reason inside clinical and reimbursement rules.' },
    { id: 'stack_ai', label: 'AI application / agent', contents: 'Copilots · agents · retrieval · summarization · prediction · automation · personalization', why: 'The visible product layer, but only works if connected to the stack below.' },
    { id: 'stack_governance', label: 'Governance & trust', contents: 'HIPAA · FDA · liability · audit logs · model monitoring · human oversight · security', why: 'Healthcare AI needs trust, control, auditability, and regulated deployment.' },
    { id: 'stack_infra', label: 'Infrastructure', contents: 'Cloud · identity · APIs · interoperability · data warehouses · devices · MLOps', why: 'The substrate that makes AI deployable across fragmented systems.' }
  ];

  var preventionOrbit = [
    { id: 'prev_assistant', label: 'Health AI assistant', description: 'Consumer asks questions, uploads labs, summarizes symptoms, or tracks goals.', examples: 'Perplexity-style lab uploads · general AI assistants · OpenEvidence-like clinician workflows' },
    { id: 'prev_devices', label: 'Wearables & home signals', description: 'Continuous signals from WHOOP, Oura, Apple Watch, CGM, sleep sensors, BP cuffs.', examples: 'WHOOP assistant · Google/AI health tracking · Nutrisense · Neera' },
    { id: 'prev_labs_omics', label: 'Labs · genetics · omics', description: 'Consumers or clinicians use richer biological data to personalize guidance.', examples: 'Function Health-style labs · genomics · precision diagnostics' },
    { id: 'prev_coaching', label: 'Personalized coaching', description: 'AI or human coaches turn data into behavior, nutrition, sleep, exercise, adherence.', examples: 'Nutrisense · Curex · wellness apps' },
    { id: 'prev_escalation', label: 'Escalation to clinician', description: 'AI flags risk or symptoms that require licensed clinician review.', examples: 'Doctronic · telehealth · primary care' }
  ];

  var vbcBridge = [
    { id: 'vbc_ffs', label: 'Fee-for-service default', description: 'The system mostly pays when care is delivered after an event.' },
    { id: 'vbc_risk', label: 'Risk-bearing contracts', description: 'Payers, providers, or employers have financial upside from avoided events or better outcomes.' },
    { id: 'vbc_ma_aco', label: 'Medicare Advantage · ACO · employer risk', description: 'Places where prevention, care management, documentation, and risk scoring affect economics.' },
    { id: 'vbc_digital_reimbursement', label: 'Digital reimbursement', description: 'RTM, digital mental health treatment codes, CMS ACCESS, and similar models can bring apps/devices into reimbursed care.' },
    { id: 'vbc_prevention_logic', label: 'Prevention becomes financeable', description: 'AI prevention matters systemically when someone can measure, trust, and capture avoided cost.' }
  ];

  // Which care/financial steps light up for which patient state
  var stateHighlights = {
    state_healthy: {
      care: ['care_signal', 'care_monitoring'],
      financial: ['fin_eligibility'],
      prevention: ['prev_assistant', 'prev_devices', 'prev_labs_omics', 'prev_coaching'],
      vbc: ['vbc_prevention_logic']
    },
    state_at_risk: {
      care: ['care_signal', 'care_search_triage', 'care_monitoring'],
      financial: ['fin_eligibility', 'fin_reporting'],
      prevention: ['prev_assistant', 'prev_devices', 'prev_labs_omics', 'prev_coaching', 'prev_escalation'],
      vbc: ['vbc_ma_aco', 'vbc_prevention_logic']
    },
    state_symptomatic: {
      care: ['care_signal', 'care_search_triage', 'care_access', 'care_encounter'],
      financial: ['fin_eligibility', 'fin_prior_auth', 'fin_documentation', 'fin_claim'],
      prevention: ['prev_assistant', 'prev_escalation'],
      vbc: ['vbc_ffs']
    },
    state_diagnosed: {
      care: ['care_diagnosis_orders', 'care_treatment', 'care_followup'],
      financial: ['fin_prior_auth', 'fin_documentation', 'fin_claim', 'fin_adjudication', 'fin_patient_bill'],
      prevention: ['prev_escalation'],
      vbc: ['vbc_ffs', 'vbc_risk']
    },
    state_chronic: {
      care: ['care_treatment', 'care_followup', 'care_monitoring'],
      financial: ['fin_documentation', 'fin_reporting', 'fin_patient_bill'],
      prevention: ['prev_devices', 'prev_coaching', 'prev_escalation'],
      vbc: ['vbc_risk', 'vbc_ma_aco', 'vbc_digital_reimbursement']
    },
    state_acute: {
      care: ['care_access', 'care_encounter', 'care_diagnosis_orders', 'care_treatment'],
      financial: ['fin_prior_auth', 'fin_documentation', 'fin_claim', 'fin_adjudication'],
      prevention: [],
      vbc: ['vbc_ffs']
    }
  };

  // ------- Tooltip dictionary -------------------------------------------
  var tooltips = {
    tt_nhe: { term: 'National Health Expenditure', def: 'The official CMS estimate of total US healthcare spending across goods, services, administration, public health, and investment.', why: 'This is the size of the system AI is entering, but not the size of the AI market.' },
    tt_private_insurance: { term: 'Private health insurance', def: 'Commercial insurance, often employer-sponsored, that pays for covered medical care.', why: 'Large software budgets and administrative workflows make this a major AI target.' },
    tt_medicare: { term: 'Medicare', def: 'Federal health insurance program primarily for people 65+ and some disabled people.', why: 'Medicare shapes reimbursement, risk models, and provider economics.' },
    tt_medicaid: { term: 'Medicaid', def: 'Joint federal-state program for low-income and eligible populations.', why: 'Medicaid-heavy categories create different budget constraints and adoption paths.' },
    tt_out_of_pocket: { term: 'Out-of-pocket', def: 'Spending paid directly by patients — deductibles, copays, coinsurance, uncovered services.', why: 'Private-pay AI and wellness can scale here without waiting for reimbursement.' },
    tt_mlr: { term: 'Medical loss ratio (MLR)', def: 'ACA rule requiring many insurers to spend 80% or 85% of premium dollars on care and quality improvement.', why: 'It changes insurer incentives: cost savings do not behave like ordinary SaaS margin expansion.' },
    tt_pbm: { term: 'Pharmacy benefit manager', def: 'Intermediary that manages drug benefits, formularies, rebates, and pharmacy networks.', why: 'PBMs sit between payers, pharma, pharmacies, and patients; AI can affect access, adherence, and review.' },
    tt_prior_auth: { term: 'Prior authorization', def: 'Payer approval required before certain drugs, tests, or services are covered.', why: 'AI attacks both sides: providers automate submissions, payers automate review.' },
    tt_rcm: { term: 'Revenue cycle management', def: 'Provider-side process for coding, billing, collecting, and reconciling payment.', why: 'High-labor workflow with direct ROI, making it a near-term AI wedge.' },
    tt_claims: { term: 'Claims adjudication', def: 'Payer process deciding whether a claim is paid, adjusted, denied, or investigated.', why: 'AI can reduce manual review but also create a claims/denials arms race.' },
    tt_coding: { term: 'Medical coding', def: 'Translating clinical work into billing codes that drive reimbursement.', why: 'Ambient AI reduces documentation labor but can also intensify coding capture.' },
    tt_quality_risk: { term: 'Quality & risk adjustment', def: 'Documentation and outcomes that affect risk-adjusted payments in MA, ACOs, and VBC contracts.', why: 'AI can systematically improve documentation, but also concentrates audit risk.' },
    tt_vbc: { term: 'Value-based care', def: 'Payment model where economics depend on outcomes, quality, risk, or total cost rather than only services delivered.', why: 'It is the bridge that can make prevention financially rational.' },
    tt_aco: { term: 'Accountable Care Organization', def: 'Provider group that can share savings or risk for a population\'s cost and quality.', why: 'ACOs have incentives to prevent avoidable downstream cost.' },
    tt_ma: { term: 'Medicare Advantage', def: 'Private plans paid to administer Medicare benefits, often with risk adjustment and quality incentives.', why: 'AI can affect navigation, risk documentation, care management, and prevention.' },
    tt_rtm: { term: 'Remote therapeutic monitoring', def: 'Reimbursement category for monitoring therapeutic response and adherence using digital tools.', why: 'One way software/device workflows can become reimbursable care.' },
    tt_cgm: { term: 'Continuous glucose monitor', def: 'Sensor that tracks glucose over time.', why: 'CGMs are part of the consumer/prevention data layer beyond traditional visits.' },
    tt_precision_medicine: { term: 'Precision medicine', def: 'Tailoring diagnosis or treatment to biological, genetic, molecular, or patient-specific data.', why: 'AI can connect omics, diagnostics, drug selection, and patient stratification.' }
  };

  // ------- Companies (DVC + Benchmark) ----------------------------------
  // public_traction flagged as "not disclosed" unless we have a sourced claim.
  var companies = [
    // ----- DVC -----
    { id: 'qualified_health', name: 'Qualified Health', status: 'DVC', category: 'Enterprise AI operating layer for health systems',
      placements: ['ai_admin_automation', 'stack_ai', 'dest_hospital', 'gate_rcm'],
      one_liner: 'Secure enterprise AI platform for health systems: agent development, workflow automation, safeguards, monitoring, governance, data integration.',
      claims: [{ claim: 'Reported $125M Series B and 500,000+ users.', evidence: 'company_claim' }] },
    { id: 'doctronic', name: 'Doctronic', status: 'DVC', category: 'AI primary care / prescription renewal',
      placements: ['care_search_triage', 'prev_escalation', 'gate_prior_auth'],
      one_liner: 'AI health assistant and care access layer. Utah partnership allows routine guideline-based prescription renewals under licensed practitioner oversight, not broad autonomous prescribing.',
      claims: [{ claim: 'Utah Department of Commerce announced partnership for AI prescription renewals.', evidence: 'official', src: SRC.doctronic }] },
    { id: 'collectly', name: 'Collectly', status: 'DVC', category: 'Patient billing & RCM',
      placements: ['gate_rcm', 'fin_patient_bill', 'ai_financial_engagement', 'fin_collection'],
      one_liner: 'Patient financial engagement and collections automation. Position as patient billing / RCM workflow, not clinical care.' },
    { id: 'redskyhealth', name: 'RedSkyHealth', status: 'DVC', category: 'Denial & claims automation',
      placements: ['gate_claims', 'gate_rcm', 'fin_adjudication'],
      one_liner: 'Claims denial remediation and RCM automation. Position as provider-side financial workflow.' },
    { id: 'workdn', name: 'Workdn / WorkDone', status: 'DVC', category: 'Hospital / workforce workflow automation',
      placements: ['stack_workflow', 'dest_hospital', 'care_encounter'],
      one_liner: 'Hospital and workflow operations automation. Public category placement only.' },
    { id: 'neera', name: 'Neera Lab', status: 'DVC', category: 'Sleep technology / prevention',
      placements: ['prev_devices', 'care_monitoring', 'ai_prevention_monitoring'],
      one_liner: 'Sleep and prevention technology. Private-pay / monitoring example.' },
    { id: 'curex', name: 'Curex', status: 'DVC', category: 'Allergy care / immunotherapy',
      placements: ['care_treatment', 'prev_coaching', 'pay_out_of_pocket'],
      one_liner: 'Online allergy care and immunotherapy pathway. Treatment, adherence, and consumer-pay navigation.' },
    { id: 'denti_ai', name: 'Denti AI', status: 'DVC', category: 'Dental AI diagnostics & charting',
      placements: ['dest_dental', 'ai_diagnostics', 'care_diagnosis_orders'],
      one_liner: 'Dental imaging / charting AI. Dental diagnostics and provider workflow.' },
    { id: 'lovi', name: 'Lovi', status: 'DVC', category: 'Consumer wellness',
      placements: ['prev_assistant', 'prev_coaching'],
      one_liner: 'Consumer wellness / personal health assistant. Category placement only.' },
    { id: 'lovon', name: 'Lovon', status: 'DVC', category: 'Consumer wellness',
      placements: ['prev_assistant', 'prev_coaching'],
      one_liner: 'Consumer wellness / emotional or relationship support. Category placement only.' },
    { id: 'nutrisense', name: 'Nutrisense', status: 'DVC', category: 'Metabolic health / CGM coaching',
      placements: ['prev_devices', 'prev_coaching', 'pay_out_of_pocket'],
      one_liner: 'Metabolic health platform using CGM-style data and coaching. Consumer prevention and self-pay.' },
    { id: 'aurora_app', name: 'Aurora app', status: 'DVC', category: 'Medication / patient management',
      placements: ['care_followup', 'care_monitoring', 'stack_workflow'],
      one_liner: 'Medication or patient management workflow. Category placement only.' },
    { id: 'bioptic', name: 'Bioptic', status: 'DVC', category: 'AI techbio / molecular discovery',
      placements: ['ai_drug_discovery', 'dest_rx', 'stack_data'],
      one_liner: 'AI-native techbio. Upstream of pharma — target discovery, molecule discovery, and biological data.' },
    { id: 'kerna_labs', name: 'Kerna Labs', status: 'DVC', category: 'RNA / mRNA therapeutics',
      placements: ['ai_drug_discovery', 'dest_rx', 'stack_data'],
      one_liner: 'AI-enabled RNA / mRNA therapeutics. Techbio and personalized therapeutics.' },
    { id: 'asyliadx', name: 'AsyliaDx', status: 'DVC', category: 'Precision diagnostics',
      placements: ['ai_diagnostics', 'stack_data', 'care_diagnosis_orders'],
      one_liner: 'Precision diagnostics and immunotherapy-related risk/response analysis.' },
    { id: 'novogaia', name: 'Novogaia', status: 'DVC', category: 'Natural-product / fungi drug discovery',
      placements: ['ai_drug_discovery', 'prev_labs_omics', 'dest_rx'],
      one_liner: 'AI-enabled natural-product or fungi-based discovery. Techbio and new therapeutic search spaces.' },
    // ----- Benchmarks -----
    { id: 'openevidence', name: 'OpenEvidence', status: 'Benchmark', category: 'Clinician evidence search',
      placements: ['ai_clinical_copilot', 'care_search_triage', 'stack_decision'],
      one_liner: 'Clinician-facing medical knowledge and evidence retrieval. Clinical decision layer, not consumer self-diagnosis.' },
    { id: 'alphafold', name: 'AlphaFold / Google DeepMind', status: 'Benchmark', category: 'Protein structure AI',
      placements: ['ai_drug_discovery', 'stack_data'],
      one_liner: 'Foundational scientific model that changed protein structure prediction and became infrastructure for biotech research.' },
    { id: 'isomorphic', name: 'Isomorphic Labs', status: 'Benchmark', category: 'AI drug design',
      placements: ['ai_drug_discovery', 'dest_rx'],
      one_liner: 'AI-first drug discovery company building on DeepMind-era scientific modeling. Upstream of pharma revenue.' },
    { id: 'abridge', name: 'Abridge', status: 'Benchmark', category: 'Ambient clinical documentation',
      placements: ['ai_admin_automation', 'gate_coding', 'care_encounter'],
      one_liner: 'Ambient clinical documentation and encounter summarization. Benchmark for near-term provider ROI.' },
    { id: 'nuance_dax', name: 'Nuance DAX / Microsoft', status: 'Benchmark', category: 'Ambient documentation',
      placements: ['ai_admin_automation', 'care_encounter'],
      one_liner: 'Incumbent ambient documentation and clinical workflow example.' },
    { id: 'viz_ai', name: 'Viz.ai', status: 'Benchmark', category: 'AI care coordination / imaging triage',
      placements: ['ai_diagnostics', 'dest_hospital'],
      one_liner: 'AI triage and coordination around time-sensitive conditions.' },
    { id: 'oura', name: 'Oura', status: 'Benchmark', category: 'Wearables / prevention',
      placements: ['prev_devices', 'prev_assistant'],
      one_liner: 'Consumer wearable signal layer.' },
    { id: 'whoop', name: 'WHOOP', status: 'Benchmark', category: 'Wearables / coaching',
      placements: ['prev_devices', 'prev_assistant'],
      one_liner: 'Fitness and recovery wearable with AI assistant-style consumer interaction.' },
    { id: 'function_health', name: 'Function Health', status: 'Benchmark', category: 'Direct-pay lab platform',
      placements: ['prev_labs_omics', 'pay_out_of_pocket'],
      one_liner: 'Private-pay lab access and interpretation layer.' }
  ];

  // ------- Key takeaways -------------------------------------------------
  var takeaways = [
    { title: 'Follow the money first', copy: 'Healthcare AI adoption depends less on technical elegance than on who pays, who uses, and who captures the value.' },
    { title: 'Admin AI is an arms race', copy: 'Prior auth, coding, claims, and RCM are high-ROI AI surfaces, but automation on one side often triggers automation on the other.' },
    { title: 'Prevention needs a payer', copy: 'Consumer prevention can grow through private pay, but systemic prevention needs value-based care, employers, Medicare Advantage, ACOs, or CMS reimbursement.' },
    { title: 'The data layer is shared, not separate', copy: 'Care, payment, prevention, research, and admin loops all compete over the same records, claims, labs, devices, and workflow data.' },
    { title: 'AI moves both downstream and upstream', copy: 'Near-term wins are documentation and admin. The long-term shift is upstream into diagnostics, drug discovery, precision medicine, and continuous prevention.' }
  ];

  // ------- Sources list --------------------------------------------------
  var sources = [
    { label: 'CMS NHE Fact Sheet', url: SRC.nhe },
    { label: 'CMS 2024 NHE Highlights PDF', url: SRC.highlights },
    { label: 'CMS historical NHE data', url: SRC.historical },
    { label: 'CMS Medical Loss Ratio', url: SRC.mlr },
    { label: 'KFF — hospital margins', url: SRC.kff },
    { label: 'PHTI — Administrative AI', url: SRC.phti },
    { label: 'Menlo Ventures — State of AI in Healthcare', url: SRC.menlo },
    { label: 'Rock Health — 2025 digital health funding', url: SRC.rock },
    { label: 'CMS ACCESS model', url: SRC.access },
    { label: 'Utah · Doctronic partnership', url: SRC.doctronic }
  ];

  // ------- Export --------------------------------------------------------
  root.HEALTHCARE_DATA = {
    SRC: SRC,
    headlineStats: headlineStats,
    sponsors: sponsors,
    paymentChannels: paymentChannels,
    destinations: destinations,
    moneyLinks: moneyLinks,
    adminGates: adminGates,
    aiSurfaces: aiSurfaces,
    moneyCallouts: moneyCallouts,
    patientStates: patientStates,
    careLoop: careLoop,
    financialLoop: financialLoop,
    sharedStack: sharedStack,
    preventionOrbit: preventionOrbit,
    vbcBridge: vbcBridge,
    stateHighlights: stateHighlights,
    tooltips: tooltips,
    companies: companies,
    takeaways: takeaways,
    sources: sources
  };
})(typeof window !== 'undefined' ? window : this);
