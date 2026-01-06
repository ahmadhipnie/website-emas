/**
 * Chart Data Model
 * Mengelola data untuk charts di dashboard
 */

import EventBus from "../utils/EventBus.js";

class ChartDataModel {
  constructor() {
    this.chartData = {
      trafficOverview: {
        newUsers: [5, 1, 17, 6, 15, 9, 6],
        users: [7, 11, 4, 16, 10, 14, 10],
        categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
    };
  }

  /**
   * Get traffic overview data
   * @returns {Object}
   */
  getTrafficOverviewData() {
    return this.chartData.trafficOverview;
  }

  /**
   * Update traffic overview data
   * @param {Object} data
   */
  updateTrafficOverviewData(data) {
    this.chartData.trafficOverview = {
      ...this.chartData.trafficOverview,
      ...data,
    };
    EventBus.emit("chart:traffic:updated", this.chartData.trafficOverview);
  }

  /**
   * Get all chart data
   * @returns {Object}
   */
  getAllChartData() {
    return this.chartData;
  }
}

export default new ChartDataModel();
