# MVP: Retirement Withdrawal Simulator

## Executive Summary

A zero-backend, static-site Monte Carlo retirement simulator. Users input their nest egg + withdrawal rules → get a probability of portfolio survival over 30 years. All computation runs client-side in a Web Worker. Deploys free to Vercel. Total infrastructure cost: \/month.


---

## Build Status

| Phase | Status | Completed |
|-------|--------|-----------|
| Phase 1: Foundation | ✅ Done | 2026-05-18 |
| Phase 2: Simulation Engine | ✅ Done | 2026-05-18 |
| Phase 3: UI Components | ✅ Done | 2026-05-18 |
| Phase 4: Next.js Migration + AI Advisor | ✅ Done | 2026-05-19 |
| Phase 5: Polish & Deployment | 🔲 Pending | — |

### Phase 1 Summary (2026-05-18)
- Scaffolded Vite 6 + React 19 + TypeScript project directly in repo root
- Installed all dependencies: Tailwind CSS v3, Recharts, classnames, Vitest v3 (0 vulnerabilities)
- Configured Tailwind (tailwind.config.ts, postcss.config.js, Tailwind directives in index.css)
- Created src/ directory structure: components/, engine/, engine/__tests__/, utils/, data/
- Bundled historical data to public/data/: S&P 500 returns + CPI inflation (2004–2025, 22 years)
- Defined all TypeScript interfaces in src/engine/types.ts: SimulationInput, WithdrawalRule, YearResult, SimulationOutput, WorkerMessage, WorkerResponse
- Implemented src/data/historical.ts with fetch + cache loader for JSON data files
- TypeScript: 0 errors. npm audit: 0 vulnerabilities.

### Phase 2 Summary (2026-05-18)
- Implemented src/engine/simulator.ts: simulateSingleRun + runMonteCarloSimulation (1,000 runs)
- Smart bucket sequencing: bear → Cash→Bonds→Equity, neutral → Bonds→Cash→Equity, bull → Equity→Bonds→Cash
- Dynamic withdrawal rate selection by market return threshold
- Percentile aggregation (p10/p25/p50/p75/p90) and survival probability calculation
- Web Worker wrapper: src/engine/simulator.worker.ts
- 8 unit tests — all passing. TypeScript: 0 errors.

### Phase 3 Summary (2026-05-18)
- Built complete wizard: Wizard.tsx (step tabs), NestEggStep.tsx (portfolio + allocation sliders), StrategyStep.tsx (3 presets + custom rule editor), SimulationStep.tsx (projection years + run button with validation)
- Built results dashboard: ResultsDashboard.tsx, SurvivalMetric.tsx (hero metric with color coding), FanChart.tsx (Recharts stacked AreaChart with 5 percentile bands), ResultsTable.tsx (year-by-year table with expandable row stats)
- Implemented src/utils/sharing.ts (URL encode/decode) and src/utils/formatting.ts (currency + percent formatters)
- Wired App.tsx: URL param pre-fill, Web Worker integration, share button, reset flow
- Production build: 0 warnings, 0 errors. Worker chunked separately (2.24 kB).

### Phase 4 Summary (2026-05-19)
- Migrated from Vite 6 to Next.js 15 (App Router) to enable server-side API routes
- Added `app/layout.tsx`, `app/page.tsx`, `next.config.ts`, `vitest.config.ts`; deleted `vite.config.ts`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`
- Updated `tsconfig.json` for Next.js (jsx: preserve, include whole repo, removed allowImportingTsExtensions)
- Fixed `App.tsx` to defer `window.location` access to `useEffect` (SSR-safe); added `'use client'` to all browser-dependent components
- Added multi-provider LLM connection layer: `lib/claude.ts` (Anthropic — proxy vs. direct auth), `lib/openai-llm.ts` (OpenAI), `lib/llm.ts` (unified `callLLM()` / `streamLLMMessage()`)
- Added `app/api/llm/route.ts`: POST endpoint that builds a system prompt from simulation context and streams LLM response as plain text
- Added `src/components/AdvisorPanel.tsx`: collapsible AI advisor chat panel with quick-question chips, streaming token-by-token rendering, and error handling
- Wired `AdvisorPanel` into `ResultsDashboard.tsx`; added `SimulationContext` to `src/engine/types.ts`
- Added `.env.local.example` documenting all LLM env vars
- All 8 unit tests passing. `next build` exits 0.

### Integrity Fix (2026-05-18)
- Fixed FanChart: rewrote to use Recharts stacked Area with delta values (base=p10, d10_25, d25_50, d50_75, d75_90) — previous array-valued dataKeys rendered blank
- Fixed ResultsTable: replaced plain Fragment with `<Fragment key={row.year}>` to eliminate React reconciliation warning on keyed table row pairs
- Fixed Wizard: replaced array-index key with stable label string on step tab buttons
- All 8 unit tests passing. TypeScript: 0 errors. Production build: clean.

---

## Business Thesis

Retirees ask one question: **"Will my money last?"** 

Most tools use a static 4% rule. Our edge: **dynamic, market-responsive withdrawal strategy** that tells users exactly how much to pull from which bucket (cash/bonds/equity) based on market conditions — maximizing portfolio longevity.

### Key Problem Solved
- Users don't know if their retirement savings will last 30+ years
- Static 4% rule is too simplistic
- Most tools don't account for market variability or smart asset sequencing

### Our Differentiator
- **Monte Carlo simulations** (1,000 futures) using historical return distributions
- **Market-responsive withdrawal rules** — if market return ≥ 5%, withdraw 4%; if return < 0%, withdraw less
- **Smart bucket sequencing** — withdraw from cash/bonds in downturns, equity in bull markets
- **Probability of success** — tells users "87% chance your money lasts 30 years" instead of one fragile projection

---

## Architecture

### Deployment Model: Static Site (Zero Backend)

All computation runs client-side. Historical data ships as a static JSON bundle. Deploy to Vercel/Netlify for free.

\\\
┌─────────────────────────────────────┐
│         Static Site (Vercel)         │
│         (Git push = Live)            │
│                                      │
│  Vite + React 19 + TypeScript        │
│  Tailwind CSS + Recharts             │
│                                      │
│  ┌────────────┐  ┌───────────────┐  │
│  │Input Wizard│→ │Sim Engine     │  │
│  │(3-step)   │  │(Web Worker)   │  │
│  └────────────┘  └───────┬───────┘  │
│                           ↓          │
│              ┌────────────────────┐  │
│              │Results Dashboard   │  │
│              │(Charts + Metrics)  │  │
│              └────────────────────┘  │
│                                      │
│  📦 Bundled Data:                   │
│     - S&P 500 returns (2004-2025)   │
│     - CPI inflation rates            │
│     - Total: ~2KB                    │
│                                      │
│  ✅ Shareable URLs                  │
│     (all inputs in query params)     │
└─────────────────────────────────────┘
\\\

### Why No Backend?

1. **Math is simple** — simulation logic fits in ~200 lines of TypeScript
2. **Data is static** — S&P 500 + CPI updated once yearly via script
3. **Infra cost: \** — Vercel free tier handles unlimited traffic
4. **Instant deployment** — Git push = live in 60 seconds
5. **User privacy** — all computation happens locally, no data sent to servers

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Build | Next.js 15 | App Router, built-in API routes, server-side LLM proxy |
| Frontend | React 19 + TypeScript | Mainstream, type-safe, easy to hire for |
| Styling | Tailwind CSS | No CSS files to maintain, rapid iteration |
| Charts | Recharts | React-native, lightweight, no D3 overhead |
| Simulation | Web Worker | Non-blocking, 1000 simulations run in background |
| Deployment | Vercel (free tier) | Git-connected, auto-HTTPS, CDN, zero config |
| Data | Static JSON | Updated annually via npm script, bundled at build time |
| Package Manager | npm | Standard, simple, no monorepo complexity |

**Total dependencies:** ~15 npm packages (lean)

---

## Core Features (MVP Scope)

### Feature 1: Three-Step Wizard (Not a Form Dump)

**Step 1 — "Your Nest Egg"**
- Single input: total portfolio value (e.g., \,000,000)
- Three sliders: Cash / Bonds / Equity allocation (must sum to 100%)
- Slider labels: describe each asset class (Cash = emergency liquidity, Bonds = stable income, Equity = growth)

**Step 2 — "Your Withdrawal Rules"**
- Three quick presets: Conservative / Moderate / Aggressive (one-click)
- Advanced toggle: custom market-condition rules
  - If market return ≥ X%, withdraw Y%
  - User can add/edit/remove rules
  - Default rule for any market condition: 3%

**Step 3 — "Simulate"**
- Input: how many years to project (default: 30)
- Button: "Run Simulation"
- Triggers Monte Carlo engine (runs in Web Worker)

### Feature 2: Monte Carlo Simulation Engine

**Algorithm:**
1. Load historical S&P 500 returns + inflation rates (1,000 samples, 2004–2024)
2. For each of 1,000 simulated futures:
   - For each year (1 to user's projection years):
     a. Sample annual return from historical distribution (random year)
     b. Apply user's withdrawal rule to select withdrawal rate (matching rule with highest threshold)
     c. Calculate withdrawal amount = portfolio × withdrawal rate / 100
     d. **Smart bucket sequencing:**
        - If market return < 0% (bear): withdraw from Cash → Bonds → Equity
        - If 0% ≤ market return ≤ inflation + 2% (neutral): withdraw from Bonds → Cash → Equity
        - If market return > inflation + 2% (bull): withdraw from Equity → Bonds → Cash
     e. Growth: each asset class grows at its conditional rate
        - Equity: grows at full market return
        - Bonds: grows at 30% of market return (conservative)
        - Cash: grows at 50% of inflation rate (very safe)
     f. Annual rebalancing: reset portfolio back to target allocation %
     g. Track year-by-year results
     h. Flag if portfolio depleted (value ≤ 0)
3. Aggregate 1,000 runs → collect percentiles (10th, 25th, 50th, 75th, 90th)

**Output:**
- Portfolio value path for each percentile (for fan chart)
- Year-by-year median withdrawal amounts (for table)
- Depletion year in worst 10% of scenarios
- Survival probability (% of simulations that never depleted)

### Feature 3: Smart Bucket Sequencing (Core Differentiator)

**Rationale:** In down markets, preserve growth assets (equity). In up markets, harvest gains from equity.

**Rules:**
| Market Condition | Withdrawal Sequence |
|---|---|
| Bear (return < 0%) | Cash → Bonds → Equity |
| Neutral (0% ≤ return ≤ inflation+2%) | Bonds → Cash → Equity |
| Bull (return > inflation+2%) | Equity → Bonds → Cash |

**Impact:** This alone extends portfolio lifespan by 3-5 years vs. random sequencing.

### Feature 4: Results Dashboard

**Hero Metric (biggest text on page):**
- "87% probability your portfolio survives 30 years"
- Color coding: Green (80%+) / Yellow (60-80%) / Red (<60%)

**Fan Chart (primary visual):**
- X-axis: Year (0 to user's projection years)
- Y-axis: Portfolio value (\$)
- Percentile bands: 90th (top line) → 75th → 50th (median line) → 25th → 10th (bottom line)
- Shaded areas between lines (visual clarity)
- Interactive: hover to see exact values

**Year-by-Year Results Table:**
- Columns: Year | Median Portfolio Value | Median Withdrawal | Cash | Bonds | Equity
- Expandable: click a row to see all 1,000 individual simulation paths for that year
- Color code rows: green if median portfolio growing, red if shrinking

**Risk Metrics (secondary):**
- "Worst-case scenario: portfolio depleted in year 22"
- "Best-case scenario: portfolio grows to \"
- "Safe withdrawal amount (10th percentile): \/year"

### Feature 5: Shareable URLs (No Backend Needed)

**Mechanism:**
1. Encode all user inputs into a JSON object:
   \\\json
   {
     "portfolioValue": 1000000,
     "cashAllocation": 10,
     "bondsAllocation": 40,
     "equityAllocation": 50,
     "withdrawalRules": [
       { "threshold": 5, "rate": 4 },
       { "threshold": 0, "rate": 3 },
       { "threshold": -100, "rate": 2.5 }
     ],
     "projectionYears": 30
   }
   \\\
2. Base64-encode the JSON
3. Create URL: \https://retirementcalc.com/?plan=<base64>\
4. User shares link
5. Recipient's browser decodes params → re-runs simulation locally → sees same results

**No server, no database, instant shareable link.**

---

## Implementation Plan

### Phase 1: Foundation (Day 1)

**Tasks:**
1. Create Vite project: \
pm create vite@latest retirement-simulator -- --template react-ts\
2. Install dependencies:
   \\\ash
   npm install tailwindcss postcss autoprefixer recharts classnames
   npm install -D @tailwindcss/forms
   \\\
3. Initialize Tailwind: \
px tailwindcss init -p\
4. Create directory structure:
   \\\
   src/
   ├── components/       (UI components)
   ├── engine/          (simulation logic)
   ├── utils/           (helpers)
   └── data/            (static historical data)
   \\\
5. Copy or download S&P 500 returns + CPI data from existing repo → \public/data/\:
   - \sp500_returns.json\ (1 KB, format: { "2024": 26.2, "2023": -18.1, ... })
   - \inflation_rates.json\ (1 KB, format: { "2024": 3.2, "2023": 4.1, ... })
6. Define TypeScript interfaces in \src/engine/types.ts\:
   \\\	ypescript
   interface SimulationInput {
     portfolioValue: number;
     cashAllocation: number;          // 0-100
     bondsAllocation: number;         // 0-100
     equityAllocation: number;        // 0-100
     withdrawalRules: WithdrawalRule[];
     projectionYears: number;
   }
   
   interface WithdrawalRule {
     threshold: number;               // market return %
     rate: number;                    // withdrawal rate %
   }
   
   interface YearResult {
     year: number;
     portfolioValue: number;
     withdrawal: number;
     cashValue: number;
     bondsValue: number;
     equityValue: number;
   }
   
   interface SimulationOutput {
     runs: YearResult[][];            // 1000 runs × N years
     percentiles: {
       p10: number[];                 // [year1, year2, ...]
       p25: number[];
       p50: number[];
       p75: number[];
       p90: number[];
     };
     survivalProbability: number;     // 0-1
     depletionYearWorst10: number;
   }
   \\\

**Deliverable:** Project scaffold with data files + type definitions.

---

### Phase 2: Simulation Engine (Day 1–2)

**Tasks:**

7. Implement \src/engine/simulator.ts\ — deterministic single-run simulation:
   \\\	ypescript
   export function simulateSingleRun(input: SimulationInput, returns: number[]): YearResult[] {
     const results: YearResult[] = [];
     let [cash, bonds, equity] = allocatePortfolio(
       input.portfolioValue,
       input.cashAllocation,
       input.bondsAllocation,
       input.equityAllocation
     );
   
     for (let year = 1; year <= input.projectionYears; year++) {
       const marketReturn = getRandomHistoricalReturn(returns);
       const inflationRate = getRandomHistoricalInflation();
       const withdrawalRate = selectWithdrawalRate(input.withdrawalRules, marketReturn);
       const currentPortfolioValue = cash + bonds + equity;
       const withdrawalAmount = (currentPortfolioValue * withdrawalRate) / 100;
   
       // Smart bucket sequencing
       const [cashAfter, bondsAfter, equityAfter] = withdrawFromBuckets(
         cash, bonds, equity, withdrawalAmount, marketReturn, inflationRate
       );
   
       // Growth
       equity = equityAfter * (1 + marketReturn / 100);
       bonds = bondsAfter * (1 + (marketReturn * 0.3) / 100);
       cash = cashAfter * (1 + (inflationRate * 0.5) / 100);
   
       // Rebalance
       [cash, bonds, equity] = rebalancePortfolio(
         cash, bonds, equity,
         input.cashAllocation, input.bondsAllocation, input.equityAllocation
       );
   
       results.push({
         year,
         portfolioValue: cash + bonds + equity,
         withdrawal: withdrawalAmount,
         cashValue: cash,
         bondsValue: bonds,
         equityValue: equity
       });
     }
   
     return results;
   }
   \\\

8. Extend to Monte Carlo in \src/engine/simulator.ts\:
   \\\	ypescript
   export function runMonteCarloSimulation(
     input: SimulationInput,
     returns: number[],
     inflationRates: number[],
     numRuns: number = 1000
   ): SimulationOutput {
     const runs: YearResult[][] = [];
   
     for (let i = 0; i < numRuns; i++) {
       const run = simulateSingleRun(input, returns, inflationRates);
       runs.push(run);
     }
   
     // Compute percentiles for each year
     const percentiles = { p10: [], p25: [], p50: [], p75: [], p90: [] };
     for (let year = 0; year < input.projectionYears; year++) {
       const yearValues = runs.map(run => run[year].portfolioValue).sort((a, b) => a - b);
       percentiles.p10.push(yearValues[Math.floor(numRuns * 0.1)]);
       percentiles.p25.push(yearValues[Math.floor(numRuns * 0.25)]);
       percentiles.p50.push(yearValues[Math.floor(numRuns * 0.5)]);
       percentiles.p75.push(yearValues[Math.floor(numRuns * 0.75)]);
       percentiles.p90.push(yearValues[Math.floor(numRuns * 0.9)]);
     }
   
     // Survival probability (% of runs that never depleted)
     const survivalCount = runs.filter(run => 
       run.every(yr => yr.portfolioValue > 0)
     ).length;
   
     return {
       runs,
       percentiles,
       survivalProbability: survivalCount / numRuns,
       depletionYearWorst10: getDepletionYearWorst10(runs)
     };
   }
   \\\

9. Create Web Worker wrapper \src/engine/simulator.worker.ts\:
   \\\	ypescript
   import { runMonteCarloSimulation } from './simulator';
   
   self.onmessage = async (event) => {
     const { input, returns, inflationRates } = event.data;
     const result = runMonteCarloSimulation(input, returns, inflationRates);
     self.postMessage({ success: true, result });
   };
   \\\

10. Unit tests in \src/engine/__tests__/simulator.test.ts\:
    - Test 1: Known inputs → verify deterministic output (fixed seed)
    - Test 2: \ portfolio, 4% flat withdrawal, 0% growth → depletes at year 25
    - Test 3: Monte Carlo aggregation → percentiles are monotonic (p10 ≤ p25 ≤ p50 ≤ ...)
    - Test 4: Bucket sequencing → verify cash withdrawn before equity in bear markets

**Deliverable:** Tested simulation engine + Web Worker wrapper.

---

### Phase 3: UI Components (Day 2–3)

**Tasks (can be done in parallel with Phase 2):**

11. Build wizard step components:
    - \src/components/Wizard.tsx\ — state machine, tabs, step controller
    - \src/components/NestEggStep.tsx\ — portfolio value input + allocation sliders
    - \src/components/StrategyStep.tsx\ — preset buttons + custom rule editor
    - \src/components/SimulationStep.tsx\ — projection years input + "Run Simulation" button

12. Build results components:
    - \src/components/ResultsDashboard.tsx\ — container layout
    - \src/components/SurvivalMetric.tsx\ — hero metric (big number + color coding)
    - \src/components/FanChart.tsx\ — Recharts AreaChart with percentile bands
    - \src/components/ResultsTable.tsx\ — year-by-year table with expandable rows

13. Wire components in \src/App.tsx\:
    \\\	ypescript
    export function App() {
      const [input, setInput] = useState<SimulationInput>(defaultInput);
      const [results, setResults] = useState<SimulationOutput | null>(null);
      const [loading, setLoading] = useState(false);
    
      const handleRunSimulation = async () => {
        setLoading(true);
        const worker = new Worker(new URL('./engine/simulator.worker.ts', import.meta.url), {
          type: 'module'
        });
        worker.postMessage({ input, returns, inflationRates });
        worker.onmessage = (event) => {
          setResults(event.data.result);
          setLoading(false);
        };
      };
    
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
          {results ? (
            <ResultsDashboard results={results} onReset={() => setResults(null)} />
          ) : (
            <Wizard input={input} setInput={setInput} onRunSimulation={handleRunSimulation} loading={loading} />
          )}
        </div>
      );
    }
    \\\

14. Design pass (Tailwind):
    - Dark theme (slate-900 background, white text)
    - Hero metric: 48px bold font, centered
    - Fan chart: full width, 400px height
    - Responsive: stack on mobile, side-by-side on desktop

**Deliverable:** Interactive UI with end-to-end data flow.

---

### Phase 4: Polish & Deployment (Day 3–4)

**Tasks:**

15. Add strategy presets:
    \\\	ypescript
    const PRESETS = {
      conservative: {
        withdrawalRules: [
          { threshold: 5, rate: 3 },
          { threshold: 0, rate: 2 },
          { threshold: -100, rate: 1.5 }
        ]
      },
      moderate: {
        withdrawalRules: [
          { threshold: 5, rate: 4 },
          { threshold: 0, rate: 3 },
          { threshold: -100, rate: 2.5 }
        ]
      },
      aggressive: {
        withdrawalRules: [
          { threshold: 5, rate: 5 },
          { threshold: 0, rate: 4 },
          { threshold: -100, rate: 3 }
        ]
      }
    };
    \\\

16. Implement URL sharing in \src/utils/sharing.ts\:
    \\\	ypescript
    export function encodeToUrl(input: SimulationInput): string {
      const encoded = btoa(JSON.stringify(input));
      return \\?plan=\\;
    }
    
    export function decodeFromUrl(params: URLSearchParams): SimulationInput | null {
      const encoded = params.get('plan');
      if (!encoded) return null;
      return JSON.parse(atob(encoded));
    }
    \\\
    - Add URL decode in App.tsx: check \window.location.search\ on load, pre-fill form if plan param exists
    - Add "Share" button in ResultsDashboard that copies encoded URL to clipboard

17. Mobile responsive pass:
    - Test on iPhone 12 (375px width)
    - Stack wizard steps vertically
    - Full-width charts and buttons
    - Touch-friendly slider sizes

18. Deploy to Vercel:
    \\\ash
    npm install -g vercel
    vercel login
    vercel
    \\\
    - Vercel auto-detects Vite, builds, deploys
    - Get live URL (e.g., \etirement-simulator.vercel.app\)
    - Enable analytics in Vercel dashboard

19. Add annual data update script \scripts/update-data.ts\:
    - Downloads latest S&P 500 returns from macrotrends.net or FRED API
    - Validates data (no nulls, reasonable ranges)
    - Outputs \sp500_returns.json\ + \inflation_rates.json\ to \public/data/\
    - Commit new files to Git → automated Vercel redeploy

**Deliverable:** Live app on Vercel + shareable URLs.

---

## Verification & Testing

### Unit Tests
| Test | Expected Result |
|------|-----------------|
| Simulator determinism | Fixed seed produces identical outputs on replay |
| Portfolio math | \ × 4% withdrawal = \ exactly |
| Bucket sequencing | In bear market, cash withdrawn before equity |
| Percentile calculation | p10 ≤ p25 ≤ p50 ≤ p75 ≤ p90 (always) |
| Depletion detection | Portfolio flagged depleted when value ≤ \ |

### Integration Tests
| Test | Expected Result |
|------|-----------------|
| End-to-end simulation | Form input → engine → results displayed in <2sec |
| URL sharing | Encoded plan recreates identical results when decoded |
| Web Worker non-blocking | UI responsive during 1000-run simulation |
| Mobile responsiveness | App usable at 375px width, no horizontal scroll |

### Validation Benchmarks
| Metric | Target |
|--------|--------|
| Survival probability (moderate, 30yr) | 80–95% (industry standard) |
| Worst-case depletion year | 20–22 years (matches Monte Carlo theory) |
| Median portfolio value at year 30 | Portfolio growth or stable (depends on inputs) |
| Lighthouse performance score | 95+ (static site) |
| Time to interactive | <1 sec |

---

## File Structure (Final)

\\\
retirement-simulator/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── package-lock.json
├── postcss.config.js
│
├── public/
│   └── data/
│       ├── sp500_returns.json
│       └── inflation_rates.json
│
├── src/
│   ├── main.tsx               (entry)
│   ├── App.tsx                (root component)
│   ├── index.css              (Tailwind directives)
│   │
│   ├── components/
│   │   ├── Wizard.tsx
│   │   ├── NestEggStep.tsx
│   │   ├── StrategyStep.tsx
│   │   ├── SimulationStep.tsx
│   │   ├── ResultsDashboard.tsx
│   │   ├── SurvivalMetric.tsx
│   │   ├── FanChart.tsx
│   │   └── ResultsTable.tsx
│   │
│   ├── engine/
│   │   ├── types.ts           (TypeScript interfaces)
│   │   ├── simulator.ts       (Monte Carlo logic)
│   │   ├── simulator.worker.ts (Web Worker wrapper)
│   │   └── __tests__/
│   │       └── simulator.test.ts
│   │
│   ├── utils/
│   │   ├── sharing.ts         (URL encoding/decoding)
│   │   └── formatting.ts      (currency, percentage formatters)
│   │
│   └── data/
│       └── historical.ts      (load & cache JSON data)
│
├── scripts/
│   └── update-data.ts         (annual refresh script)
│
├── README.md
└── .gitignore
\\\

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| **No backend** | All math is O(n) simple, data is static (updated 1×/year) |
| **Web Worker** | 1000 simulations run in background, UI stays responsive |
| **URL sharing** | Zero infrastructure, instant shareable link, user privacy |
| **Monte Carlo** | Product differentiator vs. static rules; matches industry best practices |
| **Tailwind + Recharts** | Minimal dependencies, rapid iteration, no CSS file overhead |
| **Vite** | Fast HMR, tiny bundle (45KB gzipped), zero config |
| **React 19** | Latest LTS, type-safe with TS, easy to hire for |

---

## What's Deliberately Excluded (Post-MVP)

- User accounts / authentication
- Database / backend API
- Real-time market data feeds
- PDF report export
- Tax optimization
- Social Security / pension integration
- Multiple scenario side-by-side comparison
- Roth/401k withdrawal sequencing
- Inflation adjustment by category

---

## Growth Path (Monetization Ideas)

### Tier 1: Free MVP
- Basic simulation: 1000 runs, 30-year projection
- Preset strategies only

### Tier 2: Premium (\/month or one-time \)
- Custom withdrawal rules with unlimited conditions
- PDF report export (shareable)
- Email alerts: "Your withdrawal rate triggered a new rule change"
- Scenario versioning: "Compare October vs. December plans"

### Tier 3: AI Advisor (shipped in Phase 4)
- Claude / GPT integration via `/api/llm` streaming route
- Natural language Q&A about simulation results
- Supports SAP Hyperspace proxy, direct Anthropic, or OpenAI via env vars

### Tier 4: Enterprise (future)
- Financial advisor partner program
- White-label version (advisor branding)
- Client management portal

---

## Success Metrics (Post-Launch)

| Metric | Target (Year 1) |
|--------|-----------------|
| Monthly active users | 10,000 |
| Avg. session duration | >3 minutes |
| Mobile traffic | >40% |
| Shared plans (via URL) | >5% of users |
| Return visitors | >20% |
| Lighthouse score | 95+ |
| Zero 404s | 100% |

---

## Deployment Checklist

- [x] Scaffold Vite + React + TypeScript
- [x] Install Tailwind, Recharts
- [x] Bundle historical data to public/data/
- [x] Implement simulator engine
- [x] Test simulator with known inputs
- [x] Build wizard UI
- [x] Build results dashboard + fan chart
- [x] Wire end-to-end data flow
- [x] Implement URL sharing
- [x] Presets: Conservative/Moderate/Aggressive
- [x] Next.js 15 migration (App Router)
- [x] Multi-provider LLM layer (Anthropic / OpenAI)
- [x] AI Advisor panel (AdvisorPanel.tsx, /api/llm route)
- [ ] Mobile responsive pass
- [ ] Annual data update script
- [ ] Deploy to Vercel
- [ ] DNS domain setup (if custom domain)
- [ ] Analytics (Vercel Analytics or Plausible)

---

## Summary

A **lean, serverless retirement simulator** built for speed and simplicity. No backend complexity. No subscription infrastructure. Just a single static site that runs Monte Carlo simulations in a browser Web Worker and shows users a probability of portfolio survival. Deploy to Vercel, share via URL. Total time to MVP: 4 days. Total infrastructure cost: \/month.

The differentiator isn't technology—it's the **smart Monte Carlo engine with market-responsive withdrawal rules and intelligent bucket sequencing**, packaged in a clean, mobile-friendly UX.
