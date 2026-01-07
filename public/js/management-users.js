/**
 * Management Users - Frontend JavaScript
 * Handle CRUD operations untuk user management
 * SIMPLIFIED VERSION - No SPA Router
 */

let usersTable;
let isEditMode = false;

/**
 * Initialize DataTable dan Event Listeners
 */
function initializeManagementUsers() {
  console.log('🔄 Initializing Management Users...');
  
  // Check apakah table element ada
  const tableElement = $('#usersTable');
  if (tableElement.length === 0) {
    console.warn('⚠️ Table #usersTable not found');
    return;
  }
  
  // Check if already initialized
  if ($.fn.DataTable.isDataTable('#usersTable')) {
    console.log('ℹ️ DataTable already initialized');
    return;
  }
  
  console.log('📊 Creating DataTable...');
  
  // Initialize DataTable
  usersTable = $('#usersTable').DataTable({
    ajax: {
      url: '/api/users',
      dataSrc: 'data',
      error: function(xhr, error, code) {
        console.error('DataTables Ajax Error:', error);
        alert('Gagal memuat data users');
      }
    },
    columns: [
      { data: 'id_user' },
      { data: 'nama' },
      { data: 'email' },
      { 
        data: 'role',
        render: function(data) {
          const badgeClass = data === 'admin' ? 'bg-danger' : 'bg-primary';
          return `<span class="badge ${badgeClass}">${data}</span>`;
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
        data: 'keterangan',
        render: function(data) {
          return data || '-';
        }
      },
      {
        data: null,
        orderable: false,
        render: function(data, type, row) {
          return `
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-warning btn-edit" data-id="${row.id_user}">
                <i class="ti ti-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger btn-delete" data-id="${row.id_user}" data-name="${row.nama}">
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
  $('#btnAddUser').on('click', function(e) {
    e.preventDefault();
    openAddModal();
  });
  
  $('#userForm').on('submit', handleSaveUser);
  
  $('#btnConfirmDelete').on('click', function(e) {
    e.preventDefault();
    handleDeleteUser();
  });
  
  // Delegated events untuk tombol di table (karena dynamic)
  $('#usersTable').on('click', '.btn-edit', function(e) {
    e.preventDefault();
    const id = $(this).data('id');
    openEditModal(id);
  });

  $('#usersTable').on('click', '.btn-delete', function(e) {
    e.preventDefault();
    const id = $(this).data('id');
    const name = $(this).data('name');
    openDeleteModal(id, name);
  });

  // Reset form saat modal ditutup
  $('#userModal').on('hidden.bs.modal', resetForm);
  
  console.log('✅ Management Users initialized successfully');
}

/**
 * Open modal untuk tambah user baru
 */
function openAddModal() {
  resetForm();
  isEditMode = false;
  
  $('#userModalLabel').text('Tambah User Baru');
  $('#passwordRequired').show();
  $('#userPassword').prop('required', true);
  $('#userPassword').attr('minlength', '6');
  $('#passwordHelp').show();
  $('#editPasswordHelp').hide();
  
  const modal = new bootstrap.Modal(document.getElementById('userModal'));
  modal.show();
}

/**
 * Open modal untuk edit user
 */
async function openEditModal(userId) {
  resetForm();
  
  try {
    const response = await fetch(`/api/users/${userId}`);
    const result = await response.json();

    if (result.success) {
      const user = result.data;
      
      isEditMode = true;
      $('#userId').val(user.id_user);
      $('#userName').val(user.nama);
      $('#userEmail').val(user.email);
      $('#userRole').val(user.role);
      $('#userKeterangan').val(user.keterangan || '');
      
      $('#userModalLabel').text('Edit User');
      $('#passwordRequired').hide();
      $('#userPassword').prop('required', false);
      $('#userPassword').removeAttr('minlength');
      $('#passwordHelp').hide();
      $('#editPasswordHelp').show();
      
      const modal = new bootstrap.Modal(document.getElementById('userModal'));
      modal.show();
    } else {
      showAlert('danger', result.message);
    }
  } catch (error) {
    console.error('Error loading user:', error);
    showAlert('danger', 'Gagal memuat data user');
  }
}

/**
 * Handle save user (create atau update)
 */
async function handleSaveUser(e) {
  e.preventDefault();

  const submitButton = $('#btnSaveUser');
  const saveButtonText = $('#saveButtonText');
  const saveSpinner = $('#saveSpinner');

  // Determine mode berdasarkan userId
  const userId = $('#userId').val();
  const currentIsEditMode = userId && userId.trim() !== '';

  // Get form data
  const formData = {
    nama: $('#userName').val().trim(),
    email: $('#userEmail').val().trim(),
    role: $('#userRole').val(),
    keterangan: $('#userKeterangan').val().trim()
  };

  // Validasi password
  const password = $('#userPassword').val();
  if (password && password.trim() !== '') {
    if (password.length < 6) {
      showAlert('danger', 'Password minimal 6 karakter');
      return;
    }
    formData.password = password;
  } else if (!currentIsEditMode) {
    showAlert('danger', 'Password harus diisi untuk user baru');
    return;
  }

  // Disable button dan show loading
  submitButton.prop('disabled', true);
  saveButtonText.text('Menyimpan...');
  saveSpinner.show();

  try {
    let response;
    
    if (currentIsEditMode) {
      // Update user
      response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    } else {
      // Create user baru
      response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    }

    const result = await response.json();

    if (result.success) {
      showAlert('success', result.message);
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
      modal.hide();
      
      // Reload table
      usersTable.ajax.reload();
    } else {
      showAlert('danger', result.message);
    }
  } catch (error) {
    console.error('Error saving user:', error);
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
function openDeleteModal(userId, userName) {
  $('#deleteUserId').val(userId);
  $('#deleteUserName').text(userName);
  
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
}

/**
 * Handle delete user
 */
async function handleDeleteUser() {
  const userId = $('#deleteUserId').val();
  const deleteButton = $('#btnConfirmDelete');
  const deleteButtonText = $('#deleteButtonText');
  const deleteSpinner = $('#deleteSpinner');

  // Disable button dan show loading
  deleteButton.prop('disabled', true);
  deleteButtonText.text('Menghapus...');
  deleteSpinner.show();

  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      showAlert('success', result.message);
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
      modal.hide();
      
      // Reload table
      usersTable.ajax.reload();
    } else {
      showAlert('danger', result.message);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
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
  const form = $('#userForm');
  if (form.length > 0 && form[0]) {
    form[0].reset();
  }
  $('#userId').val('');
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
  // Only initialize if on management-users page
  if ($('#usersTable').length > 0) {
    initializeManagementUsers();
  }
});

// Expose globally
window.initManagementUsers = initializeManagementUsers;
