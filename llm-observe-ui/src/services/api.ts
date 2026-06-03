import axios from "axios";
import type { StatsResponse } from "../types/stats";
import { API_BASE } from "../utils/format";

const api = axios.create({
  baseURL: API_BASE,
});

export const getStats = async (
  guestId?: string | null
): Promise<StatsResponse> => {
  const response = await api.get<StatsResponse>("/stats", {
    params: guestId ? { guest_id: guestId } : undefined,
  });
  return response.data;
};
