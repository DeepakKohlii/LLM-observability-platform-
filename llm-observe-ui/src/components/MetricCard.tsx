import type { CSSProperties } from "react";

interface Props {
  label: string;
  value: string | number;
  subtext: string;
  accentColor?: string;
}

function MetricCard({ label, value, subtext, accentColor }: Props) {
  return (
    <div
      className="metric-card"
      style={
        accentColor
          ? ({ "--accent-color": accentColor } as CSSProperties)
          : undefined
      }
    >
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-sub">{subtext}</div>
    </div>
  );
}

export default MetricCard;
