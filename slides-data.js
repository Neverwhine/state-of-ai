// slides-data.js — SINGLE SOURCE OF TRUTH for the slideshow
// Update numbers here; the slideshow auto-updates.

window.SLIDES_DATA = {
  // ─── THE STACK — 5 layers, single source of truth (slides 3-5) ───
  // Top→bottom order: APPLICATIONS → FOUNDATION MODELS → CLOUD & INFRA → SILICON → ENERGY
  stackLayers: [
    {
      badge: 'LAYER 5', title: 'APPLICATIONS', accent: '#4ECDC4',
      revenue2026: '$60-70B', revenueLabel: 'app revenue',
      revenue2024Num: 13, revenue2026Num: 65,
      growth: '+400%',
      marginPct: 50, marginRange: '25-60%'
    },
    {
      badge: 'LAYER 4', title: 'FOUNDATION MODELS', accent: '#7C4DFF',
      revenue2026: '$35-40B', revenueLabel: 'API revenue',
      revenue2024Num: 9, revenue2026Num: 37,
      growth: '+311%',
      marginPct: 50, marginRange: '33-70%'
    },
    {
      badge: 'LAYER 3', title: 'CLOUD & INFRA', accent: '#4A90D9',
      revenue2026: '$45-55B', revenueLabel: 'AI cloud rev (+ $224B CapEx)',
      revenue2024Num: 20, revenue2026Num: 50,
      growth: '+150%',
      marginPct: 28, marginRange: '20-35%'
    },
    {
      badge: 'LAYER 2', title: 'SILICON', accent: '#E8837C',
      revenue2026: '$350B+', revenueLabel: 'AI silicon revenue',
      revenue2024Num: 130, revenue2026Num: 350,
      growth: '+169%',
      marginPct: 60, marginRange: '45-75% (NVIDIA)'
    },
    {
      badge: 'LAYER 1', title: 'ENERGY', accent: '#F5C542',
      revenue2026: '580 TWh', revenueLabel: 'data-center power by 2028',
      revenue2024Num: 460, revenue2026Num: 580,
      growth: '+26%',
      marginPct: 12, marginRange: '8-15% (utility)'
    }
  ],

  // Hyperscaler CapEx ($B) — Big 4 2026 guidance: ~$695B midpoint, up to $725B top end (post-Q1 2026 earnings)
  hyperscalerCapex: { y2024: 224, y2026: 695, y2026Label: '~$695B mid / up to $725B', ratio: '$12 infra : $1 app revenue' },

  // Inference cost collapse — log scale. Cost per million tokens (USD).
  inferenceCost: [
    { date: 'GPT-4 (Mar 2023)',  cost: 37.50 },
    { date: 'GPT-4 Turbo',       cost: 30.00 },
    { date: 'GPT-4o',            cost: 15.00 },
    { date: 'Gemini Flash',      cost: 0.70 },
    { date: 'Today (commodity)', cost: 0.14 }
  ],
  inferenceCostDrop: '99.6%',

  // Application layer companies (slide 7)
  // Aug 3, 2026. Private run-rate/ARR figures are company-disclosed and unaudited.
  // Anthropic is shown as a range because sources conflict ($30B and ~$47B in the
  // same window). Cursor is a SpaceXAI subsidiary as of the Jun 16 option exercise.
  appLayer: [
    { name: 'Anthropic',  val: '$30–47B', color: '#D4A574' },
    { name: 'OpenAI',     val: '1B MAU',  color: '#10A37F' },
    { name: 'Cursor',     val: '$4B',     color: '#A0A8BC' },
    { name: 'ElevenLabs', val: '$600M',   color: '#A0A8BC' },
    { name: 'Lovable',    val: '$500M',   color: '#7C4DFF' },
    { name: 'Higgsfield', val: '$500M+',  color: '#4ECDC4', dvc: true }
  ],

  // ── Lab leadership (slide 5 strip + report cards) ──
  // Valuations are primary-round marks; secondary prints differ and are labelled.
  labLeadership: {
    anthropic: { primary: '$965B', secondary: '~$1.2T', runRate: '$30B–$47B reported run-rate (sources conflict)',
                 enterprise: '34.4% of US paid business use vs ChatGPT 32.3% (Ramp AI Index, Jul 2026)',
                 customers: '300K+ business customers · ~70% of the Fortune 100' },
    openai:    { primary: '$852B', secondary: '~$908B', usage: 'ChatGPT 1B MAU · Codex + ChatGPT Work ~10M WAU',
                 caveat: 'No audited 2026 revenue filed; latest signal is a partial internal transcript with no dollar figures' },
    google:    { gemini: '950M MAU', aiMode: '1B+ MAU', enterprise: '~90% of the Fortune 100', tokens: '22B tokens/min through Gemini APIs' },
    meta:      { mau: '1.2B MAU', wau: '800M WAU', note: 'Largest by reach, but embedded in existing search bars rather than chosen' },
    disclosure: 'Private-company ARR and run-rate figures are company-disclosed and unaudited unless noted.'
  },

  // ── Slide 6: THE MODEL MARKET BECAME A BARBELL (Aug 3, 2026) ──
  // Four lanes. Slide 6 renders these as native HTML (see slides.html) so the
  // text stays legible in fullscreen; this block is the source of record.
  modelBarbell: {
    premiumAgentic: [
      { model: 'Claude Fable 5 / Mythos 5', price: '$10/$50', note: 'Jun 9 · multi-day agentic tier · SWE-Bench Pro 80.4%' },
      { model: 'GPT-5.6 Sol',               price: '$5/$30',  note: 'Jul 9 GA · 54% more token-efficient on coding' }
    ],
    efficientFrontier: [
      { model: 'Claude Sonnet 5',        price: '$2/$10',            note: 'Promo through Aug 31, then $3/$15 · 1M context · default in Claude Code' },
      { model: 'Grok 4.5',               price: '$2/$6',             note: '500K context · co-trained with Cursor · ~4.2× fewer output tokens than Opus 4.8' },
      { model: 'GPT-5.6 Terra / Luna',   price: '$2.50/$15 · $1/$6', note: 'Luna is the floor of the credible frontier tier' },
      { model: 'Gemini 3.6 Flash',       price: '$1.50/$7.50',       note: 'Output $9.00 → $7.50 · 17% fewer output tokens' },
      { model: 'Meta Muse Spark 1.1',    price: '$1.25/$4.25',       note: "Meta's first paid Model API · leads on tool use" }
    ],
    openWeightChina: [
      { model: 'Kimi K3 (Moonshot)',      params: '2.8T', note: '896 experts / 16 active · 1M context · weights Jul 27 · largest open model to date' },
      { model: 'Qwen3.8-Max-Preview',     params: '2.4T', note: 'Alibaba · Jul 19' },
      { model: 'DeepSeek V4 Preview',     params: '1.6T / 284B', note: 'Pro 1.6T (49B active) · Flash 284B (13B active) · 33T training tokens' }
    ],
    restrictedCyber: [
      { model: 'Fable 5 / Mythos 5 suspension', stat: '19 days', note: 'US Commerce export controls suspended both globally from Jun 12; restored Jul 1 behind new cyber classifiers' },
      { model: 'GPT-5.6 pre-release review',    stat: 'EO 14409', note: 'US pre-release review preceded GA; OpenAI objected to it becoming the long-term default' },
      { model: 'Gemini 3.5 Flash Cyber',        stat: 'Dedicated SKU', note: 'Cyber capability became a release gate, not a footnote' }
    ],
    integrityCaveat: 'The Grok 4.5 CursorBench result was withdrawn after Cursor disclosed a codebase snapshot had entered the training data.'
  },

  // Token efficiency (slide 7 strip) — THREE SEPARATE VENDOR CLAIMS, NOT A TIME SERIES.
  // Deliberately not modelled as a curve: the three figures are each a vendor's
  // own comparison against its own predecessor on different tasks.
  tokenEfficiencyClaims: [
    { vendor: 'Grok 4.5',         claim: '4.2×', detail: 'fewer output tokens than Claude Opus 4.8' },
    { vendor: 'GPT-5.6 Sol',      claim: '54%',  detail: 'more token-efficient on coding than its predecessor' },
    { vendor: 'Gemini 3.6 Flash', claim: '17%',  detail: 'fewer output tokens, alongside a $9.00 → $7.50 output cut' }
  ],

  // Smarter + Cheaper diverging curves
  smarterCurve: [
    { date: '2023', mmlu: 70, cost: 37.50 },
    { date: '2024', mmlu: 80, cost: 15 },
    { date: '2025', mmlu: 87, cost: 2 },
    { date: '2026', mmlu: 92, cost: 0.14 }
  ],

  // ── NEW slide 6: Infrastructure & Energy headline stats ──
  infraStats: {
    capex2026: '$700–725B',
    capex2026Detail: 'Top four 2026 guidance · up to ~$800B calendar 2026 including leases · Google raised to $195–205B',
    capex2024: '$224B',
    multiplier: '3.1×',
    nuclear: '9.8 GW committed across 13 hyperscaler nuclear deals vs 1.92 GW operational · bridged by 2.67 GW off-grid gas (Project Kilby)'
  },

  // ── Slide 8: HOW IT'S FUNDED — the scale held, the funding quality changed ──
  fundingMix: {
    debtShare:  { from: '9% of capex (FY24)', to: '32% LTM (mid-2026)' },
    buybacks:   { from: '$28B (Meta $13B + Alphabet $15B)', to: '$0' },
    alphabetFcf: 'Free cash flow negative for the first time since the 2004 IPO',
    equityRaise: '$84.75B Alphabet equity raise, June 2026 — its first since 2005'
  },

  // ── Slide 9 (NEW): SILICON & POWER ──
  siliconPower: {
    nvidia:   { period: 'Q1 FY2027 (quarter ended Apr 26, 2026)', revenue: '$81.6B', dataCenter: '$75.2B',
                note: 'VeraRubin production ships Q3 · >$9B physical-AI revenue TTM · China compute revenue zero',
                annualContrast: 'Do not confuse with FY2026 annual revenue of $215.9B — always label the period' },
    amd:      { anthropic: 'up to 2 GW MI450 from H1 2027', meta: '6 GW (1 GW of MI450 in H2 2026)', total: '8 GW committed' },
    broadcom: { aiSemis: '$10.8B FQ2 (+143%)', q3Guide: '$16.0B', openai: 'OpenAI partnered with Broadcom on its first in-house processors' },
    // Etched is NOT a DVC portfolio company. No DVC badge anywhere.
    etched:   { round: '$300M Series C', valuation: '$10.3B', date: 'Jul 23, 2026',
                investors: 'Led by Sequoia with a16z, Jane Street, Diffusion and SK Hynix',
                totalRaised: '>$1B', preOrders: '$1B', dvc: false },
    power:    { committed: '9.8 GW across 13 hyperscaler nuclear deals', operational: '1.92 GW', ratio: '5:1',
                gasBridge: 'Project Kilby — 2.67 GW off-grid West Texas gas plant, 20-yr Microsoft PPA, first delivery 2028',
                tmi: 'Three Mile Island Unit 1 / Crane: FERC waiver Jun 1, 2026; 835 MW produces nothing until H2 2027–2028' }
  },

  // ── Slide 12 (NEW): VOICE AI ──
  voiceAI: {
    elevenlabs: { arr: '$600M', from: '$330M at end-2025', growth: '~175% YoY',
                  f500: '41% of the Fortune 500', apiUsers: '1B+ end users via API',
                  creators: '$22M paid to 10,400+ voice creators', disclosure: 'company-disclosed' },
    openai:     { product: 'GPT-Live-1 and GPT-Live-mini', date: 'July 8, 2026', capability: 'full-duplex conversation, released globally' },
    dvcExposure: ['FleetWorks', 'Avoca']
  },

  // ── NEW slide 10: Agent Anatomy 7-layer stack (KPIs are now inline in the slide headline) ──
  agentLayers: [
    { num: 1, name: 'UI / Frontend',       desc: 'How agents meet users' },
    { num: 2, name: 'Orchestration',       desc: 'Planning, routing, multi-agent' },
    { num: 3, name: 'Tool Calling',        desc: 'How agents act on the world' },
    { num: 4, name: 'Memory',              desc: 'Persistent context, long-term state' },
    { num: 5, name: 'Models',              desc: 'The reasoning core' },
    { num: 6, name: 'Observability',       desc: 'Tracing, eval, debugging' },
    { num: 7, name: 'Security & Identity', desc: 'Auth, permissions, sandboxes' }
  ],

  // ── NEW slide 11: Vibe coding ──
  // Aug 3, 2026. ARR figures are company-disclosed and unaudited.
  vibeCoding: [
    { letter: 'C', name: 'Cursor',      stat: '$4B ARR',         color: '#FF8C42', desc: '$60B all-stock to SpaceX, exercised Jun 16 · co-trained Grok 4.5' },
    { letter: 'A', name: 'Claude Code', stat: 'Sonnet 5 default', color: '#D4A574', desc: 'Default surface for Sonnet 5 from Jul 1 · ~$2.5B annualized' },
    { letter: 'L', name: 'Lovable',     stat: '$500M ARR',       color: '#7C4DFF', desc: '146 employees · ~$3.4M ARR/head · $13.2B raise reportedly in progress' },
    { letter: 'O', name: 'Work + Codex', stat: '~10M WAU',       color: '#10A37F', desc: 'OpenAI platform bundle · doubled from 6M in nine days' },
    { letter: 'M', name: 'Muse Spark',  stat: '$1.25/$4.25',     color: '#1877F2', desc: "Meta entered coding Jul 9 — its first paid Model API" },
    { letter: 'W', name: 'Wabi',        stat: '$20M pre-seed',   color: '#4ECDC4', desc: 'Software creation, reimagined', dvc: true }
  ],
  // SonarSource 2026 State of Code Developer Survey: 42% of committed code is AI-generated
  // or significantly AI-assisted; 72% of developers who tried AI use it every day.
  // Source: https://www.sonarsource.com/state-of-code-developer-survey-report.pdf
  // Stack Overflow 2025 (51% daily) kept only as secondary signal.
  vibeStats: {
    aiAuthoredCode: '42%',
    dailyUseAmongTriers: '72%',
    source: 'SonarSource 2026 State of Code Developer Survey'
  },

  // ── REBUILT slide 12: Physical AI tiles ──
  // Aug 3, 2026. Tesla's 8.4B cumulative FSD miles are deliberately NOT used as
  // an equivalent to Waymo's autonomous miles — the comparable figure is Tesla's
  // 2.5M paid robotaxi miles, of which only 380K ran without a safety monitor.
  physicalAI: {
    waymoWeeklyRides: '~500,000',
    waymoTarget:      '1M/week by year-end (one forecast puts Q4 nearer 775,000)',
    waymoMetros:      '15+ fully driverless US metros · ~3,000 vehicles',
    waymoMiles:       '220M+ autonomous miles through end-March 2026',
    teslaPaidMiles:   '2.5M paid robotaxi miles · only 380,000 without a safety monitor',
    teslaFlat:        '~900,000 added paid miles in each of Q1 and Q2 2026 · ~14 unsupervised Austin cars',
    laborMarketTAM:   '$38T',
    humanoidFunding:  '$8.6B in 2026 YTD — 1.8× all of 2025',
    nvidiaPhysicalAI: '>$9B physical-AI revenue TTM'
  },
  physicalAITiles: [
    { category: 'AUTONOMOUS MOBILITY',  color: '#4ECDC4', icon: 'car',
      company: 'WAYMO',          detail: '~500K paid rides/week · 15+ driverless metros · 220M+ mi' },
    { category: 'THE GAP WIDENED',      color: '#F5C542', icon: 'truck',
      company: 'TESLA ROBOTAXI', detail: '2.5M paid mi · 380K without a safety monitor · flat QoQ' },
    { category: 'AUTONOMOUS WORK',      color: '#E8837C', icon: 'robotarm',
      company: 'RHODA',          detail: '>$450M raised · >$2.4B valuation', dvc: true }
  ],
  physicalAIStats: [
    { num: '~500K',  label: 'WAYMO PAID RIDES/WEEK',   accent: '#4ECDC4' },
    { num: '$8.6B',  label: 'HUMANOID FUNDING 2026 YTD', accent: '#F5C542' },
    { num: '380K',   label: 'TESLA MI, NO SAFETY MONITOR', accent: '#E8837C' },
    { num: '>$9B',   label: 'NVIDIA PHYSICAL-AI TTM',   accent: '#7C4DFF' }
  ],

  // Slide 10 ARPU bars are now native (Netflix/Meta/Google/OpenAI). Numbers are
  // hard-coded in slides.html under .slide-arpu-block. Update both the report
  // (index.html #arpu-block) and slides.html together if any value changes.

  // Tech cycle phases (slide 15 close)
  cyclePhases: ['Infrastructure buildout', 'Platform consolidation', 'Application dominance'],
  weAreHere:   'Infrastructure buildout',

  // Iframe target sections — keyed by slide number, value passed as ?embed=...
  // 18 slides after the Aug 2026 refresh. Slides 8 (capex explorer) and 10
  // (agent anatomy) are NATIVE — they render in-page rather than via an iframe,
  // so this map is intentionally empty. Kept for the loader contract.
  iframeEmbeds: {},

  // Section anchors for "Dive deeper" links to index.html — 18 slides.
  //  1 QR cover            10 agent anatomy
  //  2 cinematic opener     11 vibe coding consolidation
  //  3 tech cycles          12 NEW voice AI
  //  4 unified stack        13 business models
  //  5 application / labs   14 services matrix
  //  6 model barbell        15 attack angles
  //  7 smarter + cheaper    16 NEW healthcare AI
  //  8 infra & how funded   17 physical AI
  //  9 NEW silicon & power  18 six beliefs close
  diveDeeperAnchors: {
    1:  'index.html#sec-0',
    2:  'index.html#sec-0',
    3:  'index.html#sec-1',
    4:  'index.html#sec-1',
    5:  'index.html#sec-2',
    6:  'index.html#sec-3',
    7:  'index.html#sec-3',
    8:  'index.html#sec-7',
    9:  'index.html#sec-7',
    10: 'index.html#sec-5',
    11: 'index.html#sec-4',
    12: 'index.html#sec-4',
    13: 'index.html#sec-9',
    14: 'index.html#sec-9',
    15: 'index.html#attack-angles-block',
    16: 'index.html#sec-healthcare-ai',
    17: 'index.html#sec-8',
    18: 'index.html#sec-14'
  }
};
