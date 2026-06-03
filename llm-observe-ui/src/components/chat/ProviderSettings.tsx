import { PROVIDERS, type ChatSettings, type ProviderConfig } from "../../types/chat";

interface Props {
  settings: ChatSettings;
  providerConfig: ProviderConfig;
  onChange: (patch: Partial<ChatSettings>) => void;
  callsRemaining?: number;
  onSwitchToGuest?: () => void;
}

function ProviderSettings({
  settings,
  providerConfig,
  onChange,
  callsRemaining,
  onSwitchToGuest,
}: Props) {
  return (
    <div className="chat-settings">
      <div className="chat-settings-title">API Configuration</div>
      <p className="chat-settings-note">
        Your API key is stored locally in your browser and sent only to the
        backend proxy for the LLM call. It is never saved on the server.
      </p>

      <label className="field-label">
        Provider
        <select
          className="field-input"
          value={settings.provider}
          onChange={(e) =>
            onChange({ provider: e.target.value as ChatSettings["provider"] })
          }
        >
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        API Key
        <input
          className="field-input"
          type="password"
          placeholder={providerConfig.placeholder}
          value={settings.apiKey}
          onChange={(e) => onChange({ apiKey: e.target.value })}
          autoComplete="off"
        />
      </label>

      {providerConfig.needsCustomUrl && (
        <label className="field-label">
          Base URL
          <input
            className="field-input"
            type="url"
            placeholder="https://api.example.com/v1"
            value={settings.customBaseUrl}
            onChange={(e) => onChange({ customBaseUrl: e.target.value })}
          />
        </label>
      )}

      <label className="field-label">
        Model
        {providerConfig.models.length > 0 ? (
          <select
            className="field-input"
            value={settings.model}
            onChange={(e) => onChange({ model: e.target.value })}
          >
            {providerConfig.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="field-input"
            type="text"
            placeholder="model-name"
            value={settings.model}
            onChange={(e) => onChange({ model: e.target.value })}
          />
        )}
      </label>

      {providerConfig.docsUrl && (
        <a
          className="chat-docs-link"
          href={providerConfig.docsUrl}
          target="_blank"
          rel="noreferrer"
        >
          Get API key →
        </a>
      )}

      {onSwitchToGuest && (
        <div className="mode-switch-section">
          <div className="mode-switch-divider" />
          <p className="chat-settings-note">
            {callsRemaining !== undefined && callsRemaining > 0
              ? `You still have ${callsRemaining} free guest call${callsRemaining === 1 ? "" : "s"} left.`
              : callsRemaining === 0
                ? "Guest demo limit reached for this session."
                : "Try the platform without an API key."}
          </p>
          <button
            type="button"
            className="landing-btn landing-btn-outline landing-btn-block"
            onClick={onSwitchToGuest}
            disabled={callsRemaining === 0}
          >
            ← switch to guest mode
            {callsRemaining !== undefined ? ` (${callsRemaining}/5 left)` : ""}
          </button>
        </div>
      )}
    </div>
  );
}

export default ProviderSettings;
