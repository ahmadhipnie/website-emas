/**
 * Router Configuration
 * Manage routing and page navigation
 */

const routes = {
  "/": "index.html",
  "/dashboard": "dashboard.html",
  "/ui-buttons.html": "ui-buttons.html",
  "/ui-alerts.html": "ui-alerts.html",
  "/ui-card.html": "ui-card.html",
  "/ui-forms.html": "ui-forms.html",
  "/ui-typography.html": "ui-typography.html",
  "/icon-tabler.html": "icon-tabler.html",
  "/sample-page.html": "sample-page.html",
  "/login": "authentication-login.html",
  "/register": "authentication-register.html",
};

/**
 * Get current page name
 * @returns {string}
 */
export const getCurrentPage = () => {
  const path = window.location.pathname;
  const filename = path.split("/").pop();
  return filename || "index.html";
};

/**
 * Navigate to a page
 * @param {string} page
 */
export const navigateTo = (page) => {
  window.location.href = page;
};

/**
 * Check if a page exists
 * @param {string} page
 * @returns {boolean}
 */
export const pageExists = (page) => {
  return Object.values(routes).includes(page);
};

export default routes;
