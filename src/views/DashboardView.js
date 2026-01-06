/**
 * Dashboard View
 * Mengelola tampilan dashboard utama
 */

import { $, $$, addClass, removeClass } from "../utils/helpers.js";
import EventBus from "../utils/EventBus.js";

class DashboardView {
  constructor() {
    this.container = null;
  }

  /**
   * Initialize dashboard view
   */
  init() {
    this.container = $(".container-fluid");
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen to data updates from model
    EventBus.on("dashboard:stats:updated", (data) => {
      this.updateStat(data.key, data.value);
    });
  }

  /**
   * Render dashboard stats cards
   * @param {Object} stats
   */
  renderStats(stats) {
    // Update stat values in DOM
    if (stats.totalUsers !== undefined) {
      this.updateStatValue("total-users", stats.totalUsers);
    }
    if (stats.newUsers !== undefined) {
      this.updateStatValue("new-users", stats.newUsers);
    }
    if (stats.revenue !== undefined) {
      this.updateStatValue("revenue", this.formatCurrency(stats.revenue));
    }
    if (stats.orders !== undefined) {
      this.updateStatValue("orders", stats.orders);
    }
  }

  /**
   * Update single stat value
   * @param {string} key
   * @param {*} value
   */
  updateStat(key, value) {
    const formattedValue =
      key === "revenue" ? this.formatCurrency(value) : value;
    this.updateStatValue(key, formattedValue);
  }

  /**
   * Update stat value in DOM
   * @param {string} id
   * @param {*} value
   */
  updateStatValue(id, value) {
    const element = $(`#${id}`);
    if (element) {
      element.textContent = value;
    }
  }

  /**
   * Format number as currency
   * @param {number} amount
   * @returns {string}
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format number with separator
   * @param {number} num
   * @returns {string}
   */
  formatNumber(num) {
    return new Intl.NumberFormat("id-ID").format(num);
  }

  /**
   * Show loading state
   */
  showLoading() {
    const container = this.container;
    if (container) {
      addClass(container, "loading");
      // Bisa tambahkan spinner overlay
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    const container = this.container;
    if (container) {
      removeClass(container, "loading");
    }
  }

  /**
   * Render error message
   * @param {string} message
   */
  renderError(message) {
    const alertHtml = `
      <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <strong>Error!</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;

    const alertContainer = $(".alert-container") || this.container;
    if (alertContainer) {
      alertContainer.insertAdjacentHTML("afterbegin", alertHtml);
    }
  }

  /**
   * Render success message
   * @param {string} message
   */
  renderSuccess(message) {
    const alertHtml = `
      <div class="alert alert-success alert-dismissible fade show" role="alert">
        <strong>Success!</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;

    const alertContainer = $(".alert-container") || this.container;
    if (alertContainer) {
      alertContainer.insertAdjacentHTML("afterbegin", alertHtml);
    }
  }
}

export default DashboardView;
