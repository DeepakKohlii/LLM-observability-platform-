export const API_BASE = "http://localhost:8000";

export function latencyClass(ms: number): string {
  if (ms < 1000) return "latency-ok";
  if (ms < 3000) return "latency-warn";
  return "latency-bad";
}

export function formatCalls(n: number | undefined): string {
  if (n === undefined) return "—";
  return n.toLocaleString();
}

export function formatCost(n: number | undefined): string {
  if (n === undefined) return "—";
  return `$${n.toFixed(4)}`;
}

export function formatLatency(n: number | undefined): string {
  if (n === undefined) return "—";
  return `${n.toLocaleString()}ms`;
}

export function formatTraceCost(n: number): string {
  return `$${n.toFixed(5)}`;
}

export function formatTraceTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString();
}
