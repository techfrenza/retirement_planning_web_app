'use client'

import type { SimulationInput } from "../engine/types";
import { formatCurrencyFull } from "../utils/formatting";

interface Props {
  input: SimulationInput;
  setInput: (input: SimulationInput) => void;
}

export function NestEggStep({ input, setInput }: Props) {
  const totalAlloc = input.cashAllocation + input.bondsAllocation + input.equityAllocation;
  const allocError = Math.abs(totalAlloc - 100) > 0.5;

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setInput({ ...input, portfolioValue: Number(raw) || 0 });
  };

  const handleSlider = (key: "cashAllocation" | "bondsAllocation" | "equityAllocation", value: number) => {
    setInput({ ...input, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold mb-1">Your Nest Egg</h2>
        <p className="text-slate-400 text-sm">How much have you saved for retirement?</p>
      </div>

      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">Total Portfolio Value</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
          <input
            type="text"
            value={input.portfolioValue === 0 ? "" : input.portfolioValue.toLocaleString("en-US")}
            onChange={handlePortfolioChange}
            placeholder="1,000,000"
            className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg pl-8 pr-4 py-3 text-lg focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        {input.portfolioValue > 0 && (
          <p className="text-slate-400 text-xs mt-1">{formatCurrencyFull(input.portfolioValue)}</p>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-slate-300 text-sm font-medium">Asset Allocation</h3>
          <span className={`text-xs font-medium ${allocError ? "text-red-400" : "text-green-400"}`}>
            {totalAlloc.toFixed(0)}% {allocError ? "(must equal 100%)" : "✓"}
          </span>
        </div>

        <div className="space-y-4">
          {[
            { key: "cashAllocation" as const, label: "Cash", description: "Emergency liquidity, very stable", color: "text-yellow-400", accent: "accent-yellow-400" },
            { key: "bondsAllocation" as const, label: "Bonds", description: "Stable income, low volatility", color: "text-blue-400", accent: "accent-blue-400" },
            { key: "equityAllocation" as const, label: "Equity (Stocks)", description: "Growth engine, higher volatility", color: "text-green-400", accent: "accent-green-400" },
          ].map(({ key, label, description, color, accent }) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <div>
                  <span className={`text-sm font-medium ${color}`}>{label}</span>
                  <span className="text-slate-500 text-xs ml-2">— {description}</span>
                </div>
                <span className="text-white font-bold text-sm">{input[key]}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={input[key]}
                onChange={(e) => handleSlider(key, Number(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 ${accent}`}
              />
            </div>
          ))}
        </div>

        {allocError && (
          <p className="text-red-400 text-xs mt-3 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
            Allocations must sum to 100%. Current total: {totalAlloc.toFixed(0)}%
          </p>
        )}
      </div>
    </div>
  );
}
