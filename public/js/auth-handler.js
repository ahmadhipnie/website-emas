/**
 * Global Logout Handler
 * Handle logout functionality di semua halaman
 */

(function() {
  let isInitialized = false;

  function initLogout() {
    // Find logout button
    const logoutButton = document.getElementById('logoutButton');
    
    if (!logoutButton) {
      console.warn('Logout button not found');
      return;
    }

    // Check if already initialized to prevent duplicate listeners
    if (logoutButton.hasAttribute('data-logout-initialized')) {
      console.log('Logout button already initialized');
      return;
    }

    // Mark as initialized
    logoutButton.setAttribute('data-logout-initialized', 'true');

    // Add event listener
    logoutButton.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();

      // Confirm logout
      if (!confirm('Apakah Anda yakin ingin logout?')) {
        return;
      }

      // Disable button
      this.disabled = true;
      const originalHTML = this.innerHTML;
      this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Logging out...';

      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success) {
          // Redirect ke login page
          window.location.href = data.redirect || '/login';
        } else {
          alert('Gagal logout: ' + data.message);
          // Enable button kembali
          this.disabled = false;
          this.innerHTML = originalHTML;
        }
      } catch (error) {
        console.error('Logout error:', error);
        alert('Terjadi kesalahan saat logout');
        // Enable button kembali
        this.disabled = false;
        this.innerHTML = originalHTML;
      }
    });

    console.log('✅ Logout handler initialized');
  }

  // Check user role dan show admin menu
  async function checkUserRole() {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.data) {
        console.log('Logged in as:', data.data.nama, '-', data.data.role);
        
        // Show admin menu jika user adalah admin
        if (data.data.role === 'admin') {
          const adminMenuSection = document.getElementById('adminMenuSection');
          const adminMenuItem = document.getElementById('adminMenuItem');
          
          if (adminMenuSection) adminMenuSection.style.display = 'block';
          if (adminMenuItem) adminMenuItem.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  }

  // Initialize both logout and auth check
  function initializeAuth() {
    initLogout();
    checkUserRole();
  }

  // Run on initial page load
  if (document.readyState !== 'loading') {
    initializeAuth();
  } else {
    document.addEventListener('DOMContentLoaded', initializeAuth);
  }

  // Listen to URL changes for SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log('🔄 URL changed, re-initializing auth handlers...');
      // Delay to let content load
      setTimeout(initializeAuth, 200);
    }
  }).observe(document, { subtree: true, childList: true });

  // Expose globally for manual trigger
  window.initAuthHandlers = initializeAuth;
})();
