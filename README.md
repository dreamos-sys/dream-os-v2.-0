# 🏰 Dream OS v2.0 — The Power Soul of Shalayat

[![PWA](https://img.shields.io/badge/PWA-Ready-10b981?style=for-the-badge&logo=pwa)](https://dreamos-sys.github.io/dream-os-v2.-0/)
[![License](https://img.shields.io/badge/License-MIT-34d399?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-06b6d4?style=for-the-badge)](https://github.com/dreamos-sys/dream-os-v2.-0/releases)
[![ISO 27001](https://img.shields.io/badge/ISO-27001_Aligned-f59e0b?style=for-the-badge&logo=iso)](https://www.iso.org/isoiec-27001-information-security.html)

> **Integrated Management System with Spiritual Wellness**  
> 🕌 Auto Shalat · 💎 Liquid Crystal UI · 🔐 Enterprise Security

---

## 📖 Table of Contents

- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Modules](#-modules)
- [Security](#-security)
- [Privacy](#-privacy)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## ✨ Features

### 🕌 Spiritual Integration
- ✅ **Auto Prayer Times** — Background changes 5x daily (Subuh, Dzuhur, Ashar, Maghrib, Isya)
- ✅ **Bismillah & Shalawat** — Spiritual reminder on every screen
- ✅ **Qibla Direction** — Coming soon
- ✅ **Tasbih Counter** — Coming soon

### 💼 Enterprise Modules
| Module | Description | Access Level |
|--------|-------------|--------------|
| 📊 **Command Center** | System control & monitoring | LIMITED |
| 📅 **Booking** | Room & facility reservation | All Users |
| ⚠️ **K3** | Safety & health reports | All Users |
| 🛡️ **Sekuriti** | Security logs & patrols | Security Role |
| 🧹 **Janitor In/Out** | Indoor/outdoor cleaning | Janitor Role |
| 📦 **Stok** | Equipment & inventory | Stock Role |
| 🔧 **Maintenance** | Repair & damage reports | Maintenance Role |
| 🏢 **Asset** | Asset management | Asset Role |

### 🎨 UI/UX- ✅ **Light/Dark Mode** — Auto-switch based on preference
- ✅ **Multi-Language** — Arabic (AR), English (EN), Indonesian (ID)
- ✅ **Responsive Design** — Mobile-first, tablet & desktop support
- ✅ **Offline-First** — Service Worker with intelligent caching
- ✅ **PWA Installable** — Add to home screen on Android/iOS

### 🔐 Security
- ✅ **SHA-256 Hashing** — Passwords hashed with pepper
- ✅ **Rate Limiting** — 5 attempts → 15min lockout
- ✅ **CSP Headers** — Strict Content Security Policy
- ✅ **Role-Based Access** — Developer, Master, Admin, etc.
- ✅ **Audit Logs** — All actions tracked

---

## 📸 Screenshots

| Home Screen | Module Grid | Prayer Background |
|-------------|-------------|-------------------|
| ![Home](screenshots/home-mobile.png) | ![Modules](screenshots/modules.png) | ![Prayer](screenshots/prayer-bg.png) |

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Styling** | Tailwind CSS (CDN) |
| **Icons** | Font Awesome 6.4.0 |
| **Fonts** | Google Fonts (Amiri, Rajdhani, JetBrains Mono) |
| **Database** | Supabase (PostgreSQL) |
| **Backend** | Cloudflare Workers (API config) |
| **PWA** | Service Worker, Web App Manifest |
| **Security** | DOMPurify (XSS prevention), SHA-256 (hashing) |
| **Hosting** | GitHub Pages (HTTPS) |
| **Deployment** | Bubblewrap (TWA for Play Store) |

---

## 📦 Installation

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/dreamos-sys/dream-os-v2.-0.git
cd dream-os-v2.-0

# 2. Open in browser (no build step required)# Option A: Direct file open
open index.html

# Option B: Local server (recommended)
npx http-server -p 3000
# Visit: http://localhost:3000
```

### Production Deployment

```bash
# 1. Deploy to GitHub Pages
git push origin main

# 2. Enable GitHub Pages
# Settings → Pages → Source: main branch → Save

# 3. Access live URL
# https://dreamos-sys.github.io/dream-os-v2.-0/
```

### Play Store (TWA)

```bash
# 1. Install Bubblewrap
npm install -g @bubblewrap/cli

# 2. Initialize TWA project
bubblewrap init --manifest https://dreamos-sys.github.io/dream-os-v2.-0/manifest.json

# 3. Build APK
bubblewrap build

# 4. Test on device
bubblewrap install

# 5. Submit to Play Store
# Follow Google Play Console submission process
```

---

## 🚀 Usage

### Login Credentials (Demo)

| Password | Role | Access |
|----------|------|--------|
| `012443410` | DEVELOPER | All Modules |
| `mr.m_architect_2025` | MASTER | All Modules || `4dm1n_af6969@00` | ADMIN | All Modules |
| `test` | TESTER | Booking + K3 |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Login / Submit Form |
| `Esc` | Close Module |
| `Ctrl+L` | Toggle Theme |
| `Ctrl+K` | Search Modules |

---

## 🧩 Modules Architecture
