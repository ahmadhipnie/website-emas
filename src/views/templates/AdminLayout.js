/**
 * Sidebar Template Component
 * Reusable sidebar HTML untuk semua halaman admin
 */

export const getSidebarHTML = () => `
<aside class="left-sidebar">
  <div>
    <div class="brand-logo d-flex align-items-center justify-content-between">
      <a href="/dashboard" class="text-nowrap logo-img d-flex align-items-center gap-2" aria-label="Website Emas">
        <span class="d-flex align-items-center gap-2">
          <iconify-icon icon="fa-solid:coins" style="color:#d4af37" class="fs-4" aria-hidden="true"></iconify-icon>
          <span class="brand-text fw-semibold fs-4 ms-1">Website Emas</span>
        </span>
      </a>
      <div class="close-btn d-xl-none d-block sidebartoggler cursor-pointer" id="sidebarCollapse">
        <i class="ti ti-x fs-8"></i>
      </div>
    </div>
    <nav class="sidebar-nav scroll-sidebar" data-simplebar="">
      <ul id="sidebarnav">
        <li class="nav-small-cap">
          <i class="ti ti-dots nav-small-cap-icon fs-6"></i>
          <span class="hide-menu">Home</span>
        </li>
        <li class="sidebar-item">
          <a class="sidebar-link" href="/dashboard" aria-expanded="false">
            <span><iconify-icon icon="solar:home-smile-bold-duotone" class="fs-6"></iconify-icon></span>
            <span class="hide-menu">Dashboard</span>
          </a>
        </li>
        <li class="nav-small-cap">
          <i class="ti ti-dots nav-small-cap-icon fs-6"></i>
          <span class="hide-menu">UI COMPONENTS</span>
        </li>
        <li class="sidebar-item">
          <a class="sidebar-link" href="/ui-buttons" aria-expanded="false">
            <span><iconify-icon icon="solar:layers-minimalistic-bold-duotone" class="fs-6"></iconify-icon></span>
            <span class="hide-menu">Buttons</span>
          </a>
        </li>
        <li class="sidebar-item">
          <a class="sidebar-link" href="/ui-alerts" aria-expanded="false">
            <span><iconify-icon icon="solar:danger-circle-bold-duotone" class="fs-6"></iconify-icon></span>
            <span class="hide-menu">Alerts</span>
          </a>
        </li>
        <li class="sidebar-item">
          <a class="sidebar-link" href="/ui-card" aria-expanded="false">
            <span><iconify-icon icon="solar:bookmark-square-minimalistic-bold-duotone" class="fs-6"></iconify-icon></span>
            <span class="hide-menu">Card</span>
          </a>
        </li>
        <li class="sidebar-item">
          <a class="sidebar-link" href="/ui-forms" aria-expanded="false">
            <span><iconify-icon icon="solar:file-text-bold-duotone" class="fs-6"></iconify-icon></span>
            <span class="hide-menu">Forms</span>
          </a>
        </li>
        <li class="sidebar-item">
          <a class="sidebar-link" href="/ui-typography" aria-expanded="false">
            <span><iconify-icon icon="solar:text-field-focus-bold-duotone" class="fs-6"></iconify-icon></span>
            <span class="hide-menu">Typography</span>
          </a>
        </li>
        <li class="nav-small-cap">
          <iconify-icon icon="solar:menu-dots-linear" class="nav-small-cap-icon fs-6"></iconify-icon>
          <span class="hide-menu">AUTH</span>
        </li>
        <li class="sidebar-item">
          <a class="sidebar-link" href="/login" aria-expanded="false">
            <span><iconify-icon icon="solar:login-3-bold-duotone" class="fs-6"></iconify-icon></span>
            <span class="hide-menu">Login</span>
          </a>
        </li>
        <li class="sidebar-item">
          <a class="sidebar-link" href="/register" aria-expanded="false">
            <span><iconify-icon icon="solar:user-plus-rounded-bold-duotone" class="fs-6"></iconify-icon></span>
            <span class="hide-menu">Register</span>
          </a>
        </li>
        <li class="nav-small-cap">
          <iconify-icon icon="solar:menu-dots-linear" class="nav-small-cap-icon fs-4"></iconify-icon>
          <span class="hide-menu">EXTRA</span>
        </li>
        <li class="sidebar-item">
          <a class="sidebar-link" href="/icon-tabler" aria-expanded="false">
            <span><iconify-icon icon="solar:sticker-smile-circle-2-bold-duotone" class="fs-6"></iconify-icon></span>
            <span class="hide-menu">Icons</span>
          </a>
        </li>
        <li class="sidebar-item">
          <a class="sidebar-link" href="/sample-page" aria-expanded="false">
            <span><iconify-icon icon="solar:planet-3-bold-duotone" class="fs-6"></iconify-icon></span>
            <span class="hide-menu">Sample Page</span>
          </a>
        </li>
      </ul>
      <div class="unlimited-access hide-menu bg-primary-subtle position-relative mb-7 mt-7 rounded-3"> 
        <div class="d-flex">
          <div class="unlimited-access-title me-3">
            <h6 class="fw-semibold fs-4 mb-6 text-dark w-75">Upgrade to pro</h6>
            <a href="#" target="_blank" class="btn btn-primary fs-2 fw-semibold lh-sm">Buy Pro</a>
          </div>
          <div class="unlimited-access-img">
            <img src="/public/images/backgrounds/rocket.png" alt="" class="img-fluid">
          </div>
        </div>
      </div>
    </nav>
  </div>
</aside>
`;

export const getHeaderHTML = () => `
<header class="app-header">
  <nav class="navbar navbar-expand-lg navbar-light">
    <ul class="navbar-nav">
      <li class="nav-item d-block d-xl-none">
        <a class="nav-link sidebartoggler nav-icon-hover" id="headerCollapse" href="javascript:void(0)">
          <i class="ti ti-menu-2"></i>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link nav-icon-hover" href="javascript:void(0)">
          <i class="ti ti-bell-ringing"></i>
          <div class="notification bg-primary rounded-circle"></div>
        </a>
      </li>
    </ul>
    <div class="navbar-collapse justify-content-end px-0" id="navbarNav">
      <ul class="navbar-nav flex-row ms-auto align-items-center justify-content-end">
        <a href="/" class="btn btn-outline-primary me-2">Back to Home</a>
        <li class="nav-item dropdown">
          <a class="nav-link nav-icon-hover" href="javascript:void(0)" id="drop2" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="/public/images/profile/user-1.jpg" alt="" width="35" height="35" class="rounded-circle">
          </a>
          <div class="dropdown-menu dropdown-menu-end dropdown-menu-animate-up" aria-labelledby="drop2">
            <div class="message-body">
              <a href="javascript:void(0)" class="d-flex align-items-center gap-2 dropdown-item">
                <i class="ti ti-user fs-6"></i>
                <p class="mb-0 fs-3">My Profile</p>
              </a>
              <a href="javascript:void(0)" class="d-flex align-items-center gap-2 dropdown-item">
                <i class="ti ti-mail fs-6"></i>
                <p class="mb-0 fs-3">My Account</p>
              </a>
              <a href="javascript:void(0)" class="d-flex align-items-center gap-2 dropdown-item">
                <i class="ti ti-list-check fs-6"></i>
                <p class="mb-0 fs-3">My Task</p>
              </a>
              <a href="/login" class="btn btn-outline-primary mx-3 mt-2 d-block">Logout</a>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </nav>
</header>
`;

export default { getSidebarHTML, getHeaderHTML };
