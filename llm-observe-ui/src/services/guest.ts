import axios from "axios";
import type { GuestChatResponse, GuestStatus } from "../types/guest";
import { API_BASE } from "../utils/format";

export const fetchGuestStatus = async (
  guestId: string
): Promise<GuestStatus> => {
  const response = await axios.get<GuestStatus>(`${API_BASE}/guest/status`, {
    params: { guest_id: guestId },
  });
  return response.data;
};

export const sendGuestChat = async (
  guestId: string,
  prompt: string
): Promise<GuestChatResponse> => {
  const response = await axios.post<GuestChatResponse>(
    `${API_BASE}/chat/guest`,
    { guest_id: guestId, prompt }
  );
  return response.data;
};
