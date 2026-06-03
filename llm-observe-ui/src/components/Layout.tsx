import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import type { Page, UserMode } from "../types/navigation";

interface Props {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onGoHome: () => void;
  backendOnline: boolean;
  mode?: UserMode;
  callsRemaining?: number;
  onSwitchToGuest?: () => void;
}

function Layout({
  children,
  currentPage,
  onNavigate,
  onGoHome,
  backendOnline,
  mode,
  callsRemaining,
  onSwitchToGuest,
}: Props) {
  return (
    <div className="layout">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onGoHome={onGoHome}
        backendOnline={backendOnline}
        mode={mode}
        callsRemaining={callsRemaining}
        onSwitchToGuest={onSwitchToGuest}
      />
      <main className="main">{children}</main>
    </div>
  );
}

export default Layout;
