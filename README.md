# Retirement Simulator

A Monte Carlo retirement simulator with an AI advisor panel. Enter your nest egg, set withdrawal rules, get the probability your portfolio survives 30+ years — all computed in your browser, with an optional server-side AI advisor powered by Claude or GPT.

**Live demo:** _(deploy to Vercel to get your URL)_

---

## What It Does

Most retirement tools use a static 4% rule. This simulator runs **1,000 simulated futures** using real historical S&P 500 returns and CPI inflation data (2004–2025), then shows you:

- **Probability of success** — e.g. "87% chance your money lasts 30 years"
- **Fan chart** — portfolio value paths from worst 10% to best 90%
- **Year-by-year table** — median portfolio value, withdrawal amount, and bucket balances per year
- **Risk metrics** — worst-case depletion year, best-case growth, safe withdrawal floor
- **AI Advisor panel** — ask Claude or GPT questions about your results after the simulation

### Smart Bucket Sequencing

The core differentiator: withdrawals are sequenced by market condition to protect long-term growth.

| Market Condition | Withdrawal Order |
|---|---|
| Bear (return < 0%) | Cash → Bonds → Equity |
| Neutral (0% to inflation+2%) | Bonds → Cash → Equity |
| Bull (return > inflation+2%) | Equity → Bonds → Cash |

This alone extends portfolio lifespan by 3–5 years vs. random sequencing.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Simulation | Web Worker (non-blocking, runs in browser) |
| LLM | Anthropic Claude or OpenAI (server-side API route) |
| Deployment | Vercel (free tier for the SPA; LLM requires env vars) |
| Data | Static JSON in `public/data/` |

The Monte Carlo engine runs entirely in-browser (Web Worker). Only AI advisor calls go server-side.

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+
- Git Bash (Windows) or any Unix shell

### Install & Run

```bash
git clone https://github.com/techfrenza/retirement_planning_web_app.git
cd retirement_planning_web_app
npm install
```

Set up your environment (required for AI Advisor — see [AI Advisor Setup](#ai-advisor-setup)):

```bash
cp .env.local.example .env.local
# Then edit .env.local and fill in your LLM credentials
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Port conflict?** If port 3000 is in use, Next.js automatically picks the next free port (3001, 3002, …). The actual URL is printed in the terminal output — look for `Local: http://localhost:XXXX`.

### Smoke-test the AI endpoint from Git Bash

After the server is running, verify the LLM route works end-to-end:

```bash
curl -s -X POST "http://localhost:3000/api/llm" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role":"user","content":"ping"}],
    "simulationContext": {
      "portfolioValue": 1000000,
      "survivalProbability": 0.85,
      "withdrawalRules": [{"threshold":5,"rate":4}],
      "projectionYears": 30,
      "p50Final": 1200000,
      "p10Final": 200000,
      "p90Final": 3500000,
      "medianWithdrawalYear1": 40000
    }
  }'
```

Expected: a plain-text streaming response from Claude (not an error JSON).

### Build for Production

```bash
npm run build
npm start
```

### Run Tests

```bash
npm test
```

---

## AI Advisor Setup

The AI advisor panel appears on the results page after running a simulation. It requires a server-side LLM key.

1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in credentials — **pick one provider:**

   **Option A — SAP Hyperspace proxy (internal):**
   ```env
   LLM_PROVIDER=anthropic
   ANTHROPIC_AUTH_TOKEN=<your SAP Hyperspace token>
   ANTHROPIC_BASE_URL=http://localhost:6655/anthropic/
   ```

   **Option B — Direct Anthropic:**
   ```env
   LLM_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-...
   ```

   **Option C — OpenAI:**
   ```env
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   ```

3. Restart `npm run dev`. The advisor panel will be active on the results page.

Without any credentials, the app still works — the AI advisor panel shows an error when you try to send a message.

---

## Project Structure

```
retirement-simulator/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── package.json
├── .env.local.example          # Copy to .env.local, fill in LLM credentials
│
├── app/                        # Next.js App Router
│   ├── layout.tsx              # HTML shell, global CSS import
│   ├── page.tsx                # Entry page (renders App client component)
│   └── api/
│       └── llm/
│           └── route.ts        # POST /api/llm — streaming LLM proxy
│
├── lib/                        # Server-only LLM layer
│   ├── claude.ts               # Anthropic client (proxy vs. direct auth)
│   ├── openai-llm.ts           # OpenAI client
│   └── llm.ts                  # Unified callLLM() / streamLLMMessage()
│
├── public/
│   └── data/
│       ├── sp500_returns.json  # S&P 500 annual returns 2004–2025
│       └── inflation_rates.json # US CPI annual inflation 2004–2025
│
└── src/
    ├── App.tsx                 # Root client component
    ├── index.css               # Tailwind directives
    │
    ├── engine/
    │   ├── types.ts            # TypeScript interfaces (SimulationInput, SimulationOutput, SimulationContext, …)
    │   ├── simulator.ts        # Monte Carlo logic
    │   ├── simulator.worker.ts # Web Worker wrapper
    │   └── __tests__/
    │       └── simulator.test.ts
    │
    ├── components/
    │   ├── Wizard.tsx
    │   ├── NestEggStep.tsx
    │   ├── StrategyStep.tsx
    │   ├── SimulationStep.tsx
    │   ├── ResultsDashboard.tsx
    │   ├── SurvivalMetric.tsx
    │   ├── FanChart.tsx
    │   ├── ResultsTable.tsx
    │   └── AdvisorPanel.tsx    # AI advisor chat panel
    │
    ├── utils/
    │   ├── sharing.ts          # URL encode/decode for shareable links
    │   └── formatting.ts       # Currency and percentage formatters
    │
    └── data/
        └── historical.ts       # Fetch + cache JSON data files
```

---

## Using the Simulator

**Step 1 — Your Nest Egg**
Enter your total portfolio value and split it across three buckets: Cash, Bonds, and Equity (must total 100%).

**Step 2 — Withdrawal Rules**
Pick a preset (Conservative / Moderate / Aggressive) or define custom rules:
- _If market return ≥ 5%, withdraw 4%_
- _If market return ≥ 0%, withdraw 3%_
- _If market return < 0%, withdraw 2.5%_

**Step 3 — Simulate**
Set your projection horizon (default: 30 years) and click **Run Simulation**. Results appear in under 2 seconds.

**AI Advisor**
After results load, click **Ask AI Advisor** to open the chat panel. Use the quick-question chips or type your own question — e.g. "What does my survival probability mean?" or "Am I withdrawing too aggressively?"

### Shareable Links

After running a simulation, click **Share** to copy a URL with all your inputs encoded in the query string. Recipients see identical results when they open the link — no account required.

---

## Updating Historical Data

Data files live in `public/data/` and are updated once a year. To refresh them:

```bash
npx tsx scripts/update-data.ts
```

---

## Deployment

**Vercel (recommended):**

```bash
npm install -g vercel
vercel login
vercel --prod
```

Vercel auto-detects Next.js. Set `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` as environment variables in the Vercel dashboard to enable the AI advisor in production.

---

## Build Status

| Phase | Status |
|---|---|
| Phase 1: Foundation (scaffold, data, types) | ✅ Complete |
| Phase 2: Simulation Engine | ✅ Complete |
| Phase 3: UI Components | ✅ Complete |
| Phase 4: Next.js migration + AI Advisor | ✅ Complete |
| Phase 5: Polish & Deployment | 🔲 Pending |

---

## License

MIT
