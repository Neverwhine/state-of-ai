/* ============================================================================
   facts-data.js — SINGLE SOURCE OF TRUTH for entity-level facts
   ----------------------------------------------------------------------------
   Created 2026-08-04 as part of the August 4 fact audit (306 material claims).

   Every record carries five fields so a reader (and the next refresh) can tell
   what a number actually is:
     value        — the figure or phrase as it should be rendered
     asOf         — the date the figure was true / disclosed
     sourceUrl    — the single best source (first-party > wire > analyst)
     evidenceType — official | company-disclosed | wire-reported | estimate |
                    rumour | tracker | dvc-analysis
     basis        — ARR vs run-rate, MAU vs WAU, primary vs secondary,
                    fiscal year vs quarter, program size vs cash, etc.

   Root cause of the August-4 audit's P0 list was architectural: the same fact
   lived in an August block, a legacy card, a tooltip, a chart array, a slide
   and a data file with no shared key. This file is the shared key.
   ============================================================================ */
(function (root) {
  'use strict';

  var F = {
    auditDate: '2026-08-04',
    auditNote: 'Figures checked against source on Aug 4, 2026. Private-company revenue is company-disclosed and unaudited unless marked otherwise.',

    /* ── LABS ───────────────────────────────────────────────────────────── */
    anthropic: {
      valuation: {
        value: '$965B post-money',
        asOf: '2026-05-28',
        sourceUrl: 'https://www.reuters.com/business/anthropic-raises-65-billion-now-valued-965-billion-2026-05-28/',
        evidenceType: 'wire-reported',
        basis: 'primary priced round — $65B Series H (Altimeter, Dragoneer, Greenoaks, Sequoia)'
      },
      runRate: {
        value: '$47B reported June 2026, up from the company\u2019s own $30B disclosure in April',
        asOf: '2026-06-12',
        sourceUrl: 'https://finance.yahoo.com/sectors/technology/articles/anthropic-hits-47-billion-run-121404687.html',
        evidenceType: 'wire-reported',
        basis: 'annualised run-rate, not recognised revenue; a time series ($14B Feb \u2192 $19B Mar \u2192 $30B Apr \u2192 $47B Jun), not a source conflict'
      },
      multiple: {
        value: '~21\u00d7',
        asOf: '2026-06-12',
        sourceUrl: 'https://www.reuters.com/business/anthropic-raises-65-billion-now-valued-965-billion-2026-05-28/',
        evidenceType: 'dvc-analysis',
        basis: '$965B primary mark \u00f7 $47B run-rate'
      },
      enterpriseShare: {
        value: '42.4% of US businesses pay for Anthropic vs OpenAI\u2019s 39.5%',
        asOf: '2026-07-08',
        sourceUrl: 'https://ramp.com/data/ai-index-july-2026',
        evidenceType: 'official',
        basis: 'Ramp AI Index, July 2026 release; corporate-card transaction data across 50,000+ US businesses. Overall business AI adoption 46.6%.'
      },
      flagship: {
        value: 'Claude Fable 5 (95.0% SWE-bench Verified, 80.3% SWE-Bench Pro, $10/$50 per 1M tokens)',
        asOf: '2026-06-09',
        sourceUrl: 'https://llm-stats.com/blog/research/claude-fable-5-review',
        evidenceType: 'wire-reported',
        basis: 'generally available flagship. Mythos 5 is the same weights with safeguards lifted and is restricted to Project Glasswing partners \u2014 not purchasable.'
      },
      claudeCode: {
        value: '~$2.5B annualised',
        asOf: '2026-02-12',
        sourceUrl: 'https://www.anthropic.com/news/anthropic-raises-30-billion-series-g-funding-380-billion-post-money-valuation',
        evidenceType: 'company-disclosed',
        basis: 'last disclosed Feb 2026; total run-rate has since gone $14B \u2192 $47B, so this line is almost certainly stale'
      },
      seriesH: {
        value: '$65B Series H at $965B post-money',
        asOf: '2026-05-28',
        sourceUrl: 'https://www.reuters.com/business/anthropic-raises-65-billion-now-valued-965-billion-2026-05-28/',
        evidenceType: 'wire-reported',
        basis: 'largest private AI round of the 2025\u201326 period'
      }
    },

    openai: {
      valuation: {
        value: '$852B post-money',
        asOf: '2026-03-31',
        sourceUrl: 'https://openai.com/index/accelerating-the-next-phase-ai/',
        evidenceType: 'official',
        basis: 'primary priced round \u2014 $122B closed Mar 31 2026'
      },
      secondary: {
        value: '~$880\u2013895B implied in secondaries',
        asOf: '2026-06-26',
        sourceUrl: 'https://forgeglobal.com/openai_ipo/',
        evidenceType: 'tracker',
        basis: 'Forge Global derived price (~$721.85/share, late June 2026) \u2014 secondary print, not a priced primary round'
      },
      users: {
        value: '~1B monthly active users on the ChatGPT mobile apps',
        asOf: '2026-05-31',
        sourceUrl: 'https://www.reuters.com/technology/chatgpt-app-hits-1-billion-monthly-active-users-record-time-data-shows-2026-06-02/',
        evidenceType: 'estimate',
        basis: 'Sensor Tower third-party estimate, iOS + Android apps only \u2014 excludes chatgpt.com web, API and enterprise. OpenAI\u2019s own last disclosure is 900M weekly actives (Feb 2026).'
      },
      wau: {
        value: '900M+ weekly active users',
        asOf: '2026-02-12',
        sourceUrl: 'https://openai.com/index/accelerating-the-next-phase-ai/',
        evidenceType: 'company-disclosed',
        basis: 'last company-disclosed weekly figure, February 2026; not comparable to the mobile MAU estimate'
      },
      arr: {
        value: '~$25B',
        asOf: '2026-06-30',
        sourceUrl: 'https://openai.com/index/accelerating-the-next-phase-ai/',
        evidenceType: 'estimate',
        basis: 'annualised run-rate, held near this level February through mid-2026'
      },
      flagship: {
        value: 'GPT-5.6 Sol / Terra / Luna, GA July 9 2026 at $5/$30, $2.50/$15 and $1/$6 per 1M tokens',
        asOf: '2026-07-09',
        sourceUrl: 'https://apidog.com/blog/gpt-5-6-pricing/',
        evidenceType: 'wire-reported',
        basis: 'published API list prices'
      },
      microsoft: {
        value: 'Non-exclusive IP licence through 2032; OpenAI\u2192Microsoft revenue share continues through 2030 at the same percentage subject to a total cap; Microsoft no longer pays revenue share to OpenAI',
        asOf: '2026-04-27',
        sourceUrl: 'https://openai.com/index/next-phase-of-microsoft-partnership/',
        evidenceType: 'official',
        basis: 'amended agreement of Apr 27 2026; supersedes earlier reported terms'
      }
    },

    google: {
      geminiMau: {
        value: '950M Gemini app monthly active users',
        asOf: '2026-07-22',
        sourceUrl: 'https://www.theverge.com/tech/969624/google-says-gemini-now-has-950-million-monthly-users',
        evidenceType: 'company-disclosed',
        basis: 'Gemini app MAU, up from 750M disclosed in February 2026'
      },
      capex2026: {
        value: '$195\u2013205B',
        asOf: '2026-07-22',
        sourceUrl: 'https://insight.factset.com/hyperscalers-tap-external-financing-as-ai-capex-outruns-cash-flow',
        evidenceType: 'official',
        basis: 'FY2026 capex guidance raised on the July 22 2026 Q2 call from $180\u2013190B'
      },
      fcf: {
        value: 'Q2 2026 free cash flow of \u2212$5.9B \u2014 first negative quarter since the 2004 IPO',
        asOf: '2026-07-22',
        sourceUrl: 'https://europeanbusinessmagazine.com/google-ai-billion-spending-turns-cash-flow-negative/',
        evidenceType: 'wire-reported',
        basis: 'operating cash flow $39.1B less capex $44.9B; revenue $119.8B (+24%)'
      },
      equityRaise: {
        value: '$84.75B equity capital raise program',
        asOf: '2026-06-03',
        sourceUrl: 'https://abc.xyz/investor/news/news-details/2026/Alphabet-Announces-Upsize-and-Pricing-of-84-75-Billion-Equity-Capital-Raise-to-Expand-AI-Infrastructure--and-Compute-2026-QzN3D9yMAj/default.aspx',
        evidenceType: 'official',
        basis: 'announced PROGRAM SIZE, not cash collected \u2014 $18B common, $16.75B mandatory convertible preferred, $10B Berkshire private placement, $40B at-the-market. Net proceeds recognised in the June quarter were roughly $30.5B + $19.1B.'
      },
      buybacks: {
        value: '$0',
        asOf: '2026-07-22',
        sourceUrl: 'https://europeanbusinessmagazine.com/google-ai-billion-spending-turns-cash-flow-negative/',
        evidenceType: 'wire-reported',
        basis: 'buybacks halted at both Alphabet and Meta in 2026; the prior comparison point was $13.2B in Q2 2025'
      }
    },

    meta: {
      capex2026: {
        value: '$125\u2013145B',
        asOf: '2026-04-29',
        sourceUrl: 'https://analysis-atlas.com/research/hyperscaler-ai-capex-2026/',
        evidenceType: 'official',
        basis: 'calendar-2026 capex guidance, raised from $115\u2013135B. ~$135B used as the midpoint anchor.'
      },
      metaAiUsers: {
        value: '1.2B Meta AI MAU / 800M WAU',
        asOf: '2026-07-30',
        sourceUrl: 'https://about.fb.com/news/',
        evidenceType: 'company-disclosed',
        basis: 'embedded reach across Facebook, Instagram and WhatsApp \u2014 a distribution number, not a chosen-assistant number'
      }
    },

    /* ── APPLICATION LAYER ──────────────────────────────────────────────── */
    cursor: {
      arr: {
        value: '$4B ARR, of which ~$2.6B enterprise',
        asOf: '2026-06-16',
        sourceUrl: 'https://www.reuters.com/legal/transactional/spacex-buy-anysphere-60-billion-2026-06-16/',
        evidenceType: 'wire-reported',
        basis: 'annualised revenue as of early June 2026, per company data provided to Reuters; up from ~$1B in November 2025'
      },
      deal: {
        value: '$60B all-stock transaction with SpaceX, signed June 16 2026, expected to close Q3 2026 subject to regulatory approval',
        asOf: '2026-06-16',
        sourceUrl: 'https://www.reuters.com/legal/transactional/spacex-buy-anysphere-60-billion-2026-06-16/',
        evidenceType: 'wire-reported',
        basis: 'SIGNED, not closed. Not an outstanding option \u2014 the April option was exercised. $10B break-up structure with a $4B fee if antitrust blocks it.'
      },
      multiple: {
        value: '~15\u00d7 LTM',
        asOf: '2026-06-16',
        sourceUrl: 'https://finance.yahoo.com/technology/ai/articles/why-spacexs-acquisition-cursor-ai-121100165.html',
        evidenceType: 'dvc-analysis',
        basis: '$60B \u00f7 $4B ARR. Gross margin is close to negative once model-token pass-through is counted (DVC analysis), so a mid-teens revenue multiple is the expected outcome.'
      },
      share: {
        value: '26% of a $9.5B AI coding market \u2014 down from ~41% in June 2025',
        asOf: '2026-05-31',
        sourceUrl: 'https://www.cnbc.com/2026/06/16/spacex-spcx-cursor-acquisition-ipo.html',
        evidenceType: 'tracker',
        basis: 'Ramp corporate-spend share; Anthropic now holds roughly half the segment'
      }
    },

    lovable: {
      arr: {
        value: '$500M ARR in June 2026 on 146 employees (~$3.4M per head)',
        asOf: '2026-06-30',
        sourceUrl: 'https://techcrunch.com/2026/07/08/lovable-reportedly-in-talks-to-double-its-valuation-to-13-2b/',
        evidenceType: 'company-disclosed',
        basis: 'annualised run-rate, company-disclosed and unaudited; $400M in February 2026'
      },
      round: {
        value: '~$300M at a reported $13.2B post-money, Menlo Ventures expected to lead \u2014 reportedly in progress',
        asOf: '2026-07-08',
        sourceUrl: 'https://techcrunch.com/2026/07/08/lovable-reportedly-in-talks-to-double-its-valuation-to-13-2b/',
        evidenceType: 'rumour',
        basis: 'in talks, not closed; would double the $6.6B December 2025 Series B mark. ~26\u00d7 ARR.'
      }
    },

    higgsfield: {
      runRate: {
        value: '>$500M annualised run-rate, cash-flow positive',
        asOf: '2026-06-30',
        sourceUrl: 'https://techfundingnews.com/higgsfield-targets-5b-valuation-and-500m-run-rate-as-sora-folds-and-runway-retreats/',
        evidenceType: 'company-disclosed',
        basis: 'company-disclosed and unaudited, up from ~$200M at end-2025. Sacra independently estimates ~$400M as of May 2026. ~70% of revenue reported as enterprise.'
      },
      round: {
        value: 'In talks to raise $300\u2013500M at a $5B pre-money valuation \u2014 not closed',
        asOf: '2026-07-02',
        sourceUrl: 'https://techfundingnews.com/higgsfield-targets-5b-valuation-and-500m-run-rate-as-sora-folds-and-runway-retreats/',
        evidenceType: 'rumour',
        basis: '$5B is PRE-money. DVC portfolio company.'
      }
    },

    elevenlabs: {
      arr: {
        value: '$600M ARR',
        asOf: '2026-07-21',
        sourceUrl: 'https://www.postbeam.ai/blog/how-elevenlabs-grows',
        evidenceType: 'company-disclosed',
        basis: 'stated by the CEO at the All-In conference, July 2026; company-disclosed and unaudited. Up from $330M at end-2025 (~175% YoY).'
      },
      raised: {
        value: '$781M raised at an $11B valuation',
        asOf: '2026-01-31',
        sourceUrl: 'https://elevenlabs.io/blog/series-d',
        evidenceType: 'company-disclosed',
        basis: 'latest confirmed marks'
      }
    },

    perplexity: {
      arr: {
        value: '>$450M ARR (March 2026), ~$500M estimated by April',
        asOf: '2026-04-30',
        sourceUrl: 'https://sacra.com/c/perplexity/',
        evidenceType: 'estimate',
        basis: 'FT reporting of a ~50% one-month rise from ~$305M following the February 25 2026 launch of Computer; ~$500M is a Sacra estimate'
      },
      valuation: {
        value: '~$22.6B',
        asOf: '2026-01-09',
        sourceUrl: 'https://sacra.com/c/perplexity/',
        evidenceType: 'tracker',
        basis: 'Series E-6, January 2026; tracker-grade. $20B is the last press-confirmed priced round.'
      },
      multiple: {
        value: '~45\u201350\u00d7',
        asOf: '2026-04-30',
        sourceUrl: 'https://sacra.com/c/perplexity/',
        evidenceType: 'dvc-analysis',
        basis: '~$22.6B \u00f7 ~$450\u2013500M ARR'
      },
      computerLaunch: {
        value: 'Perplexity Computer launched February 25, 2026',
        asOf: '2026-02-25',
        sourceUrl: 'https://sacra.com/c/perplexity/',
        evidenceType: 'wire-reported',
        basis: 'launch date; orchestrates up to 19 models in parallel'
      }
    },

    harvey: {
      valuation: {
        value: '$11B',
        asOf: '2026-03-25',
        sourceUrl: 'https://www.harvey.ai/blog/harvey-raises-growth-round-at-dollar11-billion-valuation-co-led-by-gic-and-sequoia',
        evidenceType: 'official',
        basis: '$200M growth round co-led by GIC and Sequoia, first-party confirmed'
      },
      arr: {
        value: '~$190M ARR (January 2026)',
        asOf: '2026-01-31',
        sourceUrl: 'https://techcrunch.com/2026/02/09/harvey-reportedly-raising-at-11b-valuation-just-months-after-it-hit-8b/',
        evidenceType: 'company-disclosed',
        basis: 'stated by CEO Winston Weinberg; Sacra estimates $195M at end-2025. No credible source supports ~$300M.'
      },
      multiple: {
        value: '~58\u00d7',
        asOf: '2026-01-31',
        sourceUrl: 'https://techcrunch.com/2026/02/09/harvey-reportedly-raising-at-11b-valuation-just-months-after-it-hit-8b/',
        evidenceType: 'dvc-analysis',
        basis: '$11B \u00f7 ~$190M ARR'
      }
    },

    sierra: {
      valuation: {
        value: '$15.8B post-money',
        asOf: '2026-05-04',
        sourceUrl: 'https://www.adaptation.ai/insights/sierra-agent-platform',
        evidenceType: 'wire-reported',
        basis: '$950M Series E, Tiger Global and GV'
      },
      arr: {
        value: '~$165M ARR',
        asOf: '2026-05-31',
        sourceUrl: 'https://www.adaptation.ai/insights/sierra-agent-platform',
        evidenceType: 'company-disclosed',
        basis: 'stated by Bret Taylor one month into the ninth quarter; TechCrunch reports ~$150M at eight quarters'
      },
      multiple: {
        value: '~96\u00d7',
        asOf: '2026-05-31',
        sourceUrl: 'https://www.adaptation.ai/insights/sierra-agent-platform',
        evidenceType: 'dvc-analysis',
        basis: '$15.8B \u00f7 ~$165M ARR'
      }
    },

    decagon: {
      valuation: {
        value: '$4.5B',
        asOf: '2026-01-31',
        sourceUrl: 'https://superframeworks.com/articles/best-ai-customer-support-tools',
        evidenceType: 'wire-reported',
        basis: '$250M Series D, January 2026. NO revenue multiple is shown: the ~$35M ARR denominator previously used could not be sourced to anything better than an SEO aggregator, so the valuation is displayed without a multiple.'
      }
    },

    /* ── SILICON, CAPEX, POWER ──────────────────────────────────────────── */
    nvidia: {
      quarter: {
        value: 'Q1 FY2027 revenue $81.6B (+85% YoY), data center $75.2B (+92%), GAAP gross margin 74.9%, net income $58.3B (+211%); Q2 FY2027 guided to ~$91B \u00b12%',
        asOf: '2026-05-20',
        sourceUrl: 'https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-first-quarter-fiscal-2027',
        evidenceType: 'official',
        basis: 'SINGLE QUARTER (Q1 FY2027). Not comparable to the $215.9B annual figure. The $91B guide excludes any data-center compute revenue from China.'
      },
      year: {
        value: '$215.9B FY2026 revenue (+65% YoY), gross margin 71.1%, data center revenue $193.7B',
        asOf: '2026-01-31',
        sourceUrl: 'https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-first-quarter-fiscal-2027',
        evidenceType: 'official',
        basis: 'FISCAL YEAR ended January 2026. Not comparable to the $81.6B single-quarter figure.'
      },
      otherIncome: {
        value: '$15.9B of other income against $58.3B of net income \u2014 27.3%, roughly a quarter',
        asOf: '2026-05-20',
        sourceUrl: 'https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-first-quarter-fiscal-2027',
        evidenceType: 'official',
        basis: 'GAAP EPS $2.39 vs non-GAAP EPS $1.87 shows the same point; the equity portfolio grew from ~$35.1B to ~$73.6B in the quarter'
      },
      groq: {
        value: '$20B non-exclusive technology licence plus asset purchase and acqui-hire (Dec 2025); NVIDIA states it did not acquire Groq',
        asOf: '2025-12-24',
        sourceUrl: 'https://www.reuters.com/business/nvidia-buy-ai-chip-startup-groq-about-20-billion-cnbc-reports-2025-12-24/',
        evidenceType: 'wire-reported',
        basis: 'NOT an acquisition. NVIDIA licensed Groq\u2019s inference technology non-exclusively and hired founder Jonathan Ross, president Sunny Madra and engineers; CNBC reported ~$20B cash for assets. Groq continues independently under CEO Simon Edwards and GroqCloud is uninterrupted. Senators Warren and Blumenthal are probing whether the structure evaded merger review.'
      }
    },

    etched: {
      dvc: true,
      round: {
        value: '$300M Series C at a $10.3B valuation, led by Sequoia with a16z, Jane Street and SK Hynix; >$1B raised in total',
        asOf: '2026-07-23',
        sourceUrl: 'https://www.reuters.com/technology/ai-chip-startup-etched-raises-300-million-103-billion-valuation-2026-07-23/',
        evidenceType: 'wire-reported',
        basis: 'Round, valuation, date, lead and cumulative total confirmed. The previously shown "$1B of pre-orders" is removed: no source states it.'
      },
      disclosure: {
        value: 'Etched IS a DVC portfolio company',
        asOf: '2026-07-29',
        sourceUrl: 'https://www.linkedin.com/posts/davidovs-vc_ai-aiinfrastructure-semiconductors-activity-7487875223044943873-0ZCB',
        evidenceType: 'official',
        basis: 'Davidovs VC\u2019s own public statement: "DVC invested in Etched at an early stage." A firm\u2019s own public statement about its own portfolio is first-party evidence.'
      }
    },

    capex: {
      topFour2026: {
        value: '~$725B midpoint, up to ~$745B top end',
        asOf: '2026-07-27',
        sourceUrl: 'https://insight.factset.com/hyperscalers-tap-external-financing-as-ai-capex-outruns-cash-flow',
        evidenceType: 'official',
        basis: 'sum of company guidance midpoints: Amazon ~$200B + Alphabet ~$200B ($195\u2013205B) + Microsoft ~$190B + Meta ~$135B. Calendar 2026.'
      },
      base2025: {
        value: '~$402\u2013410B',
        asOf: '2026-04-29',
        sourceUrl: 'https://analysis-atlas.com/research/hyperscaler-ai-capex-2026/',
        evidenceType: 'estimate',
        basis: 'top-four calendar-2025 capex; the +77% step-up to 2026 only works off this base'
      },
      amazon: { value: '~$200B', asOf: '2026-07-31', sourceUrl: 'https://insight.factset.com/hyperscalers-tap-external-financing-as-ai-capex-outruns-cash-flow', evidenceType: 'official', basis: 'calendar-2026 guidance' },
      alphabet: { value: '~$200B ($195\u2013205B)', asOf: '2026-07-22', sourceUrl: 'https://insight.factset.com/hyperscalers-tap-external-financing-as-ai-capex-outruns-cash-flow', evidenceType: 'official', basis: 'FY2026 guidance raised July 22 2026' },
      microsoft: { value: '~$190B', asOf: '2026-04-29', sourceUrl: 'https://analysis-atlas.com/research/hyperscaler-ai-capex-2026/', evidenceType: 'official', basis: 'calendar-2026 guidance including ~$25B attributed to higher component pricing' },
      meta: { value: '~$135B', asOf: '2026-04-29', sourceUrl: 'https://analysis-atlas.com/research/hyperscaler-ai-capex-2026/', evidenceType: 'official', basis: 'midpoint of $125\u2013145B calendar-2026 guidance' },
      debtShare: {
        value: '9% \u2192 32% incremental annual debt as a share of hyperscaler capex, FY24 \u2192 LTM mid-2026',
        asOf: '2026-07-27',
        sourceUrl: 'https://insight.factset.com/hyperscalers-tap-external-financing-as-ai-capex-outruns-cash-flow',
        evidenceType: 'official',
        basis: 'FactSet; strongest quantitative claim in the infrastructure section'
      },
      nuclear: {
        value: '9.8 GW committed across 13 hyperscaler nuclear deals; 1.92 GW actually operational (tracker snapshot, May 2026)',
        asOf: '2026-05-31',
        sourceUrl: 'https://smrintel.com/nuclear-data-center-deals/',
        evidenceType: 'tracker',
        basis: 'SMR Intel deal tracker, May 2026 cut. Four apparently independent trackers all trace to this one tracker \u2014 it is one source, not four. The 1.92 GW is a single deal: Amazon\u2019s front-of-meter PPA with Talen for Susquehanna (the 960 MW figure is the plant-side half of the same arrangement).'
      },
      projectKilby: {
        value: '2.67 GW Project Kilby \u2014 20-year PPA signed with Microsoft June 22 2026 under Chevron subsidiary Energy Forge One LLC, off-grid gas in Reeves County, Texas, first power 2028',
        asOf: '2026-06-22',
        sourceUrl: 'https://techcrunch.com/2026/06/22/microsoft-and-chevron-plan-one-of-the-largest-gas-powered-data-center-projects-in-us/',
        evidenceType: 'wire-reported',
        basis: 'Chevron has NOT yet taken final investment decision (expected end-2026), so this is not yet committed capital. The Environmental Integrity Project estimates >13M tons of CO\u2082.'
      }
    },

    /* ── PHYSICAL AI ────────────────────────────────────────────────────── */
    waymo: {
      metros: {
        value: '11 public driverless metros, with four more \u2014 San Diego, Las Vegas, Tampa and Denver \u2014 in employee-only driverless operation from July 8 2026',
        asOf: '2026-07-08',
        sourceUrl: 'https://www.cnbc.com/2026/07/08/waymo-starts-driverless-rides-in-san-diego-las-vegas-tampa-denver.html',
        evidenceType: 'wire-reported',
        basis: 'public commercial service vs employee-only. Phoenix, SF Bay Area, LA, Austin, Atlanta, Dallas, Houston, San Antonio, Orlando, Miami, Nashville.'
      },
      rides: {
        value: '~500,000 paid rides/week \u2014 unchanged since the March 2026 disclosure',
        asOf: '2026-03-27',
        sourceUrl: 'https://techcrunch.com/2026/03/27/waymo-skyrocketing-ridership-in-one-chart/',
        evidenceType: 'company-disclosed',
        basis: 'the flatness is the material fact: the 1M-by-year-end target needs a 2\u00d7 in five months'
      },
      fleet: {
        value: '~3,871 vehicles',
        asOf: '2026-06-17',
        sourceUrl: 'https://roadsigns.com/blogs/resources/how-many-waymo-cars-are-there',
        evidenceType: 'official',
        basis: 'Waymo\u2019s June 17 2026 NHTSA safety filing, up from 3,067 in December 2025'
      },
      miles: {
        value: '220M+ fully autonomous (rider-only) miles through end-March 2026',
        asOf: '2026-06-24',
        sourceUrl: 'https://waymo.com/blog/shorts/safetydata-june26/',
        evidenceType: 'official',
        basis: 'first-party; rider-only miles across five operating geographies. 94% fewer serious-or-fatal-injury crashes; now driving more than 4M miles every week.'
      }
    },

    tesla: {
      miles: {
        value: '2.5M cumulative paid customer miles, of which 380,000 without an in-vehicle safety monitor',
        asOf: '2026-07-23',
        sourceUrl: 'https://www.reuters.com/business/autos-transportation/teslas-once-bullish-tone-robotaxis-shifts-2026-07-23/',
        evidenceType: 'company-disclosed',
        basis: 'disclosed on the Q2 2026 call'
      },
      trend: {
        value: 'Paid mileage fell quarter over quarter \u2014 roughly 1.1M miles added in Q1 2026 against roughly 700K in Q2, a ~36% decline on the most widely reported read of Tesla\u2019s own cumulative chart (Electrek reads both quarters at ~900K)',
        asOf: '2026-07-23',
        sourceUrl: 'https://finance.yahoo.com/technology/ai/articles/tesla-robotaxis-moving-reverse-162959622.html',
        evidenceType: 'wire-reported',
        basis: 'derived from Tesla\u2019s cumulative chart; readings differ. Either way there was no acceleration despite expanding to seven metros.'
      },
      safety: {
        value: 'Tesla\u2019s VP of AI claimed \u201czero notable incidents\u201d across the 380,000 unsupervised miles without defining \u201cnotable\u201d, while Tesla\u2019s own NHTSA disclosures show 22 crashes reported for the robotaxi system',
        asOf: '2026-07-23',
        sourceUrl: 'https://finance.yahoo.com/technology/ai/articles/tesla-robotaxis-moving-reverse-162959622.html',
        evidenceType: 'wire-reported',
        basis: 'company claim balanced against the federal crash reports'
      }
    },

    rhoda: {
      dvc: true,
      figures: {
        value: '>$450M raised \u00b7 >$2.4B valuation',
        asOf: '2026-08-04',
        sourceUrl: '',
        evidenceType: 'company-disclosed',
        basis: 'DVC current \u00b7 company-disclosed \u00b7 unaudited'
      },
      description: {
        value: 'Two-arm general-purpose robot using video models for physical imagination. Not a humanoid.',
        asOf: '2026-08-04',
        sourceUrl: '',
        evidenceType: 'company-disclosed',
        basis: 'the single canonical description \u2014 supersedes earlier "next-gen humanoid robots" and "foundational model for robotics" copy'
      }
    },

    figureAi: {
      valuation: {
        value: '$39B, self-reported, September 2025',
        asOf: '2025-09-16',
        sourceUrl: 'https://www.figure.ai/news/series-c',
        evidenceType: 'company-disclosed',
        basis: 'set by Figure\u2019s own Series C announcement; an 11-month-old self-reported mark on ~$2.34B raised'
      }
    },

    apptronik: {
      raised: {
        value: '~$1.45B+ raised in total, including a $935M round at a >$5.5B valuation',
        asOf: '2026-07-05',
        sourceUrl: 'https://techcrunch.com/2026/07/05/this-humanoid-robotics-company-is-going-public-but-its-ceo-isnt-promising-a-robot-in-your-home-anytime-soon/',
        evidenceType: 'wire-reported',
        basis: 'cumulative funding'
      }
    },

    agility: {
      spac: {
        value: '~$2.5B valuation via merger with Churchill Capital Corp XI, expected to raise >$620M gross \u2014 announced, NOT yet closed',
        asOf: '2026-07-05',
        sourceUrl: 'https://techcrunch.com/2026/07/05/this-humanoid-robotics-company-is-going-public-but-its-ceo-isnt-promising-a-robot-in-your-home-anytime-soon/',
        evidenceType: 'wire-reported',
        basis: 'still needs shareholder approval and SEC review; expected to complete later in 2026'
      }
    },

    /* ── MARKET STRUCTURE ───────────────────────────────────────────────── */
    funding: {
      h1_2026: {
        value: 'OpenAI plus Anthropic absorbed $217B of $510B in H1 2026 \u2014 43% of every venture dollar deployed globally. Excluding the two, H1 2026 global venture funding falls to roughly $293B, about where the market stood in H1 2021.',
        asOf: '2026-07-02',
        sourceUrl: 'https://aiweekly.co/alerts/openai-and-anthropic-take-43-of-h1-2026-venture-funding',
        evidenceType: 'tracker',
        basis: 'Crunchbase H1 2026. Denominator is $510B, not $505B.'
      }
    },

    cerebras: {
      ipo: {
        value: 'Priced at $185, sold 30M shares raising $5.55B, opened at $350, closed day one at $311.07 (+68%) for a market cap of about $95B',
        asOf: '2026-05-14',
        sourceUrl: 'https://www.cnbc.com/2026/05/14/cerebras-cbrs-stock-trade-nasdaq-ipo.html',
        evidenceType: 'wire-reported',
        basis: 'fully-diluted market cap at the day-one close. The largest US tech IPO since Uber in 2019.'
      },
      drawdown: {
        value: '$386.34 peak to ~$176.61 \u2014 roughly \u221254% on price',
        asOf: '2026-07-15',
        sourceUrl: 'https://www.fool.com/investing/2026/05/14/cerebras-just-pulled-off-the-biggest-ipo-of-2026-h/',
        evidenceType: 'wire-reported',
        basis: 'SHARE PRICE basis throughout. Mixing a fully-diluted cap at the high with a float-only cap at the low mechanically exaggerates the drawdown, so price is used for the drawdown and market cap is stated once, on one basis.'
      },
      concentration: {
        value: '$24.6B of RPO concentrated in one customer; management expects to recognise ~15% across 2026\u20132027; ~86% of 2025 revenue came from two UAE-linked customers; 2025 net income of $237.8M included a ~$363M non-cash gain from extinguishing a G42 forward contract, leaving an underlying operating loss of ~$146M',
        asOf: '2026-05-19',
        sourceUrl: 'https://finance.yahoo.com/markets/stocks/articles/cerebras-just-rocketed-onto-nasdaq-130002526.html',
        evidenceType: 'wire-reported',
        basis: 'backlog, customer concentration and earnings quality'
      }
    },

    /* ── REGULATION ─────────────────────────────────────────────────────── */
    euAiAct: {
      aug2026: {
        value: 'August 2, 2026 \u2014 GPAI enforcement powers and Article 50 transparency obligations',
        asOf: '2026-08-03',
        sourceUrl: 'https://digital-strategy.ec.europa.eu/en/policies/enforcement-ai-act',
        evidenceType: 'official',
        basis: 'what actually activated. NOT full high-risk enforcement and NOT "the majority of rules".'
      },
      highRisk: {
        value: 'Stand-alone Annex III high-risk obligations deferred from August 2, 2026 to December 2, 2027 by the Digital Omnibus \u2014 a sixteen-month slip',
        asOf: '2026-08-03',
        sourceUrl: 'https://artificialintelligenceact.eu/enforcement-of-chapter-v-under-the-eu-ai-act/',
        evidenceType: 'official',
        basis: 'the Act now runs on two clocks'
      },
      aug2027: {
        value: 'August 2, 2027 \u2014 GPAI models placed on the market before August 2, 2025 must be fully compliant',
        asOf: '2026-08-03',
        sourceUrl: 'https://artificialintelligenceact.eu/enforcement-of-chapter-v-under-the-eu-ai-act/',
        evidenceType: 'official',
        basis: 'legacy-model compliance deadline \u2014 not a single "full enforcement" date'
      },
      fines: {
        value: 'Article 101: \u20ac15M or 3% of worldwide annual turnover, whichever is higher, for GPAI provider non-compliance; \u20ac35M or 7% applies only to Article 5 prohibited practices; \u20ac7.5M or 1% for incorrect or misleading information to authorities',
        asOf: '2026-08-04',
        sourceUrl: 'https://artificialintelligenceact.eu/article/101/',
        evidenceType: 'official',
        basis: 'regulation text; Article 101 fines are imposed by the Commission directly'
      }
    },

    /* ── PRICING ────────────────────────────────────────────────────────── */
    pricing: {
      gartnerTam: {
        value: 'Up to $234B of enterprise application software spend \u2014 about 20% of the category \u2014 is exposed to agentic arbitrage BY 2030',
        asOf: '2026-07-01',
        sourceUrl: 'https://www.channel-impact.com/gartner-234-billion-in-enterprise-application-software-spend-is-at-risk-from-agentic-ai/',
        evidenceType: 'estimate',
        basis: 'Gartner projection with a 2030 horizon. Without the horizon a reader takes $234B as a present-day loss.'
      },
      gartnerShift: {
        value: 'At least 40% of enterprise SaaS spend shifts to usage-, agent- or outcome-based pricing by 2030, with seat-based revenue falling from 21% to 15% of vendor income',
        asOf: '2026-06-16',
        sourceUrl: 'https://www.cio.com/article/4184688/it-hurtles-toward-the-great-enterprise-pricing-reset.html',
        evidenceType: 'estimate',
        basis: 'Gartner, quoted by CIO and in Deloitte TMT Predictions 2026'
      },
      salesforce: {
        value: 'Agentforce Help Agent reached GA in July 2026 at $2 per resolved issue, with Data 360 and Agentforce usage unmetered inside the interaction and nothing charged when the agent escalates to a human; m3ter was signed June 8 and closed July 1 2026',
        asOf: '2026-07-21',
        sourceUrl: 'https://www.pipelance.com/blog/pay-per-resolution-pricing',
        evidenceType: 'wire-reported',
        basis: 'the incumbent-convert datapoint, with the price the earlier version omitted'
      },
      cognizant: {
        value: '45% of Cognizant\u2019s new BPO contracts are now signed on outcome-based commercial models, on a BPO business growing 9% YoY',
        asOf: '2026-07-06',
        sourceUrl: 'https://www.moneycontrol.com/artificial-intelligence/outcome-based-pricing-gains-ground-as-45-of-cognizant-s-new-bpo-contracts-adopt-the-model-article-13966968.html',
        evidenceType: 'wire-reported',
        basis: 'the shift is happening on a growing base'
      }
    },

    /* ── HEALTHCARE ─────────────────────────────────────────────────────── */
    noharm: {
      benchmark: {
        value: '100 real primary-care-to-specialist consultation cases across 10 specialties, 12,747 expert annotations on 4,249 clinical management options, run across 31 LLMs',
        asOf: '2026-07-29',
        sourceUrl: 'https://stanfordhealthcare.org/v2/publications/968/968514.html',
        evidenceType: 'official',
        basis: 'the benchmark\u2019s own abstract. Fortune reported "1,100 real clinical cases", which is where the error entered. Not peer-reviewed; OpenEvidence contested the scoring.'
      },
      findings: {
        value: '76.6% of harmful errors were omissions (95% CI 76.4\u201376.8%); potential for severe harm in up to 22.2% of cases (95% CI 21.6\u201322.8%), down to ~8.7% for the best models',
        asOf: '2026-07-29',
        sourceUrl: 'https://stanfordhealthcare.org/v2/publications/968/968514.html',
        evidenceType: 'official',
        basis: 'the paper also found doctors with AI gave better care than doctors without'
      }
    },

    /* ── AGENT STACK ────────────────────────────────────────────────────── */
    agentStack: {
      scope: {
        value: '47 mapped companies across 7 layers',
        asOf: '2026-08-04',
        sourceUrl: '',
        evidenceType: 'dvc-analysis',
        basis: 'company count only. The previously shown "$1B+ combined funding" total did not reconcile with the sum of the listed raises and has been removed rather than restated. Individual metrics as of Aug 4 2026.'
      },
      e2b: {
        value: '88% of the Fortune 100 have signed up for E2B sandboxes',
        asOf: '2026-08-04',
        sourceUrl: 'https://e2b.dev/',
        evidenceType: 'company-disclosed',
        basis: 'signups, not usage \u2014 the weaker and accurate verb'
      }
    },

    /* ── INFERENCE COST ─────────────────────────────────────────────────── */
    inference: {
      barbell: {
        value: 'Cost collapsed at the commodity tier while frontier list prices split upward: GPT-5.6 Luna at $1/$6 against Claude Fable 5 at $10/$50. Secondary-source Gemini pricing was removed after audit.',
        asOf: '2026-07-21',
        sourceUrl: 'https://apidog.com/blog/gpt-5-6-pricing/',
        evidenceType: 'wire-reported',
        basis: 'published list prices per 1M input/output tokens, August 2026. Replaces the two incompatible 99.6%-decline time series (GPT-4-class $37.50\u2192$0.14 over 24 months and GPT-3.5-class $20.00\u2192$0.07 over 36 months), neither of which could be sourced to a current index.'
      }
    }
  };

  root.FACTS = F;
  if (typeof module !== 'undefined' && module.exports) module.exports = F;
})(typeof window !== 'undefined' ? window : globalThis);
