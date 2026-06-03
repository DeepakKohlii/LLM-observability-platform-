export interface Trace {
    timestamp: string;
    model: string;
    prompt: string;
    response: string;
    latency_ms: number;
    cost_usd: number;
    error?: string;
  }
  
  export interface DailyStat {
    day: string;
    cost: number;
    calls: number;
  }
  
  export interface StatsResponse {
    total_calls: number;
    total_cost_usd: number;
    avg_latency_ms: number;
    error_count: number;
    daily: DailyStat[];
    recent_traces: Trace[];
  }