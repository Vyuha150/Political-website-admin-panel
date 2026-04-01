"use client";

import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend);

type Datum = {
  name: string;
  value: number;
};

const DEFAULT_COLORS = [
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#0ea5e9",
  "#22c55e",
  "#f97316",
  "#64748b",
];

interface AnalyticsCardProps {
  title: string;
  subtitle: string;
  data: Datum[];
  emptyMessage?: string;
}

function hasPlottableData(data: Datum[]) {
  return data.some((item) => item.value > 0);
}

export function AnalyticsPieCard({
  title,
  subtitle,
  data,
  emptyMessage = "No analytics data available.",
}: AnalyticsCardProps) {
  if (!data.length || !hasPlottableData(data)) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: DEFAULT_COLORS,
        borderColor: "#fff",
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: { size: 12 },
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
      <div className="flex justify-center" style={{ maxHeight: "300px" }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}

export function AnalyticsBarCard({
  title,
  subtitle,
  data,
  emptyMessage = "No analytics data available.",
}: AnalyticsCardProps) {
  if (!data.length || !hasPlottableData(data)) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: "Count",
        data: data.map((item) => item.value),
        backgroundColor: DEFAULT_COLORS.slice(0, data.length),
        borderColor: "#fff",
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        displayColors: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 11 },
        },
        grid: {
          color: "#e5e7eb",
        },
      },
      y: {
        ticks: {
          font: { size: 11 },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
      <div style={{ maxHeight: "350px" }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

export function AnalyticsVerticalBarCard({
  title,
  subtitle,
  data,
  emptyMessage = "No analytics data available.",
}: AnalyticsCardProps) {
  if (!data.length || !hasPlottableData(data)) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: "Count",
        data: data.map((item) => item.value),
        backgroundColor: DEFAULT_COLORS.slice(0, data.length),
        borderColor: "#fff",
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "x" as const,
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        displayColors: false,
      },
    },
    scales: {
      x: {
        ticks: {
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 11 },
        },
        grid: {
          color: "#e5e7eb",
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
      <div style={{ maxHeight: "350px" }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

export function AnalyticsLineCard({
  title,
  subtitle,
  data,
  emptyMessage = "No analytics data available.",
}: AnalyticsCardProps) {
  if (!data.length || !hasPlottableData(data)) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: "Trend",
        data: data.map((item) => item.value),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: "#f59e0b",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointHoverRadius: 8,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        displayColors: false,
      },
    },
    scales: {
      x: {
        ticks: {
          font: { size: 11 },
        },
        grid: {
          color: "#e5e7eb",
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 11 },
        },
        grid: {
          color: "#e5e7eb",
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
      <div style={{ maxHeight: "350px" }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
