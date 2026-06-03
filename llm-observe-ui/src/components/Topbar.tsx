interface Props {
  statusText: string;
  isError: boolean;
  onRefresh: () => void;
}

function Topbar({ statusText, isError, onRefresh }: Props) {
  return (
    <div className="topbar">
      <div>
        <div className="page-title">
          Overview <span>_</span>
        </div>
        <div className={`last-updated${isError ? " error" : ""}`}>
          {statusText}
        </div>
      </div>
      <button type="button" className="refresh-btn" onClick={onRefresh}>
        ↻ refresh
      </button>
    </div>
  );
}

export default Topbar;
