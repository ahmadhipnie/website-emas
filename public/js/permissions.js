/**
 * Permission System
 * Mengatur visibility dan akses berdasarkan role user
 */

let currentUser = null;

/**
 * Load current user info
 */
async function loadCurrentUser() {
  try {
    const response = await fetch('/api/auth/me');
    const result = await response.json();
    
    if (result.success) {
      currentUser = result.data;
      console.log('👤 Current User:', currentUser);
      applyPermissions();
      return currentUser;
    }
  } catch (error) {
    console.error('Error loading user info:', error);
  }
  return null;
}

/**
 * Check if current user has specific role
 */
function hasRole(role) {
  return currentUser && currentUser.role === role;
}

/**
 * Check if current user is admin
 */
function isAdmin() {
  return hasRole('admin');
}

/**
 * Apply permissions to page elements
 */
function applyPermissions() {
  if (!currentUser) return;
  
  console.log('🔐 Applying permissions for role:', currentUser.role);
  
  // Jika user adalah admin, disable semua tombol tambah
  if (isAdmin()) {
    disableAddButtons();
  }
}

/**
 * Disable all "Add" buttons for admin role
 */
function disableAddButtons() {
  // Selector untuk berbagai tombol tambah di semua menu (KECUALI Management Users)
  const addButtonSelectors = [
    // '#btnAddUser',              // Management Users - TIDAK DISABLED
    '#btnTambahLead',           // Lead Management
    '#btnTambahEvent',          // Calendar Event
    '#btnTambahInventaris',     // Stock Inventaris
    '#btnTambahRAB',            // RAB
    '#btnTambahLaporan',        // Laporan
    '#btnTambahFlyer',          // Flyer
    '.btn-tambah',              // Buttons dengan class btn-tambah
    '[data-action="add"]',      // Buttons dengan data-action="add"
  ];
  
  addButtonSelectors.forEach(selector => {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach(button => {
      button.disabled = true;
      button.style.opacity = '0.5';
      button.style.cursor = 'not-allowed';
      button.title = 'Admin tidak memiliki akses untuk menambah data';
      
      // Remove click event listeners
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      console.log('🚫 Disabled button:', selector);
    });
  });
  
  // Disable semua button yang mengandung text "Tambah" KECUALI yang ada di Management Users page
  const currentPath = window.location.pathname;
  const isManagementUsersPage = currentPath.includes('management-users');
  
  if (!isManagementUsersPage) {
    document.querySelectorAll('button').forEach(button => {
      // Skip jika button id adalah btnAddUser (Management Users button)
      if (button.id === 'btnAddUser') {
        return;
      }
      
      if (button.textContent.toLowerCase().includes('tambah')) {
        button.disabled = true;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        button.title = 'Admin tidak memiliki akses untuk menambah data';
        console.log('🚫 Disabled button with "Tambah" text:', button.id || button.className);
      }
    });
  }
  
  // Juga hide tombol jika ada class khusus
  document.querySelectorAll('.admin-hide').forEach(el => {
    el.style.display = 'none';
  });
  
  console.log('✅ All add buttons disabled for admin role (except Management Users)');
}

/**
 * Enable add button (untuk role selain admin)
 */
function enableAddButtons() {
  const addButtonSelectors = [
    '#btnAddUser',
    '#btnTambahLead',
    '#btnTambahEvent',
    '#btnTambahInventaris',
    '#btnTambahRAB',
    '#btnTambahLaporan',
    '#btnTambahFlyer',
  ];
  
  addButtonSelectors.forEach(selector => {
    const button = document.querySelector(selector);
    if (button) {
      button.disabled = false;
      button.style.opacity = '1';
      button.style.cursor = 'pointer';
      button.title = '';
    }
  });
  
  document.querySelectorAll('.admin-hide').forEach(el => {
    el.style.display = '';
  });
}

/**
 * Check permission before action
 */
function checkPermission(action, showAlert = true) {
  if (isAdmin() && action === 'add') {
    if (showAlert) {
      alert('Admin tidak memiliki akses untuk menambah data baru.');
    }
    return false;
  }
  return true;
}

/**
 * Initialize permission system on page load
 */
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🔐 Initializing Permission System...');
  await loadCurrentUser();
});

// Export functions untuk digunakan di module lain
window.PermissionSystem = {
  loadCurrentUser,
  hasRole,
  isAdmin,
  checkPermission,
  getCurrentUser: () => currentUser
};
