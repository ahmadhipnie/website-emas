# Permission System - Role Based Access Control (Updated)

## Overview
Sistem permission untuk mengatur akses berdasarkan role user. Untuk role **admin**, semua tombol "Tambah" akan di-disable di menu operational dan marketing, **KECUALI Management Users** (admin tetap bisa tambah user).

## ✅ Implementation Summary

### Menu yang DI-DISABLE untuk Admin:
1. ✅ **Lead Management** - Tombol "Tambah Lead" disabled
2. ✅ **Calendar Event** - Tombol "Tambah Event" disabled
3. ✅ **Stock Inventaris** - Tombol "Tambah Inventaris" disabled
4. ✅ **RAB** - Tombol "Tambah RAB" disabled
5. ✅ **Laporan** - Tombol "Tambah Laporan" disabled
6. ✅ **Flyer** - Tombol "Tambah Flyer" disabled

### Menu yang TIDAK DI-DISABLE (Admin masih bisa akses):
- ✅ **Management Users** - Admin tetap bisa tambah user baru

## Files Modified

### 1. Backend - API Endpoint
**File**: `src/config/api.js`
- ✅ Fixed `/api/laporan/rab-list` endpoint (uncommented and removed WHERE filter)
- ✅ Endpoint `GET /api/auth/me` untuk get user info sudah tersedia

### 2. Frontend - Permission System
**File**: `public/js/permissions.js`
- ✅ Updated `disableAddButtons()` untuk skip `#btnAddUser`
- ✅ Added check untuk skip Management Users page by pathname
- ✅ Updated selector list (removed `#btnAddUser` from disabled list)

**Key Changes**:
```javascript
// Skip Management Users button
const addButtonSelectors = [
  // '#btnAddUser',           // TIDAK DI-DISABLE
  '#btnTambahLead',          // DISABLED
  '#btnTambahEvent',         // DISABLED
  '#btnTambahInventaris',    // DISABLED
  '#btnTambahRAB',           // DISABLED
  '#btnTambahLaporan',       // DISABLED
  '#btnTambahFlyer',         // DISABLED
];

// Check if current page is Management Users
const isManagementUsersPage = window.location.pathname.includes('management-users');
if (!isManagementUsersPage) {
  // Disable buttons with "Tambah" text (except btnAddUser)
}
```

### 3. HTML Integration
All pages now include `<script src="/public/js/permissions.js"></script>`:

**Integrated Pages**:
- ✅ `src/views/pages/marketing/lead-management.html`
- ✅ `src/views/pages/operational/calendar-event.html`
- ✅ `src/views/pages/operational/stock-inventaris.html`
- ✅ `src/views/pages/operational/rab.html`
- ✅ `src/views/pages/operational/laporan.html`
- ✅ `src/views/pages/operational/flyer.html`
- ✅ `src/views/pages/admin/management-users.html` (permission loaded but not applied to btnAddUser)

### 4. JavaScript Updates
**File**: `public/js/management-users.js`
- ✅ Removed permission check dari button click handler
- ✅ Admin sekarang bisa langsung klik tombol tanpa alert

## How It Works

### Flow Diagram:
```
User Login → Session with role
    ↓
Page Load → permissions.js load
    ↓
DOMContentLoaded → loadCurrentUser()
    ↓
GET /api/auth/me → Get user role
    ↓
applyPermissions()
    ↓
Check if role === 'admin'
    ↓
YES → disableAddButtons()
    ↓
Skip #btnAddUser (Management Users)
    ↓
Disable all other "Tambah" buttons
```

### Button Detection:
1. **By ID**: `#btnTambahLead`, `#btnTambahEvent`, dll
2. **By Text**: Semua button dengan text "Tambah" (kecuali di Management Users page)
3. **By Class**: `.btn-tambah`, `[data-action="add"]`

### Visual Effect for Disabled Buttons:
```css
opacity: 0.5;
cursor: not-allowed;
disabled: true;
title: "Admin tidak memiliki akses untuk menambah data"
```

## Testing Guide

### Test Case 1: Admin Role
1. Login dengan user role `admin`
2. Navigate ke **Lead Management**
   - ✅ Tombol "Tambah Lead" harus disabled (semi-transparan, not-clickable)
3. Navigate ke **Stock Inventaris**
   - ✅ Tombol "Tambah Inventaris" harus disabled
4. Navigate ke **RAB**
   - ✅ Tombol "Tambah RAB" harus disabled
5. Navigate ke **Laporan**
   - ✅ Tombol "Tambah Laporan" harus disabled
6. Navigate ke **Flyer**
   - ✅ Tombol "Tambah Flyer" harus disabled
7. Navigate ke **Calendar Event**
   - ✅ Tombol "Tambah Event" harus disabled
8. Navigate ke **Management Users**
   - ✅ Tombol "Tambah User" harus **ENABLED** (normal, clickable)

### Test Case 2: User/Superadmin Role
1. Login dengan role `user` atau `superadmin`
2. Navigate ke semua menu
   - ✅ Semua tombol "Tambah" harus enabled
   - ✅ Dapat menambah data di semua menu

## Console Logs

Saat halaman dibuka dengan role admin:
```
🔐 Initializing Permission System...
👤 Current User: {role: "admin", nama: "Admin User", email: "admin@example.com"}
🔐 Applying permissions for role: admin
🚫 Disabled button: #btnTambahLead
🚫 Disabled button: #btnTambahEvent
🚫 Disabled button: #btnTambahInventaris
🚫 Disabled button: #btnTambahRAB
🚫 Disabled button: #btnTambahLaporan
🚫 Disabled button: #btnTambahFlyer
🚫 Disabled button with "Tambah" text: btnTambahSomething
✅ All add buttons disabled for admin role (except Management Users)
```

## API Endpoints

### Get Current User
```
GET /api/auth/me
Authorization: Required (isAuthenticated middleware)

Response:
{
  "success": true,
  "data": {
    "id_user": 1,
    "nama": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Get RAB List for Dropdown
```
GET /api/laporan/rab-list
Authorization: Required (isAuthenticated middleware)

Response:
{
  "success": true,
  "data": [
    {
      "id_rab": 1,
      "nama_kegiatan": "Renovasi Kantor",
      "anggaran": 50000000,
      "status": "Disetujui"
    }
  ]
}
```

## Database Structure

Table `users` dengan kolom `role`:
```sql
CREATE TABLE users (
  id_user INT PRIMARY KEY AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user', 'superadmin') DEFAULT 'user',
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Future Enhancements

1. **Granular Permissions**: Permission matrix per menu/action
2. **Backend Validation**: Validate role di setiap POST endpoint
3. **Permission Groups**: Group permissions untuk role khusus
4. **Audit Log**: Track permission checks dan violations
5. **Dynamic Permissions**: Load permissions from database

## Notes

- ✅ Admin role = **view-only** untuk operational/marketing add operations
- ✅ Admin role = **full access** untuk Management Users
- ✅ Admin can still **edit** and **delete** existing data (not restricted)
- ✅ Session-based authentication dengan `express-session`
- ✅ Permission check di client-side untuk UX improvement
- ✅ Backend API protected dengan `isAuthenticated` middleware

## Quick Commands

**Restart Server**:
```bash
taskkill /F /IM node.exe; node server.js
```

**Test Permission System**:
```bash
# Login sebagai admin
# Buka: http://localhost:3000/lead-management
# Tombol "Tambah Lead" harus disabled

# Buka: http://localhost:3000/management-users
# Tombol "Tambah User" harus enabled
```

## Support

Jika ada masalah dengan permission system:
1. Check Console (F12) untuk error messages
2. Verify user role di `/api/auth/me`
3. Clear browser cache dan hard refresh (Ctrl+F5)
4. Restart server jika ada perubahan di `permissions.js`
