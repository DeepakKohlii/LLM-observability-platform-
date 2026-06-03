export interface GuestStatus {
  guest_id: string;
  calls_used: number;
  calls_remaining: number;
  limit: number;
}

export interface GuestChatResponse {
  response: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  cost_usd: number;
  calls_used: number;
  calls_remaining: number;
}
