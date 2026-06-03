import { useCallback, useState } from "react";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import { useGuest } from "./hooks/useGuest";
import { useStats } from "./hooks/useStats";
import type { AppView, Page, UserMode } from "./types/navigation";

function App() {
  const [view, setView] = useState<AppView>("landing");
  const [page, setPage] = useState<Page>("chat");
  const [userMode, setUserMode] = useState<UserMode>("guest");

  const isGuest = view === "app" && userMode === "guest";
  const guest = useGuest(view === "app");
  const stats = useStats(isGuest ? guest.guestId : null);

  const backendOnline = view === "landing" ? true : !stats.error && !!stats.data;

  const startGuest = useCallback(() => {
    setUserMode("guest");
    setView("app");
    setPage("chat");
  }, []);

  const switchToGuest = useCallback(() => {
    setUserMode("guest");
    setPage("chat");
  }, []);

  const startFull = useCallback(() => {
    setUserMode("full");
    setView("app");
    setPage("chat");
  }, []);

  const goHome = useCallback(() => {
    setView("landing");
  }, []);

  const onTraceLogged = useCallback(() => {
    stats.refresh();
  }, [stats.refresh]);

  const onGuestUpdated = useCallback(() => {
    guest.refresh();
    stats.refresh();
  }, [guest.refresh, stats.refresh]);

  if (view === "landing") {
    return <Landing onTryGuest={startGuest} onUseOwnKey={startFull} />;
  }

  if (page === "chat") {
    return (
      <Chat
        mode={userMode}
        currentPage={page}
        onNavigate={setPage}
        onGoHome={goHome}
        backendOnline={backendOnline}
        guestId={isGuest ? guest.guestId : undefined}
        callsRemaining={guest.callsRemaining}
        onTraceLogged={onTraceLogged}
        onGuestUpdated={onGuestUpdated}
        onUpgrade={startFull}
        onSwitchToGuest={switchToGuest}
      />
    );
  }

  return (
    <Dashboard
      currentPage={page}
      onNavigate={setPage}
      onGoHome={goHome}
      stats={stats}
      mode={userMode}
      callsRemaining={guest.callsRemaining}
      onSwitchToGuest={switchToGuest}
    />
  );
}

export default App;
