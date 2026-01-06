/**
 * Sidebar View
 * Mengelola tampilan dan rendering sidebar
 */

import { $, $$, addClass, removeClass, hasClass } from "../utils/helpers.js";
import EventBus from "../utils/EventBus.js";

class SidebarView {
  constructor() {
    this.sidebar = null;
    this.sidebarNav = null;
    this.menuItems = [];
  }

  /**
   * Initialize sidebar view
   */
  init() {
    this.sidebar = $(".left-sidebar");
    this.sidebarNav = $("#sidebarnav");
    this.menuItems = $$(".sidebar-item", this.sidebar);

    this.setActiveMenuItem();
  }

  /**
   * Set active menu item based on current URL
   */
  setActiveMenuItem() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split("/").pop() || "dashboard";

    // Default to dashboard if no page specified
    const targetPage = currentPage === "" || currentPage === "/" ? "dashboard" : currentPage;

    // Find matching menu item
    const links = $$("ul#sidebarnav a");
    let foundMatch = false;

    links.forEach((link) => {
      const linkHref = link.getAttribute("href");
      if (!linkHref) return;

      // Extract page name from href (e.g., "/dashboard" -> "dashboard")
      const linkPage = linkHref.replace(/^\//, "").replace(".html", "").replace("./", "");

      // Check if this link matches current page
      if (linkPage === targetPage || linkHref === currentPath) {
        this.activateMenuItem(link);
        foundMatch = true;
      }
    });

    // If no match found, activate dashboard by default
    if (!foundMatch) {
      const dashboardLink = $('a[href="/dashboard"]', this.sidebar) || $('a[href="./index.html"]', this.sidebar);
      if (dashboardLink) {
        this.activateMenuItem(dashboardLink);
      }
    }
  }

  /**
   * Activate a menu item and its parents
   * @param {Element} link
   */
  activateMenuItem(link) {
    if (!link) return;

    // First, deactivate all menu items
    this.deactivateAllMenuItems();

    // Add active class to the link itself
    addClass(link, "active");

    // Add active class to the link's parent li (sidebar-item)
    const parentLi = link.closest(".sidebar-item");
    if (parentLi) {
      addClass(parentLi, "active");
    }

    // Traverse up to activate parent items for nested menus
    let current = link.parentElement;
    while (current && !current.matches(".sidebar-nav")) {
      if (current.matches("li.sidebar-item")) {
        addClass(current, "active");
        // Also activate the parent link
        const parentLink = current.querySelector(":scope > a");
        if (parentLink) {
          addClass(parentLink, "active");
        }
      } else if (current.matches("ul.collapse") && !current.matches("ul#sidebarnav")) {
        // Expand parent submenu
        addClass(current, "in");
      }
      current = current.parentElement;
    }
  }

  /**
   * Deactivate all menu items
   */
  deactivateAllMenuItems() {
    // Remove active class from all links
    const links = $$("ul#sidebarnav a");
    links.forEach((link) => {
      removeClass(link, "active");
    });

    // Remove active class from sidebar items (but NOT the items themselves)
    const items = $$("ul#sidebarnav li.sidebar-item");
    items.forEach((item) => {
      removeClass(item, "active");
    });

    // Close all submenus
    const submenus = $$("ul#sidebarnav ul.collapse");
    submenus.forEach((submenu) => {
      removeClass(submenu, "in");
    });
  }

  /**
   * Toggle submenu
   * @param {Element} link
   */
  toggleSubmenu(link) {
    const hasActive = hasClass(link, "active");

    if (!hasActive) {
      // Close only sibling menus at the same level
      const parentLi = link.parentElement;
      const siblings = Array.from(parentLi.parentElement.children).filter(
        (child) => child !== parentLi && child.tagName === "LI"
      );
      
      siblings.forEach((sibling) => {
        const siblingLink = sibling.querySelector(":scope > a");
        const siblingUl = sibling.querySelector(":scope > ul");
        if (siblingLink) removeClass(siblingLink, "active");
        if (siblingUl) removeClass(siblingUl, "in");
      });

      // Open current menu
      const nextUl = link.nextElementSibling;
      if (nextUl && nextUl.tagName === "UL") {
        addClass(nextUl, "in");
      }
      addClass(link, "active");
    } else {
      // Close current menu
      removeClass(link, "active");
      const nextUl = link.nextElementSibling;
      if (nextUl && nextUl.tagName === "UL") {
        removeClass(nextUl, "in");
      }
    }
  }

  /**
   * Toggle sidebar (mobile)
   */
  toggleSidebar() {
    const mainWrapper = $("#main-wrapper");
    if (mainWrapper) {
      const body = document.body;
      const showClass = "show-sidebar";

      if (hasClass(body, showClass)) {
        removeClass(body, showClass);
      } else {
        addClass(body, showClass);
      }
    }
  }

  /**
   * Get all menu links
   * @returns {NodeList}
   */
  getMenuLinks() {
    return $$("#sidebarnav a");
  }

  /**
   * Get submenu trigger links
   * @returns {NodeList}
   */
  getSubmenuTriggers() {
    return $$("#sidebarnav > li > a.has-arrow");
  }

  /**
   * Render notification badge
   * @param {string} menuId
   * @param {number} count
   */
  renderNotificationBadge(menuId, count) {
    const menuItem = $(`#${menuId}`);
    if (menuItem && count > 0) {
      let badge = $(".badge", menuItem);
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "badge bg-primary rounded-circle ms-auto";
        menuItem.appendChild(badge);
      }
      badge.textContent = count;
    }
  }
}

export default SidebarView;
