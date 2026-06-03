import type { Trace } from "../types/stats";
import { latencyClass } from "../utils/format";

interface Props {
  trace: Trace | null;
  onClose: () => void;
}

function TraceModal({ trace, onClose }: Props) {
  if (!trace) return null;

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Trace Detail</div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕ close
          </button>
        </div>

        {trace.error && (
          <div className="error-msg" style={{ margin: "0 0 16px" }}>
            ⚠ {trace.error}
          </div>
        )}

        <div className="modal-field">
          <div className="modal-label">Timestamp</div>
          <div className="modal-val">{trace.timestamp}</div>
        </div>

        <div className="modal-field">
          <div className="modal-label">Model</div>
          <div className="modal-val">{trace.model}</div>
        </div>

        <div className="modal-grid">
          <div>
            <div className="modal-label">Latency</div>
            <div className={`modal-val ${latencyClass(trace.latency_ms)}`}>
              {trace.latency_ms} ms
            </div>
          </div>
          <div>
            <div className="modal-label">Cost</div>
            <div className="modal-val" style={{ color: "var(--purple)" }}>
              ${(trace.cost_usd || 0).toFixed(6)}
            </div>
          </div>
        </div>

        <div className="modal-field">
          <div className="modal-label">Prompt</div>
          <div className="modal-val">{trace.prompt}</div>
        </div>

        <div className="modal-field">
          <div className="modal-label">Response</div>
          <div className="modal-val">{trace.response || "—"}</div>
        </div>
      </div>
    </div>
  );
}

export default TraceModal;
