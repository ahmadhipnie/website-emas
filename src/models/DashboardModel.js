/**
 * Dashboard Model
 * Mengelola data dan state untuk dashboard
 */

import EventBus from "../utils/EventBus.js";

class DashboardModel {
  constructor() {
    this.data = {
      stats: {
        totalUsers: 0,
        newUsers: 0,
        revenue: 0,
        orders: 0,
      },
      initialized: false,
    };
  }

  /**
   * Initialize dashboard data
   */
  async initialize() {
    // Simulasi data - nanti bisa diganti dengan API call
    this.data.stats = {
      totalUsers: 1245,
      newUsers: 342,
      revenue: 45678,
      orders: 892,
    };

    this.data.initialized = true;
    EventBus.emit("dashboard:initialized", this.data);
  }

  /**
   * Get dashboard stats
   * @returns {Object}
   */
  getStats() {
    return this.data.stats;
  }

  /**
   * Update specific stat
   * @param {string} key
   * @param {*} value
   */
  updateStat(key, value) {
    if (this.data.stats.hasOwnProperty(key)) {
      this.data.stats[key] = value;
      EventBus.emit("dashboard:stats:updated", { key, value });
    }
  }

  /**
   * Check if dashboard is initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this.data.initialized;
  }
}

export default new DashboardModel();
