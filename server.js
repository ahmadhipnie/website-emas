/**
 * Express Server for MVC Website EMAS
 * Serving static files and handling routes
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Static files
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/src", express.static(path.join(__dirname, "src")));

// Route mapping for clean URLs
const routes = {
  "/": "index.html",
  "/dashboard": "dashboard.html",
  "/ui-buttons": "ui-buttons.html",
  "/ui-alerts": "ui-alerts.html",
  "/ui-card": "ui-card.html",
  "/ui-forms": "ui-forms.html",
  "/ui-typography": "ui-typography.html",
  "/icon-tabler": "icon-tabler.html",
  "/sample-page": "sample-page.html",
  "/login": "authentication-login.html",
  "/register": "authentication-register.html",
};

// Views directory
const viewsDir = path.join(__dirname, "src", "views", "pages");

// Handle routes
Object.entries(routes).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(viewsDir, file));
  });
});

// Also serve .html files directly (for backward compatibility)
app.get("/*.html", (req, res) => {
  const filename = req.path.slice(1); // Remove leading /
  res.sendFile(path.join(viewsDir, filename));
});

// Fallback for landing page
app.get("/landing", (req, res) => {
  res.sendFile(path.join(__dirname, "landing", "index.html"));
});

// Serve landing assets
app.use("/landing", express.static(path.join(__dirname, "landing")));

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
app.listen(PORT, () => {
  console.log("");
  console.log("🚀 =============================================");
  console.log("   Website EMAS - MVC Architecture");
  console.log("   =============================================");
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
