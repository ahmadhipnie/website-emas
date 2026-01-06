/**
 * Sidebar Controller
 * Menghubungkan SidebarView dengan NavigationModel
 */

import SidebarView from "../views/SidebarView.js";
import NavigationModel from "../models/NavigationModel.js";
import EventBus from "../utils/EventBus.js";

class SidebarController {
  constructor() {
    this.view = new SidebarView();
    this.model = NavigationModel;
  }

  /**
   * Initialize sidebar controller
   */
  init() {
    this.view.init();
    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Handle menu item clicks
    const menuLinks = this.view.getMenuLinks();
    menuLinks.forEach((link) => {
      link.addEventListener("click", (e) => this.handleMenuClick(e, link));
    });

    // Handle submenu triggers
    const submenuTriggers = this.view.getSubmenuTriggers();
    submenuTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        this.view.toggleSubmenu(trigger);
      });
    });

    // Handle sidebar toggle (mobile)
    const sidebarToggle = document.getElementById("sidebarCollapse");
    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", () => {
        this.view.toggleSidebar();
        this.model.toggleSidebar();
      });
    }

    // Handle mobile menu toggle
    const mobileMenuToggle = document.querySelector(".sidebartoggler");
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener("click", () => {
        this.view.toggleSidebar();
      });
    }

    // Listen to navigation changes
    EventBus.on("navigation:page:changed", (page) => {
      this.handlePageChange(page);
    });
  }

  /**
   * Handle menu item click
   * @param {Event} e
   * @param {Element} link
   */
  handleMenuClick(e, link) {
    const hasSubmenu = link.classList.contains("has-arrow");

    if (!hasSubmenu) {
      // Regular menu item - update model
      const page = this.getPageFromUrl(link.href);
      this.model.setCurrentPage(page);

      // For SPA, prevent default and handle routing
      // e.preventDefault();
      // Handle routing here if needed
    }
  }

  /**
   * Handle page change
   * @param {string} page
   */
  handlePageChange(page) {
    console.log("Page changed to:", page);
    // Additional logic when page changes
  }

  /**
   * Get page name from URL
   * @param {string} url
   * @returns {string}
   */
  getPageFromUrl(url) {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return filename.replace(".html", "");
  }
}

export default SidebarController;
