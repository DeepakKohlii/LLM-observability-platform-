import type { ChartOptions } from "chart.js";
import type { DailyStat } from "../types/stats";

export function sortedDaily(daily: DailyStat[]): DailyStat[] {
  return [...daily].sort((a, b) => a.day.localeCompare(b.day));
}

export function costChartData(daily: DailyStat[]) {
  const sorted = sortedDaily(daily);
  return {
    labels: sorted.map((r) => r.day),
    datasets: [
      {
        label: "Cost",
        data: sorted.map((r) => r.cost),
        borderColor: "#a78bfa",
        backgroundColor: "#a78bfa18",
        borderWidth: 1.5,
        pointRadius: 3,
        pointBackgroundColor: "#a78bfa",
        fill: true,
        tension: 0.4,
      },
    ],
  };
}

export function callsChartData(daily: DailyStat[]) {
  const sorted = sortedDaily(daily);
  return {
    labels: sorted.map((r) => r.day),
    datasets: [
      {
        label: "Calls",
        data: sorted.map((r) => r.calls),
        borderColor: "#00ff9d",
        backgroundColor: "#00ff9d18",
        borderWidth: 1.5,
        pointRadius: 3,
        pointBackgroundColor: "#00ff9d",
        fill: true,
        tension: 0.4,
      },
    ],
  };
}

export function chartOptions(formatY: (v: number) => string): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0d1117",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "#4a5568",
        bodyColor: "#e2e8f0",
        titleFont: { family: "JetBrains Mono", size: 10 },
        bodyFont: { family: "JetBrains Mono", size: 12 },
        callbacks: {
          label: (ctx) => ` ${formatY(Number(ctx.raw))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: {
          color: "#4a5568",
          font: { family: "JetBrains Mono", size: 10 },
          maxTicksLimit: 7,
        },
        border: { color: "rgba(255,255,255,0.07)" },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: {
          color: "#4a5568",
          font: { family: "JetBrains Mono", size: 10 },
          callback: (v) => formatY(Number(v)),
        },
        border: { color: "rgba(255,255,255,0.07)" },
      },
    },
  };
}
