import { API_BASE } from "../utils/format";
import type { Page, UserMode } from "../types/navigation";

const NAV_ITEMS: { id: Page; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "chat", label: "Chat Playground" },
];

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onGoHome: () => void;
  backendOnline: boolean;
  mode?: UserMode;
  callsRemaining?: number;
  onSwitchToGuest?: () => void;
}

function Sidebar({
  currentPage,
  onNavigate,
  onGoHome,
  backendOnline,
  mode,
  callsRemaining,
  onSwitchToGuest,
}: Props) {
  const host = API_BASE.replace(/^https?:\/\//, "");

  return (
    <aside className="sidebar">
      <button type="button" className="logo logo-btn" onClick={onGoHome}>
        <div className="logo-mark">llm_observe</div>
        <div className="logo-sub">Platform v1.0</div>
      </button>

      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item${currentPage === item.id ? " active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-dot" />
            {item.label}
          </button>
        ))}
      </nav>

      {mode === "guest" && (
        <div className="sidebar-guest-pill">
          guest · {callsRemaining ?? 0}/5 left
        </div>
      )}

      {mode === "full" && onSwitchToGuest && (
        <button
          type="button"
          className="sidebar-mode-switch"
          onClick={onSwitchToGuest}
          disabled={callsRemaining === 0}
        >
          ← guest demo
          {callsRemaining !== undefined ? ` (${callsRemaining}/5)` : ""}
        </button>
      )}

      <div className={`status-bar${backendOnline ? "" : " offline"}`}>
        <span className="status-dot" />
        {backendOnline ? "backend online" : "backend offline"}
        <div className="status-host">{host}</div>
      </div>
    </aside>
  );
}

export default Sidebar;
