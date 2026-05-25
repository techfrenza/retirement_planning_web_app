import type { SimulationOutput } from "../engine/types";
import { formatPercent } from "../utils/formatting";

interface Props {
  survivalProbability: number;
  projectionYears: number;
  output: SimulationOutput;
}

export function SurvivalMetric({ survivalProbability, projectionYears, output }: Props) {
  const pct = survivalProbability * 100;
  const colorClass =
    pct >= 80 ? "text-green-400" : pct >= 60 ? "text-yellow-400" : "text-red-400";
  const bgClass =
    pct >= 80 ? "bg-green-900/30 border-green-700" : pct >= 60 ? "bg-yellow-900/30 border-yellow-700" : "bg-red-900/30 border-red-700";

  const lastPercentile = output.percentiles;
  const bestCase = lastPercentile.p90[lastPercentile.p90.length - 1];
  const worstCase = lastPercentile.p10[lastPercentile.p10.length - 1];
  const medianWithdrawal = output.percentiles.p50[0]
    ? (output.runs.map(r => r[0]?.withdrawal ?? 0).sort((a, b) => a - b)[Math.floor(output.runs.length * 0.5)] ?? 0)
    : 0;

  return (
    <div className={`rounded-xl border p-6 ${bgClass} text-center`}>
      <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Probability of Success</p>
      <p className={`text-7xl font-black ${colorClass} leading-none`}>
        {pct.toFixed(0)}%
      </p>
      <p className="text-slate-300 mt-3 text-lg">
        Your portfolio has a <span className={`font-bold ${colorClass}`}>{formatPercent(survivalProbability, 0)}</span> chance of lasting{" "}
        <span className="font-bold text-white">{projectionYears} years</span>
      </p>

      {output.depletionYearWorst10 > 0 && (
        <p className="text-slate-400 mt-2 text-sm">
          Worst 10%: portfolio depleted around year {output.depletionYearWorst10}
        </p>
      )}

      <div className="grid grid-cols-3 gap-4 mt-6 text-left">
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Best Case (90th)</p>
          <p className="text-green-400 font-bold text-lg">
            {bestCase >= 1_000_000 ? `$${(bestCase / 1_000_000).toFixed(1)}M` : `$${(bestCase / 1_000).toFixed(0)}K`}
          </p>
          <p className="text-slate-500 text-xs">at year {projectionYears}</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Median Withdrawal</p>
          <p className="text-blue-400 font-bold text-lg">
            ${(medianWithdrawal / 1_000).toFixed(0)}K
          </p>
          <p className="text-slate-500 text-xs">year 1</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Worst Case (10th)</p>
          <p className="text-red-400 font-bold text-lg">
            {worstCase >= 1_000_000 ? `$${(worstCase / 1_000_000).toFixed(1)}M` : worstCase > 0 ? `$${(worstCase / 1_000).toFixed(0)}K` : "Depleted"}
          </p>
          <p className="text-slate-500 text-xs">at year {projectionYears}</p>
        </div>
      </div>
    </div>
  );
}
