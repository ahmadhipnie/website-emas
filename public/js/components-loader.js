/**
 * Component Loader
 * Utility untuk load HTML components (sidebar, header, dll)
 */

/**
 * Load HTML component ke dalam element
 * @param {string} componentPath - Path ke file component
 * @param {string} targetSelector - CSS selector untuk target element
 * @param {Function} callback - Optional callback setelah component loaded
 */
async function loadComponent(componentPath, targetSelector, callback) {
  try {
    const response = await fetch(componentPath);
    if (!response.ok) {
      throw new Error(`Failed to load component: ${componentPath}`);
    }
    
    const html = await response.text();
    const targetElement = document.querySelector(targetSelector);
    
    if (targetElement) {
      targetElement.innerHTML = html;
      
      // Call callback if provided
      if (typeof callback === 'function') {
        callback();
      }
      return true;
    } else {
      console.error(`Target element not found: ${targetSelector}`);
      return false;
    }
  } catch (error) {
    console.error('Error loading component:', error);
    return false;
  }
}

/**
 * Check admin role dan show/hide admin menu
 */
async function checkAdminMenu() {
  try {
    console.log('🔍 Checking admin role...');
    const response = await fetch('/api/auth/me');
    const result = await response.json();
    
    console.log('👤 User role check result:', result);
    
    // AuthController mengembalikan data di result.data, bukan result.user
    if (result.success && result.data && result.data.role === 'admin') {
      console.log('✅ User is admin, showing admin menu');
      const adminSection = document.getElementById('adminMenuSection');
      const adminItem = document.getElementById('adminMenuItem');
      
      if (adminSection) {
        adminSection.style.display = 'block';
        console.log('   - Admin section shown');
      } else {
        console.warn('   - Admin section element not found');
      }
      
      if (adminItem) {
        adminItem.style.display = 'block';
        console.log('   - Admin menu item shown');
      } else {
        console.warn('   - Admin menu item element not found');
      }
    } else {
      console.log('ℹ️ User is not admin or not logged in');
    }
  } catch (error) {
    console.error('❌ Error checking admin role:', error);
  }
}

/**
 * Setup logout button
 */
function setupLogout() {
  const logoutBtn = document.getElementById('logoutButton');
  if (logoutBtn && !logoutBtn.hasAttribute('data-logout-initialized')) {
    logoutBtn.setAttribute('data-logout-initialized', 'true');
    logoutBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/login';
      }
    });
  }
}

/**
 * Setup sidebar toggle for mobile
 */
function setupSidebarToggle() {
  const togglers = document.querySelectorAll('.sidebartoggler, #sidebarCollapse, #headerCollapse');
  togglers.forEach(toggler => {
    if (!toggler.hasAttribute('data-toggle-initialized')) {
      toggler.setAttribute('data-toggle-initialized', 'true');
      toggler.addEventListener('click', function() {
        document.body.classList.toggle('show-sidebar');
      });
    }
  });
}

/**
 * Load sidebar dan set active menu berdasarkan current page
 * @param {string} activePage - Nama halaman aktif (optional)
 */
async function loadSidebar(activePage) {
  const loaded = await loadComponent('/src/views/components/sidebar.html', '#sidebar-container', async () => {
    console.log('✅ Sidebar loaded');
    
    // Set active menu berdasarkan URL atau parameter
    if (!activePage) {
      const path = window.location.pathname;
      activePage = path.substring(1) || 'dashboard'; // Remove leading slash
    }
    
    // Set active class
    const menuItem = document.querySelector(`.sidebar-item[data-page="${activePage}"]`);
    if (menuItem) {
      menuItem.classList.add('active');
      const link = menuItem.querySelector('.sidebar-link');
      if (link) {
        link.classList.add('active');
      }
    }
    
    // Setup sidebar toggle terlebih dahulu
    setupSidebarToggle();
    
    // Initialize simplebar if available
    if (typeof SimpleBar !== 'undefined') {
      const scrollSidebar = document.querySelector('.scroll-sidebar');
      if (scrollSidebar && !scrollSidebar.SimpleBar) {
        new SimpleBar(scrollSidebar);
      }
    }
    
    // Check admin menu setelah semua setup selesai
    await checkAdminMenu();
  });
  
  return loaded;
}

/**
 * Load header component
 */
async function loadHeader() {
  const loaded = await loadComponent('/src/views/components/header.html', '#header-container', () => {
    console.log('✅ Header loaded');
    
    // Setup logout button
    setupLogout();
    
    // Setup sidebar toggle (also in header)
    setupSidebarToggle();
  });
  
  return loaded;
}

/**
 * Load footer component
 */
async function loadFooter() {
  const loaded = await loadComponent('/src/views/components/footer.html', '#footer-container', () => {
    console.log('✅ Footer loaded');
  });
  return loaded;
}

/**
 * Load all common components (sidebar + header)
 * @param {string} activePage - Nama halaman aktif
 */
async function loadCommonComponents(activePage) {
  await Promise.all([
    loadSidebar(activePage),
    loadHeader(),
    loadFooter()
  ]);
  
  console.log('✅ All components loaded');
}

// Auto-detect active page from URL if not specified
function getActivePageFromURL() {
  const path = window.location.pathname;
  return path.substring(1) || 'dashboard';
}

// Expose functions globally
window.loadComponent = loadComponent;
window.loadSidebar = loadSidebar;
window.loadHeader = loadHeader;
window.loadCommonComponents = loadCommonComponents;
window.getActivePageFromURL = getActivePageFromURL;
window.checkAdminMenu = checkAdminMenu;
window.setupLogout = setupLogout;
