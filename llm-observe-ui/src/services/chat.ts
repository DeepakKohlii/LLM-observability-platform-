import axios from "axios";
import type { ChatResponse, ChatSettings } from "../types/chat";
import { API_BASE } from "../utils/format";

export const sendChat = async (
  settings: ChatSettings,
  prompt: string
): Promise<ChatResponse> => {
  const response = await axios.post<ChatResponse>(`${API_BASE}/chat`, {
    provider: settings.provider,
    api_key: settings.apiKey,
    model: settings.model,
    prompt,
    custom_base_url: settings.customBaseUrl || undefined,
  });
  return response.data;
};
