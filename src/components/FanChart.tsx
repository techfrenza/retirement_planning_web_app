'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { SimulationOutput } from "../engine/types";
import { formatCurrency } from "../utils/formatting";

interface Props {
  output: SimulationOutput;
  projectionYears: number;
}

// Recharts stacked-area fan chart.
// Each band is a DELTA (height of the band), stacked on top of the previous.
// Stacking order bottom-to-top: base (invisible) → d10 → d10_25 → d25_50 → d50_75 → d75_90
// Tooltip uses raw percentile values stored as separate fields.
interface ChartPoint {
  year: number;
  base: number;       // p10 — invisible foundation
  d10_25: number;     // p25 - p10
  d25_50: number;     // p50 - p25
  d50_75: number;     // p75 - p50
  d75_90: number;     // p90 - p75
  // raw values for tooltip
  _p10: number;
  _p25: number;
  _p50: number;
  _p75: number;
  _p90: number;
}

interface TooltipPayload {
  name: string;
  value: number;
  payload: ChartPoint;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-white font-bold mb-2">Year {label}</p>
      <p className="text-green-400">90th %ile: {formatCurrency(pt._p90)}</p>
      <p className="text-blue-300">75th %ile: {formatCurrency(pt._p75)}</p>
      <p className="text-indigo-300 font-semibold">Median (50th): {formatCurrency(pt._p50)}</p>
      <p className="text-yellow-300">25th %ile: {formatCurrency(pt._p25)}</p>
      <p className="text-red-400">10th %ile: {formatCurrency(pt._p10)}</p>
    </div>
  );
}

export function FanChart({ output, projectionYears }: Props) {
  const data: ChartPoint[] = Array.from({ length: projectionYears }, (_, i) => {
    const p10 = output.percentiles.p10[i] ?? 0;
    const p25 = output.percentiles.p25[i] ?? 0;
    const p50 = output.percentiles.p50[i] ?? 0;
    const p75 = output.percentiles.p75[i] ?? 0;
    const p90 = output.percentiles.p90[i] ?? 0;
    return {
      year: i + 1,
      base: p10,
      d10_25: Math.max(0, p25 - p10),
      d25_50: Math.max(0, p50 - p25),
      d50_75: Math.max(0, p75 - p50),
      d75_90: Math.max(0, p90 - p75),
      _p10: p10,
      _p25: p25,
      _p50: p50,
      _p75: p75,
      _p90: p90,
    };
  });

  const maxVal = Math.max(...output.percentiles.p90);
  const yMax = Math.ceil(maxVal / 500_000) * 500_000;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
      <h3 className="text-white font-bold text-lg mb-1">Portfolio Value Over Time</h3>
      <p className="text-slate-400 text-sm mb-6">
        Shaded bands show the range of possible outcomes across 1,000 simulated futures
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 20 }} stackOffset="none">
          <defs>
            <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="transparent" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad10_25" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.15} />
            </linearGradient>
            <linearGradient id="grad25_50" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.15} />
            </linearGradient>
            <linearGradient id="grad50_75" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.15} />
            </linearGradient>
            <linearGradient id="grad75_90" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.15} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="year"
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            label={{ value: "Year", position: "insideBottom", fill: "#94a3b8", dy: 15 }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={(v: number) => formatCurrency(v)}
            domain={[0, yMax]}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: "#94a3b8", fontSize: "12px", paddingTop: "16px" }}
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                d75_90: "75th–90th %ile",
                d50_75: "50th–75th %ile",
                d25_50: "25th–50th %ile",
                d10_25: "10th–25th %ile",
              };
              return labels[value] ?? null;
            }}
          />

          {/* Invisible base layer: occupies p10 height with no fill */}
          <Area
            type="monotone"
            dataKey="base"
            stackId="fan"
            stroke="none"
            fill="transparent"
            legendType="none"
            tooltipType="none"
            dot={false}
            activeDot={false}
          />
          {/* 10th–25th band */}
          <Area
            type="monotone"
            dataKey="d10_25"
            stackId="fan"
            stroke="#ef4444"
            strokeWidth={0}
            fill="url(#grad10_25)"
            name="d10_25"
            dot={false}
            activeDot={false}
          />
          {/* 25th–50th band */}
          <Area
            type="monotone"
            dataKey="d25_50"
            stackId="fan"
            stroke="#f59e0b"
            strokeWidth={0}
            fill="url(#grad25_50)"
            name="d25_50"
            dot={false}
            activeDot={false}
          />
          {/* 50th–75th band */}
          <Area
            type="monotone"
            dataKey="d50_75"
            stackId="fan"
            stroke="#6366f1"
            strokeWidth={0}
            fill="url(#grad50_75)"
            name="d50_75"
            dot={false}
            activeDot={false}
          />
          {/* 75th–90th band */}
          <Area
            type="monotone"
            dataKey="d75_90"
            stackId="fan"
            stroke="#22c55e"
            strokeWidth={0}
            fill="url(#grad75_90)"
            name="d75_90"
            dot={false}
            activeDot={false}
          />
          {/* Median line drawn on top — NOT stacked, uses raw _p50 */}
          <Area
            type="monotone"
            dataKey="_p50"
            stroke="#60a5fa"
            strokeWidth={2.5}
            fill="none"
            dot={false}
            legendType="none"
            tooltipType="none"
            activeDot={{ r: 4, fill: "#60a5fa" }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-4 justify-center mt-2 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500/50 inline-block" />75th–90th</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-500/50 inline-block" />50th–75th</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500/50 inline-block" />25th–50th</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500/50 inline-block" />10th–25th</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-400 inline-block" />Median</span>
      </div>
    </div>
  );
}
