import CallsChart from "../components/CallsChart";
import CostChart from "../components/CostChart";
import Layout from "../components/Layout";
import MetricCard from "../components/MetricCard";
import Topbar from "../components/Topbar";
import TracesTable from "../components/TracesTable";
import type { useStats } from "../hooks/useStats";
import type { Page, UserMode } from "../types/navigation";
import {
  formatCalls,
  formatCost,
  formatLatency,
} from "../utils/format";

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onGoHome: () => void;
  stats: ReturnType<typeof useStats>;
  mode: UserMode;
  callsRemaining?: number;
  onSwitchToGuest?: () => void;
}

function Dashboard({
  currentPage,
  onNavigate,
  onGoHome,
  stats,
  mode,
  callsRemaining,
  onSwitchToGuest,
}: Props) {
  const { data, loading, refreshing, error, lastUpdated, refresh } = stats;

  const backendOnline = !error && !!data;

  const statusText = (() => {
    if (refreshing) return "refreshing...";
    if (loading) return "fetching data...";
    if (error) return "⚠ cannot reach backend";
    if (lastUpdated) {
      return `last updated ${lastUpdated.toLocaleTimeString()}`;
    }
    return "fetching data...";
  })();

  const dash = "—";

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
      <Topbar
        statusText={
          mode === "guest"
            ? `${statusText} · showing your guest session traces`
            : statusText
        }
        isError={!!error && !loading}
        onRefresh={refresh}
      />

      <div className="metrics">
        <MetricCard
          label="Total Calls"
          value={data ? formatCalls(data.total_calls) : dash}
          subtext="all time"
          accentColor="var(--accent)"
        />
        <MetricCard
          label="Total Cost"
          value={data ? formatCost(data.total_cost_usd) : dash}
          subtext="USD spent"
          accentColor="var(--purple)"
        />
        <MetricCard
          label="Avg Latency"
          value={data ? formatLatency(data.avg_latency_ms) : dash}
          subtext="milliseconds"
          accentColor="var(--accent2)"
        />
        <MetricCard
          label="Errors"
          value={data ? data.error_count : dash}
          subtext="failed calls"
          accentColor="var(--danger)"
        />
      </div>

      <div className="charts">
        <CostChart daily={data?.daily ?? []} />
        <CallsChart daily={data?.daily ?? []} />
      </div>

      <TracesTable
        traces={data?.recent_traces ?? []}
        loading={loading}
        error={error}
      />
    </Layout>
  );
}

export default Dashboard;
