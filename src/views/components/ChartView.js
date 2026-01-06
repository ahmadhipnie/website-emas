/**
 * Chart View Component
 * Mengelola rendering charts menggunakan ApexCharts
 */

import { $ } from "../../utils/helpers.js";
import EventBus from "../../utils/EventBus.js";

class ChartView {
  constructor() {
    this.charts = {};
  }

  /**
   * Render traffic overview chart
   * @param {Object} data
   */
  renderTrafficOverview(data) {
    const chartElement = $("#traffic-overview");
    if (!chartElement) {
      console.error("Chart element #traffic-overview not found");
      return;
    }

    const options = {
      series: [
        {
          name: "New Users",
          data: data.newUsers || [],
        },
        {
          name: "Users",
          data: data.users || [],
        },
      ],
      chart: {
        toolbar: {
          show: false,
        },
        type: "line",
        fontFamily: "inherit",
        foreColor: "#adb0bb",
        height: 320,
        stacked: false,
      },
      colors: ["var(--bs-gray-300)", "var(--bs-primary)"],
      plotOptions: {},
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      stroke: {
        width: 2,
        curve: "smooth",
        dashArray: [8, 0],
      },
      grid: {
        borderColor: "rgba(0,0,0,0.1)",
        strokeDashArray: 3,
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      xaxis: {
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        categories: data.categories || [],
      },
      yaxis: {
        tickAmount: 4,
      },
      markers: {
        strokeColor: ["var(--bs-gray-300)", "var(--bs-primary)"],
        strokeWidth: 2,
      },
      tooltip: {
        theme: "dark",
      },
    };

    // Destroy existing chart if exists
    if (this.charts.trafficOverview) {
      this.charts.trafficOverview.destroy();
    }

    // Create new chart
    this.charts.trafficOverview = new ApexCharts(chartElement, options);
    this.charts.trafficOverview.render();
  }

  /**
   * Update traffic overview chart
   * @param {Object} newData
   */
  updateTrafficOverview(newData) {
    if (this.charts.trafficOverview) {
      this.charts.trafficOverview.updateSeries([
        {
          name: "New Users",
          data: newData.newUsers || [],
        },
        {
          name: "Users",
          data: newData.users || [],
        },
      ]);
    } else {
      this.renderTrafficOverview(newData);
    }
  }

  /**
   * Destroy all charts
   */
  destroyAllCharts() {
    Object.values(this.charts).forEach((chart) => {
      if (chart && chart.destroy) {
        chart.destroy();
      }
    });
    this.charts = {};
  }

  /**
   * Destroy specific chart
   * @param {string} chartName
   */
  destroyChart(chartName) {
    if (this.charts[chartName]) {
      this.charts[chartName].destroy();
      delete this.charts[chartName];
    }
  }
}

export default ChartView;
