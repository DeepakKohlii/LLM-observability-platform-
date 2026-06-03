import { Line } from "react-chartjs-2";
import type { DailyStat } from "../types/stats";
import { chartOptions, costChartData } from "../utils/chartConfig";
import "../utils/chartSetup";

interface Props {
  daily: DailyStat[];
}

function CostChart({ daily }: Props) {
  return (
    <div className="chart-card">
      <div className="chart-title">Cost per day (USD)</div>
      <div className="chart-wrap">
        <Line
          data={costChartData(daily)}
          options={chartOptions((v) => `$${Number(v).toFixed(5)}`)}
        />
      </div>
    </div>
  );
}

export default CostChart;
