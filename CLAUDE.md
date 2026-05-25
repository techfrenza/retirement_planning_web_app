# CLAUDE.md — AI Behavior Contract

## 1. Project Vision

**Core**: Zero-backend Monte Carlo retirement simulator — a static React SPA that runs 1,000 stochastic projection runs entirely in-browser via a Web Worker, with no server-side computation.

**Tech Stack & Constraints**

| Layer | Locked version |
|---|---|
| Runtime | Node.js v22 (build only) |
| Framework | React 19 |
| Build | Vite 6 (`vite.config.ts` — worker registered with `{ type: 'module' }`) |
| Language | TypeScript 5 (strict mode, `tsc && vite build`) |
| Tests | Vitest |
| Charts | Recharts |
| Deployment | Static site (`dist/`) — zero backend |

[CRITICAL] Never suggest or introduce any framework, library, or dependency not in the table above.

---

## 2. Golden Rules

- **Read-Before-Write**: Before modifying any function, read its full implementation, its callers, and the types it touches. No blind edits.
- **Precision Edits**: Change only the minimum lines required. No opportunistic refactors of adjacent healthy code.
- **Premature Abstraction Guard**: ≤3 repetitions → copy-paste is correct. Only abstract when a 4th caller exists.
- **Fail Explicitly**: No silent `catch`. Every error or uncertain boundary must throw, log, or surface to the nearest error boundary.

---

## 3. Architecture & Coding Standards

### Architecture — Non-Obvious Constraints

```
public/data/*.json  →  src/data/historical.ts (fetch-and-cache)
                    →  src/engine/simulator.ts (Monte Carlo, bucket sequencing)
                    ↑  called via simulator.worker.ts (Web Worker, off main thread)
                    →  Wizard.tsx (3-step: NestEgg → Strategy → Simulation)
                    →  ResultsDashboard.tsx → SurvivalMetric | FanChart | ResultsTable
```

**Invariants that must never be broken:**

- **Fan chart delta stacking**: `FanChart.tsx` stacks *delta* values (P10, P25−P10, P50−P25, …), NOT absolute portfolio values. Any percentile rendering change must preserve this.
- **Worker boundary**: All simulation logic lives in `simulator.worker.ts`. Never call `runSimulation` directly from the main thread.
- **Shared types**: `src/engine/types.ts` is the single source of truth for `SimulationInput`, `SimulationOutput`, `YearResult`, `BucketState`, `WithdrawalStrategy`. Add types there; never redeclare locally.
- **Data boundary**: All data from `public/data/*.json` and URL query params must pass through `src/data/historical.ts` or `src/utils/sharing.ts` respectively — never consume raw objects directly.
- **URL sharing**: `src/utils/sharing.ts` owns encode/decode of all wizard inputs as query params. Any new input field must be wired through it.

### Coding Standards

- **No `any`**: TypeScript strict mode is non-negotiable. If a third-party type forces it, add `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- <reason>`.
- **Function naming**: `[verb + noun]` — e.g., `runSimulation`, `loadHistoricalData`, `encodeWizardState`.
- **No linter configured**: No ESLint/Prettier in this repo. Do not add them.

---

## 4. Agent Workflow

**Plan Mode trigger**: Any change touching ≥2 files requires a written plan (scope, risk, rollback) before the first write. Wait for explicit user confirmation.

**Verification sequence** (run in this order; all must exit 0 before declaring done):
```bash
npx vitest run src/engine/__tests__/simulator.test.ts   # 8 tests
npm run build                                            # tsc + vite build
```

**Commit messages**: Angular conventional format. Body must explain *why* (context, constraint, or tradeoff) — not what changed.

---

## 5. Hard Boundaries — NEVER

- Read or modify `.env` or any secrets/credentials file.
- Delete files or drop data without explicit in-session confirmation.
- Execute `git push` without explicit user authorization in the current session.
- Suggest swapping any locked stack entry (React 19, Vite 6, Vitest, Recharts) for an alternative.

---

## 6. Definition of Done

- [ ] Change is consistent with Section 3 architecture invariants.
- [ ] `npm run build` exits 0.
- [ ] All 8 simulator unit tests pass.
- [ ] Zero `any` types introduced.
- [ ] If a new wizard input was added: `sharing.ts` encode/decode updated.

---

## 7. Context Compaction Guide

On `/compact` or context-limit summary, preserve inside `<architecture_state>` tags:

```xml
<architecture_state>
  <decisions><!-- confirmed technical choices this session --></decisions>
  <dead_ends><!-- approaches tried and rejected, with reasons --></dead_ends>
  <todo><!-- current checklist item + next atomic instruction --></todo>
</architecture_state>
```

---

## 8. AGENTS.md Soft Link

CLAUDE.md is self-contained — no @ reference to AGENTS.md. AGENTS.md contains only @CLAUDE.md.
