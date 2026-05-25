import type {
  SimulationInput,
  SimulationOutput,
  WithdrawalRule,
  YearResult,
} from "./types";

function selectWithdrawalRate(rules: WithdrawalRule[], marketReturn: number): number {
  // Sort descending by threshold — pick first rule whose threshold is met
  const sorted = [...rules].sort((a, b) => b.threshold - a.threshold);
  for (const rule of sorted) {
    if (marketReturn >= rule.threshold) return rule.rate;
  }
  // Fallback: use the rule with the lowest threshold
  return sorted[sorted.length - 1]?.rate ?? 3;
}

function withdrawFromBuckets(
  cash: number,
  bonds: number,
  equity: number,
  amount: number,
  marketReturn: number,
  inflationRate: number
): [number, number, number] {
  let remaining = amount;
  let c = cash;
  let b = bonds;
  let e = equity;

  // Determine withdrawal order by market condition
  let order: Array<"cash" | "bonds" | "equity">;
  if (marketReturn < 0) {
    order = ["cash", "bonds", "equity"]; // bear: protect equity
  } else if (marketReturn <= inflationRate + 2) {
    order = ["bonds", "cash", "equity"]; // neutral
  } else {
    order = ["equity", "bonds", "cash"]; // bull: harvest gains
  }

  for (const bucket of order) {
    if (remaining <= 0) break;
    if (bucket === "cash") {
      const take = Math.min(c, remaining);
      c -= take;
      remaining -= take;
    } else if (bucket === "bonds") {
      const take = Math.min(b, remaining);
      b -= take;
      remaining -= take;
    } else {
      const take = Math.min(e, remaining);
      e -= take;
      remaining -= take;
    }
  }

  return [c, b, e];
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function simulateSingleRun(
  input: SimulationInput,
  returns: number[],
  inflationRates: number[]
): YearResult[] {
  const results: YearResult[] = [];

  let cash = input.portfolioValue * (input.cashAllocation / 100);
  let bonds = input.portfolioValue * (input.bondsAllocation / 100);
  let equity = input.portfolioValue * (input.equityAllocation / 100);

  for (let year = 1; year <= input.projectionYears; year++) {
    const marketReturn = getRandomElement(returns);
    const inflationRate = getRandomElement(inflationRates);

    const portfolioTotal = cash + bonds + equity;
    if (portfolioTotal <= 0) {
      results.push({ year, portfolioValue: 0, withdrawal: 0, cashValue: 0, bondsValue: 0, equityValue: 0 });
      continue;
    }

    const withdrawalRate = selectWithdrawalRate(input.withdrawalRules, marketReturn);
    const withdrawalAmount = (portfolioTotal * withdrawalRate) / 100;

    let [c, b, e] = withdrawFromBuckets(cash, bonds, equity, withdrawalAmount, marketReturn, inflationRate);

    // Apply growth to remaining balances
    e = e * (1 + marketReturn / 100);
    b = b * (1 + (marketReturn * 0.3) / 100);
    c = c * (1 + (inflationRate * 0.5) / 100);

    // Clamp negatives (shouldn't happen but guards against floating point)
    c = Math.max(0, c);
    b = Math.max(0, b);
    e = Math.max(0, e);

    // Rebalance back to target allocation
    const newTotal = c + b + e;
    if (newTotal > 0) {
      c = newTotal * (input.cashAllocation / 100);
      b = newTotal * (input.bondsAllocation / 100);
      e = newTotal * (input.equityAllocation / 100);
    }

    cash = c;
    bonds = b;
    equity = e;

    results.push({
      year,
      portfolioValue: cash + bonds + equity,
      withdrawal: withdrawalAmount,
      cashValue: cash,
      bondsValue: bonds,
      equityValue: equity,
    });
  }

  return results;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(Math.floor(sorted.length * p), sorted.length - 1);
  return sorted[idx];
}

function getDepletionYearWorst10(runs: YearResult[][]): number {
  const depletionYears: number[] = [];
  for (const run of runs) {
    const depletedYear = run.find((yr) => yr.portfolioValue <= 0);
    if (depletedYear) depletionYears.push(depletedYear.year);
  }
  if (depletionYears.length === 0) return -1;
  depletionYears.sort((a, b) => a - b);
  return depletionYears[Math.floor(depletionYears.length * 0.1)] ?? depletionYears[0];
}

export function runMonteCarloSimulation(
  input: SimulationInput,
  returns: number[],
  inflationRates: number[],
  numRuns = 1000
): SimulationOutput {
  const runs: YearResult[][] = [];

  for (let i = 0; i < numRuns; i++) {
    runs.push(simulateSingleRun(input, returns, inflationRates));
  }

  const p10: number[] = [];
  const p25: number[] = [];
  const p50: number[] = [];
  const p75: number[] = [];
  const p90: number[] = [];

  for (let year = 0; year < input.projectionYears; year++) {
    const yearValues = runs
      .map((run) => (run[year]?.portfolioValue ?? 0))
      .sort((a, b) => a - b);

    p10.push(percentile(yearValues, 0.1));
    p25.push(percentile(yearValues, 0.25));
    p50.push(percentile(yearValues, 0.5));
    p75.push(percentile(yearValues, 0.75));
    p90.push(percentile(yearValues, 0.9));
  }

  const survivalCount = runs.filter((run) =>
    run.every((yr) => yr.portfolioValue > 0)
  ).length;

  return {
    runs,
    percentiles: { p10, p25, p50, p75, p90 },
    survivalProbability: survivalCount / numRuns,
    depletionYearWorst10: getDepletionYearWorst10(runs),
  };
}
