/**
 * Express Server for MVC Website EMAS
 * Serving static files and handling routes
 */

import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { testConnection } from "./src/config/database.js";
import apiRoutes from "./src/config/api.js";
import { isAuthenticated, isGuest, isAdmin } from "./src/middleware/auth.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'website-emas-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true di production dengan HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 jam
    }
  })
);

// Static files
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/src", express.static(path.join(__dirname, "src")));

// Route mapping for clean URLs
const routes = {
  "/": "auth/login.html",  // Default route to login

  // Authentication
  "/login": "auth/login.html",
  "/register": "auth/register.html",

  // Dashboard
  "/dashboard": "dashboard.html",
  
  // Marketing Module
  "/simulasi-cicilan": "marketing/simulasi-cicilan.html",
  "/lead-management": "marketing/lead-management.html",
  "/kalkulator-griya": "marketing/kalkulator-griya.html",
  "/kalkulator-premi": "marketing/kalkulator-premi.html",
  
  // Operational Module
  "/calendar-event": "operational/calendar-event.html",
  "/stock-inventaris": "operational/stock-inventaris.html",
  "/rab": "operational/rab.html",
  "/laporan": "operational/laporan.html",
  "/flyer": "operational/flyer.html",

  // Admin Module
  "/management-users": "admin/management-users.html",

  // UI Components
  "/ui-alerts": "ui-components/ui-alerts.html",
  "/ui-buttons": "ui-components/ui-buttons.html",
  "/ui-card": "ui-components/ui-card.html",
  "/ui-forms": "ui-components/ui-forms.html",
  "/ui-typography": "ui-components/ui-typography.html",
  "/icon-tabler": "ui-components/icon-tabler.html",

  // Sample
  "/sample-page": "sample-page.html",
};

// Public routes (tidak perlu login)
const publicRoutes = ["/", "/login", "/register"];

// Admin only routes
const adminOnlyRoutes = ["/management-users"];

// Views directory
const viewsDir = path.join(__dirname, "src", "views", "pages");

// API Routes
app.use('/api', apiRoutes);

// Handle routes dengan authentication check
Object.entries(routes).forEach(([route, file]) => {
  // Tentukan middleware berdasarkan jenis route
  let middleware = [];
  
  if (publicRoutes.includes(route)) {
    // Public routes - guest only untuk login/register
    if (route === "/login" || route === "/register") {
      middleware = [isGuest];
    }
  } else if (adminOnlyRoutes.includes(route)) {
    // Admin only routes
    middleware = [isAuthenticated, isAdmin];
  } else {
    // Protected routes - authentication required
    middleware = [isAuthenticated];
  }

  app.get(route, ...middleware, (req, res) => {
    const filePath = path.join(viewsDir, file);
    console.log(`📄 Serving ${route} → ${filePath}`);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`❌ Error serving ${route}:`, err.message);
        res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head><title>404 - File Not Found</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>404 - File Not Found</h1>
            <p>Cannot find file: ${file}</p>
            <p>Path: ${filePath}</p>
            <a href="/dashboard">Go to Dashboard</a>
          </body>
          </html>
        `);
      }
    });
  });
});

// Also serve .html files directly (for backward compatibility)
app.get("/*.html", (req, res) => {
  const filename = req.path.slice(1); // Remove leading /
  res.sendFile(path.join(viewsDir, filename));
});

// Debug endpoint
app.get("/debug/routes", (req, res) => {
  const routeList = Object.entries(routes).map(([route, file]) => ({
    route,
    file,
    fullPath: path.join(viewsDir, file),
    exists: require('fs').existsSync(path.join(viewsDir, file))
  }));
  
  res.json({
    viewsDir,
    routes: routeList
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head><title>404 Not Found</title></head>
    <body style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/">Go Home</a>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, async () => {
  console.log("");
  console.log("🚀 =============================================");
  console.log("   Website EMAS - MVC Architecture");
  console.log("   =============================================");
  console.log("");
  
  // Test database connection
  await testConnection();
  console.log("");
  
  console.log("   Server running at:");
  console.log(`   → Local:   http://localhost:${PORT}`);
  console.log("");
  console.log("   Available routes:");
  Object.keys(routes).forEach((route) => {
    console.log(`   → http://localhost:${PORT}${route}`);
  });
  console.log("");
  console.log("   Press Ctrl+C to stop");
  console.log("");
});

export default app;
