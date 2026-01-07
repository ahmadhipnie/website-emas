/**
 * SPA Router - Smooth Page Transitions
 * Load pages without full refresh
 */
(function () {
  "use strict";

  let isNavigating = false;

  document.addEventListener("DOMContentLoaded", function () {
    initSPARouter();
  });

  function initSPARouter() {
    // Set active menu on initial load
    setActiveMenu(window.location.pathname);

    // Intercept all sidebar link clicks
    document.addEventListener("click", function (e) {
      const link = e.target.closest("#sidebarnav a");
      
      if (link && !link.classList.contains("has-arrow")) {
        e.preventDefault();
        
        if (isNavigating) return;
        
        const href = link.getAttribute("href");
        if (href && href !== "#") {
          navigateToPage(href);
        }
      }
    });

    // Handle browser back/forward buttons
    window.addEventListener("popstate", function (e) {
      if (e.state && e.state.path) {
        loadPage(e.state.path, false);
      }
    });
  }

  /**
   * Navigate to a new page
   */
  function navigateToPage(path) {
    if (window.location.pathname === path) return;
    
    // Push to browser history
    history.pushState({ path: path }, "", path);
    
    // Load the page
    loadPage(path, true);
  }

  /**
   * Load page content via AJAX
   */
  async function loadPage(path, updateMenu = true) {
    if (isNavigating) return;
    
    isNavigating = true;
    const contentArea = document.querySelector(".body-wrapper");
    
    if (!contentArea) {
      // Fallback to full page reload if body-wrapper not found
      window.location.href = path;
      return;
    }

    try {
      // Add loading indicator
      showLoadingIndicator(contentArea);

      // Fetch the new page
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      
      // Parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      
      // Extract new content
      const newContent = doc.querySelector(".body-wrapper");
      const newTitle = doc.querySelector("title");
      
      if (newContent) {
        // Fade out
        contentArea.style.opacity = "0";
        
        await sleep(200);
        
        // Update content
        contentArea.innerHTML = newContent.innerHTML;
        
        // Update page title
        if (newTitle) {
          document.title = newTitle.textContent;
        }
        
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: "smooth" });
        
        // Fade in
        contentArea.style.opacity = "1";
        
        // Update active menu
        if (updateMenu) {
          setActiveMenu(path);
        }
        
        // Dispatch custom event untuk page loaded
        const pageLoadedEvent = new CustomEvent('spa:pageLoaded', {
          detail: { path: path }
        });
        document.dispatchEvent(pageLoadedEvent);
        console.log('🚀 SPA page loaded:', path);
        
      } else {
        throw new Error("Content not found");
      }
      
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback to full page reload on error
      window.location.href = path;
    } finally {
      isNavigating = false;
    }
  }

  /**
   * Show loading indicator
   */
  function showLoadingIndicator(container) {
    container.style.opacity = "0.5";
  }

  /**
   * Set active menu item
   */
  function setActiveMenu(path) {
    const allLinks = document.querySelectorAll("#sidebarnav a");

    allLinks.forEach(function (link) {
      const href = link.getAttribute("href");
      
      // Remove active class
      link.classList.remove("active");
      const parentLi = link.closest(".sidebar-item");
      if (parentLi) {
        parentLi.classList.remove("active");
      }

      // Add active to matching link
      if (href === path) {
        link.classList.add("active");
        if (parentLi) {
          parentLi.classList.add("active");
        }
      }
    });
  }

  /**
   * Sleep utility
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle mobile sidebar toggle
   */
  function handleSidebarToggle() {
    const togglers = document.querySelectorAll(".sidebartoggler, #sidebarCollapse");
    togglers.forEach(function (toggler) {
      toggler.addEventListener("click", function () {
        document.body.classList.toggle("show-sidebar");
      });
    });
  }

  // Initialize sidebar toggle
  handleSidebarToggle();
})();
