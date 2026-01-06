/**
 * Dashboard Controller
 * Menghubungkan DashboardView dengan DashboardModel dan ChartDataModel
 */

import DashboardView from "../views/DashboardView.js";
import ChartView from "../views/components/ChartView.js";
import DashboardModel from "../models/DashboardModel.js";
import ChartDataModel from "../models/ChartDataModel.js";
import EventBus from "../utils/EventBus.js";

class DashboardController {
  constructor() {
    this.dashboardView = new DashboardView();
    this.chartView = new ChartView();
    this.dashboardModel = DashboardModel;
    this.chartDataModel = ChartDataModel;
  }

  /**
   * Initialize dashboard controller
   */
  async init() {
    // Initialize views
    this.dashboardView.init();

    // Setup event listeners
    this.setupEventListeners();

    // Load initial data
    await this.loadDashboardData();

    // Render charts
    this.renderCharts();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen to model updates
    EventBus.on("dashboard:initialized", (data) => {
      this.dashboardView.renderStats(data.stats);
    });

    EventBus.on("chart:traffic:updated", (data) => {
      this.chartView.updateTrafficOverview(data);
    });

    // Listen to window resize to redraw charts
    window.addEventListener(
      "resize",
      this.debounce(() => {
        this.redrawCharts();
      }, 250)
    );
  }

  /**
   * Load dashboard data
   */
  async loadDashboardData() {
    try {
      this.dashboardView.showLoading();

      // Initialize dashboard model
      await this.dashboardModel.initialize();

      // Get stats and render
      const stats = this.dashboardModel.getStats();
      this.dashboardView.renderStats(stats);

      this.dashboardView.hideLoading();
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      this.dashboardView.renderError("Failed to load dashboard data");
      this.dashboardView.hideLoading();
    }
  }

  /**
   * Render all charts
   */
  renderCharts() {
    // Render traffic overview chart
    const trafficData = this.chartDataModel.getTrafficOverviewData();
    this.chartView.renderTrafficOverview(trafficData);
  }

  /**
   * Redraw all charts (on resize)
   */
  redrawCharts() {
    // ApexCharts handles responsive automatically
    // But we can manually trigger update if needed
    const trafficData = this.chartDataModel.getTrafficOverviewData();
    this.chartView.updateTrafficOverview(trafficData);
  }

  /**
   * Update dashboard stats
   * @param {string} key
   * @param {*} value
   */
  updateStat(key, value) {
    this.dashboardModel.updateStat(key, value);
  }

  /**
   * Debounce helper
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Destroy controller and cleanup
   */
  destroy() {
    this.chartView.destroyAllCharts();
    EventBus.off("dashboard:initialized");
    EventBus.off("chart:traffic:updated");
  }
}

export default DashboardController;
