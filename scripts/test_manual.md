# Manual Testing Guide — Retirement Simulator

Step-by-step instructions for a human tester to verify every function on localhost.

---

## Prerequisites

Before testing, complete these steps in Git Bash:

```bash
# 1. Install dependencies
cd /c/Users/k.huang@sap.com/git-My/retirement_planning
npm install

# 2. Configure LLM credentials
cp .env.local.example .env.local
# Open .env.local and confirm these values are set:
#   ANTHROPIC_AUTH_TOKEN=<your SAP Hyperspace token>
#   ANTHROPIC_BASE_URL=http://localhost:6655/anthropic/
#   LLM_PROVIDER=anthropic
#   ANTHROPIC_MODEL_DEFAULT=claude-sonnet-4-5

# 3. Verify the Hyperspace proxy is reachable
curl -s -X POST "http://localhost:6655/anthropic/v1/messages" \
  -H "Authorization: Bearer $(grep ANTHROPIC_AUTH_TOKEN .env.local | cut -d= -f2)" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-haiku-4-5","max_tokens":16,"messages":[{"role":"user","content":"ping"}]}'
# Expected: JSON with "content":[{"text":"..."}]

# 4. Run unit tests
npm test
# Expected: 8 tests passed

# 5. Start the dev server
npm run dev
# Note the port printed: "Local: http://localhost:3000" (or 3001/3002 if 3000 is busy)
```

Open your browser to the URL printed in the terminal (e.g. **http://localhost:3000**).

---

## Test 1 — Wizard: Step 1 "Your Nest Egg"

**What to do:**
1. The page should show the wizard with the "Your Nest Egg" step active (tab 1 highlighted in indigo).
2. Clear the portfolio value field and type `2000000`. Verify the formatted hint below the field shows `$2,000,000`.
3. Move the **Cash** slider to `20%`. Verify the number next to "Cash" updates to `20%`.
4. Move the **Bonds** slider to `30%`. Verify `30%`.
5. Verify the **total allocation badge** in the top-right of the sliders section shows `50%` in red with the message "must equal 100%".
6. Move the **Equity** slider to `50%`. Verify the badge now shows `100% ✓` in green.
7. Click **Next →**. Verify you advance to Step 2.

**Pass criteria:** Portfolio value displayed correctly; allocation error shown/cleared; navigation advances.

---

## Test 2 — Wizard: Step 2 "Withdrawal Rules"

**What to do:**
1. Verify three preset buttons are visible: **Conservative**, **Moderate**, **Aggressive**.
2. Click **Conservative**. Verify the "Active Rules" section updates to show rates of 3%, 2%, 1.5%.
3. Click **Moderate**. Verify rates 4%, 3%, 2.5% and the Moderate button is highlighted in indigo.
4. Click **Customize →** (small link on the right). Verify the custom rule editor expands.
5. Change the first rule's withdrawal rate from `4` to `5`. Verify the "Active Rules" preview updates immediately and the preset highlight disappears (no preset is active).
6. Click **+ Add rule**. Verify a new rule row appears.
7. Click **✕** on the newly added rule to remove it.
8. Click **Back** to return to Step 1, then **Next →** to return to Step 2 — verify inputs are preserved.

**Pass criteria:** Presets switch correctly; custom editor works; add/remove rules; navigation preserves state.

---

## Test 3 — Wizard: Step 3 "Run Simulation"

**What to do:**
1. Click **Next →** to advance to Step 3 (or click the "Simulate" tab directly).
2. Verify the **Inputs Summary** card shows the correct portfolio value, allocation, and projection years.
3. Move the **Projection Horizon** slider to `40 years`. Verify the label updates to `40 years`.
4. Set the portfolio value to `0` (go back to Step 1, clear the field, return). Verify a red validation error appears: "Portfolio value must be greater than 0" and the **Run Simulation** button is disabled (greyed out).
5. Fix the portfolio value to `1000000`. Return to Step 3.
6. Click **Run Simulation →**. Verify:
   - The button shows a spinner and "Running 1,000 simulations…"
   - Within 2–3 seconds the page transitions to the **Results Dashboard**.

**Pass criteria:** Validation blocks bad inputs; simulation runs and results appear.

---

## Test 4 — Results Dashboard: Survival Metric

**What to do:**
1. On the Results Dashboard, verify the large **survival probability** percentage is displayed (e.g. "87%").
2. Verify color coding:
   - ≥ 80%: green text
   - 60–79%: yellow/amber text
   - < 60%: red text
3. Verify the three secondary metric cards are visible: **Best Case**, **Worst Case (P10)**, **Median (P50)**.
4. Check that all three show dollar values (not zeros or NaN).

**Pass criteria:** Survival metric renders with correct color; secondary metrics are populated.

---

## Test 5 — Results Dashboard: Fan Chart

**What to do:**
1. Scroll to the **Portfolio Value Over Time** fan chart.
2. Verify five shaded bands are visible in the chart (red, amber, indigo, green from bottom to top) plus a blue median line.
3. Hover over any point on the chart. Verify a tooltip appears showing Year, and values for 90th, 75th, 50th (Median), 25th, and 10th percentiles — all formatted as dollar amounts (e.g. `$1.23M`).
4. Verify the legend below the chart labels the four bands correctly (10th–25th, 25th–50th, etc.).

**Pass criteria:** Chart renders with bands and median line; hover tooltip shows all five percentile values.

---

## Test 6 — Results Dashboard: Year-by-Year Table

**What to do:**
1. Scroll to the **Year-by-Year Results** table.
2. Verify rows are present for every year in the projection (e.g. Year 1 through Year 40).
3. Check that each row shows a green or red dot (growing vs. shrinking portfolio), portfolio value, and withdrawal amount.
4. Click on **Year 5**. Verify an expanded row appears below it showing: Min, 10th %, Median, 90th %, Max, and Depleted count.
5. Click the row again. Verify it collapses.
6. Scroll to the last year. Verify it renders without errors.

**Pass criteria:** Table rows render; expand/collapse works; values look reasonable.

---

## Test 7 — Shareable URL

**What to do:**
1. Click the **Share** button in the top-right of the Results Dashboard.
2. Verify either:
   - A browser alert says "Link copied to clipboard!" — then paste the URL from your clipboard into the address bar of a new tab, OR
   - A prompt dialog appears with the URL — copy it and open in a new tab.
3. In the new tab, verify the simulation **auto-runs** and produces the same results as the original tab (same survival probability, same projection years).

**Pass criteria:** URL encodes all inputs; new tab decodes and re-runs producing identical results.

---

## Test 8 — AI Advisor Panel (requires .env.local credentials)

**What to do:**
1. On the Results Dashboard, scroll to the bottom. Verify the **Ask AI Advisor** panel is visible with a `✦` icon.
2. Click the **Ask AI Advisor** header button. Verify the panel expands and shows three quick-question chips.
3. Click the chip **"What does my survival probability mean?"**. Verify:
   - The chip question appears as a user message bubble (indigo, right-aligned).
   - A pulsing dots indicator appears in the assistant bubble (left-aligned).
   - Within 5–10 seconds, text streams in token-by-token in the assistant bubble.
   - The **Send →** button is disabled while streaming.
   - Streaming completes with a full sentence answer.
4. Type a custom question in the textarea: `"If I reduce my withdrawal by 1%, how would that affect my survival odds?"`. Press **Enter** (not Shift+Enter). Verify it sends and a new streamed response appears.
5. Verify the **Send →** button is disabled when the textarea is empty.
6. Click the **Ask AI Advisor** header again. Verify the panel collapses. Click again — verify it re-opens and **conversation history is preserved**.

**Pass criteria:** Panel opens/closes; quick questions work; custom input works; streaming renders correctly; history persists across collapse/expand.

---

## Test 8b — AI Advisor Error Handling (optional)

**What to do:**
1. Temporarily edit `.env.local`, change `ANTHROPIC_AUTH_TOKEN` to an invalid value (e.g. `invalid`), and restart the dev server (`npm run dev`).
2. Run a simulation, open the AI Advisor panel, send a message.
3. Verify a red error banner appears with an error message (not a blank screen or JS crash).
4. Verify the **✕** button dismisses the error.
5. Restore the correct token in `.env.local` and restart the server.

**Pass criteria:** Errors surface gracefully; app does not crash.

---

## Test 9 — Reset Flow

**What to do:**
1. From the Results Dashboard, click **New Simulation**.
2. Verify the page returns to the Wizard, Step 1.
3. Verify the URL no longer contains a `?plan=` query parameter.

**Pass criteria:** Reset clears results and URL param; wizard is usable again.

---

## Test 10 — Git Bash: API Endpoint Smoke Test

Run this directly in Git Bash (replace the port if your dev server is on 3001/3002):

```bash
curl -s -X POST "http://localhost:3000/api/llm" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role":"user","content":"In one sentence, what is a safe withdrawal rate?"}],
    "simulationContext": {
      "portfolioValue": 1000000,
      "survivalProbability": 0.87,
      "withdrawalRules": [
        {"threshold": 5, "rate": 4},
        {"threshold": 0, "rate": 3},
        {"threshold": -100, "rate": 2.5}
      ],
      "projectionYears": 30,
      "p50Final": 1250000,
      "p10Final": 180000,
      "p90Final": 3800000,
      "medianWithdrawalYear1": 38000
    }
  }'
```

**Expected:** A plain-text response from Claude, streamed as one continuous string (no JSON wrapper, no error message).

**Failure cases to diagnose:**

| Output | Cause | Fix |
|--------|-------|-----|
| `[Error: Could not resolve authentication method]` | `ANTHROPIC_AUTH_TOKEN` not loaded | Restart dev server; check `.env.local` exists and is not empty |
| `[Error: HTTP 401]` | Token invalid or expired | Get a fresh token from SAP Hyperspace |
| `[Error: HTTP 404]` | Wrong proxy URL | Check `ANTHROPIC_BASE_URL` ends with `/anthropic/` |
| `curl: (7) Failed to connect` | Dev server not running | Run `npm run dev` |

---

## Test 11 — Unit Tests

```bash
npm test
```

**Expected output:**
```
✓ src/engine/__tests__/simulator.test.ts (8 tests)
Test Files  1 passed (1)
Tests       8 passed (8)
```

**Pass criteria:** All 8 tests green, no failures.

---

## Test 12 — Production Build

```bash
npm run build
```

**Expected output:**
```
✓ Compiled successfully
✓ Generating static pages (3/3)
Route (app)         Size
  ƒ /               ~112 kB
  ƒ /api/llm        ~124 B
```

**Pass criteria:** Build exits 0 with no TypeScript errors.

---

## Summary Checklist

| # | Test | Pass |
|---|------|------|
| 1 | Wizard Step 1 — portfolio + allocation | ☐ |
| 2 | Wizard Step 2 — withdrawal rules + custom editor | ☐ |
| 3 | Wizard Step 3 — validation + run simulation | ☐ |
| 4 | Results — survival metric + color coding | ☐ |
| 5 | Results — fan chart + hover tooltip | ☐ |
| 6 | Results — year-by-year table + expand/collapse | ☐ |
| 7 | Shareable URL — encode + decode + auto-run | ☐ |
| 8 | AI Advisor — streaming chat + history | ☐ |
| 8b | AI Advisor — error handling (optional) | ☐ |
| 9 | Reset flow — returns to wizard, clears URL | ☐ |
| 10 | Git Bash API smoke test | ☐ |
| 11 | Unit tests (8/8 pass) | ☐ |
| 12 | Production build (exit 0) | ☐ |
