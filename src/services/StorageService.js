/**
 * Storage Service
 * Wrapper untuk localStorage dan sessionStorage
 */

class StorageService {
  /**
   * Set item in localStorage
   * @param {string} key
   * @param {*} value
   */
  setLocal(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  /**
   * Get item from localStorage
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  getLocal(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return defaultValue;
    }
  }

  /**
   * Remove item from localStorage
   * @param {string} key
   */
  removeLocal(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing from localStorage:", error);
    }
  }

  /**
   * Clear all localStorage
   */
  clearLocal() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  }

  /**
   * Set item in sessionStorage
   * @param {string} key
   * @param {*} value
   */
  setSession(key, value) {
    try {
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(key, serialized);
    } catch (error) {
      console.error("Error saving to sessionStorage:", error);
    }
  }

  /**
   * Get item from sessionStorage
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  getSession(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error("Error reading from sessionStorage:", error);
      return defaultValue;
    }
  }

  /**
   * Remove item from sessionStorage
   * @param {string} key
   */
  removeSession(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing from sessionStorage:", error);
    }
  }

  /**
   * Clear all sessionStorage
   */
  clearSession() {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error("Error clearing sessionStorage:", error);
    }
  }
}

export default new StorageService();
