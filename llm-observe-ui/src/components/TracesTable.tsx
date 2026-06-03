import { useState } from "react";
import type { Trace } from "../types/stats";
import {
  API_BASE,
  formatTraceCost,
  formatTraceTime,
  latencyClass,
} from "../utils/format";
import TraceModal from "./TraceModal";

interface Props {
  traces: Trace[];
  loading: boolean;
  error: string | null;
}

function TracesTable({ traces, loading, error }: Props) {
  const [selected, setSelected] = useState<Trace | null>(null);

  const body = () => {
    if (loading) {
      return (
        <div className="loading">
          <span>loading traces...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-msg">
          Cannot connect to backend at {API_BASE}. Make sure uvicorn is running.
        </div>
      );
    }

    if (!traces.length) {
      return (
        <div className="loading">no traces yet — run your demo script</div>
      );
    }

    return (
      <table className="traces-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Model</th>
            <th>Prompt</th>
            <th>Response</th>
            <th>Latency</th>
            <th>Cost</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {traces.map((t, i) => (
            <tr key={`${t.timestamp}-${i}`} onClick={() => setSelected(t)}>
              <td className="time-cell">{formatTraceTime(t.timestamp)}</td>
              <td>
                <span className="model-badge">{t.model}</span>
              </td>
              <td className="prompt-cell">{t.prompt}</td>
              <td className="response-cell">{t.response || "—"}</td>
              <td className={latencyClass(t.latency_ms)}>
                {t.latency_ms}ms
              </td>
              <td className="cost-cell">{formatTraceCost(t.cost_usd || 0)}</td>
              <td>
                {t.error ? (
                  <span className="error-badge">error</span>
                ) : (
                  <span className="ok-badge">ok</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <>
      <div className="table-card">
        <div className="table-header">
          <div className="table-title">Recent Traces</div>
          <div className="trace-count">{traces.length} traces</div>
        </div>
        {body()}
      </div>

      <TraceModal trace={selected} onClose={() => setSelected(null)} />
    </>
  );
}

export default TracesTable;
