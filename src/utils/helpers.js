/**
 * Utility Helper Functions
 * Native JS helpers menggantikan jQuery utilities
 */

/**
 * Query selector helper (like jQuery $)
 * @param {string} selector - CSS selector
 * @param {Element} context - Context element (default: document)
 * @returns {Element|null}
 */
export const $ = (selector, context = document) => {
  return context.querySelector(selector);
};

/**
 * Query selector all helper
 * @param {string} selector - CSS selector
 * @param {Element} context - Context element (default: document)
 * @returns {NodeList}
 */
export const $$ = (selector, context = document) => {
  return context.querySelectorAll(selector);
};

/**
 * Add class to element
 * @param {Element} element
 * @param {...string} classes
 */
export const addClass = (element, ...classes) => {
  if (element) element.classList.add(...classes);
};

/**
 * Remove class from element
 * @param {Element} element
 * @param {...string} classes
 */
export const removeClass = (element, ...classes) => {
  if (element) element.classList.remove(...classes);
};

/**
 * Toggle class on element
 * @param {Element} element
 * @param {string} className
 */
export const toggleClass = (element, className) => {
  if (element) element.classList.toggle(className);
};

/**
 * Check if element has class
 * @param {Element} element
 * @param {string} className
 * @returns {boolean}
 */
export const hasClass = (element, className) => {
  return element ? element.classList.contains(className) : false;
};

/**
 * Get/Set element attribute
 * @param {Element} element
 * @param {string} attr
 * @param {string} value (optional)
 */
export const attr = (element, attr, value) => {
  if (!element) return null;
  if (value === undefined) {
    return element.getAttribute(attr);
  }
  element.setAttribute(attr, value);
};

/**
 * Get closest parent matching selector
 * @param {Element} element
 * @param {string} selector
 * @returns {Element|null}
 */
export const closest = (element, selector) => {
  return element ? element.closest(selector) : null;
};

/**
 * Get all parent elements until selector
 * @param {Element} element
 * @param {string} selector
 * @returns {Array<Element>}
 */
export const parentsUntil = (element, selector) => {
  const parents = [];
  let current = element.parentElement;

  while (current && !current.matches(selector)) {
    parents.push(current);
    current = current.parentElement;
  }

  return parents;
};

/**
 * Check if element matches selector
 * @param {Element} element
 * @param {string} selector
 * @returns {boolean}
 */
export const is = (element, selector) => {
  return element ? element.matches(selector) : false;
};

/**
 * Get next sibling matching selector
 * @param {Element} element
 * @param {string} selector (optional)
 * @returns {Element|null}
 */
export const next = (element, selector) => {
  if (!element) return null;
  let sibling = element.nextElementSibling;
  if (!selector) return sibling;

  while (sibling && !sibling.matches(selector)) {
    sibling = sibling.nextElementSibling;
  }
  return sibling;
};

/**
 * Get children matching selector
 * @param {Element} element
 * @param {string} selector (optional)
 * @returns {Array<Element>}
 */
export const children = (element, selector) => {
  if (!element) return [];
  const kids = Array.from(element.children);
  return selector ? kids.filter((child) => child.matches(selector)) : kids;
};

/**
 * Get parent element
 * @param {Element} element
 * @param {string} selector (optional)
 * @returns {Element|null}
 */
export const parent = (element, selector) => {
  if (!element) return null;
  const p = element.parentElement;
  return selector ? (p && p.matches(selector) ? p : null) : p;
};

/**
 * DOM ready helper
 * @param {Function} callback
 */
export const ready = (callback) => {
  if (document.readyState !== "loading") {
    callback();
  } else {
    document.addEventListener("DOMContentLoaded", callback);
  }
};

/**
 * Debounce function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Simple AJAX helper
 * @param {string} url
 * @param {Object} options
 * @returns {Promise}
 */
export const ajax = async (url, options = {}) => {
  const defaultOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};
