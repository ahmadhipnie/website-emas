/**
 * Navigation Model
 * Mengelola state navigasi dan routing
 */

import EventBus from "../utils/EventBus.js";

class NavigationModel {
  constructor() {
    this.currentPage = "";
    this.sidebarCollapsed = false;
  }

  /**
   * Set current active page
   * @param {string} page
   */
  setCurrentPage(page) {
    this.currentPage = page;
    EventBus.emit("navigation:page:changed", page);
  }

  /**
   * Get current page
   * @returns {string}
   */
  getCurrentPage() {
    return this.currentPage;
  }

  /**
   * Toggle sidebar collapse state
   */
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    EventBus.emit("navigation:sidebar:toggled", this.sidebarCollapsed);
  }

  /**
   * Get sidebar state
   * @returns {boolean}
   */
  isSidebarCollapsed() {
    return this.sidebarCollapsed;
  }
}

export default new NavigationModel();
