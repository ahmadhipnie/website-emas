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
    const currentPage = currentPath.split("/").pop() || "index.html";

    // Find matching menu item
    const links = $$("ul#sidebarnav a");
    links.forEach((link) => {
      const linkHref = link.getAttribute("href");
      const linkPage = linkHref ? linkHref.replace("./", "") : "";

      // Check if this link matches current page
      if (
        linkPage === currentPage ||
        (currentPage === "" && linkPage === "index.html") ||
        (currentPage === "/" && linkPage === "index.html")
      ) {
        this.activateMenuItem(link);
      }
    });
  }

  /**
   * Activate a menu item and its parents
   * @param {Element} link
   */
  activateMenuItem(link) {
    // First, deactivate all menu items
    this.deactivateAllMenuItems();

    // Add active class to the link's parent li
    const parentLi = link.closest(".sidebar-item");
    if (parentLi) {
      addClass(parentLi, "active");
      addClass(link, "active");
    }

    // Traverse up to activate parent items
    let current = link.parentElement;
    while (current && !current.matches(".sidebar-nav")) {
      if (current.matches("li.sidebar-item")) {
        addClass(current, "active");
        const childLink = current.querySelector("a");
        if (childLink) {
          addClass(childLink, "active");
        }
      } else if (current.matches("ul") && !current.matches("ul#sidebarnav")) {
        addClass(current, "in");
      }
      current = current.parentElement;
    }
  }

  /**
   * Deactivate all menu items
   */
  deactivateAllMenuItems() {
    const links = $$("ul#sidebarnav a");
    links.forEach((link) => {
      removeClass(link, "active");
    });

    const items = $$("ul#sidebarnav li");
    items.forEach((item) => {
      removeClass(item, "active", "selected");
    });

    const submenus = $$("ul#sidebarnav ul");
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
      // Close other open menus at same level
      const parent = link.parentElement.parentElement;
      const siblings = $$("ul", parent);
      siblings.forEach((ul) => removeClass(ul, "in"));

      const siblingLinks = $$("a", parent);
      siblingLinks.forEach((a) => removeClass(a, "active"));

      // Open current menu
      const nextUl = link.nextElementSibling;
      if (nextUl && nextUl.tagName === "UL") {
        addClass(nextUl, "in");
      }
      addClass(link, "active");
    } else {
      // Close current menu
      removeClass(link, "active");
      const parent = link.parentElement.parentElement;
      removeClass(parent, "active");

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
