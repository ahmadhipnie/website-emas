/*
 * Sidebar Menu - Website EMAS
 * Simple navigation handler
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    setActiveMenu();
    handleSidebarToggle();
  });

  function setActiveMenu() {
    const currentPath = window.location.pathname;
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
      if (href === currentPath) {
        link.classList.add("active");
        if (parentLi) {
          parentLi.classList.add("active");
        }
      }
    });
  }

  function handleSidebarToggle() {
    const togglers = document.querySelectorAll(".sidebartoggler, #sidebarCollapse");
    togglers.forEach(function (toggler) {
      toggler.addEventListener("click", function () {
        document.body.classList.toggle("show-sidebar");
      });
    });
  }
})();
