import { Line } from "react-chartjs-2";
import type { DailyStat } from "../types/stats";
import { callsChartData, chartOptions } from "../utils/chartConfig";
import "../utils/chartSetup";

interface Props {
  daily: DailyStat[];
}

function CallsChart({ daily }: Props) {
  return (
    <div className="chart-card">
      <div className="chart-title">Calls per day</div>
      <div className="chart-wrap">
        <Line
          data={callsChartData(daily)}
          options={chartOptions((v) => `${v} calls`)}
        />
      </div>
    </div>
  );
}

export default CallsChart;
