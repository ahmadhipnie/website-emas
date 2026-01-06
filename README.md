# Admin Dashboard - MVC Architecture

Template admin yang telah di-refactor menggunakan **Native JavaScript** dengan arsitektur **MVC (Model-View-Controller)**.

## 🎯 Fitur

- ✅ **Native JavaScript** - Tanpa jQuery
- ✅ **MVC Architecture** - Separation of concerns
- ✅ **ES6 Modules** - Modern JavaScript
- ✅ **Reactive** - Event-driven architecture dengan EventBus
- ✅ **Responsive** - Bootstrap 5
- ✅ **Charts** - ApexCharts untuk visualisasi data
- ✅ **Template sama** - UI/UX identik dengan template asli

## 📁 Struktur Folder

```
website-emas/
├── index.html              # Entry point
├── public/                 # Static assets
│   ├── css/               # Styles
│   ├── images/            # Images
│   └── libs/              # Libraries (Bootstrap, ApexCharts, Simplebar)
├── src/                   # Source code
│   ├── app.js            # Application entry point
│   ├── models/           # Data models
│   │   ├── DashboardModel.js
│   │   ├── ChartDataModel.js
│   │   └── NavigationModel.js
│   ├── views/            # View components
│   │   ├── SidebarView.js
│   │   ├── DashboardView.js
│   │   └── components/
│   │       └── ChartView.js
│   ├── controllers/      # Controllers
│   │   ├── SidebarController.js
│   │   └── DashboardController.js
│   ├── services/         # Services
│   │   ├── ApiService.js
│   │   └── StorageService.js
│   ├── utils/            # Utilities
│   │   ├── EventBus.js
│   │   └── helpers.js
│   └── config/           # Configuration
├── admin/                # Template asli (backup)
└── landing/              # Landing page
```

## 🚀 Cara Menjalankan

### Option 1: Live Server (VS Code)

```bash
# Install extension Live Server di VS Code
# Klik kanan index.html -> Open with Live Server
```

### Option 2: Python HTTP Server

```bash
python -m http.server 8000
# Buka browser: http://localhost:8000
```

### Option 3: Node.js HTTP Server

```bash
npx http-server -p 8000
# Buka browser: http://localhost:8000
```

## 🏗️ Arsitektur MVC

### Model

- `DashboardModel.js` - Mengelola data dashboard (stats, metrics)
- `ChartDataModel.js` - Mengelola data untuk charts
- `NavigationModel.js` - Mengelola state navigasi

### View

- `SidebarView.js` - Render dan manage sidebar navigation
- `DashboardView.js` - Render dashboard content
- `ChartView.js` - Render charts dengan ApexCharts

### Controller

- `SidebarController.js` - Menghubungkan SidebarView dengan NavigationModel
- `DashboardController.js` - Menghubungkan DashboardView dengan Models

## 📝 Perbandingan dengan Template Asli

### Template Asli (jQuery)

```javascript
$(function () {
  $("#sidebarnav a").on("click", function (e) {
    // jQuery syntax
  });
});
```

### Template MVC (Native JS)

```javascript
class SidebarController {
  attachEventListeners() {
    const links = document.querySelectorAll("#sidebarnav a");
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        // Native JS
      });
    });
  }
}
```

## 🔧 Utilities

### EventBus

Pub/sub pattern untuk komunikasi antar komponen:

```javascript
import EventBus from './utils/EventBus.js';

// Subscribe
EventBus.on('dashboard:updated', (data) => {
  console.log(data);
});

// Emit
EventBus.emit('dashboard:updated', { stats: {...} });
```

### Helpers

Native JS utilities menggantikan jQuery:

```javascript
import { $, $$, addClass, removeClass } from "./utils/helpers.js";

const element = $("#myId"); // querySelector
const elements = $$(".myClass"); // querySelectorAll
addClass(element, "active"); // classList.add
```

## 🔌 Future Integration

### API Integration

```javascript
import ApiService from "./services/ApiService.js";

// GET request
const { success, data } = await ApiService.get("/api/dashboard");

// POST request
await ApiService.post("/api/users", { name: "John" });
```

### Local Storage

```javascript
import StorageService from "./services/StorageService.js";

// Save data
StorageService.setLocal("user", { name: "John" });

// Get data
const user = StorageService.getLocal("user");
```

## 📦 Dependencies

- **Bootstrap 5** - UI Framework
- **ApexCharts** - Charting library
- **Simplebar** - Custom scrollbar
- **Iconify** - Icon library

## ⚡ Performance

- No jQuery (~30KB saved)
- ES6 Modules (tree-shaking ready)
- Lazy loading support
- Minimal dependencies

## 🎨 Customization

### Menambah Page Baru

1. Buat Model di `src/models/`
2. Buat View di `src/views/`
3. Buat Controller di `src/controllers/`
4. Initialize di `src/app.js`

### Menambah Chart Baru

1. Tambah data di `ChartDataModel.js`
2. Tambah render method di `ChartView.js`
3. Call dari `DashboardController.js`

## 📚 Resources

- [Bootstrap 5 Docs](https://getbootstrap.com/docs/5.3/)
- [ApexCharts Docs](https://apexcharts.com/docs/)
- [MDN JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## 📄 License

Template asli dari AdminMart.com, distributed by ThemeWagon.
Refactored to MVC architecture with Native JavaScript.

---

**Made with ❤️ using Modern JavaScript & MVC Pattern**
