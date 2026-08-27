# ⚡ TempMail Pro

> **Soft Neobrutalism Temporary Email Scraper & Web Application** with automatic Firebase / Alight Creative login link extraction, 3-digit random username generator (`haidarapis-XXX`), and clean SPA URL routing.

---

## 🌟 Fitur Utama

- 🎨 **Soft Neobrutalism UI**: Desain modern dengan skema warna pastel, border tegas `3px solid #18181b`, bayangan drop shadow tajam, dan 100% Ikon Vektor SVG (tanpa emoji).
- 🔗 **Auto Extract Link Login (Alight Creative / Firebase)**: Memindai dan mendekode *Raw EML Source* (Quoted-Printable) secara otomatis untuk mengekstrak URL login yang terselubung teks (contoh: `https://alight-creative.firebaseapp.com/__/auth/links?...`).
- 🎲 **3-Digit Random Username Generator**: Mengenerate email otomatis dengan format `haidarapis-XXX@domain` (3 digit acak 100-999).
- 🌐 **Short SPA URL Routing**: Dukungan langsung membuka alamat email atau pesan spesifik via URL:
  - `http://localhost:3000/email/haidarapis-380@wzjpj.com`
  - `http://localhost:3000/haidarapis-380@wzjpj.com`
  - `http://localhost:3000/?email=haidarapis-380@wzjpj.com`
- 🟡 **Buka di Tab Baru**: Tombol `Tab Baru` untuk membuka pesan spesifik di tab browser terpisah (`target="_blank"`).
- 🔄 **Realtime Polling Auto Refresh**: Hitung mundur auto refresh 5 detik dengan progres indikator visual non-flicker.
- ⚡ **SEO & Google AI Search Ready**: Dilengkapi dengan Structured Data JSON-LD (`WebApplication` & `FAQPage`), `robots.txt` (mengizinkan `Googlebot` & `Google-Extended`), dan `sitemap.xml`.

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat
- Node.js (v14 atau lebih baru)

### 2. Jalankan Server
```bash
node server.js
```

Aplikasi akan berjalan di:
```text
http://localhost:3000
```

---

## 📂 Struktur File Project

```text
├── mail.js          # Core Scraper Class & Token/Domain Extractor (mailporary.com)
├── server.js        # Backend Server HTTP Native & API Proxy Proxy CORS
├── example.js       # Contoh Penggunaan Module mail.js di Node.js
├── public/
│   ├── index.html   # Frontend Soft Neobrutalism Layout & SEO Meta
│   ├── style.css    # Design System & Styling Rules (Pure Vanilla CSS)
│   ├── app.js       # Client Logic, Auto Refresh & Link Parser
│   ├── favicon.svg  # Favicon Vektor SVG
│   └── logo.svg     # Logo Vektor SVG
├── package.json
└── README.md
```

---

## 📄 Lisensi

MIT License &copy; 2026 TempMail Pro Team
