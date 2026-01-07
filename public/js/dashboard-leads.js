/**
 * Dashboard Leads Management
 * Menampilkan summary dan tabel leads di dashboard
 */

// API Configuration
const API_BASE_URL = '/api/leads';

// Formatter untuk tanggal
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Get warna untuk status card
const getStatusColor = (status) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('baru') || statusLower === 'new') return 'success';
  else if (statusLower.includes('proses') || statusLower.includes('process') || statusLower.includes('follow') || statusLower.includes('hot')) return 'primary';
  else if (statusLower.includes('deal') || statusLower.includes('closed') || statusLower.includes('done')) return 'warning';
  else if (statusLower.includes('tidak aktif') || statusLower.includes('inactive') || statusLower.includes('cold') || statusLower.includes('batal')) return 'danger';
  return 'info';
};

// Get icon untuk status card
const getStatusIcon = (status) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('baru') || statusLower === 'new') return 'solar:user-plus-bold-duotone';
  else if (statusLower.includes('proses') || statusLower.includes('process') || statusLower.includes('follow') || statusLower.includes('hot')) return 'solar:refresh-circle-bold-duotone';
  else if (statusLower.includes('deal') || statusLower.includes('closed') || statusLower.includes('done')) return 'solar:check-circle-bold-duotone';
  else if (statusLower.includes('tidak aktif') || statusLower.includes('inactive') || statusLower.includes('cold') || statusLower.includes('batal')) return 'solar:close-circle-bold-duotone';
  return 'solar:info-circle-bold-duotone';
};

// Formatter untuk status badge
const getStatusBadge = (status) => {
  if (!status) return '<span class="badge bg-secondary">-</span>';
  const statusLower = status.toLowerCase();
  let badgeClass = 'bg-secondary';
  let icon = '';

  if (statusLower.includes('baru') || statusLower === 'new') {
    badgeClass = 'bg-success';
    icon = '<i class="ti ti-user-plus me-1"></i>';
  } else if (statusLower.includes('proses') || statusLower.includes('process') || statusLower.includes('follow') || statusLower.includes('hot')) {
    badgeClass = 'bg-primary';
    icon = '<i class="ti ti-refresh me-1"></i>';
  } else if (statusLower.includes('deal') || statusLower.includes('closed') || statusLower.includes('done')) {
    badgeClass = 'bg-warning';
    icon = '<i class="ti ti-check me-1"></i>';
  } else if (statusLower.includes('tidak aktif') || statusLower.includes('inactive') || statusLower.includes('cold') || statusLower.includes('batal')) {
    badgeClass = 'bg-danger';
    icon = '<i class="ti ti-x me-1"></i>';
  }

  return `<span class="badge ${badgeClass}">${icon}${status}</span>`;
};

// Fetch dan tampilkan summary leads
async function loadLeadsSummary() {
  try {
    console.log('Fetching leads from:', API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}`);
    const result = await response.json();

    console.log('API Response:', result);

    if (!result.success) {
      throw new Error(result.message || 'Gagal memuat data leads');
    }

    const leads = result.data || [];
    console.log('Total leads:', leads.length);

    if (leads.length === 0) {
      // Tampilkan 0 jika tidak ada data
      const totalCountEl = document.getElementById('total-leads-count');
      if (totalCountEl) totalCountEl.textContent = '0';
      return;
    }

    // Hitung total dan summary per status secara dinamis
    const totalLeads = leads.length;
    const statusCounts = {};
    const statusList = [];

    // Collect semua unique status
    leads.forEach(lead => {
      const status = lead.status_leads || lead.status || 'Tidak Ada Status';
      if (!statusCounts[status]) {
        statusCounts[status] = 0;
        statusList.push(status);
      }
      statusCounts[status]++;
    });

    // Sort status list by count (descending)
    statusList.sort((a, b) => statusCounts[b] - statusCounts[a]);

    console.log('Status list:', statusList);
    console.log('Status counts:', statusCounts);

    // Update Total Leads
    const totalCountEl = document.getElementById('total-leads-count');
    if (totalCountEl) {
      totalCountEl.textContent = totalLeads;
      totalCountEl.innerHTML = `<span class="counter-icon">${totalLeads}</span> <small class="text-muted">Total Leads</small>`;
    }

    // Ambil top 4 status untuk ditampilkan di cards
    const topStatuses = statusList.slice(0, 4);
    const cardContainer = document.querySelector('.leads-summary-cards .row');

    if (cardContainer && topStatuses.length > 0) {
      // Generate cards untuk top 4 status
      let cardsHTML = '';

      topStatuses.forEach((status, index) => {
        const count = statusCounts[status];
        const color = getStatusColor(status);
        const icon = getStatusIcon(status);
        const cardSize = index === 0 ? 'col-12 col-sm-6 col-xl-3' : 'col-6 col-sm-3 col-xl';

        cardsHTML += `
          <div class="${cardSize} mb-3 mb-xl-0">
            <div class="card border-${color} border-opacity-10 h-100">
              <div class="card-body d-flex flex-column justify-content-between">
                <div class="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 class="mb-1 text-muted text-truncate" style="max-width: 150px;">${status}</h6>
                  </div>
                  <div class="bg-${color} bg-opacity-10 rounded-3 p-2">
                    <iconify-icon icon="${icon}" class="fs-4 text-${color}"></iconify-icon>
                  </div>
                </div>
                <h5 class="fw-bold mb-0 text-${color} mt-auto">${count}</h5>
              </div>
            </div>
          </div>
        `;
      });

      // Jika kurang dari 4 status, tambahkan placeholder cards
      for (let i = topStatuses.length; i < 4; i++) {
        cardsHTML += `
          <div class="col-6 col-sm-3 col-xl mb-3 mb-xl-0">
            <div class="card border-secondary border-opacity-10 h-100 opacity-50">
              <div class="card-body d-flex flex-column justify-content-between">
                <div class="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 class="mb-1 text-muted">-</h6>
                  </div>
                  <div class="bg-secondary bg-opacity-10 rounded-3 p-2">
                    <iconify-icon icon="solar:shield-bold-duotone" class="fs-4 text-secondary"></iconify-icon>
                  </div>
                </div>
                <h5 class="fw-bold mb-0 text-secondary mt-auto">0</h5>
              </div>
            </div>
          </div>
        `;
      }

      cardContainer.innerHTML = cardsHTML;
    }

  } catch (error) {
    console.error('Error loading leads summary:', error);
    // Set 0 pada error
    const totalCountEl = document.getElementById('total-leads-count');
    if (totalCountEl) totalCountEl.textContent = '0';
  }
}

// Fetch dan tampilkan tabel leads (5 terbaru)
async function loadLeadsTable() {
  try {
    console.log('Fetching leads table from:', API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}`);
    const result = await response.json();

    console.log('Table API Response:', result);

    if (!result.success) {
      throw new Error(result.message || 'Gagal memuat data leads');
    }

    const leads = result.data || [];
    console.log('Leads for table:', leads);

    // Ambil 5 leads terbaru berdasarkan tanggal input
    const sortedLeads = leads
      .sort((a, b) => {
        const dateA = new Date(a.tanggal_input || a.created_at || 0);
        const dateB = new Date(b.tanggal_input || b.created_at || 0);
        return dateB - dateA;
      })
      .slice(0, 5);

    console.log('Sorted leads (top 5):', sortedLeads);

    const tableBody = document.getElementById('dashboardLeadsTableBody');

    if (!tableBody) {
      console.error('Table body element not found!');
      return;
    }

    if (sortedLeads.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            <iconify-icon icon="solar:users-group-rounded-bold-duotone" class="fs-1 d-block mb-2"></iconify-icon>
            Belum ada data leads
          </td>
        </tr>
      `;
      return;
    }

    // Render tabel
    tableBody.innerHTML = sortedLeads.map(lead => `
      <tr>
        <td class="fw-medium">${lead.nama_nasabah || '-'}</td>
        <td>${lead.no_hp || '-'}</td>
        <td>${lead.produk || '-'}</td>
        <td>${getStatusBadge(lead.status_leads || lead.status || '-')}</td>
        <td>${formatDate(lead.tanggal_input || lead.created_at)}</td>
      </tr>
    `).join('');

    console.log('Table rendered successfully');

  } catch (error) {
    console.error('Error loading leads table:', error);
    const tableBody = document.getElementById('dashboardLeadsTableBody');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger py-4">
            <iconify-icon icon="solar:danger-triangle-bold-duotone" class="fs-1 d-block mb-2"></iconify-icon>
            Gagal memuat data leads: ${error.message}
          </td>
        </tr>
      `;
    }
  }
}

// Load semua data leads di dashboard
async function loadDashboardLeads() {
  // Cek apakah elemen dashboard leads ada
  if (!document.getElementById('dashboardLeadsTable') && !document.getElementById('total-leads-count')) {
    return;
  }

  console.log('Loading dashboard leads...');
  await Promise.all([
    loadLeadsSummary(),
    loadLeadsTable()
  ]);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Delay sebentar untuk memastikan elemen sudah tersedia
  setTimeout(() => {
    loadDashboardLeads();
  }, 500);
});

// Detect SPA navigation dan reload leads
// Gunakan IIFE untuk mengisolasi variabel
(function() {
  let dashboardLeadsLastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== dashboardLeadsLastUrl) {
      dashboardLeadsLastUrl = url;

      // Jika navigasi ke dashboard, reload data leads
      if (url.includes('/dashboard') || url.endsWith('/dashboard')) {
        setTimeout(() => {
          loadDashboardLeads();
        }, 300);
      }
    }
  }).observe(document, { subtree: true, childList: true });
})();

// Export fungsi untuk global access
window.loadDashboardLeads = loadDashboardLeads;
