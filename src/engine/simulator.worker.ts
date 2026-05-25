import { runMonteCarloSimulation } from "./simulator";
import type { WorkerMessage, WorkerResponse } from "./types";

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  try {
    const { input, returns, inflationRates } = event.data;
    const result = runMonteCarloSimulation(input, returns, inflationRates);
    const response: WorkerResponse = { success: true, result };
    self.postMessage(response);
  } catch (err) {
    const response: WorkerResponse = {
      success: false,
      result: null as never,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
};
