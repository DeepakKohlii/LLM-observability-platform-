import ChatPanel from "../components/chat/ChatPanel";
import ProviderSettings from "../components/chat/ProviderSettings";
import Layout from "../components/Layout";
import { useChatSettings } from "../hooks/useChatSettings";
import type { Page, UserMode } from "../types/navigation";

interface Props {
  mode: UserMode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onGoHome: () => void;
  backendOnline: boolean;
  guestId?: string;
  callsRemaining?: number;
  onTraceLogged?: () => void;
  onGuestUpdated?: () => void;
  onUpgrade?: () => void;
  onSwitchToGuest?: () => void;
}

function Chat({
  mode,
  currentPage,
  onNavigate,
  onGoHome,
  backendOnline,
  guestId,
  callsRemaining,
  onTraceLogged,
  onGuestUpdated,
  onUpgrade,
  onSwitchToGuest,
}: Props) {
  const { settings, updateSettings, providerConfig, isConfigured } =
    useChatSettings();

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={onNavigate}
      onGoHome={onGoHome}
      backendOnline={backendOnline}
      mode={mode}
      callsRemaining={callsRemaining}
      onSwitchToGuest={onSwitchToGuest}
    >
      <div className="topbar">
        <div>
          <div className="page-title">
            Chat <span>Playground</span>
          </div>
          <div className="last-updated">
            {mode === "guest"
              ? "Guest demo — 5 free calls, then add your own API key"
              : "Test LLM calls — traces appear on Dashboard automatically"}
          </div>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={() => onNavigate("dashboard")}
        >
          view dashboard →
        </button>
      </div>

      <div className="chat-layout">
        <ChatPanel
          mode={mode}
          settings={settings}
          isConfigured={isConfigured}
          guestId={guestId}
          callsRemaining={callsRemaining}
          onTraceLogged={onTraceLogged}
          onGuestUpdated={onGuestUpdated}
          onUpgrade={onUpgrade}
        />
        {mode === "full" ? (
          <ProviderSettings
            settings={settings}
            providerConfig={providerConfig}
            onChange={updateSettings}
            callsRemaining={callsRemaining}
            onSwitchToGuest={onSwitchToGuest}
          />
        ) : (
          <div className="chat-settings guest-upgrade-panel">
            <div className="chat-settings-title">Guest Demo</div>
            <p className="chat-settings-note">
              You're using our shared API key for up to 5 free calls. Every
              request is traced and shows up on your personal dashboard graphs.
            </p>
            <ul className="guest-feature-list">
              <li>Real LLM responses via OpenRouter</li>
              <li>Live cost & latency tracking</li>
              <li>Dashboard graphs update instantly</li>
            </ul>
            <button
              type="button"
              className="landing-btn landing-btn-primary landing-btn-block"
              onClick={onUpgrade}
            >
              bring your own API key →
            </button>
            <p className="chat-settings-note" style={{ marginTop: 16 }}>
              Supports OpenAI, OpenRouter, Groq, Anthropic & custom endpoints.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Chat;
