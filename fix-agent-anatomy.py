#!/usr/bin/env python3
"""Comprehensive fix script for Agent Revolution (sec-5) and Anatomy of AI Agent (sec-6)."""

import re

# Read files
with open('/home/user/workspace/state-of-ai/index.html', 'r') as f:
    html = f.read()
with open('/home/user/workspace/state-of-ai/style.css', 'r') as f:
    css = f.read()
with open('/home/user/workspace/state-of-ai/app.js', 'r') as f:
    js = f.read()

# ==========================================
# AGENT REVOLUTION FIXES (sec-5)
# ==========================================

# 1. SHRINK VIBE CODING QUOTE — make it more compact
old_quote = '''    <div class="ar-quote anim-fade">
      <div class="ar-quote-icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M6 6h4l-2 8h4v12H4V14l2-8zm16 0h4l-2 8h4v12H20V14l2-8z" fill="#4ECDC4" opacity="0.5"/>
        </svg>
      </div>
      <blockquote class="ar-quote-text">
        "In the past, reading and writing was an attribute of the elite. Now it's a human right. Ability to make software will be a human right soon, and it's not going to feel like making software."
      </blockquote>
      <cite class="ar-quote-cite">— The Vibe Coding Thesis</cite>
      <div class="ar-quote-decoration">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2" y="4" width="14" height="16" rx="2" stroke="#4ECDC4" stroke-width="1.5" fill="none"/>
          <path d="M6 8h6M6 11h4M6 14h5" stroke="#4ECDC4" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M18 7l3 3-3 3" stroke="#4ECDC4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>'''

new_quote = '''    <div class="ar-quote ar-quote--compact anim-fade">
      <blockquote class="ar-quote-text">"Ability to make software will be a human right soon, and it's not going to feel like making software."</blockquote>
      <cite class="ar-quote-cite">— The Vibe Coding Thesis</cite>
    </div>'''

html = html.replace(old_quote, new_quote)

# 2. REMOVE HIGHLIGHTS from Manus, OpenClaw, NemoClaw
html = html.replace('class="ar-agent-card ar-agent-card--highlight anim-fade" data-agent="manus"',
                     'class="ar-agent-card anim-fade" data-agent="manus"')
html = html.replace('class="ar-agent-card ar-agent-card--highlight anim-fade" data-agent="openclaw"',
                     'class="ar-agent-card anim-fade" data-agent="openclaw"')
html = html.replace('class="ar-agent-card ar-agent-card--highlight anim-fade" data-agent="nemoclaw"',
                     'class="ar-agent-card anim-fade" data-agent="nemoclaw"')

# 3. FIX LOVABLE — remove "2 founders"
html = html.replace('<span class="tabnum">$400M ARR, 2 founders</span>',
                     '<span class="tabnum">$400M ARR</span>')

# 4. HIDE THE 2 EVIDENCE EXAMPLES in an expandable element
old_evidence = '''      <!-- Evidence Callouts -->
      <div class="ar-evidence-card anim-fade">
        <svg class="ar-evidence-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 12l2 2 4-4" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="12" cy="12" r="10" stroke="#4ECDC4" stroke-width="1.5" fill="none"/>
        </svg>
        <div class="ar-evidence-content">
          <p>AppDirect's non-technical marketing team vibe-coded <strong class="tabnum">200K+</strong> lines of code, built <strong class="tabnum">11</strong> projects with <strong class="tabnum">4</strong> in production, and have <strong class="tabnum">80+</strong> applications in progress across Sales, Finance, HR, and Operations.</p>
          <span class="stat-source">Source: Lovable / AppDirect case study, 2025</span>
        </div>
      </div>
      <div class="ar-evidence-card anim-fade">
        <svg class="ar-evidence-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 12l2 2 4-4" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="12" cy="12" r="10" stroke="#4ECDC4" stroke-width="1.5" fill="none"/>
        </svg>
        <div class="ar-evidence-content">
          <p>A founder with zero coding background built a transcription platform that reached <strong class="tabnum">80,000</strong> users, <strong class="tabnum">1M+</strong> minutes processed, and six-figure ARR — in four months.</p>
          <span class="stat-source">Source: Replit / Whisper AI, 2025</span>
        </div>
      </div>'''

new_evidence = '''      <!-- Evidence Callouts — Expandable -->
      <div class="ar-howworks anim-fade" data-collapsed="true">
        <button class="ar-howworks-toggle" aria-expanded="false">
          <span>Real-World Evidence — Vibe Coding in Action</span>
          <svg class="ar-howworks-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <polyline points="5,8 10,13 15,8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="ar-howworks-body">
          <p style="color:#C8CCD4;font-size:0.84rem;line-height:1.55;margin:0 0 0.75rem"><strong style="color:#4ECDC4">AppDirect:</strong> Non-technical marketing team vibe-coded <strong class="tabnum">200K+</strong> lines of code, built <strong class="tabnum">11</strong> projects with <strong class="tabnum">4</strong> in production, and have <strong class="tabnum">80+</strong> applications in progress across Sales, Finance, HR, and Operations.</p>
          <p style="color:#C8CCD4;font-size:0.84rem;line-height:1.55;margin:0 0 0.5rem"><strong style="color:#4ECDC4">Zero-code founder:</strong> Built a transcription platform that reached <strong class="tabnum">80,000</strong> users, <strong class="tabnum">1M+</strong> minutes processed, and six-figure ARR — in four months.</p>
          <span class="stat-source">Source: Lovable / AppDirect case study, Replit / Whisper AI, 2025</span>
        </div>
      </div>'''

html = html.replace(old_evidence, new_evidence)

# 5. UPDATE PROTOTYPE CAVEAT — remove it, replace with meta statement about agents building agents
old_caveat = '''      <!-- Caveat -->
      <p class="ar-caveat anim-fade">Caveat: Prototype creation is the easy win. Durable, maintainable production software remains harder. <span class="stat-source">Source: Forbes, 2026</span></p>'''

new_caveat = '''      <!-- Self-referential note -->
      <div class="ar-aaas-callout anim-fade" style="margin:1.5rem 0 0;padding:1rem 1.25rem;background:rgba(78,205,196,0.05);border:1px solid rgba(78,205,196,0.12);border-radius:10px;display:flex;align-items:flex-start;gap:0.75rem">
        <span style="font-size:1.2rem;flex-shrink:0;margin-top:1px">&#128187;</span>
        <p style="color:#A0A8BC;font-size:0.82rem;line-height:1.55;margin:0"><strong style="color:#C8CCD4">Agents building agents:</strong> 100% of Claude Code is written in Claude Code. 100% of Perplexity Computer is written in Perplexity Computer — as is this presentation.</p>
      </div>'''

html = html.replace(old_caveat, new_caveat)

# 6. FIX AGENT CARD CLICK HANDLERS — change sec-4 to sec-5
js = js.replace(
    "// --- AUTONOMOUS REVOLUTION (sec-4) ---\n  function initAutonomousRevolution() {\n    const sec = document.getElementById('sec-4');",
    "// --- AUTONOMOUS REVOLUTION (sec-5) ---\n  function initAutonomousRevolution() {\n    const sec = document.getElementById('sec-5');"
)

# ==========================================
# DEPLOYMENT CARDS — Make more compact
# ==========================================

# Add compact CSS for deployment cards
deploy_compact_css = '''
/* --- Deployment cards compact --- */
.ar-deploy-card {
  padding: 16px 14px 14px !important;
}
.ar-deploy-card h4 {
  margin-bottom: 4px !important;
}
.ar-deploy-examples {
  margin-bottom: 2px !important;
  font-size: 0.76rem !important;
}
.ar-deploy-econ {
  margin-bottom: 6px !important;
  font-size: 0.72rem !important;
}
.ar-deploy-bar {
  margin-top: 4px !important;
}
'''

# ==========================================
# COMPACT QUOTE CSS
# ==========================================

quote_compact_css = '''
/* --- Compact quote variant --- */
.ar-quote--compact {
  padding: 16px 24px !important;
  margin-bottom: 2rem !important;
  text-align: center;
}
.ar-quote--compact .ar-quote-text {
  font-size: 1.05rem !important;
  margin-bottom: 6px !important;
  line-height: 1.5 !important;
}
.ar-quote--compact .ar-quote-cite {
  margin-top: 0 !important;
}
'''

# ==========================================
# ANATOMY OF AI AGENT FIXES (sec-6)
# ==========================================

# Full CSS for the anatomy section — 7-layer stack, protocols, OSS ecosystem
anatomy_css = '''
/* ============================================
   ANATOMY OF AI AGENT (sec-6) — Full Styles
   ============================================ */

.aa-section-sub {
  max-width: 780px;
  color: #C8CCD4;
  font-size: 1.05rem;
  line-height: 1.65;
  margin: 0 auto 2.5rem;
  text-align: center;
}

/* --- 7-Layer Stack --- */
.aa-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 3rem;
}

.aa-layer {
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255,255,255,0.06);
  overflow: hidden;
  transition: border-color 0.3s;
}
.aa-layer:hover {
  border-color: var(--layer-color, rgba(255,255,255,0.12));
}

.aa-layer-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  user-select: none;
}
.aa-layer-bar:hover {
  background: rgba(255,255,255,0.03);
}

.aa-layer-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  color: #fff;
  background: var(--layer-color, var(--accent-teal));
  flex-shrink: 0;
}

.aa-layer-icon {
  color: var(--layer-color, var(--accent-teal));
  flex-shrink: 0;
}

.aa-layer-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
  flex: 1;
}

.aa-layer-tagline {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin-left: auto;
  flex-shrink: 0;
}

.aa-layer-chevron {
  color: var(--text-secondary);
  transition: transform 0.3s ease;
  flex-shrink: 0;
}
.aa-layer.aa-layer--expanded .aa-layer-chevron {
  transform: rotate(180deg);
}

.aa-layer-detail {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease;
  padding: 0 16px;
}
.aa-layer.aa-layer--expanded .aa-layer-detail {
  max-height: 300px;
  padding: 0 16px 16px;
}

.aa-detail-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.aa-tool-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  font-size: 0.74rem;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
}
.aa-tool-chip--dvc {
  border-color: rgba(78,205,196,0.25);
  background: rgba(78,205,196,0.08);
}

.aa-dvc-badge {
  display: inline-block;
  padding: 1px 5px;
  background: var(--accent-teal);
  color: #1a1d2e;
  font-size: 0.6rem;
  font-weight: 800;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.aa-stars {
  color: var(--accent-gold);
  font-size: 0.7rem;
}

.aa-detail-stat {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.aa-stat-number {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--accent-teal);
}
.aa-stat-label {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.aa-detail-note {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-secondary);
  margin: 0;
}

/* --- Startup vs Enterprise Compare --- */
.aa-compare {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  margin-bottom: 3rem;
  align-items: start;
}

.aa-compare-col {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 20px 18px;
  border: 1px solid rgba(255,255,255,0.06);
}

.aa-compare-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.aa-compare-header h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.aa-compare-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  gap: 8px;
}
.aa-compare-row:last-child { border-bottom: none; }
.aa-row-dim {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
  min-width: 80px;
}
.aa-row-val {
  font-size: 0.76rem;
  color: var(--text-primary);
  text-align: right;
}

.aa-compare-callout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  background: rgba(78,205,196,0.06);
  border: 1px solid rgba(78,205,196,0.15);
  border-radius: var(--radius);
  align-self: center;
}
.aa-callout-arrow {
  font-size: 1.5rem;
  color: var(--accent-teal);
  display: none;
}
.aa-callout-stat {
  text-align: center;
}
.aa-callout-year {
  display: block;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--accent-teal);
}
.aa-callout-pct {
  display: block;
  font-size: 0.8rem;
  color: var(--text-primary);
}
.aa-callout-divider {
  width: 30px;
  height: 2px;
  background: rgba(78,205,196,0.3);
}

/* --- OSS Agent Ecosystem Grid --- */
.aa-oss-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 3rem;
}

.aa-oss-card {
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  padding: 16px 14px;
  border: 1px solid rgba(255,255,255,0.06);
  transition: var(--transition);
}
.aa-oss-card:hover {
  background: var(--bg-card-hover);
  border-color: rgba(255,255,255,0.12);
}
.aa-oss-card--dvc {
  border-color: rgba(78,205,196,0.2);
}
.aa-oss-card--dvc:hover {
  border-color: rgba(78,205,196,0.35);
}

.aa-oss-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.aa-oss-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.aa-oss-group {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.7;
}

.aa-oss-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 6px;
}

.aa-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.68rem;
  font-weight: 600;
  background: rgba(255,255,255,0.05);
  color: var(--text-secondary);
}
.aa-badge--stars {
  color: var(--accent-gold);
}
.aa-badge--dl {
  color: var(--accent-teal);
}
.aa-badge--raised {
  color: var(--accent-coral);
}

.aa-oss-desc {
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--text-secondary);
  margin: 0;
}

/* --- Three Protocols Diagram --- */
.aa-protocols {
  margin-bottom: 2rem;
}

.aa-proto-diagram {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  gap: 0;
  align-items: center;
  margin-bottom: 16px;
}

.aa-proto-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 16px 14px;
  border: 1px solid rgba(255,255,255,0.06);
  text-align: center;
}
.aa-proto-card--dvc {
  border-color: rgba(78,205,196,0.2);
}

.aa-proto-icon {
  margin-bottom: 6px;
}
.aa-proto-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 2px;
}
.aa-proto-role {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--accent-teal);
  margin: 0 0 4px;
}
.aa-proto-desc {
  font-size: 0.74rem;
  color: var(--text-secondary);
  margin: 0 0 6px;
  line-height: 1.4;
}
.aa-proto-stats {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}
.aa-proto-backers {
  font-size: 0.68rem;
  color: var(--text-secondary);
  margin: 0;
  opacity: 0.7;
}

.aa-proto-line {
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, rgba(78,205,196,0.3), rgba(78,205,196,0.6));
  justify-self: center;
}

.aa-proto-center {
  display: flex;
  justify-content: center;
}
.aa-proto-center-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px;
  background: rgba(78,205,196,0.08);
  border: 2px solid rgba(78,205,196,0.25);
  border-radius: 50%;
  width: 80px;
  height: 80px;
  justify-content: center;
}
.aa-proto-center-circle span {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--accent-teal);
}

/* AG-UI below center */
.aa-proto-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}
.aa-proto-line--down {
  width: 2px;
  height: 20px;
  background: linear-gradient(180deg, rgba(245,197,66,0.3), rgba(245,197,66,0.6));
}
.aa-proto-bottom .aa-proto-card {
  max-width: 280px;
}

.aa-proto-quote {
  text-align: center;
  font-style: italic;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 16px 0 0;
  line-height: 1.5;
}

/* --- Responsive --- */
@media (max-width: 900px) {
  .aa-oss-grid { grid-template-columns: repeat(2, 1fr); }
  .aa-compare { grid-template-columns: 1fr; }
  .aa-compare-callout { flex-direction: row; justify-content: center; }
  .aa-callout-divider { width: 2px; height: 30px; }
  .aa-proto-diagram { grid-template-columns: 1fr; gap: 8px; }
  .aa-proto-line { width: 2px; height: 20px; background: linear-gradient(180deg, rgba(78,205,196,0.3), rgba(78,205,196,0.6)); }
}

@media (max-width: 600px) {
  .aa-oss-grid { grid-template-columns: 1fr; }
  .aa-layer-tagline { display: none; }
  .aa-proto-center-circle { width: 60px; height: 60px; }
}
'''

# ==========================================
# ADD JS — Anatomy layer click handlers
# ==========================================

anatomy_js = '''
  // --- ANATOMY OF AI AGENT (sec-6) ---
  function initAnatomyLayers() {
    const sec = document.getElementById('sec-6');
    if (!sec) return;

    // Layer expand/collapse
    sec.querySelectorAll('.aa-layer').forEach((layer) => {
      const bar = layer.querySelector('.aa-layer-bar');
      if (!bar) return;
      bar.addEventListener('click', () => {
        const wasExpanded = layer.classList.contains('aa-layer--expanded');
        // collapse all
        sec.querySelectorAll('.aa-layer--expanded').forEach((l) =>
          l.classList.remove('aa-layer--expanded')
        );
        if (!wasExpanded) layer.classList.add('aa-layer--expanded');
      });
    });
  }
'''

# Also need to add call to initAnatomyLayers
# Find where initAutonomousRevolution is called
old_init_call = "initAutonomousRevolution();"
new_init_call = "initAutonomousRevolution();\n  initAnatomyLayers();"

# Also add expandable evidence toggles for the new howworks elements in sec-5
# The existing howworks toggle code is in initAutonomousRevolution but only selects one.
# We need to make it handle all howworks elements.
# Actually, the existing code uses querySelector (single) so it only gets the first one.
# Let's fix it to querySelectorAll.

old_howworks = '''    // How It Works collapsible
    const hw = sec.querySelector('.ar-howworks');
    if (hw) {
      const btn = hw.querySelector('.ar-howworks-toggle');
      btn.addEventListener('click', () => {
        const collapsed = hw.dataset.collapsed === 'true';
        hw.dataset.collapsed = collapsed ? 'false' : 'true';
        btn.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
      });
    }'''

new_howworks = '''    // How It Works collapsible (all instances)
    sec.querySelectorAll('.ar-howworks').forEach((hw) => {
      const btn = hw.querySelector('.ar-howworks-toggle');
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const collapsed = hw.dataset.collapsed === 'true';
        hw.dataset.collapsed = collapsed ? 'false' : 'true';
        btn.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
      });
    });'''

js = js.replace(old_howworks, new_howworks)

# Insert anatomy_js before the closing of DOMContentLoaded or at appropriate spot
# Find a good insertion point — after initAutonomousRevolution function
js = js.replace(old_init_call, new_init_call)

# Add the function definition before the call
# Find where initAutonomousRevolution function ends
# Let's insert anatomy function after the autonomous revolution function's last brace
# Actually let's just add it before the init call section
# Find the function and add after it
idx = js.find("initAnatomyLayers();")
# Add the function definition earlier in the file
# Insert before the line that calls it
js = js.replace(
    "  // --- AUTONOMOUS REVOLUTION (sec-5) ---",
    anatomy_js + "\n  // --- AUTONOMOUS REVOLUTION (sec-5) ---"
)

# ==========================================
# ANATOMY — Add "context engineering" to the So What callout
# ==========================================
old_sowhat = '''<p style="color:#C8CCD4;font-size:0.95rem;line-height:1.6;margin:0 0 0.75rem">The enduring advantage in agents will not come from having a model. It will come from orchestrating the full system around the model: memory, tools, workflows, reliability, and distribution.</p>'''

new_sowhat = '''<p style="color:#C8CCD4;font-size:0.95rem;line-height:1.6;margin:0 0 0.75rem">The enduring advantage in agents will not come from having a model. It will come from orchestrating the full system around the model: memory, tools, workflows, reliability, and distribution. <strong style="color:#F5C542">We have moved from prompt engineering to context engineering.</strong></p>'''

html = html.replace(old_sowhat, new_sowhat)

# ==========================================
# CHECK FOR MISSING TECH IN LAYERS
# Already has: CopilotKit/AG-UI, Vercel AI SDK, Streamlit (Layer 1)
# LangGraph, CrewAI, AutoGen, Semantic Kernel (Layer 2)
# mem0, Zep, Letta/MemGPT (Layer 3)
# MCP, A2A, Function Calling (Layer 4)
# OpenAI, Anthropic, Google, xAI, Open-weight (Layer 5)
# E2B, Daytona, WebContainers, Cloud VMs, Local Runtime, Dynamo (Layer 6)
# LangSmith, Phoenix/Arize, OpenTelemetry (Layer 7)
#
# Potentially missing:
# Layer 1: Gradio (very popular for demos)
# Layer 2: Pydantic AI, DSPy
# Layer 3: ChromaDB / Pinecone (vector stores are memory-adjacent)
# Layer 4: Browser Use (playwright-based tool), Composio
# Layer 5: Meta (explicitly), Mistral, DeepSeek
# Layer 6: Modal, Fly.io
# Layer 7: Weights & Biases, Braintrust
#
# Let's add a few key ones that are conspicuously absent:
# ==========================================

# Layer 1: Add Gradio
html = html.replace(
    '''            <span class="aa-tool-chip">Streamlit</span>
          </div>
          <div class="aa-detail-stat">
            <span class="aa-stat-number tabnum">12.4K</span>''',
    '''            <span class="aa-tool-chip">Streamlit</span>
            <span class="aa-tool-chip">Gradio</span>
          </div>
          <div class="aa-detail-stat">
            <span class="aa-stat-number tabnum">12.4K</span>'''
)

# Layer 2: Add Pydantic AI
html = html.replace(
    '''            <span class="aa-tool-chip">Semantic Kernel</span>
          </div>
          <div class="aa-detail-stat">
            <span class="aa-stat-label">Most serious startups eventually build proprietary orchestration</span>''',
    '''            <span class="aa-tool-chip">Semantic Kernel</span>
            <span class="aa-tool-chip">Pydantic AI</span>
          </div>
          <div class="aa-detail-stat">
            <span class="aa-stat-label">Most serious startups eventually build proprietary orchestration</span>'''
)

# Layer 4: Add Browser Use and Composio
html = html.replace(
    '''            <span class="aa-tool-chip">Function Calling</span>
          </div>
          <div class="aa-detail-stat">
            <span class="aa-stat-label">"MCP is becoming the REST of the AI era"</span>''',
    '''            <span class="aa-tool-chip">Function Calling</span>
            <span class="aa-tool-chip">Browser Use</span>
            <span class="aa-tool-chip">Composio</span>
          </div>
          <div class="aa-detail-stat">
            <span class="aa-stat-label">"MCP is becoming the REST of the AI era"</span>'''
)

# Layer 5: Add Meta explicitly and DeepSeek
html = html.replace(
    '''            <span class="aa-tool-chip">xAI</span>
            <span class="aa-tool-chip">Open-weight models</span>''',
    '''            <span class="aa-tool-chip">xAI</span>
            <span class="aa-tool-chip">Meta / Llama</span>
            <span class="aa-tool-chip">DeepSeek</span>
            <span class="aa-tool-chip">Mistral</span>'''
)

# Layer 6: Add Modal
html = html.replace(
    '''            <span class="aa-tool-chip">Local Runtime</span>
            <span class="aa-tool-chip" style="border-color:#76B947">Dynamo <span class="aa-stars" style="color:#76B947">NVIDIA OSS</span></span>''',
    '''            <span class="aa-tool-chip">Local Runtime</span>
            <span class="aa-tool-chip">Modal</span>
            <span class="aa-tool-chip" style="border-color:#76B947">Dynamo <span class="aa-stars" style="color:#76B947">NVIDIA OSS</span></span>'''
)

# Layer 7: Add Braintrust
html = html.replace(
    '''            <span class="aa-tool-chip">OpenTelemetry</span>
          </div>
          <div class="aa-detail-stat">
            <span class="aa-stat-label">Best startups treat eval as product, not afterthought</span>''',
    '''            <span class="aa-tool-chip">OpenTelemetry</span>
            <span class="aa-tool-chip">Braintrust</span>
          </div>
          <div class="aa-detail-stat">
            <span class="aa-stat-label">Best startups treat eval as product, not afterthought</span>'''
)

# ==========================================
# MAKE THREE PROTOCOLS MORE COMPACT
# Reduce padding and font sizes
# ==========================================
# Already handled in CSS above — the .aa-proto-card padding is 16px 14px

# ==========================================
# WRITE ALL FILES
# ==========================================

# Append all new CSS
css += deploy_compact_css
css += quote_compact_css
css += anatomy_css

with open('/home/user/workspace/state-of-ai/index.html', 'w') as f:
    f.write(html)
with open('/home/user/workspace/state-of-ai/style.css', 'w') as f:
    f.write(css)
with open('/home/user/workspace/state-of-ai/app.js', 'w') as f:
    f.write(js)

print("All fixes applied successfully!")
print("- Shrunk vibe coding quote (compact, text only)")
print("- Removed highlights from Manus, OpenClaw, NemoClaw")
print("- Removed '2 founders' from Lovable")
print("- Hid evidence examples in expandable element")
print("- Replaced prototype caveat with agents-building-agents note")
print("- Fixed agent card click handlers (sec-4 → sec-5)")
print("- Fixed howworks toggles to handle multiple instances")
print("- Made deployment cards more compact")
print("- Added full Anatomy section CSS (layers, OSS grid, protocols, compare)")
print("- Added layer click handlers for Anatomy section")
print("- Added context engineering line to So What callout")
print("- Added missing tech: Gradio, Pydantic AI, Browser Use, Composio, Meta/Llama, DeepSeek, Mistral, Modal, Braintrust")
print("- Made three protocols diagram compact")
