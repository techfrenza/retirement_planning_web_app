import type { SimulationInput } from "../engine/types";

export function encodeToUrl(input: SimulationInput): string {
  const encoded = btoa(JSON.stringify(input));
  return `${window.location.origin}${window.location.pathname}?plan=${encoded}`;
}

export function decodeFromUrl(params: URLSearchParams): SimulationInput | null {
  const encoded = params.get("plan");
  if (!encoded) return null;
  try {
    return JSON.parse(atob(encoded)) as SimulationInput;
  } catch {
    return null;
  }
}
