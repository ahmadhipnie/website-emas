/**
 * Gold Price Dashboard
 * Chart dan informasi harga emas
 */

// State
let goldChart = null;
let currentUnit = "toz"; // 'toz' or 'gram'
let currentData = null; // Cache current data

// Konversi dari toz ke gram (1 toz = 31.1034768 gram)
const TOZ_TO_GRAM = 31.1034768;

// Formatter untuk mata uang IDR
const formatIDR = (value, decimals = 0) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Formatter untuk timestamp
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Konversi harga dari toz ke gram
const tozToGram = (value) => value / TOZ_TO_GRAM;

// Get harga berdasarkan unit saat ini
const getPrice = (data, field) => {
  const value = parseFloat(data[field]);
  if (currentUnit === "gram") {
    return tozToGram(value);
  }
  return value;
};

// Simple debounce helper for button clicks
function debounce(fn, wait) {
  let timer = null;
  return function (...args) {
    if (timer) return; // ignore while waiting
    timer = setTimeout(() => {
      timer = null;
    }, wait);
    return fn.apply(this, args);
  };
}

// Fetch data harga emas terbaru
async function fetchGoldPrice() {
  try {
    const response = await fetch("/api/emas/fetch", { method: "POST" });
    const result = await response.json();

    if (result.success) {
      showToast("Harga emas berhasil diperbarui!", "success");
      await updateDashboard();
    } else {
      // Handle manual limit exceeded
      if (result.error === "MANUAL_LIMIT_EXCEEDED") {
        showToast(`⚠️ ${result.message}`, "error");
        return;
      }

      // Handle quota exceeded
      if (
        result.quotaExceeded ||
        result.error === "RATE_LIMIT_EXCEEDED" ||
        result.error === "QUOTA_EXCEEDED" ||
        result.error === "API_LIMIT_EXCEEDED"
      ) {
        showToast("⚠️ " + (result.message || "API quota habis!"), "error");
        // Update API usage untuk menampilkan status terbaru
        updateApiUsage();
      } else {
        showToast(result.message || "Gagal mengambil harga emas", "error");
      }
    }
  } catch (error) {
    console.error("Error fetching gold price:", error);
    showToast("Terjadi kesalahan saat mengambil harga emas", "error");
  }
}

// Update tampilan dashboard
async function updateDashboard() {
  try {
    // Fetch data terbaru
    const statsResponse = await fetch("/api/emas/stats");
    const statsResult = await statsResponse.json();

    if (!statsResult.success) {
      throw new Error(statsResult.message);
    }

    const latest = statsResult.data.latest;

    if (!latest) {
      showNoDataMessage();
      return;
    }

    // Cache data
    currentData = latest;

    // Update cards harga
    updatePriceCards(latest);

    // Update chart
    await updateChart();

    // Update API usage & manual refresh status
    updateApiUsage();
  } catch (error) {
    console.error("Error updating dashboard:", error);
    showErrorMessage(error.message);
  }
}

// Update kartu harga
function updatePriceCards(data) {
  const suffix = currentUnit === "gram" ? "/gram" : "/toz";

  // Price card
  const priceCard = document.getElementById("gold-price");
  if (priceCard) {
    const price = getPrice(data, "price");
    priceCard.textContent = formatIDR(price, 0);

    // Update change indicator
    const changeIndicator = document.getElementById("price-change");
    if (changeIndicator) {
      const changeValue = parseFloat(data.change_value);
      const changePercent = parseFloat(data.change_percent);
      const isPositive = changeValue >= 0;
      const icon = isPositive ? "ti-arrow-up-right" : "ti-arrow-down-right";
      const colorClass = isPositive ? "text-success" : "text-danger";
      const changeText = isPositive
        ? `+${changePercent.toFixed(2)}%`
        : `${changePercent.toFixed(2)}%`;

      changeIndicator.innerHTML = `
        <i class="ti ${icon} ${colorClass}"></i>
        <span class="${colorClass}">${changeText}</span>
      `;
    }

    // Update unit badge
    const unitBadge = document.getElementById("unit-badge");
    if (unitBadge) {
      unitBadge.textContent = suffix;
    }
  }

  // Ask price
  const askCard = document.getElementById("gold-ask");
  if (askCard) {
    const ask = getPrice(data, "ask");
    askCard.textContent = formatIDR(ask, 0);
  }

  // Bid price
  const bidCard = document.getElementById("gold-bid");
  if (bidCard) {
    const bid = getPrice(data, "bid");
    bidCard.textContent = formatIDR(bid, 0);
  }

  // High
  const highCard = document.getElementById("gold-high");
  if (highCard) {
    const high = getPrice(data, "high");
    highCard.textContent = formatIDR(high, 0);
  }

  // Low
  const lowCard = document.getElementById("gold-low");
  if (lowCard) {
    const low = getPrice(data, "low");
    lowCard.textContent = formatIDR(low, 0);
  }

  // Last update
  const lastUpdate = document.getElementById("last-update");
  if (lastUpdate) {
    lastUpdate.textContent = formatTimestamp(data.timestamp);
  }
}

// Update chart
async function updateChart() {
  try {
    const response = await fetch(`/api/emas/history?limit=30`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    const history = result.data;

    if (history.length === 0) {
      showNoDataMessage();
      return;
    }

    // Ambil 10 data terakhir untuk ditampilkan di chart
    const displayData = history.slice(-10);

    // Prepare chart data
    const labels = displayData.map((d) => {
      const date = new Date(d.timestamp);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });
    });

    // Konversi harga ke gram jika perlu
    const prices = displayData.map((d) => getPrice(d, "price"));
    const asks = displayData.map((d) => getPrice(d, "ask"));
    const bids = displayData.map((d) => getPrice(d, "bid"));

    // Render chart
    renderGoldChart(labels, prices, asks, bids);
  } catch (error) {
    console.error("Error updating chart:", error);
  }
}

// Render ApexChart
function renderGoldChart(labels, prices, asks, bids) {
  const chartElement = document.getElementById("gold-price-chart");

  if (!chartElement) return;

  // Destroy existing chart
  if (goldChart) {
    goldChart.destroy();
  }

  // Calculate change for color
  const isPositive = prices[prices.length - 1] >= prices[0];
  const priceColor = isPositive ? "#0da69e" : "#fa896b";

  const options = {
    series: [
      {
        name: "Harga Spot",
        data: prices,
      },
      {
        name: "Ask (Jual)",
        data: asks,
      },
      {
        name: "Bid (Beli)",
        data: bids,
      },
    ],
    chart: {
      type: "line",
      height: 350,
      fontFamily: "inherit",
      toolbar: { show: false },
    },
    colors: [priceColor, "#22c55e", "#3b82f6"],
    fill: {
      type: ["gradient", "solid", "solid"],
      gradient: {
        shadeIntensity: 0.8,
        opacityFrom: 0.6,
        opacityTo: 0.5,
        stops: [0, 100],
      },
    },
    stroke: {
      curve: "smooth",
      width: [3, 2, 2],
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (value) => formatIDR(value, 0),
      },
    },
    tooltip: {
      y: {
        formatter: (value) => formatIDR(value, 0),
      },
    },
    grid: {
      strokeDashArray: 4,
      borderColor: "#e5e7eb",
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
    },
  };

  goldChart = new ApexCharts(chartElement, options);
  goldChart.render();
}

// Toggle unit (toz/gram)
function toggleUnit() {
  currentUnit = currentUnit === "toz" ? "gram" : "toz";

  // Update button text
  const toggleBtn = document.getElementById("toggle-unit-btn");
  if (toggleBtn) {
    toggleBtn.textContent =
      currentUnit === "toz" ? "Tampilkan per Gram" : "Tampilkan per Toz";
  }

  // Refresh display tanpa fetch ulang dari server
  if (currentData) {
    updatePriceCards(currentData);
  }
  updateChart();
}

// Show toast notification
function showToast(message, type = "info") {
  // Remove existing toast
  const existingToast = document.querySelector(".gold-toast");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = `gold-toast alert alert-${
    type === "success" ? "success" : type === "error" ? "danger" : "info"
  } position-fixed`;
  toast.style.cssText =
    "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Show no data message
function showNoDataMessage() {
  const chartContainer = document.getElementById("gold-chart-container");
  if (chartContainer) {
    chartContainer.innerHTML = `
      <div class="text-center py-5">
        <iconify-icon icon="solar:database-line-duotone" class="fs-1 text-muted"></iconify-icon>
        <p class="mt-3 text-muted">Belum ada data harga emas.</p>
        <button class="btn btn-primary" onclick="fetchGoldPrice()">
          <iconify-icon icon="solar:refresh-bold-duotone" class="fs-5 me-1"></iconify-icon>
          Ambil Data Sekarang
        </button>
      </div>
    `;
  }
}

// Show error message
function showErrorMessage(message) {
  const chartContainer = document.getElementById("gold-chart-container");
  if (chartContainer) {
    chartContainer.innerHTML = `
      <div class="alert alert-danger">
        <iconify-icon icon="solar:danger-triangle-bold-duotone" class="fs-4 me-2"></iconify-icon>
        ${message}
      </div>
    `;
  }
}

// Manual refresh status endpoint removed — client no longer requests it.

// Update API Usage
async function updateApiUsage() {
  try {
    const response = await fetch("/api/emas/usage");
    const result = await response.json();

    if (!result.success) {
      console.error(
        "Failed to fetch API usage:",
        result?.message || "Unknown error"
      );
      return;
    }

    // Data dari metals.dev API langsung dalam result.data
    const data = result.data;

    // Pastikan data valid
    if (!data) {
      console.error("No usage data received");
      return;
    }

    const used = parseInt(data.used) || 0;
    const total = parseInt(data.total) || 100;
    const remaining = parseInt(data.remaining) || total - used;
    const usagePercent = total > 0 ? (used / total) * 100 : 0;

    // Update plan
    const planEl = document.getElementById("api-plan");
    if (planEl) {
      planEl.textContent = `Plan: ${
        data.plan || "Free"
      } | ${used}/${total} requests`;
    }

    // Update usage text
    const usageTextEl = document.getElementById("api-usage-text");
    if (usageTextEl) {
      usageTextEl.textContent = `${used} digunakan`;
    }

    // Update remaining
    const remainingEl = document.getElementById("api-remaining");
    if (remainingEl) {
      const remainingPercent =
        total > 0 ? ((remaining / total) * 100).toFixed(0) : 0;
      remainingEl.textContent = `${remaining} tersisa (${remainingPercent}%)`;
      remainingEl.className =
        "small fw-semibold " +
        (remaining < 20
          ? "text-danger"
          : remaining < 50
          ? "text-warning"
          : "text-success");
    }

    // Update progress bar
    const barEl = document.getElementById("api-usage-bar");
    if (barEl) {
      barEl.style.width = `${usagePercent}%`;
      barEl.className =
        "progress-bar " +
        (remaining < 20
          ? "bg-danger"
          : remaining < 50
          ? "bg-warning"
          : "bg-success");
    }

    // manual refresh status endpoint calls removed (client won't request it)
  } catch (error) {
    console.error("Error updating API usage:", error);
  }
}

// Function to initialize dashboard
function initializeDashboard() {
  // Check if we're on the dashboard page
  if (document.getElementById("gold-price-chart")) {
    console.log('Initializing dashboard...');
    updateDashboard();

    // Setup toggle unit button
    const toggleBtn = document.getElementById("toggle-unit-btn");
    if (toggleBtn) {
      // Remove existing listener to avoid duplicates
      toggleBtn.removeEventListener("click", toggleUnit);
      toggleBtn.addEventListener("click", toggleUnit);
    }

    // Setup refresh button
    const refreshBtn = document.getElementById("refresh-gold-btn");
    if (refreshBtn) {
      // Remove existing listener to avoid duplicates
      refreshBtn.removeEventListener("click", debounce(fetchGoldPrice, 1500));
      // Wrap fetchGoldPrice with a short debounce (1.5s) to prevent rapid repeated clicks
      refreshBtn.addEventListener("click", debounce(fetchGoldPrice, 1500));
    }
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  initializeDashboard();
});

// Detect SPA navigation and reinitialize dashboard
// This handles navigation when returning to dashboard from other pages
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Check if dashboard is now visible
    if (document.getElementById("gold-price-chart")) {
      console.log('Dashboard detected after navigation, reinitializing...');
      // Small delay to ensure DOM is fully updated
      setTimeout(() => {
        initializeDashboard();
      }, 100);
    }
  }
}).observe(document, { subtree: true, childList: true });

// Also observe for when dashboard content is added/removed
const dashboardObserver = new MutationObserver((_mutations) => {
  // Check if gold-price-chart was added to DOM
  const chartElement = document.getElementById("gold-price-chart");
  if (chartElement && !goldChart) {
    console.log('Dashboard chart element detected, initializing...');
    // Clear any existing timeout to avoid duplicate initialization
    if (window.dashboardInitTimeout) {
      clearTimeout(window.dashboardInitTimeout);
    }
    // Small delay to ensure all dashboard elements are loaded
    window.dashboardInitTimeout = setTimeout(() => {
      initializeDashboard();
    }, 150);
  }
});

// Start observing when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    dashboardObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
} else {
  dashboardObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Export functions for global access
window.fetchGoldPrice = fetchGoldPrice;
window.toggleUnit = toggleUnit;
