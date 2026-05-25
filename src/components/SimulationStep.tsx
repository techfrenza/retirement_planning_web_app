'use client'

import type { SimulationInput } from "../engine/types";
import { formatCurrencyFull } from "../utils/formatting";

interface Props {
  input: SimulationInput;
  setInput: (input: SimulationInput) => void;
  onRunSimulation: () => void;
  loading: boolean;
}

export function SimulationStep({ input, setInput, onRunSimulation, loading }: Props) {
  const totalAlloc = input.cashAllocation + input.bondsAllocation + input.equityAllocation;
  const allocError = Math.abs(totalAlloc - 100) > 0.5;
  const portfolioError = input.portfolioValue <= 0;
  const canRun = !allocError && !portfolioError && !loading;

  const year1Withdrawal = input.withdrawalRules.length > 0
    ? (input.portfolioValue * Math.max(...input.withdrawalRules.map((r) => r.rate))) / 100
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold mb-1">Run Simulation</h2>
        <p className="text-slate-400 text-sm">Review your inputs and run 1,000 Monte Carlo simulations.</p>
      </div>

      {/* Summary */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-700 p-4 space-y-3">
        <p className="text-slate-300 text-sm font-medium mb-3">Inputs Summary</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-400 text-xs">Portfolio Value</p>
            <p className={`font-bold ${portfolioError ? "text-red-400" : "text-white"}`}>
              {portfolioError ? "Not set" : formatCurrencyFull(input.portfolioValue)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Allocation</p>
            <p className={`font-bold ${allocError ? "text-red-400" : "text-white"}`}>
              {allocError
                ? `${totalAlloc}% (must be 100)`
                : `${input.cashAllocation}% / ${input.bondsAllocation}% / ${input.equityAllocation}%`}
            </p>
            {!allocError && <p className="text-slate-500 text-xs">Cash / Bonds / Equity</p>}
          </div>
          <div>
            <p className="text-slate-400 text-xs">Projection</p>
            <p className="text-white font-bold">{input.projectionYears} years</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Max Year 1 Withdrawal</p>
            <p className="text-white font-bold">{formatCurrencyFull(year1Withdrawal)}</p>
          </div>
        </div>
      </div>

      {/* Projection years */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-slate-300 text-sm font-medium">Projection Horizon</label>
          <span className="text-white font-bold text-sm">{input.projectionYears} years</span>
        </div>
        <input
          type="range"
          min={10}
          max={50}
          step={5}
          value={input.projectionYears}
          onChange={(e) => setInput({ ...input, projectionYears: Number(e.target.value) })}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-indigo-500"
        />
        <div className="flex justify-between text-slate-500 text-xs mt-1">
          <span>10 yrs</span>
          <span>30 yrs</span>
          <span>50 yrs</span>
        </div>
      </div>

      {/* Validation errors */}
      {(allocError || portfolioError) && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 space-y-1">
          {portfolioError && <p className="text-red-400 text-sm">⚠ Portfolio value must be greater than 0</p>}
          {allocError && <p className="text-red-400 text-sm">⚠ Asset allocations must sum to 100% (currently {totalAlloc.toFixed(0)}%)</p>}
        </div>
      )}

      {/* Run button */}
      <button
        onClick={onRunSimulation}
        disabled={!canRun}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-900/30"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Running 1,000 simulations…
          </span>
        ) : (
          "Run Simulation →"
        )}
      </button>

      <p className="text-slate-500 text-xs text-center">
        Runs in your browser using historical S&P 500 data (2004–2025). No data is sent to any server.
      </p>
    </div>
  );
}
