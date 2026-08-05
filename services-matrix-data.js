/* ============================================================================
   services-matrix-data.js — SINGLE SOURCE for the services disruption matrix
   ----------------------------------------------------------------------------
   Consumed by BOTH index.html (report §11) and slides.html (slide 14).
   Rebuilt 2026-08-04 from the August 4 fact audit (TASK A, rows M001–M200).

   What changed and why:
   • The "$1.5T+ mapped" headline is gone. The four quadrant dollar totals summed
     to ~$2.285T against it, and Sequoia publishes no quadrant totals at all.
   • All four quadrant dollar totals are gone for the same reason.
   • Market sizes are shown ONLY where Sequoia states them. Categories that are
     the site's own additions carry no dollar figure, because none was sourced.
   • Three companies that are no longer independent private challengers were
     removed (Sana → Workday, Uizard → Miro, Navan → public) and are disclosed
     in a separate consolidation note instead.
   • Duplicate entities and duplicate categories were de-duplicated.
   • Every adoption statistic that was hard-truncated at ~90 characters (24 of 35
     here, 26 of 35 on the slide) with severed citation URLs was removed. Only a
     statistic with a verified, clickable source URL is retained.
   • Funding figures updated per Phase 2 §A6, each with an as-of date and a
     source URL on the row.
   ============================================================================ */
(function (root) {
  'use strict';

  var SEQ = 'https://sequoiacap.com/article/services-the-new-software/';

  var QUADRANTS = [
    { id: 'q1', label: 'COPILOT TERRITORY', sub: 'Outsourced \u00d7 Judgement \u2014 AI augments, humans decide', color: '#F5C542', rgb: '245,197,66', radius: '14px 4px 4px 4px', glyph: '\u25cb' },
    { id: 'q2', label: 'AUTOPILOT TERRITORY', sub: 'Outsourced \u00d7 Intelligence \u2014 ripe for full automation', color: '#4ECDC4', rgb: '78,205,196', radius: '4px 14px 4px 4px', glyph: '\u25cf' },
    { id: 'q3', label: 'WATCH', sub: 'Insourced \u00d7 Judgement \u2014 hardest to automate', color: '#E8837C', rgb: '232,131,124', radius: '4px 4px 4px 14px', glyph: '\u25cb' },
    { id: 'q4', label: 'NEXT WAVE', sub: 'Insourced \u00d7 Intelligence \u2014 automation coming fast', color: '#7C4DFF', rgb: '124,77,255', radius: '4px 4px 14px 4px', glyph: '\u25cf' }
  ];

  /* Each row:
       q          quadrant id
       label      short chip label
       cat        full category name (tooltip heading)
       tam        market size — ONLY where Sequoia states it, else null
       tamNote    provenance of the market size
       incumbents string
       contenders [{ n: name, f: funding or null, asOf, src, note }]
       dvc        [{ n: name, d: description }]
       stat       { text, src } — only where a verified URL exists
       note       row-level caveat rendered in the tooltip
  */
  var ROWS = [
    /* ─── Q1 · COPILOT TERRITORY ───────────────────────────────────────── */
    {
      q: 'q1', label: 'Management consulting', cat: 'Management Consulting',
      tam: '$300\u2013400B', tamNote: 'Sequoia (Bek, Mar 2026)',
      incumbents: 'McKinsey, BCG, Bain',
      contenders: [],
      contendersNote: 'Best candidates TBD',
      dvc: [],
      stat: {
        text: 'McKinsey disclosed a 60,000-person workforce comprising 40,000 humans and 20,000 agents at CES in January 2026; a spokesperson later put the agent count nearer 25,000, with a stated goal of parity (40,000) by end-2026. Separately, AI work accounts for roughly 40% of the firm\u2019s business via QuantumBlack (1,700 people) \u2014 a different 40% from the headcount share.',
        src: 'https://www.businessinsider.com/mckinsey-workforce-ai-agents-consulting-industry-bob-sternfels-2026-1'
      },
      note: 'Sequoia writes \u201cBest candidates TBD.\u201d for this vertical. The three companies previously listed here \u2014 Profound (AI search visibility), Eve (plaintiff-side legal AI) and Norm Ai (regulatory compliance) \u2014 do not compete with McKinsey, BCG or Bain and have been removed.'
    },
    {
      q: 'q1', label: 'Graphic / UX design', cat: 'Graphic UX Design AI',
      tam: null, tamNote: null,
      incumbents: 'Adobe, Figma, Sketch',
      contenders: [
        { n: 'Kittl', f: '~$50M', asOf: 'Jan 2024', src: 'https://www.zoominfo.com/c/oa-kittl/430911842', note: 'last priced round a $36M Series B in January 2024' }
      ],
      dvc: [{ n: 'Wabi', d: 'Generative interfaces for the AI age' }],
      stat: null,
      note: 'Uizard removed: Miro acquired it in 2024 and it now ships as \u201cUizard by Miro Labs\u201d, so it is not an independent challenger to Adobe or Figma.'
    },
    {
      q: 'q1', label: 'Executive search', cat: 'Executive Search',
      tam: null, tamNote: null,
      incumbents: 'Korn Ferry, Spencer Stuart, Russell Reynolds Associates',
      contenders: [
        { n: 'Findem', f: '$105M', asOf: 'Oct 2025', src: 'https://www.findem.ai/news/findem-series-c-funding', note: 'first-party; a $51M round in Oct 2025 took the total to $105M' },
        { n: 'Alex', f: '$20M', asOf: 'Apr 2026', src: 'https://www.alex.com/blog/we-raised-20m-to-help-ai-hire-more-humans', note: 'formerly Apriora \u2014 same company, rebranded after buying alex.com' }
      ],
      dvc: [],
      stat: null,
      note: 'Findem and Alex appear once each. Alex was previously double-counted on the Recruitment row under its old name, Apriora.'
    },

    /* ─── Q2 · AUTOPILOT TERRITORY ─────────────────────────────────────── */
    {
      q: 'q2', label: 'Insurance brokerage', cat: 'Insurance brokerage',
      tam: '$140\u2013200B', tamNote: 'Sequoia (Bek, Mar 2026)',
      incumbents: 'Marsh McLennan, Aon, Arthur J. Gallagher',
      contenders: [
        { n: 'Corgi', f: '~$378M+', asOf: 'Jul 2026', src: 'https://www.forbes.com/sites/annatong/2026/07/22/ai-startup-corgi-of-seven-day-work-week-fame-raises-yet-again-at-4-billion-valuation/', note: 'repriced $630M \u2192 $1.3B \u2192 $2.6B \u2192 $4B in six months' },
        { n: 'Harper', f: '$47M', asOf: 'Feb 2026', src: 'https://www.harperinsure.com/news/series-a-announcement', note: 'company\u2019s own figure for combined seed + Series A' },
        { n: 'WithCoverage', f: '$42M+', asOf: 'Jan 2026', src: 'https://www.axios.com/pro/fintech-deals/2026/01/13/withcoverage-flat-fee-insurance', note: '$42M Series B' }
      ],
      dvc: [],
      stat: null,
      note: 'Best-sourced row in the exhibit: WithCoverage and Harper are the two companies Sequoia itself names here.'
    },
    {
      q: 'q2', label: 'IT managed services', cat: 'IT Managed Services',
      tam: '$100B+', tamNote: 'Sequoia (Bek, Mar 2026)',
      incumbents: 'IBM, Accenture, Cognizant',
      contenders: [
        { n: 'Titan', f: '$74M', asOf: 'Aug 2025', src: 'https://www.crn.com/news/channel-news/2025/titan-scores-74m-funding-to-build-ai-platform-and-acquire-msps-to-use-it', note: 'an MSP roll-up holding company rather than a software startup' },
        { n: 'Treeline', f: '$25M', asOf: 'Mar 2026', src: 'https://www.prnewswire.com/news-releases/treeline-raises-25-million-to-reinvent-it-services-302729004.html', note: '$25M Series A led by a16z' },
        { n: 'SuperOps.ai', f: '$54M', asOf: 'Jan 2025', src: 'https://superops.com/llm-info', note: 'first-party; $54.4M total' }
      ],
      dvc: [{ n: 'Avoca', d: 'AI communications platform for SMBs' }],
      stat: null, note: null
    },
    {
      q: 'q2', label: 'Payroll & compliance', cat: 'Payroll and Compliance',
      tam: null, tamNote: null,
      incumbents: 'ADP, Paychex, Paycom',
      contenders: [
        { n: 'Warp', f: '$85M', asOf: 'Jun 2026', src: 'https://www.warp.co/b', note: 'first-party; a $60M Series B led by Battery took the total to $85M' }
      ],
      dvc: [{ n: 'RemoFirst', d: 'Global employment and payroll' }],
      stat: null,
      note: 'Comp removed: it has raised a ~$2.6M pre-seed, roughly $3M in total, and no source supports the $17M previously shown.'
    },
    {
      q: 'q2', label: 'Claims adjusting', cat: 'Claims Adjusting AI',
      tam: '$50\u201380B', tamNote: 'Sequoia (Bek, Mar 2026) \u2014 including TPAs',
      incumbents: 'Sedgwick, Crawford, Gallagher Bassett',
      contenders: [
        { n: 'Reserv', f: '~$180\u2013200M', asOf: 'May 2026', src: 'https://www.linkedin.com/posts/reserv-ai_reserv-announces-125-million-series-c-financing-activity-7457022759039033344-htDe', note: '$125M Series C led by KKR; company reports $100M ARR' },
        { n: 'Liberate', f: '$72M', asOf: 'Oct 2025', src: 'https://iireporter.com/liberate-raises-50-million-to-expand-insurance-focused-ai-agents/', note: '$50M Series B at a $300M post-money' },
        { n: 'ClaimSorted', f: '$16.3M', asOf: 'Oct 2025', src: 'https://fintech.global/2025/10/13/insurtech-claimsorted-secures-13-3m-seed-round/', note: '$13.3M seed plus ~$3M pre-seed' }
      ],
      dvc: [{ n: 'Red Sky Health', d: 'AI claims and benefits operations' }, { n: 'Eloquent AI', d: 'Agentic workflows for regulated financial services' }],
      stat: null, note: null
    },
    {
      q: 'q2', label: 'Accounting & audit', cat: 'Accounting and audit',
      tam: '$50\u201380B', tamNote: 'Sequoia (Bek, Mar 2026) \u2014 outsourced in the US alone',
      incumbents: 'Deloitte, PwC, EY, KPMG',
      contenders: [
        { n: 'Basis', f: '$138M', asOf: 'Feb 2026', src: 'https://www.reuters.com/business/ai-accounting-startup-basis-raises-100-million-115-billion-valuation-2026-02-24/', note: 'total after a $100M Series B at a $1.15B valuation \u2014 a unicorn' },
        { n: 'Fieldguide', f: '$125M', asOf: 'Feb 2026', src: 'https://www.fieldguide.io/blog/series-c-announcement', note: 'first-party; $75M Series C at $700M' },
        { n: 'Zeni.ai', f: '$47.5M', asOf: 'Aug 2021', src: 'https://www.caplight.com/company/zeni', note: 'last substantive round was a $34M Series B in August 2021' }
      ],
      dvc: [{ n: 'Kick', d: 'Self-driving bookkeeping' }, { n: 'JustPaid.io', d: 'AI billing and collections' }],
      stat: null,
      note: 'Sequoia\u2019s figure is explicitly outsourced-only US spend; it is not comparable with global all-in market sizes.'
    },
    {
      q: 'q2', label: 'Healthcare rev cycle', cat: 'Healthcare Revenue Cycle Management',
      tam: '$50\u201380B', tamNote: 'Sequoia (Bek, Mar 2026) \u2014 outsourced in the US',
      incumbents: 'R1 RCM, Optum, Ensemble',
      contenders: [
        { n: 'AKASA', f: '$205M', asOf: '2024', src: 'https://www.cbinsights.com/company/alpha-health', note: 'last round mid-2024; the company itself told Business Insider $250M in Nov 2025' },
        { n: 'CodaMetrix', f: '~$109M', asOf: 'May 2025', src: 'https://pitchbook.com/profiles/company/434177-29', note: 'PitchBook and Forge; the company\u2019s own site says $95M' },
        { n: 'SmarterDx', f: '$71M', asOf: 'May 2024', src: 'https://www.cooley.com/news/coverage/2024/2024-05-14-smarterdx-raises-50-million-series-b', note: 'rests on a May 2024 Series B' }
      ],
      dvc: [{ n: 'Collectly', d: 'Patient billing and payments' }, { n: 'Qualified Health', d: 'Governed generative AI for health systems' }],
      stat: null,
      note: 'All three contenders last priced in 2024\u201325, which weakens this row as evidence of live 2026 momentum. Sequoia\u2019s figure is outsourced-only US spend.'
    },
    {
      q: 'q2', label: 'Mortgage origination', cat: 'Mortgage Origination',
      tam: null, tamNote: null,
      incumbents: 'UWM, Rocket, Pennymac',
      contenders: [
        { n: 'Tomo', f: '$130M', asOf: 'Mar 2025', src: 'https://www.prnewswire.com/news-releases/ai-powered-tomo-mortgage-raises-20m-with-backing-from-progressive-insurance-302397582.html', note: '$20M Series B took the total to $130M' },
        { n: 'Tidalwave', f: '$24M', asOf: 'Nov 2025', src: 'https://www.tidalwave.ai/blog/series-a-announcement', note: 'first-party; $22M Series A' }
      ],
      dvc: [], stat: null, note: null
    },
    {
      q: 'q2', label: 'KYC / AML', cat: 'KYC/AML Compliance',
      tam: null, tamNote: null,
      incumbents: 'LexisNexis, NICE Actimize, Oracle',
      contenders: [
        { n: 'Vulcan Technologies', f: '$10.9M', asOf: 'Oct 2025', src: 'https://www.prnewswire.com/news-releases/vulcan-technologies-raises-10-9m-seed-round-to-modernize-regulatory-law-with-ai-302579056.html', note: 'sells regulatory drafting to government agencies rather than KYC/AML to banks' },
        { n: 'Sinpex', f: '~$11.6M', asOf: 'Jan 2026', src: 'https://fintech.global/2026/01/19/sinpex-secures-e10m-to-expand-ai-kyb-compliance-platform/', note: '\u20ac10M Series A; the $16M previously shown rests only on a weak aggregator' }
      ],
      dvc: [{ n: 'Eloquent AI', d: 'Agentic workflows for regulated financial services' }],
      stat: null, note: null
    },
    {
      q: 'q2', label: 'Paralegal / LPO', cat: 'Paralegal Legal Process Outsourcing',
      tam: null, tamNote: null,
      incumbents: 'UnitedLex, Integreon, QuisLex',
      contenders: [
        { n: 'Supio', f: '$91M', asOf: 'Apr 2025', src: 'https://www.supio.com/blog/supio-raises-60m-series-b-to-accelerate-growth-and-legal-ai-innovation', note: 'first-party; $60M Series B took the total to $91M' }
      ],
      dvc: [{ n: 'Docdraft', d: 'AI legal drafting' }, { n: 'Docsum', d: 'Contract review and summarisation' }],
      stat: null,
      note: 'This category previously appeared three times, in three quadrants, at three different market sizes ($20B+, $36B, $200B+). It now appears once, with no market size: Sequoia has no paralegal or LPO vertical, so none of the three figures traced to the cited framework.'
    },
    {
      q: 'q2', label: 'Tax advisory', cat: 'Tax advisory',
      tam: '$30\u201335B', tamNote: 'Sequoia (Bek, Mar 2026)',
      incumbents: 'Intuit, H&R Block, Jackson Hewitt',
      contenders: [
        { n: 'Accrual', f: '$75M', asOf: 'Feb 2026', src: 'https://www.bloomberg.com/news/articles/2026-02-05/general-catalyst-backed-startup-raises-75-million-to-bring-ai-to-accounting', note: 'launch funding led by General Catalyst' },
        { n: 'April', f: '$38M+', asOf: 'Jul 2025', src: 'https://www.getapril.com/resources/Blog/april-has-raised-a-38-million-series-b-round-led-by-qed-2fWaPRTsDoSn94tV89XeJR', note: '$38M Series B disclosed by the company; shown as a floor rather than an inferred total' },
        { n: 'Accordance', f: '$13M', asOf: 'Sep 2025', src: 'https://accordance.com/press/accordance-raises-13m-from-khosla-ventures-and-general-catalyst', note: 'first-party; $10M seed plus $3M pre-seed' }
      ],
      dvc: [{ n: 'Kick', d: 'Self-driving bookkeeping' }],
      stat: null, note: null
    },
    {
      q: 'q2', label: 'Legal transactional', cat: 'Legal transactional',
      tam: '$20\u201325B', tamNote: 'Sequoia (Bek, Mar 2026)',
      incumbents: 'DocuSign, iManage, Litera',
      contenders: [
        { n: 'SpotDraft', f: '$92M', asOf: 'Jan 2026', src: 'https://finance.yahoo.com/news/qualcomm-backs-spotdraft-scale-device-013000916.html', note: '$8M Series B extension took disclosed funding to $92M at roughly $380M' },
        { n: 'Ivo', f: '$77M', asOf: 'Jan 2026', src: 'https://www.globenewswire.com/news-release/2026/01/20/3221758/0/en/ivo-raises-55m-to-transform-contracts-into-a-trusted-source-of-intelligence-for-every-business.html', note: '$55M Series B' },
        { n: 'Spellbook', f: '~$84.8M equity', asOf: 'Mar 2026', src: 'https://sacra.com/c/spellbook/', note: 'equity basis; total capital exceeds $120M once a $40M RBCx debt facility is counted' }
      ],
      dvc: [{ n: 'Docdraft', d: 'AI legal drafting' }, { n: 'Docsum', d: 'Contract review and summarisation' }],
      stat: null,
      note: 'Spellbook is shown on an equity basis so it is comparable with every other cell; the debt facility is stated separately rather than blended in.'
    },
    {
      q: 'q2', label: 'Real estate closing', cat: 'Real estate closing',
      tam: null, tamNote: null,
      incumbents: 'First American, Fidelity National, Old Republic',
      contenders: [
        { n: 'Dono', f: '$10.2M', asOf: 'Feb 2026', src: 'https://siliconangle.com/2026/02/10/dono-raises-6-5m-seed-round-modernize-property-records-ai/', note: '$6.5M seed took the total to $10.2M' }
      ],
      dvc: [{ n: 'Dwelly', d: 'AI-native lettings and property management' }],
      stat: null,
      note: 'A single seed-stage company is thin evidence for a category-wide attack surface, which is why no market size is asserted.'
    },
    {
      q: 'q2', label: 'Cost estimation', cat: 'Construction Cost Estimation',
      tam: null, tamNote: null,
      incumbents: 'Procore, Sage, STACK',
      contenders: [
        { n: 'XBuild', f: '$19M', asOf: 'Jan 2026', src: 'https://www.prnewswire.com/news-releases/xbuild-raises-19m-series-a-launches-ai-powered-residential-roofing-estimate-product-302664721.html', note: '$19M Series A led by N47 with a16z' }
      ],
      dvc: [{ n: 'PermitFlow', d: 'Construction permitting automation' }],
      stat: null, note: null
    },

    /* ─── Q3 · WATCH ───────────────────────────────────────────────────── */
    {
      q: 'q3', label: 'Recruitment', cat: 'Recruitment AI',
      tam: '$200B+', tamNote: 'Sequoia (Bek, Mar 2026) \u2014 recruitment and staffing',
      incumbents: 'iCIMS, Workday, Oracle',
      contenders: [
        { n: 'Mercor', f: '~$483M', asOf: 'Jul 2026', src: 'https://techcrunch.com/2026/07/09/mercor-is-in-talks-for-a-20b-valuation/', note: 'named here by Sequoia, but Mercor pivoted from AI recruiting to AI training data in mid-2025; in talks at a $20B valuation, up from $10B' }
      ],
      dvc: [{ n: 'Agentnoon', d: 'Org design and workforce planning' }, { n: 'Humand', d: 'AI people operations' }],
      stat: null,
      note: 'Findem and Apriora removed from this row: Findem is shown once under Executive Search, and Apriora is the same company as Alex, also shown under Executive Search.'
    },
    {
      q: 'q3', label: 'Advertising', cat: 'Advertising AI',
      tam: null, tamNote: null,
      incumbents: 'Google, Meta, Amazon',
      contenders: [
        { n: 'Agentio', f: '$56M', asOf: 'Nov 2025', src: 'https://www.agentio.com/blog/agentio-series-b', note: 'first-party; $40M Series B at $340M' },
        { n: 'Fluency', f: '$40M', asOf: 'Dec 2025', src: 'https://www.adexchanger.com/platforms/fluency-raises-40-million-to-fuel-ai-for-digital-ad-campaign-automation/', note: '$40M Series A' },
        { n: 'AdsGency', f: '$12M+', asOf: 'Oct 2025', src: 'https://vcnewsdaily.com/adsgency/venture-capital-funding/sdrrvqddbz', note: '$12M seed round; shown as a floor because an exact cumulative total is not consistently disclosed' }
      ],
      dvc: [{ n: 'Unreal Labs', d: 'AI performance marketing' }, { n: 'Realytics', d: 'AI market intelligence' }],
      stat: null, note: null
    },
    {
      q: 'q3', label: 'Freight brokerage', cat: 'Freight brokerage',
      tam: null, tamNote: null,
      incumbents: 'C.H. Robinson, TQL, WWEX',
      contenders: [
        { n: 'Augment', f: '$110M', asOf: 'Sep 2025', src: 'https://www.goaugment.com/blog/augment-85m-series-a', note: 'first-party; $85M Series A' },
        { n: 'HappyRobot', f: '~$200M', asOf: 'Aug 4 2026', src: 'https://theaiinsider.tech/2026/08/04/happyrobot-raises-150m-in-series-c-funding-to-expand-ai-agent-platform-for-logistics-supply-chains/', note: '$150M Series C at a $1.2B valuation, announced Aug 4 2026' },
        { n: 'FleetWorks', f: '$17.5M', asOf: 'Oct 2025', src: 'https://techcrunch.com/2025/10/14/fleetworks-raises-17m-to-match-truckers-with-cargo-faster/', note: '$17M including a $15M Series A led by First Round' }
      ],
      dvc: [{ n: 'FleetWorks', d: 'AI dispatch for freight' }, { n: 'Fura', d: 'AI freight operations' }],
      stat: null,
      note: 'FleetWorks appears as both contender and DVC pairing \u2014 disclosed rather than hidden. CB Insights independently lists Davidovs Venture Collective as an investor.'
    },
    {
      q: 'q3', label: 'Admin assistants', cat: 'Admin Assistants',
      tam: null, tamNote: null,
      incumbents: 'BELAY, Prialto, Zirtual',
      contenders: [
        { n: 'Motion', f: '$60M+', asOf: 'Sep 2025', src: 'https://www.signalfire.com/blog/motion-investor', note: '$60M across Series B/C/C2 at a $550M valuation; shown as a floor rather than an inferred total' },
        { n: 'Winn.ai', f: '$35M', asOf: 'Feb 2026', src: 'https://www.insightpartners.com/ideas/winn-ai-raises-18-million-series-a-to-close-the-gap-between-sales-strategy-and-real-time-execution/', note: 'a sales-call tool rather than an admin assistant \u2014 loose category fit' },
        { n: 'Sybill', f: '$14.5M', asOf: 'Jul 2024', src: 'https://techcrunch.com/2024/07/31/sybill-raises-11m-for-its-ai-assistant-that-helps-salespeople-reduce-administrative-burden/', note: 'also a sales-call tool; last round July 2024' }
      ],
      dvc: [{ n: 'Avoca', d: 'AI communications platform for SMBs' }, { n: 'Howie AI', d: 'AI scheduling assistant' }, { n: 'Humand', d: 'AI people operations' }],
      stat: null, note: null
    },
    {
      q: 'q3', label: 'Clinical trials / CRO', cat: 'Clinical trials CRO',
      tam: null, tamNote: null,
      incumbents: 'IQVIA, ICON, Parexel',
      contenders: [
        { n: 'PhaseV', f: '$65M', asOf: 'May 2025', src: 'https://www.insightpartners.com/ideas/phasev-lands-50m-series-a-to-supercharge-ai-for-clinical-development-backed-by-top-vcs-and-trusted-by-leading-pharma-clients/', note: '$50M Series A co-led by Accel and Insight' },
        { n: 'Rivia', f: '~$18M', asOf: 'Mar 2026', src: 'https://www.startupticker.ch/en/news/rivia-raises-15m-series-a-to-bring-clinical-trials-into-the-agentic-ai-era', note: '$15M Series A led by Earlybird plus a \u20ac3M seed' }
      ],
      dvc: [{ n: 'Bioptic', d: 'AI drug discovery' }, { n: 'Kerna Laboratories', d: 'AI lab automation' }],
      stat: null, note: null
    },
    {
      q: 'q3', label: 'SEO / SEM', cat: 'SEO/SEM',
      tam: null, tamNote: null,
      incumbents: 'SEMrush, Ahrefs, Moz',
      contenders: [
        { n: 'Profound', f: '$155M', asOf: 'Feb 2026', src: 'https://fortune.com/2026/02/24/exclusive-as-ai-threatens-search-profound-raises-96-million-to-help-brands-stay-visible/', note: '$96M Series C at a $1B valuation \u2014 now a unicorn' },
        { n: 'Peec AI', f: '~$29M', asOf: 'Nov 2025', src: 'https://sifted.eu/articles/peec-ai-raises-21m-series-a', note: '$21M Series A; Caplight records a further ~$10M at a $200M pre-money in June 2026' }
      ],
      dvc: [{ n: 'tely.ai', d: 'B2B content marketing agent' }],
      stat: null,
      note: 'Profound appears here only. It was previously also listed as a management-consulting challenger, which it is not.'
    },
    {
      q: 'q3', label: 'ERP implementation', cat: 'ERP Implementation',
      tam: null, tamNote: null,
      incumbents: 'SAP, Oracle, MS Dynamics',
      contenders: [
        { n: 'DualEntry', f: '>$100M', asOf: 'Oct 2025', src: 'https://www.dualentry.com/funding-announcement', note: 'first-party; $90M Series A at a $415M valuation' },
        { n: 'Rillet', f: '>$100M', asOf: 'Aug 2025', src: 'https://finance.yahoo.com/news/rillet-raises-70m-andreessen-horowitz-170527896.html', note: '$70M Series B co-led by a16z and ICONIQ at ~$500M' },
        { n: 'DOSS', f: '$73M', asOf: 'Mar 2026', src: 'https://siliconangle.com/2026/03/24/doss-raises-55m-expand-ai-powered-operations-platform-erp-integrated-workflows/', note: '$55M Series B at a $250M post-money' }
      ],
      dvc: [{ n: 'Wrkdn', d: 'AI operations workforce' }],
      stat: null, note: null
    },
    {
      q: 'q3', label: 'Corporate training', cat: 'Corporate training',
      tam: null, tamNote: null,
      incumbents: 'LinkedIn Learning, Cornerstone, SAP Litmos',
      contenders: [
        { n: 'CoachHub', f: '~$373.65M', asOf: 'Dec 2024', src: 'https://www.cbinsights.com/company/coachhub', note: 'includes a ~$42M debt round; no equity round since June 2022' },
        { n: '360Learning', f: '$240M+', asOf: '2025', src: 'https://www.cbinsights.com/company/360learning/financials', note: '~$240\u2013242.6M cumulative' }
      ],
      dvc: [],
      stat: null,
      note: 'Sana removed: Workday completed its ~$1.1B acquisition on Nov 4 2025 and relaunched it inside Workday in March 2026, so it is an incumbent product rather than a challenger.'
    },
    {
      q: 'q3', label: 'Market research', cat: 'Market Research',
      tam: null, tamNote: null,
      incumbents: 'NielsenIQ, Kantar, Ipsos',
      contenders: [
        { n: 'Listen Labs', f: '$100M', asOf: 'Jan 2026', src: 'https://pear.vc/listen-labs-series-b/', note: '$69M Series B took the total to $100M' },
        { n: 'Remesh', f: '~$54\u201355M', asOf: 'Dec 2022', src: 'https://www.cbinsights.com/company/remesh', note: 'the $10M+ previously shown was the 2018 Series A; last round December 2022' }
      ],
      dvc: [{ n: 'Motives', d: 'AI consumer insight' }, { n: 'Realytics', d: 'AI market intelligence' }],
      stat: null,
      note: 'UserCue removed: it was listed with a revenue figure in a funding column, which breaks the comparison the column is making.'
    },
    {
      q: 'q3', label: 'Cybersecurity', cat: 'Cybersecurity AI',
      tam: null, tamNote: null,
      incumbents: 'Palo Alto, CrowdStrike, Fortinet',
      contenders: [
        { n: 'Cyera', f: '>$2.3B', asOf: 'Jun 2026', src: 'https://www.cyera.com/press-releases/cyera-raises-600-million-at-12-billion-valuation-to-continue-building-the-trust-layer-for-the-ai-era', note: 'first-party; $600M Series G at a $12B valuation' },
        { n: '7AI', f: '$166M', asOf: 'Dec 2025', src: 'https://www.wsj.com/articles/cybersecurity-startup-7ai-raises-130-million-in-series-a-funding-efb18f14', note: '$130M Series A at $700M' },
        { n: 'Torq', f: '$332M', asOf: 'Jan 2026', src: 'https://torq.io/news/torq-seriesd/', note: 'first-party; $140M Series D at $1.2B' }
      ],
      dvc: [{ n: 'LightBeam.ai', d: 'Data privacy and governance' }],
      stat: null, note: null
    },
    {
      q: 'q3', label: 'Architecture', cat: 'Architecture AI',
      tam: null, tamNote: null,
      incumbents: 'Autodesk, Nemetschek, Trimble',
      contenders: [
        { n: 'Augmenta', f: '~$25.6M', asOf: 'Mar 2025', src: 'https://www.cretech.com/news/augmenta-secures-10m-to-drive-ai-powered-building-design-innovation/', note: 'last round a $10M seed' },
        { n: 'TestFit', f: '$22M', asOf: 'Jul 2022', src: 'https://pitchbook.com/profiles/company/399170-71', note: 'last round a $20M Series A in July 2022' },
        { n: 'Snaptrude', f: '~$21M', asOf: 'Nov 2023', src: 'https://www.snaptrude.com/blog/snaptrude-raises-14m-series-a-from-existing-investors-foundamental-and-accel-and-launches-sketch-to-bim-workflows', note: 'first-party; $14M Series A' }
      ],
      dvc: [{ n: 'PermitFlow', d: 'Construction permitting automation' }],
      stat: null,
      note: 'The newest datapoint on this row is 17 months old and the oldest is four years old. Shown with dates rather than implied as current momentum.'
    },
    {
      q: 'q3', label: 'Patent / IP', cat: 'Patent & IP Management',
      tam: null, tamNote: null,
      incumbents: 'Clarivate, Questel, Anaqua',
      contenders: [
        { n: 'Solve Intelligence', f: '$55M', asOf: 'Dec 2025', src: 'https://www.solveintelligence.com/blog/post/solve-intelligence-raises-40m-series-b-to-build-ai-for-patents-and-launches-charts', note: 'first-party; $40M Series B' },
        { n: 'DeepIP', f: '$40M', asOf: 'Mar 2026', src: 'https://www.deepip.ai/blog/deepip-40m-funding-ai-patent-platform', note: 'first-party; $25M Series B' },
        { n: 'Ankar', f: '$24M', asOf: 'Dec 2025', src: 'https://www.indexventures.com/perspectives/ankar-raises-20m-series-a-to-accelerate-and-protect-innovation/', note: '$20M Series A led by Atomico' }
      ],
      dvc: [{ n: 'Solve Intelligence', d: 'AI for patent drafting and prosecution' }],
      stat: null,
      note: 'Disclosure: Solve Intelligence appears as both the AI contender and the DVC pairing on this row.'
    },
    {
      q: 'q3', label: 'Travel mgmt', cat: 'Travel management AI',
      tam: null, tamNote: null,
      incumbents: 'Amex GBT, BCD, CWT',
      contenders: [
        { n: 'Spotnana', f: 'over $115M', asOf: 'Mar 2026', src: 'https://www.spotnana.com/llm-info/', note: 'the company\u2019s own figure; PitchBook shows $116M. The $200M+ previously shown is supported only by one secondary marketplace.' },
        { n: 'ITILITE', f: '~$46M', asOf: 'Apr 2022', src: 'https://www.cbinsights.com/company/itilite', note: 'last round a $29M Series C in April 2022' }
      ],
      dvc: [],
      stat: null,
      note: 'Navan removed: it listed on Nasdaq in October 2025 (ticker NAVN), so it is a public company rather than a private challenger, and the $660M+ previously shown matched neither its private total nor its IPO proceeds.'
    },

    /* ─── Q4 · NEXT WAVE ──────────────────────────────────────────────── */
    {
      q: 'q4', label: 'Supply chain & procurement', cat: 'Supply chain and procurement',
      tam: '$200B+', tamNote: 'Sequoia (Bek, Mar 2026)',
      incumbents: 'Accenture, GEP, Genpact',
      contenders: [
        { n: 'Magentic', f: null, asOf: 'Mar 2026', src: SEQ, note: 'named by Sequoia in this vertical; no funding figure is asserted because none was verified' },
        { n: 'AskLio', f: null, asOf: 'Mar 2026', src: SEQ, note: 'named by Sequoia in this vertical' },
        { n: 'Tacto', f: null, asOf: 'Mar 2026', src: SEQ, note: 'named by Sequoia in this vertical' }
      ],
      dvc: [{ n: 'Sibvi', d: 'AI supply-chain forecasting' }, { n: 'Zinit', d: 'AI procurement operations' }],
      stat: null,
      note: 'One of the two largest verticals on Sequoia\u2019s list. It was previously present as a label only, with a Paralegal LPO tooltip attached to it.'
    },
    {
      q: 'q4', label: 'Pharmacy back-office', cat: 'Pharmacy back-office',
      tam: null, tamNote: null,
      incumbents: 'McKesson, Oracle Cerner, QS-1',
      contenders: [
        { n: 'Plenful', f: '$76M', asOf: 'Apr 2025', src: 'https://www.prnewswire.com/news-releases/plenful-raises-50m-series-b-to-expand-ai-powered-healthcare-automation-platform-302442027.html', note: '$50M Series B' },
        { n: 'Clarium', f: '$43M', asOf: 'May 2025', src: 'https://www.prnewswire.com/news-releases/clarium-raises-27m-series-a-to-scale-ai-powered-supply-chain-resiliency-technology-to-leading-health-systems-302450625.html', note: '$27M Series A' }
      ],
      dvc: [],
      stat: null,
      note: 'Tandem removed: the company is reported to have renamed itself and raised again, but the best available source is a funding newsletter, so neither the new name nor a new figure is printed.'
    },
    {
      q: 'q4', label: 'Wealth mgmt ops', cat: 'Wealth management operations',
      tam: null, tamNote: null,
      incumbents: 'Envestnet, Orion, Black Diamond',
      contenders: [
        { n: 'Savvy Wealth', f: '>$100M', asOf: 'Jul 2025', src: 'https://www.savvywealth.com/series-b-page', note: '$72M Series B took disclosed total funding above $100M' },
        { n: 'Nevis', f: '$40M', asOf: 'Dec 2025', src: 'https://www.neviswealth.com/news/nevis-raised-40m/', note: 'first-party; $35M Series A led by Sequoia at a $200M valuation' }
      ],
      dvc: [{ n: 'Generative Alpha', d: 'AI investment research' }],
      stat: null, note: null
    },
    {
      q: 'q4', label: 'Medical admin', cat: 'Medical Administration',
      tam: null, tamNote: null,
      incumbents: 'Epic, Oracle Cerner, athenahealth',
      contenders: [
        { n: 'Janus Health', f: '$63M', asOf: 'Oct 2024', src: 'https://www.cbinsights.com/company/janus-health', note: 'CB Insights; PitchBook shows $74.2M and Tracxn $56M' },
        { n: 'Fathom', f: '~$61M', asOf: 'Nov 2022', src: 'https://www.cbinsights.com/company/fathom-4', note: 'last priced round a $46M Series B in November 2022' }
      ],
      dvc: [{ n: 'Doctronic', d: 'AI primary care' }, { n: 'Hona AI', d: 'Patient communication' }, { n: 'Denti.ai', d: 'Dental AI diagnostics' }],
      stat: null,
      note: 'SmarterDx removed here: it is shown once, on the Healthcare Revenue Cycle Management row.'
    },
    {
      q: 'q4', label: 'Fund administration', cat: 'Fund administration',
      tam: null, tamNote: null,
      incumbents: 'SS&C, State Street, BNY Mellon',
      contenders: [
        { n: 'Hanover Park', f: '$27M', asOf: 'Mar 2026', src: 'https://finance.yahoo.com/news/hanover-park-raises-27m-series-203700091.html', note: '$27M Series A led by Emergence Capital' }
      ],
      dvc: [{ n: 'Keye', d: 'AI diligence for private equity' }],
      stat: null, note: null
    }
  ];

  var CONSOLIDATION = [
    { n: 'Sana', to: 'Workday', detail: 'acquisition completed Nov 4 2025 (~$1.1B); relaunched inside Workday in March 2026', src: 'https://newsroom.workday.com/2025-11-04-Workday-Completes-Acquisition-of-Sana' },
    { n: 'Uizard', to: 'Miro', detail: 'acquired 2024; now ships as \u201cUizard by Miro Labs\u201d', src: 'https://pitchbook.com/profiles/company/181491-67' },
    { n: 'Navan', to: 'the public market', detail: 'IPO\u2019d on Nasdaq in October 2025 at $25/share, raising $923M (ticker NAVN)', src: 'https://www.reuters.com/business/travel-tech-firm-navan-makes-us-ipo-filing-public-2025-09-19/' }
  ];

  /* ── rendering ───────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  /* Tooltips are delivered through a data-tip ATTRIBUTE whose value is HTML.
     Inner markup therefore uses single quotes and the attribute value is
     double-escaped exactly once, which is what the shared popup expects. */
  function attr(html) { return html.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

  function tipFor(r) {
    var h = '<strong>' + esc(r.cat) + '</strong>';
    if (r.tam) h += "<br><span style='color:#F5C542;font-size:0.78rem'>" + esc(r.tam) + "</span> <span style='color:#6B7280;font-size:0.68rem'>" + esc(r.tamNote) + '</span>';
    else h += "<br><span style='color:#6B7280;font-size:0.68rem'>No market size shown \u2014 this category is not in the Sequoia list and no sourced figure was found.</span>";
    h += "<br><span style='color:#E8837C;font-size:0.75rem'>Incumbents:</span> <span style='color:#A0A8BC;font-size:0.78rem'>" + esc(r.incumbents) + '</span>';
    if (r.contenders && r.contenders.length) {
      h += "<br><span style='color:#4ECDC4;font-size:0.75rem;margin-top:4px;display:inline-block'>AI contenders:</span>";
      r.contenders.forEach(function (c) {
        h += "<br><span style='color:#E8E9ED;font-size:0.78rem'>&bull; " + esc(c.n);
        if (c.f) h += " <span style='color:#F5C542'>" + esc(c.f) + '</span>';
        if (c.asOf) h += " <span style='color:#6B7280;font-size:0.68rem'>(as of " + esc(c.asOf) + ')</span>';
        h += '</span>';
        if (c.note) h += "<span style='color:#6B7280;font-size:0.7rem;display:block'>" + esc(c.note) + '</span>';
      });
    } else if (r.contendersNote) {
      h += "<br><span style='color:#4ECDC4;font-size:0.75rem;margin-top:4px;display:inline-block'>AI contenders:</span> <span style='color:#E8E9ED;font-size:0.78rem'>" + esc(r.contendersNote) + '</span>';
    }
    if (r.dvc && r.dvc.length) {
      h += "<br><span style='color:#7C4DFF;font-size:0.75rem;margin-top:4px;display:inline-block'>DVC portfolio:</span>";
      r.dvc.forEach(function (d) {
        h += "<br><span style='color:#E8E9ED;font-size:0.78rem'>&bull; " + esc(d.n) + ' \u00b7 ' + esc(d.d) + '</span>';
      });
    }
    if (r.stat && r.stat.text) {
      h += "<br><span style='color:#F5C542;font-size:0.72rem;margin-top:6px;display:inline-block'>" + esc(r.stat.text) + '</span>';
      if (r.stat.src) h += "<br><a href='" + esc(r.stat.src) + "' target='_blank' rel='noopener' style='color:#4ECDC4;font-size:0.7rem'>Source</a>";
    }
    if (r.note) h += "<br><span style='color:#8A93A6;font-size:0.7rem;margin-top:6px;display:inline-block;font-style:italic'>" + esc(r.note) + '</span>';
    return h;
  }

  function chip(r, q) {
    var base = 'display:inline-flex;align-items:center;gap:0.3rem;padding:0.3rem 0.6rem;background:rgba(' + q.rgb + ',0.06);border:1px solid rgba(' + q.rgb + ',0.12);border-radius:6px;font-size:0.72rem;color:#C8CCD4;cursor:pointer;transition:all 0.2s ease';
    var s = '<span class="seq-entry" data-tip="' + attr(tipFor(r)) + '" style="' + base + '"'
      + ' onmouseover="this.style.borderColor=\'rgba(' + q.rgb + ',0.4)\';this.style.background=\'rgba(' + q.rgb + ',0.12)\'"'
      + ' onmouseout="this.style.borderColor=\'rgba(' + q.rgb + ',0.12)\';this.style.background=\'rgba(' + q.rgb + ',0.06)\'">'
      + '<span style="color:' + q.color + ';font-size:0.65rem">' + q.glyph + '</span>' + esc(r.label);
    if (r.tam) s += ' <span class="tabnum" style="color:#6B7280;font-size:0.65rem">' + esc(r.tam) + '</span>';
    s += '</span>';
    return s;
  }

  function quadrantHtml(q) {
    var rows = ROWS.filter(function (r) { return r.q === q.id; });
    var h = '<div style="background:rgba(' + q.rgb + ',0.04);border:1px solid rgba(' + q.rgb + ',0.15);border-radius:' + q.radius + ';padding:1rem 1.25rem;min-height:180px">'
      + '<div style="margin-bottom:0.5rem"><span style="color:' + q.color + ';font-size:0.72rem;font-weight:800;letter-spacing:0.1em">' + q.label + '</span></div>'
      + '<p style="color:#6B7280;font-size:0.7rem;margin:0 0 0.75rem;font-style:italic">' + q.sub + '</p>'
      + '<div style="display:flex;flex-wrap:wrap;gap:0.35rem">';
    rows.forEach(function (r) { h += chip(r, q); });
    return h + '</div></div>';
  }

  function gridHtml() {
    var h = '<div style="position:relative;margin:0 auto;max-width:1100px">'
      + '<div style="text-align:center;margin-bottom:0.5rem"><span style="color:#6B7280;font-size:0.7rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase">OUTSOURCED</span></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;position:relative">'
      + '<div style="position:absolute;left:-2.5rem;top:50%;transform:translateY(-50%) rotate(-90deg);white-space:nowrap"><span style="color:#6B7280;font-size:0.7rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase">JUDGEMENT</span></div>'
      + '<div style="position:absolute;right:-2.8rem;top:50%;transform:translateY(-50%) rotate(90deg);white-space:nowrap"><span style="color:#6B7280;font-size:0.7rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase">INTELLIGENCE</span></div>';
    QUADRANTS.forEach(function (q) { h += quadrantHtml(q); });
    h += '</div><div style="text-align:center;margin-top:0.5rem"><span style="color:#6B7280;font-size:0.7rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase">INSOURCED</span></div></div>';
    return h;
  }

  function consolidationHtml() {
    var items = CONSOLIDATION.map(function (c) {
      return '<a href="' + esc(c.src) + '" target="_blank" rel="noopener" style="color:#C8CCD4;text-decoration:none;border-bottom:1px dotted rgba(200,204,212,0.35)">' + esc(c.n) + '</a> \u2192 ' + esc(c.to);
    }).join(' &middot; ');
    return '<p style="color:#8A93A6;font-size:0.72rem;line-height:1.5;margin:0.75rem auto 0;max-width:860px;text-align:center">'
      + '<strong style="color:#A0A8BC">Absorbed by incumbents, so not shown as challengers:</strong> ' + items + '.</p>';
  }

  function footerHtml() {
    return '<p style="color:#8A93A6;font-size:0.72rem;line-height:1.55;margin:0.75rem auto 0;max-width:900px;text-align:center">'
      + 'Vertical market sizes for ten categories after <a href="' + SEQ + '" target="_blank" rel="noopener" style="color:#4ECDC4">Sequoia Capital (Bek, March 2026)</a>. '
      + 'Remaining categories, quadrant grouping and company selections are DVC\u2019s.'
      + '</p>'
      + '<p style="color:#6B7280;font-size:0.7rem;margin:0.4rem auto 0;max-width:900px;text-align:center">'
      + 'Funding figures checked Aug 4, 2026; company totals mix equity/debt only where explicitly labelled. '
      + 'Categories with no dollar figure are ones Sequoia does not size and for which no sourced market size was found. '
      + '<span style="color:#7C4DFF">DVC portfolio</span> pairings highlighted in each tooltip.'
      + '</p>';
  }

  function render(el, opts) {
    var node = typeof el === 'string' ? document.getElementById(el) : el;
    if (!node) return false;
    opts = opts || {};
    var h = gridHtml();
    if (opts.consolidation !== false) h += consolidationHtml();
    if (opts.footer !== false) h += footerHtml();
    node.innerHTML = h;
    return true;
  }

  root.SERVICES_MATRIX = {
    asOf: '2026-08-04',
    sequoiaUrl: SEQ,
    headline: 'Where AI autopilots are attacking services.',
    attribution: 'Vertical market sizes for ten categories after Sequoia Capital (Bek, March 2026). Remaining categories, quadrant grouping and company selections are DVC\u2019s.',
    fundingStamp: 'Funding figures checked Aug 4, 2026; company totals mix equity/debt only where explicitly labelled',
    quadrants: QUADRANTS,
    rows: ROWS,
    consolidation: CONSOLIDATION,
    render: render,
    gridHtml: gridHtml,
    footerHtml: footerHtml,
    consolidationHtml: consolidationHtml
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SERVICES_MATRIX;
})(typeof window !== 'undefined' ? window : globalThis);
