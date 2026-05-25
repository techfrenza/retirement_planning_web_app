'use client'

import { useState } from "react";
import type { SimulationInput, WithdrawalRule } from "../engine/types";

interface Props {
  input: SimulationInput;
  setInput: (input: SimulationInput) => void;
}

const PRESETS = {
  conservative: {
    label: "Conservative",
    description: "Withdraw less in down markets",
    rules: [
      { threshold: 5, rate: 3 },
      { threshold: 0, rate: 2 },
      { threshold: -100, rate: 1.5 },
    ],
  },
  moderate: {
    label: "Moderate",
    description: "Balanced approach (4% rule variant)",
    rules: [
      { threshold: 5, rate: 4 },
      { threshold: 0, rate: 3 },
      { threshold: -100, rate: 2.5 },
    ],
  },
  aggressive: {
    label: "Aggressive",
    description: "Maximize withdrawals in bull markets",
    rules: [
      { threshold: 5, rate: 5 },
      { threshold: 0, rate: 4 },
      { threshold: -100, rate: 3 },
    ],
  },
} as const;

function rulesMatch(a: WithdrawalRule[], b: readonly { threshold: number; rate: number }[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((r, i) => r.threshold === b[i].threshold && r.rate === b[i].rate);
}

export function StrategyStep({ input, setInput }: Props) {
  const [showCustom, setShowCustom] = useState(false);

  const activePreset = Object.entries(PRESETS).find(([, p]) =>
    rulesMatch(input.withdrawalRules, p.rules)
  )?.[0];

  const applyPreset = (key: keyof typeof PRESETS) => {
    setInput({ ...input, withdrawalRules: PRESETS[key].rules.map((r) => ({ ...r })) });
    setShowCustom(false);
  };

  const updateRule = (idx: number, field: keyof WithdrawalRule, value: number) => {
    const updated = input.withdrawalRules.map((r, i) =>
      i === idx ? { ...r, [field]: value } : r
    );
    setInput({ ...input, withdrawalRules: updated });
  };

  const addRule = () => {
    setInput({
      ...input,
      withdrawalRules: [...input.withdrawalRules, { threshold: 0, rate: 3 }],
    });
  };

  const removeRule = (idx: number) => {
    if (input.withdrawalRules.length <= 1) return;
    setInput({
      ...input,
      withdrawalRules: input.withdrawalRules.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-xl font-bold mb-1">Withdrawal Rules</h2>
        <p className="text-slate-400 text-sm">How much will you withdraw each year? Rules are matched by market return.</p>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(PRESETS) as Array<[keyof typeof PRESETS, typeof PRESETS[keyof typeof PRESETS]]>).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => applyPreset(key)}
            className={`p-3 rounded-lg border text-left transition-all ${
              activePreset === key
                ? "border-indigo-500 bg-indigo-900/30 text-white"
                : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-500"
            }`}
          >
            <p className="font-semibold text-sm">{preset.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{preset.description}</p>
            <p className="text-xs text-indigo-400 mt-1">
              Up to {Math.max(...preset.rules.map((r) => r.rate))}%
            </p>
          </button>
        ))}
      </div>

      {/* Active rules preview */}
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <p className="text-slate-300 text-sm font-medium">Active Rules</p>
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors"
          >
            {showCustom ? "Hide editor" : "Customize →"}
          </button>
        </div>
        <div className="space-y-2">
          {[...input.withdrawalRules]
            .sort((a, b) => b.threshold - a.threshold)
            .map((rule, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">If market return ≥</span>
                <span className="text-indigo-300 font-mono font-bold">{rule.threshold}%</span>
                <span className="text-slate-400">→ withdraw</span>
                <span className="text-green-300 font-mono font-bold">{rule.rate}%</span>
              </div>
            ))}
        </div>
      </div>

      {/* Custom rule editor */}
      {showCustom && (
        <div className="border border-indigo-800 bg-indigo-950/20 rounded-xl p-4 space-y-3">
          <p className="text-indigo-300 text-sm font-medium">Custom Rules</p>
          {input.withdrawalRules.map((rule, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-slate-400 text-xs whitespace-nowrap">If return ≥</span>
              <input
                type="number"
                value={rule.threshold}
                onChange={(e) => updateRule(idx, "threshold", Number(e.target.value))}
                className="w-20 bg-slate-900 border border-slate-600 text-white rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-indigo-500"
              />
              <span className="text-slate-400 text-xs">% → withdraw</span>
              <input
                type="number"
                step={0.1}
                min={0}
                max={20}
                value={rule.rate}
                onChange={(e) => updateRule(idx, "rate", Number(e.target.value))}
                className="w-20 bg-slate-900 border border-slate-600 text-white rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-indigo-500"
              />
              <span className="text-slate-400 text-xs">%</span>
              <button
                onClick={() => removeRule(idx)}
                className="text-red-400 hover:text-red-300 text-xs ml-auto"
                disabled={input.withdrawalRules.length <= 1}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={addRule}
            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            + Add rule
          </button>
        </div>
      )}

      <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700">
        <p className="text-slate-400 text-xs leading-relaxed">
          <span className="text-slate-300 font-medium">How rules work:</span> Each year, the simulator picks the rule whose threshold best matches the sampled market return. In bear markets, you automatically withdraw less — extending portfolio life.
        </p>
      </div>
    </div>
  );
}
