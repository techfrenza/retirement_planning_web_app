'use client'

import { useState, useEffect } from "react";
import type { SimulationInput, SimulationOutput } from "./engine/types";
import { loadHistoricalData } from "./data/historical";
import { decodeFromUrl } from "./utils/sharing";
import { Wizard } from "./components/Wizard";
import { ResultsDashboard } from "./components/ResultsDashboard";

const DEFAULT_INPUT: SimulationInput = {
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

export default function App() {
  const [input, setInput] = useState<SimulationInput>(DEFAULT_INPUT);
  const [results, setResults] = useState<SimulationOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRunSimulation = async (overrideInput?: SimulationInput) => {
    const effectiveInput = overrideInput ?? input;
    setLoading(true);
    try {
      const { returns, inflationRates } = await loadHistoricalData();
      const worker = new Worker(
        new URL("./engine/simulator.worker.ts", import.meta.url),
        { type: "module" }
      );
      worker.postMessage({ input: effectiveInput, returns, inflationRates });
      worker.onmessage = (event) => {
        const { success, result, error } = event.data;
        if (success) {
          setResults(result);
        } else {
          console.error("Simulation failed:", error);
        }
        setLoading(false);
        worker.terminate();
      };
      worker.onerror = (err) => {
        console.error("Worker error:", err);
        setLoading(false);
        worker.terminate();
      };
    } catch (err) {
      console.error("Failed to load historical data:", err);
      setLoading(false);
    }
  };

  // Decode URL params and auto-run after mount (safe: window only exists in browser)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const decoded = decodeFromUrl(params);
    if (decoded) {
      setInput(decoded);
    }
    if (params.get("plan")) {
      handleRunSimulation(decoded ?? undefined);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    setResults(null);
    // Clear plan param from URL without reload
    const url = new URL(window.location.href);
    url.searchParams.delete("plan");
    window.history.replaceState({}, "", url.toString());
  };

  return results ? (
    <ResultsDashboard results={results} input={input} onReset={handleReset} />
  ) : (
    <Wizard
      input={input}
      setInput={setInput}
      onRunSimulation={handleRunSimulation}
      loading={loading}
    />
  );
}
