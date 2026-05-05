// slides-data.js — SINGLE SOURCE OF TRUTH for the slideshow
// Update numbers here; the slideshow auto-updates.

window.SLIDES_DATA = {
  // Stack revenue by layer ($B), 2024 vs 2026 — bars in slides 3-4
  stackRevenue: [
    { layer: 'Application',   y2024: 10,  y2026: 60,  growth: '+500%' },
    { layer: 'Model',         y2024: 4,   y2026: 30,  growth: '+650%' },
    { layer: 'Orchestration', y2024: 0.2, y2026: 1.5, growth: '+650%' },
    { layer: 'Cloud (AI)',    y2024: 35,  y2026: 130, growth: '+270%' },
    { layer: 'Silicon (AI)',  y2024: 60,  y2026: 200, growth: '+230%' },
    { layer: 'Power & DC',    y2024: 30,  y2026: 90,  growth: '+200%' }
  ],

  // Margins by layer (%) — slide 4 morph target
  stackMargins: [
    { layer: 'Application',   margin: 50, range: '40-65%' },
    { layer: 'Model',         margin: 25, range: '15-35%' },
    { layer: 'Orchestration', margin: 60, range: '50-70%' },
    { layer: 'Cloud (AI)',    margin: 28, range: '20-35%' },
    { layer: 'Silicon (AI)',  margin: 50, range: '45-75% NVIDIA outlier' },
    { layer: 'Power & DC',    margin: 12, range: '8-15% utility' }
  ],

  // Application layer companies (slide 8)
  appLayer: [
    { name: 'OpenAI',     val: '$25B',   color: '#10A37F' },
    { name: 'Anthropic',  val: '$30B',   color: '#D4A574' },
    { name: 'Cursor',     val: '$2B',    color: '#A0A8BC' },
    { name: 'Perplexity', val: '$420M',  color: '#4ECDC4', dvc: true },
    { name: 'ElevenLabs', val: '$330M',  color: '#A0A8BC' },
    { name: 'Higgsfield', val: '$300M',  color: '#4ECDC4', dvc: true }
  ],

  // Inference cost collapse — log scale. Cost per million tokens (USD).
  inferenceCost: [
    { date: 'GPT-4 (Mar 2023)',  cost: 60.00 },
    { date: 'GPT-4 Turbo',       cost: 30.00 },
    { date: 'GPT-4o',            cost: 15.00 },
    { date: 'Gemini Flash',      cost: 0.70 },
    { date: 'Today (commodity)', cost: 0.14 }
  ],
  inferenceCostDrop: '99.6%',

  // Hyperscaler CapEx ($B)
  hyperscalerCapex: { y2024: 224, y2026: 700, ratio: '$12 infra : $1 app revenue' },

  // Model layer
  frontierModelCount: 15,
  modelClusterGroups: {
    commodity:   ['DeepSeek V3.2', 'Qwen 3', 'GLM-5', 'Kimi K2.5', 'Gemma 4', 'Llama 4'],
    specialist:  ['Cursor (code)', 'ElevenLabs (voice)', 'Veo 3.1 (video)', 'Imagen 4 (image)'],
    govOnly:     ['Mythos', 'GPT-5.5-Cyber'],
    deprecated:  ['Sora 2'] // crossed out
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

  // Tech cycle phases (slide 13)
  cyclePhases: ['Infrastructure buildout', 'Platform consolidation', 'Application dominance'],
  weAreHere:   'Infrastructure buildout',

  // Section anchors for "Dive deeper" links to index.html
  diveDeeperAnchors: {
    1:  'index.html#sec-0',   // opening
    2:  'index.html#sec-1',   // tech cycles
    3:  'index.html#sec-1',   // stack
    4:  'index.html#sec-1',   // margin morph
    5:  'index.html#sec-7',   // industrial / infrastructure
    6:  'index.html#sec-9',   // spoons / business models
    7:  'index.html#sec-1',   // two forces
    8:  'index.html#sec-2',   // application layer
    9:  'index.html#sec-3',   // model wars
    10: 'index.html#sec-3',   // smarter + cheaper
    11: 'index.html#sec-8',   // physical AI
    12: 'index.html#sec-9',   // business models
    13: 'index.html#sec-15'   // closing
  }
};
