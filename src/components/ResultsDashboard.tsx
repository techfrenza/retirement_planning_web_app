'use client'

import type { SimulationOutput, SimulationInput } from "../engine/types";
import { SurvivalMetric } from "./SurvivalMetric";
import { FanChart } from "./FanChart";
import { ResultsTable } from "./ResultsTable";
import { AdvisorPanel } from "./AdvisorPanel";
import { encodeToUrl } from "../utils/sharing";

interface Props {
  results: SimulationOutput;
  input: SimulationInput;
  onReset: () => void;
}

export function ResultsDashboard({ results, input, onReset }: Props) {
  const handleShare = async () => {
    const url = encodeToUrl(input);
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    } catch {
      prompt("Copy this link:", url);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-2xl sm:text-3xl font-bold">Simulation Results</h1>
            <p className="text-slate-400 mt-1 text-sm">Based on 1,000 simulated futures using historical S&P 500 returns (2004–2025)</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Share
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              New Simulation
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <SurvivalMetric
            survivalProbability={results.survivalProbability}
            projectionYears={input.projectionYears}
            output={results}
          />
          <FanChart output={results} projectionYears={input.projectionYears} />
          <ResultsTable output={results} projectionYears={input.projectionYears} />
          <AdvisorPanel results={results} input={input} />
        </div>

        <p className="text-slate-600 text-xs text-center mt-8">
          Past returns do not guarantee future results. This simulator is for educational purposes only.
        </p>
      </div>
    </div>
  );
}
