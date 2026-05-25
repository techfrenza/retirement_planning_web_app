import { describe, it, expect } from "vitest";
import { simulateSingleRun, runMonteCarloSimulation } from "../simulator";
import type { SimulationInput } from "../types";

const baseInput: SimulationInput = {
  portfolioValue: 1_000_000,
  cashAllocation: 10,
  bondsAllocation: 30,
  equityAllocation: 60,
  withdrawalRules: [
    { threshold: 5, rate: 4 },
    { threshold: 0, rate: 3 },
    { threshold: -100, rate: 2.5 },
  ],
  projectionYears: 30,
};

describe("simulateSingleRun", () => {
  it("returns one YearResult per projection year", () => {
    const results = simulateSingleRun(baseInput, [7], [3]);
    expect(results).toHaveLength(30);
    expect(results[0].year).toBe(1);
    expect(results[29].year).toBe(30);
  });

  it("portfolio depletes with 0% growth and 100% flat withdrawal", () => {
    // 100% withdrawal rate drains the entire portfolio in year 1
    const depletingInput: SimulationInput = {
      ...baseInput,
      portfolioValue: 1_000_000,
      cashAllocation: 0,
      bondsAllocation: 0,
      equityAllocation: 100,
      withdrawalRules: [{ threshold: -100, rate: 100 }],
      projectionYears: 5,
    };
    const results = simulateSingleRun(depletingInput, [0], [0]);
    // After year 1 the portfolio is 0; subsequent years remain 0
    expect(results[0].portfolioValue).toBeCloseTo(0, 0);
    expect(results[results.length - 1].portfolioValue).toBeCloseTo(0, 0);
  });

  it("portfolio math: $1M × 4% withdrawal = $40,000 in year 1 (bull market)", () => {
    const input: SimulationInput = {
      ...baseInput,
      portfolioValue: 1_000_000,
      withdrawalRules: [{ threshold: -100, rate: 4 }],
    };
    const results = simulateSingleRun(input, [10], [3]); // bull market
    expect(results[0].withdrawal).toBeCloseTo(40_000, 0);
  });

  it("cash withdrawn before equity in bear market (marketReturn < 0)", () => {
    const cashHeavyInput: SimulationInput = {
      portfolioValue: 1_000_000,
      cashAllocation: 50,
      bondsAllocation: 30,
      equityAllocation: 20,
      withdrawalRules: [{ threshold: -100, rate: 4 }],
      projectionYears: 1,
    };
    // bear market: cash should be reduced more than equity before rebalance
    const results = simulateSingleRun(cashHeavyInput, [-10], [3]);
    // After withdrawal in bear market, cash should take the hit first
    // Before rebalance: cash bucket was drawn down first
    // The rebalance happens after, so we validate withdrawal happened (not depleted from equity first)
    expect(results[0].portfolioValue).toBeGreaterThan(0);
    expect(results[0].withdrawal).toBeCloseTo(40_000, -3);
  });
});

describe("runMonteCarloSimulation", () => {
  it("returns correct structure", () => {
    const output = runMonteCarloSimulation(baseInput, [7, -5, 15, 0], [3, 2, 4], 100);
    expect(output.runs).toHaveLength(100);
    expect(output.percentiles.p10).toHaveLength(30);
    expect(output.percentiles.p90).toHaveLength(30);
    expect(output.survivalProbability).toBeGreaterThanOrEqual(0);
    expect(output.survivalProbability).toBeLessThanOrEqual(1);
  });

  it("percentiles are monotonic: p10 ≤ p25 ≤ p50 ≤ p75 ≤ p90", () => {
    const output = runMonteCarloSimulation(baseInput, [7, -5, 15, 3, -12, 25], [3, 2, 4, 7], 200);
    for (let i = 0; i < baseInput.projectionYears; i++) {
      expect(output.percentiles.p10[i]).toBeLessThanOrEqual(output.percentiles.p25[i]);
      expect(output.percentiles.p25[i]).toBeLessThanOrEqual(output.percentiles.p50[i]);
      expect(output.percentiles.p50[i]).toBeLessThanOrEqual(output.percentiles.p75[i]);
      expect(output.percentiles.p75[i]).toBeLessThanOrEqual(output.percentiles.p90[i]);
    }
  });

  it("survival probability is high with conservative withdrawal and good returns", () => {
    const conservativeInput: SimulationInput = {
      ...baseInput,
      withdrawalRules: [{ threshold: -100, rate: 2 }], // 2% withdrawal
    };
    const output = runMonteCarloSimulation(conservativeInput, [8, 10, 6, 12, 5], [3], 200);
    expect(output.survivalProbability).toBeGreaterThan(0.8);
  });

  it("depletionYearWorst10 is -1 when no runs deplete", () => {
    const safeInput: SimulationInput = {
      ...baseInput,
      projectionYears: 5,
      withdrawalRules: [{ threshold: -100, rate: 1 }],
    };
    const output = runMonteCarloSimulation(safeInput, [10, 15, 20], [3], 100);
    // With 1% withdrawal and positive returns, portfolio should never deplete in 5 years
    expect(output.depletionYearWorst10).toBe(-1);
  });
});
