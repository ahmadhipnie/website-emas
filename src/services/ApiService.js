/**
 * API Service
 * Centralized service untuk API calls
 */

class ApiService {
  constructor(baseURL = "") {
    this.baseURL = baseURL;
  }

  /**
   * Generic request method
   * @param {string} endpoint
   * @param {Object} options
   * @returns {Promise}
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("API Error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * GET request
   */
  async get(endpoint) {
    return this.request(endpoint);
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  }
}

export default new ApiService();
