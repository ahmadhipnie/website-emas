/**
 * Dashboard Flyer Carousel
 * Auto-sliding carousel dengan manual navigation
 */

let flyerData = [];
let currentSlide = 0;
let autoSlideInterval = null;
const AUTO_SLIDE_DELAY = 5000; // 5 detik

/**
 * Load flyer data dari API
 */
async function loadFlyerData() {
  try {
    const response = await fetch('/api/flyer/public');
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      flyerData = result.data;
      renderFlyerCarousel();
      startAutoSlide();
    } else {
      // Jika tidak ada data, tampilkan default content
      renderEmptyState();
    }
  } catch (error) {
    console.error('Error loading flyer data:', error);
    renderEmptyState();
  }
}

/**
 * Inject CSS needed for horizontal (portrait) flyer styling
 */
function ensureHorizontalStyles() {
  if (document.getElementById('horizontal-carousel-styles')) return;
  const css = `
    /* Portrait flyer - taller and slightly wider */
    .flyer-portrait { width: 105%; transform: translateX(-2.5%); height: 820px; object-fit: cover; border-radius: 8px; display: block; }
    @media (max-width: 992px) { .flyer-portrait { height: 680px; } }
    @media (max-width: 768px) { .flyer-portrait { height: 560px; } }
    @media (max-width: 576px) { .flyer-portrait { height: 420px; } }
    .carousel-item .card { min-height: unset; overflow: hidden; }
    .carousel-indicators { bottom: 10px; }
  `;
  const style = document.createElement('style');
  style.id = 'horizontal-carousel-styles';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
}

/**
 * Go to a specific slide (index) using Bootstrap Carousel
 */
function goToSlide(index) {
  const carouselEl = document.getElementById('flyerCarousel');
  if (!carouselEl) return;
  const carousel = bootstrap.Carousel.getInstance(carouselEl) || new bootstrap.Carousel(carouselEl, { interval: false, ride: false });
  const slides = Math.ceil(flyerData.length / 3) || 0;
  if (slides === 0) return;
  if (index < 0) index = slides - 1;
  if (index >= slides) index = 0;
  currentSlide = index;
  carousel.to(index);
}

/**
 * Render carousel dengan data flyer
 */
function renderFlyerCarousel() {
  const container = document.getElementById('flyer-carousel-container');
  if (!container) return;

  ensureHorizontalStyles();

  // Group flyers into slides of 3 items each
  const perSlide = 3;
  const slides = [];
  for (let i = 0; i < flyerData.length; i += perSlide) {
    slides.push(flyerData.slice(i, i + perSlide));
  }

  let carouselHTML = `
    <div class="row">
      <div class="col-12">
        <div class="position-relative">
          <div id="flyerCarousel" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-indicators">
              ${slides.map((_, index) => `<button type="button" data-bs-target="#flyerCarousel" data-bs-slide-to="${index}" ${index === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${index + 1}"></button>`).join('')}
            </div>

            <div class="carousel-inner">
              ${slides.map((group, sIndex) => `
                <div class="carousel-item ${sIndex === 0 ? 'active' : ''}">
                  <div class="row g-3">
                    ${group.map((flyer) => `
                      <div class="col-12 col-sm-6 col-md-4">
                        <div class="card overflow-hidden h-100">
                          <img src="${flyer.gambar}" alt="${flyer.nama}" class="flyer-portrait" loading="lazy">
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>

            <button class="carousel-control-prev" type="button" data-bs-target="#flyerCarousel" data-bs-slide="prev">
              <span class="carousel-control-prev-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#flyerCarousel" data-bs-slide="next">
              <span class="carousel-control-next-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Next</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = carouselHTML;

  // Setup event listeners for pause on hover and slide change
  const carouselEl = document.getElementById('flyerCarousel');
  if (carouselEl) {
    carouselEl.addEventListener('mouseenter', pauseAutoSlide);
    carouselEl.addEventListener('mouseleave', startAutoSlide);
    carouselEl.addEventListener('slid.bs.carousel', function(e) {
      if (typeof e.to === 'number') {
        currentSlide = e.to;
      } else {
        const active = carouselEl.querySelector('.carousel-item.active');
        currentSlide = Array.from(carouselEl.querySelectorAll('.carousel-item')).indexOf(active);
      }
      restartAutoSlide();
    });
  }

  // Initialize Bootstrap Carousel instance
  const carousel = bootstrap.Carousel.getInstance(carouselEl) || new bootstrap.Carousel(carouselEl, { interval: false, ride: false });
}

/**
 * Render empty state jika tidak ada flyer
 */
function renderEmptyState() {
  const container = document.getElementById('flyer-carousel-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="row">
      <div class="col-lg-4">
        <div class="card overflow-hidden hover-img">
          <div class="position-relative">
            <img src="/public/images/blog/blog-img1.jpg" class="card-img-top" alt="Blog image" />
            <span class="badge text-bg-light text-dark fs-2 lh-sm mb-9 me-9 py-1 px-2 fw-semibold position-absolute bottom-0 end-0">
              2 min Read
            </span>
            <img src="/public/images/profile/user-3.jpg" alt="Profile" 
              class="img-fluid rounded-circle position-absolute bottom-0 start-0 mb-n9 ms-9"
              width="40" height="40" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Georgeanna Ramero" />
          </div>
          <div class="card-body p-4">
            <span class="badge text-bg-light fs-2 py-1 px-2 lh-sm mt-3">Social</span>
            <a class="d-block my-4 fs-5 text-dark fw-semibold link-primary" href="#">
              As yen tumbles, gadget-loving Japan goes for secondhand iPhones
            </a>
            <div class="d-flex align-items-center gap-4">
              <div class="d-flex align-items-center gap-2">
                <i class="ti ti-eye text-dark fs-5"></i>9,125
              </div>
              <div class="d-flex align-items-center gap-2">
                <i class="ti ti-message-2 text-dark fs-5"></i>3
              </div>
              <div class="d-flex align-items-center fs-2 ms-auto">
                <i class="ti ti-point text-dark"></i>Mon, Dec 19
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="card overflow-hidden hover-img">
          <div class="position-relative">
            <img src="/public/images/blog/blog-img2.jpg" class="card-img-top" alt="Blog image" />
            <span class="badge text-bg-light text-dark fs-2 lh-sm mb-9 me-9 py-1 px-2 fw-semibold position-absolute bottom-0 end-0">
              2 min Read
            </span>
            <img src="/public/images/profile/user-2.jpg" alt="Profile" 
              class="img-fluid rounded-circle position-absolute bottom-0 start-0 mb-n9 ms-9"
              width="40" height="40" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Georgeanna Ramero" />
          </div>
          <div class="card-body p-4">
            <span class="badge text-bg-light fs-2 py-1 px-2 lh-sm mt-3">Gadget</span>
            <a class="d-block my-4 fs-5 text-dark fw-semibold link-primary" href="#">
              Intel loses bid to revive antitrust case against patent foe Fortress
            </a>
            <div class="d-flex align-items-center gap-4">
              <div class="d-flex align-items-center gap-2">
                <i class="ti ti-eye text-dark fs-5"></i>4,150
              </div>
              <div class="d-flex align-items-center gap-2">
                <i class="ti ti-message-2 text-dark fs-5"></i>38
              </div>
              <div class="d-flex align-items-center fs-2 ms-auto">
                <i class="ti ti-point text-dark"></i>Sun, Dec 18
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="card overflow-hidden hover-img">
          <div class="position-relative">
            <img src="/public/images/blog/blog-img3.jpg" class="card-img-top" alt="Blog image" />
            <span class="badge text-bg-light text-dark fs-2 lh-sm mb-9 me-9 py-1 px-2 fw-semibold position-absolute bottom-0 end-0">
              2 min Read
            </span>
            <img src="/public/images/profile/user-3.jpg" alt="Profile" 
              class="img-fluid rounded-circle position-absolute bottom-0 start-0 mb-n9 ms-9"
              width="40" height="40" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Georgeanna Ramero" />
          </div>
          <div class="card-body p-4">
            <span class="badge text-bg-light fs-2 py-1 px-2 lh-sm mt-3">Health</span>
            <a class="d-block my-4 fs-5 text-dark fw-semibold link-primary" href="#">
              COVID outbreak deepens as more lockdowns loom in China
            </a>
            <div class="d-flex align-items-center gap-4">
              <div class="d-flex align-items-center gap-2">
                <i class="ti ti-eye text-dark fs-5"></i>9,480
              </div>
              <div class="d-flex align-items-center gap-2">
                <i class="ti ti-message-2 text-dark fs-5"></i>12
              </div>
              <div class="d-flex align-items-center fs-2 ms-auto">
                <i class="ti ti-point text-dark"></i>Sat, Dec 17
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Start auto-slide interval
 */
function startAutoSlide() {
  const slideCount = Math.ceil(flyerData.length / 3) || 0;
  if (slideCount <= 1) return; // No need to auto-slide if only one slide

  pauseAutoSlide(); // Clear existing interval

  autoSlideInterval = setInterval(() => {
    const carouselEl = document.getElementById('flyerCarousel');
    if (!carouselEl) return;
    const carousel = bootstrap.Carousel.getInstance(carouselEl) || new bootstrap.Carousel(carouselEl, { interval: false, ride: false });
    if (carousel) {
      carousel.next();
    }
  }, AUTO_SLIDE_DELAY);
}

/**
 * Pause auto-slide
 */
function pauseAutoSlide() {
  if (autoSlideInterval) {
    clearInterval(autoSlideInterval);
    autoSlideInterval = null;
  }
}

/**
 * Restart auto-slide (used after manual navigation)
 */
function restartAutoSlide() {
  pauseAutoSlide();
  setTimeout(() => {
    startAutoSlide();
  }, AUTO_SLIDE_DELAY);
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', function() {
  loadFlyerData();
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
  pauseAutoSlide();
});
