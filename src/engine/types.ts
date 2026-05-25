export interface WithdrawalRule {
  threshold: number; // market return % — apply this rate when return >= threshold
  rate: number;      // withdrawal rate %
}

export interface SimulationInput {
  portfolioValue: number;
  cashAllocation: number;   // 0-100
  bondsAllocation: number;  // 0-100
  equityAllocation: number; // 0-100
  withdrawalRules: WithdrawalRule[];
  projectionYears: number;
}

export interface YearResult {
  year: number;
  portfolioValue: number;
  withdrawal: number;
  cashValue: number;
  bondsValue: number;
  equityValue: number;
}

export interface SimulationOutput {
  runs: YearResult[][];
  percentiles: {
    p10: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p90: number[];
  };
  survivalProbability: number; // 0-1
  depletionYearWorst10: number;
}

export interface WorkerMessage {
  input: SimulationInput;
  returns: number[];
  inflationRates: number[];
}

export interface WorkerResponse {
  success: boolean;
  result: SimulationOutput;
  error?: string;
}

export interface SimulationContext {
  portfolioValue: number;
  survivalProbability: number;
  withdrawalRules: Array<{ threshold: number; rate: number }>;
  projectionYears: number;
  p50Final: number;
  p10Final: number;
  p90Final: number;
  medianWithdrawalYear1: number;
}