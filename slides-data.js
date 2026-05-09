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
  appLayer: [
    { name: 'OpenAI',     val: '$25B',   color: '#10A37F' },
    { name: 'Anthropic',  val: '$30B+',  color: '#D4A574' },
    { name: 'Cursor',     val: '$2B',    color: '#A0A8BC' },
    { name: 'Perplexity', val: '$420M',  color: '#4ECDC4', dvc: true },
    { name: 'ElevenLabs', val: '$330M',  color: '#A0A8BC' },
    { name: 'Higgsfield', val: '$300M',  color: '#4ECDC4', dvc: true }
  ],

  // Model layer (count derived from chips below — see slide 8 eyebrow)
  modelClusterGroups: {
    commodity:   ['DeepSeek V3.2', 'Qwen3.5 397B A17B', 'GLM-5', 'Kimi K2.5', 'Gemma 4', 'Llama 4'],
    specialist:  ['Cursor (code)', 'ElevenLabs (voice)', 'Veo 3.1 (video)', 'Imagen 4 (image)'],
    govOnly:     ['Mythos', 'GPT-5.5-Cyber'],
    deprecated:  ['Sora 2']
  },

  // Smarter + Cheaper diverging curves
  smarterCurve: [
    { date: '2023', mmlu: 70, cost: 37.50 },
    { date: '2024', mmlu: 80, cost: 15 },
    { date: '2025', mmlu: 87, cost: 2 },
    { date: '2026', mmlu: 92, cost: 0.14 }
  ],

  // ── NEW slide 6: Infrastructure & Energy headline stats ──
  infraStats: {
    capex2026: '~$700B',
    capex2026Detail: '~$695B midpoint · up to $725B top end (Big 4 post-Q1 2026)',
    capex2024: '$224B',
    multiplier: '3.1×',
    nuclear: 'Three Mile Island restart · Microsoft + Google SMRs'
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
  vibeCoding: [
    { letter: 'C', name: 'Cursor',      stat: '$2B+ ARR',        color: '#FF8C42', desc: 'AI-native IDE · doubled in 3 months' },
    { letter: 'A', name: 'Claude Code', stat: '$2.5B run-rate',  color: '#D4A574', desc: '9-month ramp · agent-mediated SWE' },
    { letter: 'L', name: 'Lovable',     stat: '$400M ARR',       color: '#7C4DFF', desc: 'Vibe coding for non-engineers' },
    { letter: 'D', name: 'Devin',       stat: '$10.2B val',      color: '#4A90D9', desc: '67% PR merge rate · autonomous SWE' },
    { letter: 'W', name: 'Wabi',        stat: '$20M pre-seed',   color: '#4ECDC4', desc: 'Software creation, reimagined', dvc: true },
    { letter: 'B', name: 'Bolt.new',    stat: '~$40M ARR (6mo)', color: '#A0A8BC', desc: 'Browser-based full-stack builder' }
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
  physicalAI: {
    waymoWeeklyRides: '400,000+',
    laborMarketTAM:   '$38T',
    teslaFSDMiles:    '8.4B',
    auroraTrucks:     '200+'
  },
  physicalAITiles: [
    { category: 'AUTONOMOUS MOBILITY',  color: '#4ECDC4', icon: 'car',
      company: 'WAYMO',          detail: '400,000+ rides per week' },
    { category: 'AUTONOMOUS LOGISTICS', color: '#F5C542', icon: 'truck',
      company: 'AURORA + GATIK', detail: '200+ driverless trucks · commercial scale' },
    { category: 'AUTONOMOUS WORK',      color: '#E8837C', icon: 'robotarm',
      company: 'RHODA',          detail: '2-arm robot · imagination via video models', dvc: true }
  ],
  physicalAIStats: [
    { num: '400,000+', label: 'WAYMO RIDES/WEEK',     accent: '#4ECDC4' },
    { num: '$38T',     label: 'LABOR MARKET IN PLAY', accent: '#F5C542' },
    { num: '8.4B',     label: 'TESLA FSD MILES',      accent: '#E8837C' },
    { num: '200+',     label: 'AURORA TRUCKS',        accent: '#7C4DFF' }
  ],

  // Slide 10 ARPU bars are now native (Netflix/Meta/Google/OpenAI). Numbers are
  // hard-coded in slides.html under .slide-arpu-block. Update both the report
  // (index.html #arpu-block) and slides.html together if any value changes.

  // Tech cycle phases (slide 15 close)
  cyclePhases: ['Infrastructure buildout', 'Platform consolidation', 'Application dominance'],
  weAreHere:   'Infrastructure buildout',

  // Iframe target sections — keyed by slide number, value passed as ?embed=...
  // 14 slides total. Stack-logic slides come first (1-6), then industrial
  // buildout (7), agents (8), vibe coding (9), business models (10),
  // services quadrant (11), attack angles (12), physical AI (13), close (14).
  iframeEmbeds: {
    7:  'sec-7:capex-explorer-block',  // CapEx explorer (focused block)
    8:  'sec-5:agent-stack-block'      // Agent anatomy 7-layer stack
    // Slide 10 (ARPU), 11 (seq-matrix), 12 (attack-angles) are now NATIVE — no iframe.
  },

  // Section anchors for "Dive deeper" links to index.html (14 slides)
  diveDeeperAnchors: {
    1:  'index.html#sec-0',
    2:  'index.html#sec-1',
    3:  'index.html#sec-1',   // unified stack: 5 layers / 2 lenses / 2 forces
    4:  'index.html#sec-2',   // application layer funnel
    5:  'index.html#sec-3',   // model wars
    6:  'index.html#sec-3',   // smarter+cheaper
    7:  'index.html#sec-7',   // infrastructure & energy (industrial buildout)
    8:  'index.html#sec-5',   // agent anatomy
    9:  'index.html#sec-4',   // vibe coding / agent revolution cards
    10: 'index.html#sec-9',   // business models / pricing / ARPU
    11: 'index.html#sec-9',   // sequoia services matrix
    12: 'index.html#attack-angles-block', // three attack angles
    13: 'index.html#sec-8',   // physical AI
    14: 'index.html#sec-15'   // close
  }
};
