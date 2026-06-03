import { useCallback, useState } from "react";
import {
  DEFAULT_SETTINGS,
  PROVIDERS,
  type ChatSettings,
  type ProviderId,
} from "../types/chat";

const STORAGE_KEY = "llm_observe_chat_settings";

function loadSettings(): ChatSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ChatSettings>;
    const provider = (parsed.provider ?? DEFAULT_SETTINGS.provider) as ProviderId;
    const config = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0];
    return {
      provider,
      apiKey: parsed.apiKey ?? "",
      model: parsed.model ?? config.defaultModel,
      customBaseUrl: parsed.customBaseUrl ?? "",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings: ChatSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export const useChatSettings = () => {
  const [settings, setSettings] = useState<ChatSettings>(loadSettings);

  const updateSettings = useCallback((patch: Partial<ChatSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (patch.provider && patch.provider !== prev.provider) {
        const config = PROVIDERS.find((p) => p.id === patch.provider)!;
        next.model = config.defaultModel;
      }
      persistSettings(next);
      return next;
    });
  }, []);

  const providerConfig =
    PROVIDERS.find((p) => p.id === settings.provider) ?? PROVIDERS[0];

  const isConfigured =
    settings.apiKey.trim().length > 0 &&
    settings.model.trim().length > 0 &&
    (settings.provider !== "custom" || settings.customBaseUrl.trim().length > 0);

  return { settings, updateSettings, providerConfig, isConfigured };
};
