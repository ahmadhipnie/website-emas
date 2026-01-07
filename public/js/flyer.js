/**
 * Flyer Management - Frontend JavaScript
 * Handle CRUD operations untuk flyer dengan upload gambar
 */

let flyersTable;
let isEditMode = false;

/**
 * Initialize DataTable dan Event Listeners
 */
function initializeFlyer() {
  console.log('🔄 Initializing Flyer Management...');
  
  // Check apakah table element ada
  const tableElement = $('#flyersTable');
  if (tableElement.length === 0) {
    console.warn('⚠️ Table #flyersTable not found');
    return;
  }
  
  // Check if already initialized
  if ($.fn.DataTable.isDataTable('#flyersTable')) {
    console.log('ℹ️ DataTable already initialized');
    return;
  }
  
  console.log('📊 Creating DataTable...');
  
  // Initialize DataTable
  flyersTable = $('#flyersTable').DataTable({
    ajax: {
      url: '/api/flyers',
      dataSrc: 'data',
      error: function(xhr, error, code) {
        console.error('DataTables Ajax Error:', error);
        alert('Gagal memuat data flyers. Pastikan tabel flyers sudah dibuat di database.');
      }
    },
    columns: [
      { data: 'id_flyer' },
      { 
        data: 'gambar',
        orderable: false,
        render: function(data, type, row) {
          // Path sudah lengkap dari database, langsung gunakan
          return `<img src="${data}" alt="${row.nama}" class="flyer-thumbnail" style="max-width: 100px; max-height: 60px; object-fit: cover;">`;
        }
      },
      { data: 'nama' },
      { 
        data: 'keterangan',
        render: function(data) {
          if (!data) return '-';
          return data.length > 100 ? data.substring(0, 100) + '...' : data;
        }
      },
      { 
        data: 'created_at',
        render: function(data) {
          return new Date(data).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      },
      {
        data: null,
        orderable: false,
        render: function(data, type, row) {
          return `
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-warning btn-edit" data-id="${row.id_flyer}">
                <i class="ti ti-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger btn-delete" data-id="${row.id_flyer}" data-name="${row.nama}">
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

  // Event Listeners
  $('#btnAddFlyer').on('click', function(e) {
    e.preventDefault();
    openAddModal();
  });
  
  $('#flyerForm').on('submit', handleSaveFlyer);
  
  $('#btnConfirmDelete').on('click', function(e) {
    e.preventDefault();
    handleDeleteFlyer();
  });
  
  // Image preview on file select
  $('#flyerGambar').on('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      // Validasi ukuran file (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file terlalu besar! Maksimal 2MB');
        $(this).val('');
        $('#imagePreviewContainer').hide();
        return;
      }
      
      // Preview image
      const reader = new FileReader();
      reader.onload = function(e) {
        $('#imagePreview').attr('src', e.target.result);
        $('#imagePreviewContainer').show();
      };
      reader.readAsDataURL(file);
    } else {
      $('#imagePreviewContainer').hide();
    }
  });
  
  // Delegated events untuk tombol di table
  $('#flyersTable').on('click', '.btn-edit', function(e) {
    e.preventDefault();
    const id = $(this).data('id');
    openEditModal(id);
  });

  $('#flyersTable').on('click', '.btn-delete', function(e) {
    e.preventDefault();
    const id = $(this).data('id');
    const name = $(this).data('name');
    openDeleteModal(id, name);
  });

  // Reset form saat modal ditutup
  $('#flyerModal').on('hidden.bs.modal', resetForm);
  
  console.log('✅ Flyer Management initialized successfully');
}

/**
 * Open modal untuk tambah flyer baru
 */
function openAddModal() {
  resetForm();
  isEditMode = false;
  
  $('#flyerModalLabel').text('Tambah Flyer');
  $('#gambarRequired').show();
  $('#flyerGambar').prop('required', true);
  $('#editGambarHelp').hide();
  $('#imagePreviewContainer').hide();
  
  const modal = new bootstrap.Modal(document.getElementById('flyerModal'));
  modal.show();
}

/**
 * Open modal untuk edit flyer
 */
async function openEditModal(flyerId) {
  resetForm();
  
  try {
    const response = await fetch(`/api/flyers/${flyerId}`);
    const result = await response.json();

    if (result.success) {
      const flyer = result.data;
      
      isEditMode = true;
      $('#flyerId').val(flyer.id_flyer);
      $('#flyerNama').val(flyer.nama);
      $('#flyerKeterangan').val(flyer.keterangan || '');
      
      // Show current image
      if (flyer.gambar) {
        $('#imagePreview').attr('src', `/public/uploads/flyers/${flyer.gambar}`);
        $('#imagePreviewContainer').show();
      }
      
      $('#flyerModalLabel').text('Edit Flyer');
      $('#gambarRequired').hide();
      $('#flyerGambar').prop('required', false);
      $('#editGambarHelp').show();
      
      const modal = new bootstrap.Modal(document.getElementById('flyerModal'));
      modal.show();
    } else {
      showAlert('danger', result.message);
    }
  } catch (error) {
    console.error('Error loading flyer:', error);
    showAlert('danger', 'Gagal memuat data flyer');
  }
}

/**
 * Handle save flyer (create atau update)
 */
async function handleSaveFlyer(e) {
  e.preventDefault();

  const submitButton = $('#btnSaveFlyer');
  const saveButtonText = $('#saveButtonText');
  const saveSpinner = $('#saveSpinner');

  // Determine mode berdasarkan flyerId
  const flyerId = $('#flyerId').val();
  const currentIsEditMode = flyerId && flyerId.trim() !== '';

  // Validasi gambar untuk create
  const fileInput = document.getElementById('flyerGambar');
  if (!currentIsEditMode && !fileInput.files.length) {
    showAlert('danger', 'Gambar harus diisi untuk flyer baru');
    return;
  }

  // Prepare FormData
  const formData = new FormData();
  formData.append('nama', $('#flyerNama').val().trim());
  formData.append('keterangan', $('#flyerKeterangan').val().trim());
  
  if (fileInput.files.length > 0) {
    formData.append('gambar', fileInput.files[0]);
  }

  // Disable button dan show loading
  submitButton.prop('disabled', true);
  saveButtonText.text('Menyimpan...');
  saveSpinner.show();

  try {
    let response;
    
    if (currentIsEditMode) {
      // Update flyer
      response = await fetch(`/api/flyers/${flyerId}`, {
        method: 'PUT',
        body: formData
      });
    } else {
      // Create flyer baru
      response = await fetch('/api/flyers', {
        method: 'POST',
        body: formData
      });
    }

    const result = await response.json();

    if (result.success) {
      showAlert('success', result.message);
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('flyerModal'));
      modal.hide();
      
      // Reload table
      flyersTable.ajax.reload();
    } else {
      showAlert('danger', result.message);
    }
  } catch (error) {
    console.error('Error saving flyer:', error);
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
function openDeleteModal(flyerId, flyerName) {
  $('#deleteFlyerId').val(flyerId);
  $('#deleteFlyerName').text(flyerName);
  
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
}

/**
 * Handle delete flyer
 */
async function handleDeleteFlyer() {
  const flyerId = $('#deleteFlyerId').val();
  const deleteButton = $('#btnConfirmDelete');
  const deleteButtonText = $('#deleteButtonText');
  const deleteSpinner = $('#deleteSpinner');

  // Disable button dan show loading
  deleteButton.prop('disabled', true);
  deleteButtonText.text('Menghapus...');
  deleteSpinner.show();

  try {
    const response = await fetch(`/api/flyers/${flyerId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      showAlert('success', result.message);
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
      modal.hide();
      
      // Reload table
      flyersTable.ajax.reload();
    } else {
      showAlert('danger', result.message);
    }
  } catch (error) {
    console.error('Error deleting flyer:', error);
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
  const form = $('#flyerForm');
  if (form.length > 0 && form[0]) {
    form[0].reset();
  }
  $('#flyerId').val('');
  $('#imagePreviewContainer').hide();
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
  if ($('#flyersTable').length > 0) {
    initializeFlyer();
  }
});

// Expose globally
window.initFlyer = initializeFlyer;
