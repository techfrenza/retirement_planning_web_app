'use client'

import { useState } from "react";
import type { SimulationInput } from "../engine/types";
import { NestEggStep } from "./NestEggStep";
import { StrategyStep } from "./StrategyStep";
import { SimulationStep } from "./SimulationStep";

interface Props {
  input: SimulationInput;
  setInput: (input: SimulationInput) => void;
  onRunSimulation: () => void;
  loading: boolean;
}

const STEPS = ["Your Nest Egg", "Withdrawal Rules", "Simulate"] as const;

export function Wizard({ input, setInput, onRunSimulation, loading }: Props) {
  const [step, setStep] = useState(0);

  const canNext = step < STEPS.length - 1;
  const canBack = step > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-white text-3xl font-black tracking-tight">Retirement Simulator</h1>
          <p className="text-slate-400 mt-2 text-sm">Monte Carlo analysis using real historical market data</p>
        </div>

        {/* Step tabs */}
        <div className="flex mb-8 bg-slate-800/60 rounded-xl p-1">
          {STEPS.map((label, i) => (
            <button
              key={label}
              onClick={() => setStep(i)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                step === i
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          {step === 0 && <NestEggStep input={input} setInput={setInput} />}
          {step === 1 && <StrategyStep input={input} setInput={setInput} />}
          {step === 2 && (
            <SimulationStep
              input={input}
              setInput={setInput}
              onRunSimulation={onRunSimulation}
              loading={loading}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={!canBack}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>
          {canNext && (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
