let cachedReturns: number[] | null = null;
let cachedInflation: number[] | null = null;

export async function loadHistoricalData(): Promise<{
  returns: number[];
  inflationRates: number[];
}> {
  if (cachedReturns && cachedInflation) {
    return { returns: cachedReturns, inflationRates: cachedInflation };
  }

  const [returnsRes, inflationRes] = await Promise.all([
    fetch("/data/sp500_returns.json"),
    fetch("/data/inflation_rates.json"),
  ]);

  const returnsMap: Record<string, number> = await returnsRes.json();
  const inflationMap: Record<string, number> = await inflationRes.json();

  cachedReturns = Object.values(returnsMap);
  cachedInflation = Object.values(inflationMap);

  return { returns: cachedReturns, inflationRates: cachedInflation };
}