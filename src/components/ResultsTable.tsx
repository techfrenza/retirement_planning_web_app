'use client'

import { Fragment, useState } from "react";
import type { SimulationOutput, YearResult } from "../engine/types";
import { formatCurrencyFull } from "../utils/formatting";

interface Props {
  output: SimulationOutput;
  projectionYears: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

export function ResultsTable({ output, projectionYears }: Props) {
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  const tableRows = Array.from({ length: projectionYears }, (_, i) => {
    const year = i + 1;
    const yearRuns: YearResult[] = output.runs.map((run) => run[i]).filter(Boolean);
    const medianPortfolio = median(yearRuns.map((r) => r.portfolioValue));
    const medianWithdrawal = median(yearRuns.map((r) => r.withdrawal));
    const medianCash = median(yearRuns.map((r) => r.cashValue));
    const medianBonds = median(yearRuns.map((r) => r.bondsValue));
    const medianEquity = median(yearRuns.map((r) => r.equityValue));
    const prevMedian = i > 0
      ? median(output.runs.map((run) => run[i - 1]?.portfolioValue ?? 0))
      : null;
    const growing = prevMedian === null || medianPortfolio >= prevMedian;
    return { year, medianPortfolio, medianWithdrawal, medianCash, medianBonds, medianEquity, growing, yearRuns };
  });

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
      <h3 className="text-white font-bold text-lg mb-2">Year-by-Year Results</h3>
      <p className="text-slate-400 text-sm mb-4">Median values across all 1,000 simulations. Click a row to see individual run breakdown.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Year</th>
              <th className="text-right py-2 px-3 text-slate-400 font-medium">Portfolio</th>
              <th className="text-right py-2 px-3 text-slate-400 font-medium">Withdrawal</th>
              <th className="text-right py-2 px-3 text-slate-400 font-medium hidden sm:table-cell">Cash</th>
              <th className="text-right py-2 px-3 text-slate-400 font-medium hidden sm:table-cell">Bonds</th>
              <th className="text-right py-2 px-3 text-slate-400 font-medium hidden sm:table-cell">Equity</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <Fragment key={row.year}>
                <tr
                  className={`border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30 transition-colors ${
                    expandedYear === row.year ? "bg-slate-700/40" : ""
                  }`}
                  onClick={() => setExpandedYear(expandedYear === row.year ? null : row.year)}
                >
                  <td className="py-2 px-3 text-slate-300 font-medium">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${row.growing ? "bg-green-500" : "bg-red-500"}`} />
                      {row.year}
                    </span>
                  </td>
                  <td className={`py-2 px-3 text-right font-semibold ${row.growing ? "text-green-400" : "text-red-400"}`}>
                    {formatCurrencyFull(row.medianPortfolio)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-300">{formatCurrencyFull(row.medianWithdrawal)}</td>
                  <td className="py-2 px-3 text-right text-slate-400 hidden sm:table-cell">{formatCurrencyFull(row.medianCash)}</td>
                  <td className="py-2 px-3 text-right text-slate-400 hidden sm:table-cell">{formatCurrencyFull(row.medianBonds)}</td>
                  <td className="py-2 px-3 text-right text-slate-400 hidden sm:table-cell">{formatCurrencyFull(row.medianEquity)}</td>
                </tr>
                {expandedYear === row.year && (
                  <tr className="bg-slate-900/60">
                    <td colSpan={6} className="px-3 py-3">
                      <p className="text-slate-400 text-xs mb-2">Individual run distribution for year {row.year}:</p>
                      <div className="flex gap-4 flex-wrap text-xs">
                        <span className="text-slate-400">Min: <span className="text-red-400">{formatCurrencyFull(Math.min(...row.yearRuns.map(r => r.portfolioValue)))}</span></span>
                        <span className="text-slate-400">10th %: <span className="text-orange-400">{formatCurrencyFull(row.yearRuns.sort((a,b)=>a.portfolioValue-b.portfolioValue)[Math.floor(row.yearRuns.length*0.1)]?.portfolioValue ?? 0)}</span></span>
                        <span className="text-slate-400">Median: <span className="text-blue-400">{formatCurrencyFull(row.medianPortfolio)}</span></span>
                        <span className="text-slate-400">90th %: <span className="text-green-400">{formatCurrencyFull(row.yearRuns[Math.floor(row.yearRuns.length*0.9)]?.portfolioValue ?? 0)}</span></span>
                        <span className="text-slate-400">Max: <span className="text-green-300">{formatCurrencyFull(Math.max(...row.yearRuns.map(r => r.portfolioValue)))}</span></span>
                        <span className="text-slate-400">Depleted: <span className="text-red-500">{row.yearRuns.filter(r => r.portfolioValue <= 0).length} / {row.yearRuns.length}</span></span>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
