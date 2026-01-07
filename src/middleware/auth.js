/**
 * Authentication Middleware
 * Middleware untuk proteksi route yang memerlukan authentication
 */

/**
 * Check if user is authenticated
 */
export function isAuthenticated(req, res, next) {
  console.log('🔐 isAuthenticated - Path:', req.path, '- Session:', req.session?.user ? 'EXISTS' : 'NONE');
  
  if (req.session && req.session.user) {
    return next();
  }

  // Jika request dari API, return JSON
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({
      success: false,
      message: 'Anda harus login terlebih dahulu',
      isAuthenticated: false
    });
  }

  // Jika request halaman HTML, redirect ke login
  res.redirect('/login');
}

/**
 * Check if user is admin
 */
export function isAdmin(req, res, next) {
  console.log('👤 isAdmin - User:', req.session?.user?.nama, '- Role:', req.session?.user?.role);
  
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }

  // Jika request dari API, return JSON
  if (req.path.startsWith('/api/')) {
    return res.status(403).json({
      success: false,
      message: 'Anda tidak memiliki akses ke resource ini',
      isAuthenticated: !!req.session.user
    });
  }

  // Jika request halaman HTML, redirect ke dashboard dengan error
  res.redirect('/dashboard?error=forbidden');
}

/**
 * Check if user is already logged in (untuk login page)
 */
export function isGuest(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
}

/**
 * Optional authentication - tidak redirect jika tidak login
 */
export function optionalAuth(req, res, next) {
  // Set req.user jika ada session
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
}
