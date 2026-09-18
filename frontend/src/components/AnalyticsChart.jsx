import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

function AnalyticsChart({ timeSeries }) {
  const labels = timeSeries.map((measurement) => measurement.measurement_date);

  const createDataset = (label, key) => ({
    label,
    data: timeSeries.map((measurement) => measurement[key]),
    tension: 0.3,
    spanGaps: true,
  });

  const createOptions = (title, beginAtZero = true) => ({
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: "index",
      intersect: false,
    },

    plugins: {
      legend: {
        display: true,
        position: "bottom",
      },

      tooltip: {
        mode: "index",
        intersect: false,
      },

      title: {
        display: true,
        text: title,
        align: "start",
        font: {
          size: 16,
          weight: "600",
        },
        padding: {
          bottom: 16,
        },
      },
    },

    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
        },
      },

      y: {
        title: {
          display: true,
          text: "Value",
        },

        beginAtZero,
      },
    },
  });

  const carbonStockData = {
    labels,
    datasets: [createDataset("Carbon Stock", "carbon_stock")],
  };

  const carbonSequesteredData = {
    labels,
    datasets: [createDataset("Carbon Sequestered", "carbon_sequestered")],
  };

  const biodiversityData = {
    labels,
    datasets: [createDataset("Biodiversity Score", "biodiversity_score")],
  };

  const treeCoverData = {
    labels,
    datasets: [createDataset("Tree Cover", "tree_cover")],
  };

  return (
    <div className="analytics-charts-grid">
      <div className="analytics-chart-panel">
        <Line data={carbonStockData} options={createOptions("Carbon Stock")} />
      </div>

      <div className="analytics-chart-panel">
        <Line
          data={carbonSequesteredData}
          options={createOptions("Carbon Sequestered")}
        />
      </div>

      <div className="analytics-chart-panel">
        <Line
          data={biodiversityData}
          options={createOptions("Biodiversity Score")}
        />
      </div>

      <div className="analytics-chart-panel">
        <Line data={treeCoverData} options={createOptions("Tree Cover (%)")} />
      </div>
    </div>
  );
}

export default AnalyticsChart;
