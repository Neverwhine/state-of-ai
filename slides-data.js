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
      revenue2026: '$18-22B', revenueLabel: 'AI cloud rev (+ $224B CapEx)',
      revenue2024Num: 8, revenue2026Num: 20,
      growth: '+150%',
      marginPct: 28, marginRange: '20-35%'
    },
    {
      badge: 'LAYER 2', title: 'SILICON', accent: '#E8837C',
      revenue2026: '$130B', revenueLabel: 'AI silicon revenue',
      revenue2024Num: 60, revenue2026Num: 130,
      growth: '+117%',
      marginPct: 60, marginRange: '45-75% (NVIDIA)'
    },
    {
      badge: 'LAYER 1', title: 'ENERGY', accent: '#F5C542',
      revenue2026: '460 TWh', revenueLabel: 'data-center power',
      revenue2024Num: 240, revenue2026Num: 460,
      growth: '+92%',
      marginPct: 12, marginRange: '8-15% (utility)'
    }
  ],

  // Hyperscaler CapEx ($B)
  hyperscalerCapex: { y2024: 224, y2026: 700, ratio: '$12 infra : $1 app revenue' },

  // Inference cost collapse — log scale. Cost per million tokens (USD).
  inferenceCost: [
    { date: 'GPT-4 (Mar 2023)',  cost: 60.00 },
    { date: 'GPT-4 Turbo',       cost: 30.00 },
    { date: 'GPT-4o',            cost: 15.00 },
    { date: 'Gemini Flash',      cost: 0.70 },
    { date: 'Today (commodity)', cost: 0.14 }
  ],
  inferenceCostDrop: '99.6%',

  // Application layer companies (slide 6, formerly slide 8)
  appLayer: [
    { name: 'OpenAI',     val: '$25B',   color: '#10A37F' },
    { name: 'Anthropic',  val: '$30B',   color: '#D4A574' },
    { name: 'Cursor',     val: '$2B',    color: '#A0A8BC' },
    { name: 'Perplexity', val: '$420M',  color: '#4ECDC4', dvc: true },
    { name: 'ElevenLabs', val: '$330M',  color: '#A0A8BC' },
    { name: 'Higgsfield', val: '$300M',  color: '#4ECDC4', dvc: true }
  ],

  // Model layer
  frontierModelCount: 15,
  modelClusterGroups: {
    commodity:   ['DeepSeek V3.2', 'Qwen 3', 'GLM-5', 'Kimi K2.5', 'Gemma 4', 'Llama 4'],
    specialist:  ['Cursor (code)', 'ElevenLabs (voice)', 'Veo 3.1 (video)', 'Imagen 4 (image)'],
    govOnly:     ['Mythos', 'GPT-5.5-Cyber'],
    deprecated:  ['Sora 2']
  },

  // Smarter + Cheaper diverging curves
  smarterCurve: [
    { date: '2023', mmlu: 70, cost: 60 },
    { date: '2024', mmlu: 80, cost: 15 },
    { date: '2025', mmlu: 87, cost: 2 },
    { date: '2026', mmlu: 92, cost: 0.14 }
  ],

  // Physical AI
  physicalAI: {
    waymoWeeklyRides: '400,000+',
    laborMarketTAM:   '$38T',
    teslaFSDMiles:    '8.4B',
    auroraTrucks:     '200+'
  },

  // ARPU comparison
  arpu: [
    { name: 'Anthropic', value: 16.20, color: '#D4A574' },
    { name: 'Microsoft', value: 5.00,  color: '#0078D4' },
    { name: 'OpenAI',    value: 2.20,  color: '#10A37F' },
    { name: 'Google',    value: 1.10,  color: '#4285F4' }
  ],

  // Tech cycle phases (slide 11)
  cyclePhases: ['Infrastructure buildout', 'Platform consolidation', 'Application dominance'],
  weAreHere:   'Infrastructure buildout',

  // Section anchors for "Dive deeper" links to index.html
  diveDeeperAnchors: {
    1:  'index.html#sec-0',
    2:  'index.html#sec-1',
    3:  'index.html#sec-1',  // stack
    4:  'index.html#sec-1',  // revenue/margin
    5:  'index.html#sec-1',  // two forces
    6:  'index.html#sec-2',  // app layer (was 8)
    7:  'index.html#sec-3',  // model wars (was 9)
    8:  'index.html#sec-3',  // smarter+cheaper (was 10)
    9:  'index.html#sec-8',  // physical AI (was 11)
    10: 'index.html#sec-9',  // business models (was 12)
    11: 'index.html#sec-15'  // close (was 13)
  }
};
