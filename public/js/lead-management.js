/**
 * Lead Management - Frontend JavaScript
 * Handle CRUD operations untuk lead management
 */

let leadsTable;
let isEditMode = false;

/**
 * Initialize DataTable dan Event Listeners
 */
function initializeLeadManagement() {
  console.log('🔄 Initializing Lead Management...');

  // Check apakah table element ada
  const tableElement = $('#leadsTable');
  if (tableElement.length === 0) {
    console.warn('⚠️ Table #leadsTable not found');
    return;
  }

  // Check if already initialized
  if ($.fn.DataTable.isDataTable('#leadsTable')) {
    console.log('ℹ️ DataTable already initialized');
    return;
  }

  console.log('📊 Creating DataTable...');

  // Initialize DataTable
  leadsTable = $('#leadsTable').DataTable({
    ajax: {
      url: '/api/leads',
      dataSrc: 'data',
      error: function(xhr, error, code) {
        console.error('DataTables Ajax Error:', error);
        alert('Gagal memuat data leads');
      }
    },
    columns: [
      { data: 'id_leads' },
      { data: 'nama_nasabah' },
      { data: 'no_hp' },
      {
        data: 'email',
        render: function(data) {
          return data || '-';
        }
      },
      { data: 'produk' },
      { data: 'status_leads' },
      {
        data: 'tanggal_input',
        render: function(data) {
          if (!data) return '-';
          return new Date(data).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      },
      {
        data: 'keterangan',
        render: function(data) {
          if (!data) return '-';
          // Truncate if too long
          return data.length > 50 ? data.substring(0, 50) + '...' : data;
        }
      },
      {
        data: null,
        orderable: false,
        render: function(data, type, row) {
          return `
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-warning btn-edit" data-id="${row.id_leads}">
                <i class="ti ti-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger btn-delete" data-id="${row.id_leads}" data-name="${row.nama_nasabah}">
                <i class="ti ti-trash"></i>
              </button>
            </div>
          `;
        }
      }
    ],
    order: [[0, 'desc']],
    pageLength: 10,
    language: {
      url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/id.json'
    }
  });

  // Event Listeners - Simple direct binding
  $('#btnAddLead').on('click', function(e) {
    e.preventDefault();
    openAddModal();
  });

  $('#leadForm').on('submit', handleSaveLead);

  $('#btnConfirmDelete').on('click', function(e) {
    e.preventDefault();
    handleDeleteLead();
  });

  // Delegated events untuk tombol di table (karena dynamic)
  $('#leadsTable').on('click', '.btn-edit', function(e) {
    e.preventDefault();
    const id = $(this).data('id');
    openEditModal(id);
  });

  $('#leadsTable').on('click', '.btn-delete', function(e) {
    e.preventDefault();
    const id = $(this).data('id');
    const name = $(this).data('name');
    openDeleteModal(id, name);
  });

  // Reset form saat modal ditutup
  $('#leadModal').on('hidden.bs.modal', resetForm);

  console.log('✅ Lead Management initialized successfully');
}

/**
 * Open modal untuk tambah lead baru
 */
function openAddModal() {
  resetForm();
  isEditMode = false;

  $('#leadModalLabel').text('Tambah Lead Baru');

  const modal = new bootstrap.Modal(document.getElementById('leadModal'));
  modal.show();
}

/**
 * Open modal untuk edit lead
 */
async function openEditModal(leadId) {
  resetForm();

  try {
    const response = await fetch(`/api/leads/${leadId}`);
    const result = await response.json();

    if (result.success) {
      const lead = result.data;

      isEditMode = true;
      $('#leadId').val(lead.id_leads);
      $('#leadNamaNasabah').val(lead.nama_nasabah);
      $('#leadNoHp').val(lead.no_hp);
      $('#leadEmail').val(lead.email || '');
      $('#leadProduk').val(lead.produk || '');
      $('#leadStatusLeads').val(lead.status_leads || '');
      $('#leadTanggalInput').val(lead.tanggal_input || '');
      $('#leadKeterangan').val(lead.keterangan || '');

      $('#leadModalLabel').text('Edit Lead');

      const modal = new bootstrap.Modal(document.getElementById('leadModal'));
      modal.show();
    } else {
      showAlert('danger', result.message);
    }
  } catch (error) {
    console.error('Error loading lead:', error);
    showAlert('danger', 'Gagal memuat data lead');
  }
}

/**
 * Handle save lead (create atau update)
 */
async function handleSaveLead(e) {
  e.preventDefault();

  const submitButton = $('#btnSaveLead');
  const saveButtonText = $('#saveButtonText');
  const saveSpinner = $('#saveSpinner');

  // Determine mode berdasarkan leadId
  const leadId = $('#leadId').val();
  const currentIsEditMode = leadId && leadId.trim() !== '';

  // Get form data
  const formData = {
    nama_nasabah: $('#leadNamaNasabah').val().trim(),
    no_hp: $('#leadNoHp').val().trim(),
    email: $('#leadEmail').val().trim(),
    produk: $('#leadProduk').val().trim(),
    status_leads: $('#leadStatusLeads').val().trim(),
    tanggal_input: $('#leadTanggalInput').val().trim(),
    keterangan: $('#leadKeterangan').val().trim()
  };

  // Validasi input - semua field required kecuali keterangan
  if (!formData.nama_nasabah) {
    showAlert('danger', 'Nama nasabah harus diisi');
    return;
  }

  if (!formData.no_hp) {
    showAlert('danger', 'No. HP harus diisi');
    return;
  }

  if (!formData.email) {
    showAlert('danger', 'Email harus diisi');
    return;
  }

  if (!formData.produk) {
    showAlert('danger', 'Produk harus diisi');
    return;
  }

  if (!formData.status_leads) {
    showAlert('danger', 'Status leads harus diisi');
    return;
  }

  if (!formData.tanggal_input) {
    showAlert('danger', 'Tanggal input harus diisi');
    return;
  }

  // Disable button dan show loading
  submitButton.prop('disabled', true);
  saveButtonText.text('Menyimpan...');
  saveSpinner.show();

  try {
    let response;

    if (currentIsEditMode) {
      // Update lead
      response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    } else {
      // Create lead baru
      response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    }

    const result = await response.json();

    if (result.success) {
      showAlert('success', result.message);

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('leadModal'));
      modal.hide();

      // Reload table
      leadsTable.ajax.reload();
    } else {
      showAlert('danger', result.message);
    }
  } catch (error) {
    console.error('Error saving lead:', error);
    showAlert('danger', 'Terjadi kesalahan saat menyimpan data');
  } finally {
    // Enable button kembali
    submitButton.prop('disabled', false);
    saveButtonText.text('Simpan');
    saveSpinner.hide();
  }
}

/**
 * Open delete confirmation modal
 */
function openDeleteModal(leadId, leadName) {
  $('#deleteLeadId').val(leadId);
  $('#deleteLeadName').text(leadName);

  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
}

/**
 * Handle delete lead
 */
async function handleDeleteLead() {
  const leadId = $('#deleteLeadId').val();
  const deleteButton = $('#btnConfirmDelete');
  const deleteButtonText = $('#deleteButtonText');
  const deleteSpinner = $('#deleteSpinner');

  // Disable button dan show loading
  deleteButton.prop('disabled', true);
  deleteButtonText.text('Menghapus...');
  deleteSpinner.show();

  try {
    const response = await fetch(`/api/leads/${leadId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      showAlert('success', result.message);

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
      modal.hide();

      // Reload table
      leadsTable.ajax.reload();
    } else {
      showAlert('danger', result.message);
    }
  } catch (error) {
    console.error('Error deleting lead:', error);
    showAlert('danger', 'Terjadi kesalahan saat menghapus data');
  } finally {
    // Enable button kembali
    deleteButton.prop('disabled', false);
    deleteButtonText.text('Hapus');
    deleteSpinner.hide();
  }
}

/**
 * Reset form
 */
function resetForm() {
  const form = $('#leadForm');
  if (form.length > 0 && form[0]) {
    form[0].reset();
  }
  $('#leadId').val('');
  isEditMode = false;
}

/**
 * Show alert message
 */
function showAlert(type, message) {
  const alertDiv = $('#alertMessage');
  const alertText = $('#alertText');

  if (alertDiv.length === 0) {
    console.log('Alert:', type, message);
    return;
  }

  alertDiv.removeClass().addClass(`alert alert-${type} alert-dismissible fade show`);
  alertText.text(message);
  alertDiv.show();

  // Auto hide after 5 seconds
  setTimeout(() => {
    alertDiv.fadeOut();
  }, 5000);

  // Scroll to top
  $('html, body').animate({ scrollTop: 0 }, 'fast');
}

// Initialize saat DOM ready
$(document).ready(function() {
  // Only initialize if on lead-management page
  if ($('#leadsTable').length > 0) {
    initializeLeadManagement();
  }
});

// Expose globally
window.initLeadManagement = initializeLeadManagement;
