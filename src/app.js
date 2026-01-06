/**
 * Main Application Entry Point
 * Initialize MVC architecture components
 */

import { ready } from "./utils/helpers.js";
import SidebarController from "./controllers/SidebarController.js";
import DashboardController from "./controllers/DashboardController.js";

class App {
  constructor() {
    this.controllers = {
      sidebar: null,
      dashboard: null,
    };
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log("🚀 Initializing MVC Admin Dashboard...");

    try {
      // SIDEBAR CONTROLLER DISABLED - menggunakan sidebarmenu.js standalone
      // this.controllers.sidebar = new SidebarController();
      // this.controllers.sidebar.init();
      console.log("✅ Sidebar handled by sidebarmenu.js");

      // Initialize Dashboard Controller
      this.controllers.dashboard = new DashboardController();
      await this.controllers.dashboard.init();
      console.log("✅ Dashboard Controller initialized");

      // Initialize tooltips (Bootstrap)
      this.initializeTooltips();

      console.log("✅ Application initialized successfully!");
    } catch (error) {
      console.error("❌ Error initializing application:", error);
    }
  }

  /**
   * Initialize Bootstrap tooltips
   */
  initializeTooltips() {
    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );
    const tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  /**
   * Cleanup and destroy application
   */
  destroy() {
    if (this.controllers.dashboard) {
      this.controllers.dashboard.destroy();
    }
    console.log("Application destroyed");
  }
}

// Initialize app when DOM is ready
ready(() => {
  window.app = new App();
  window.app.init();
});

// Export for global access if needed
export default App;
