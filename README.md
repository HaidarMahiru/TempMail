<div align="center">

  <img src="public/logo.svg" alt="TempMail Pro Logo" width="480">

  # ⚡ TempMail Pro
  ### High-Performance Soft Neobrutalism Temporary Email Scraper & Web App

  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-v14%2B-brightgreen.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  [![UI Style](https://img.shields.io/badge/Design-Soft_Neobrutalism-ffc6ff.svg?style=for-the-badge)](https://github.com/HaidarMahiru/TempMail)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/HaidarMahiru/TempMail/pulls)

  <p align="center">
    <strong>Aplikasi Web & Library Scraper Email Sementara Tanpa Password dengan Ekstraksi Link Login Otomatis (Firebase / Alight Creative), Generator Username 3 Digit, dan Rute URL Singkat Instan.</strong>
  </p>

  <p align="center">
    <a href="#-fitur-unggulan">Fitur Unggulan</a> •
    <a href="#-cara-instalasi--penggunaan">Cara Penggunaan</a> •
    <a href="#-dokumentasi-api-endpoint">Dokumentasi API</a> •
    <a href="#-struktur-proyek">Struktur Proyek</a> •
    <a href="#-lisensi">Lisensi</a>
  </p>

</div>

---

## 📖 Daftar Isi
- [✨ Fitur Unggulan](#-fitur-unggulan)
- [🎨 Desain & Interface System](#-desain--interface-system)
- [🔍 Ekstraksi Tautan Login Firebase / Alight Creative](#-ekstraksi-tautan-login-firebase--alight-creative)
- [🚀 Cara Instalasi & Penggunaan](#-cara-instalasi--penggunaan)
- [📡 Dokumentasi API Endpoint](#-dokumentasi-api-endpoint)
- [💻 Contoh Penggunaan Library (`mail.js`)](#-contoh-penggunaan-library-mailjs)
- [📁 Struktur Proyek](#-struktur-proyek)
- [🛡️ Fitur SEO & Google AI Optimization](#%EF%B8%8F-fitur-seo--google-ai-optimization)
- [📄 Lisensi](#-lisensi)

---

## ✨ Fitur Unggulan

- 🎨 **Soft Neobrutalism UI**: Tampilan antarmuka modern dengan warna pastel harmonis, garis tepi tebal `3px solid #18181b`, bayangan *hard drop shadow*, dan **100% Ikon Vektor SVG** (tanpa emoji generik).
- 🔗 **Deep EML Source Link Extractor**: Mengunduh dan mendekode pesan *Raw EML Source* (Quoted-Printable) secara otomatis untuk mengambil link login tersembunyi (seperti login Firebase `https://alight-creative.firebaseapp.com/__/auth/action?...`) dan menampilkannya dalam kotak aksi **"Salin Link"** & **"Buka Link"**.
- 🎲 **Generator Username 3 Digit (`haidarapis-XXX`)**: Pembuat alamat email otomatis dengan awalan `haidarapis-` diikuti 3 digit angka acak (100–999) dan pemilihan domain acak otomatis.
- 🌐 **Short SPA URL Routing**: Akses langsung ke kotak masuk email apa saja via URL browser singkat tanpa perlu mengetik ulang:
  - `http://localhost:3000/email/haidarapis-380@wzjpj.com`
  - `http://localhost:3000/haidarapis-380@wzjpj.com`
- 🟡 **Buka di Tab Baru (`target="_blank"`)**: Setiap pesan email dapat dibuka di tab browser terpisah untuk kenyamanan membaca ganda.
- 🔄 **Realtime Polling Auto Refresh**: Hitung mundur auto refresh 5 detik dengan progres bar visual dan mekanisme *smart DOM diffing* bebas kedip (*non-flicker*).
- 📱 **Fully Responsive Layout**: Teroptimasi penuh untuk perangkat HP (mobile-first), tablet, dan desktop.

---

## 🎨 Desain & Interface System

TempMail Pro dibangun mengusung filosofi **Soft Neobrutalism**:

| Elemen UI | Spesifikasi Style |
| :--- | :--- |
| **Color Palette** | Mint (`#b4f8c8`), Pink (`#ffc6ff`), Yellow (`#fbe7c6`), Cyan (`#a0e7e5`), Danger (`#ff9aa2`), Purple (`#e0c3fc`) |
| **Borders** | `3px solid #18181b` (Solid Black Border) |
| **Shadows** | `4px 4px 0px #18181b` (Hard Edge Drop Shadow) |
| **Typography** | `Plus Jakarta Sans` & `Space Grotesk` (Google Fonts) |
| **Icons** | Clean Lucide Vector SVG Icons |

---

## 🔍 Ekstraksi Tautan Login Firebase / Alight Creative

Banyak email verifikasi (seperti link login Firebase Auth dari Alight Creative) mengirimkan tautan login di balik kata-kata seperti `"Login ke Alight Creative"`. Pada pembaca email biasa, link asli tidak muncul atau tidak bisa disalin.

TempMail Pro menyelesaikan masalah ini secara otomatis:
1. Mendownload **Raw EML Source** pesan dari server `mailporary`.
2. Mendekode enkripsi **Quoted-Printable** (`decodeQuotedPrintable`).
3. Mengakses tag `href` asli dan menyajikannya pada kotak **`🔗 TAUTAN LOGIN DITEMUKAN`**:

```html
<!-- Otomatis diekstrak menjadi tombol siap pakai -->
<a href="https://alight-creative.firebaseapp.com/__/auth/links?link=https://alightcreative.com/auth_action/?apiKey=...&mode=signIn&oobCode=...">
  Login ke Alight Creative
</a>
```

---

## 🚀 Cara Instalasi & Penggunaan

### 1. Clone Repository
```bash
git clone https://github.com/HaidarMahiru/TempMail.git
cd TempMail
```

### 2. Jalankan Server Web
```bash
node server.js
```

### 3. Buka di Browser
Akses aplikasi melalui alamat:
```text
http://localhost:3000
```

---

## 📡 Dokumentasi API Endpoint

Backend HTTP server menyediakan REST Proxy Endpoints untuk berinteraksi dengan API `mailporary`:

| Method | Endpoint | Deskripsi | Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/init` | Mengambil token JWT & daftar domain aktif | - |
| `GET` | `/api/create` | Membuat email acak baru / custom | `name` (opsional), `domain` (opsional) |
| `GET` | `/api/inbox` | Mengambil daftar pesan kotak masuk | `email` (wajib) |
| `GET` | `/api/message` | Mengambil detail pesan spesifik | `email` (wajib), `id` (wajib) |
| `GET` | `/api/source` | Mengambil Raw EML Source pesan | `email` (wajib), `id` (wajib) |
| `DELETE` | `/api/inbox` | Mengosongkan seluruh isi kotak masuk | `email` (wajib) |
| `DELETE` | `/api/message` | Menghapus 1 pesan spesifik | `email` (wajib), `id` (wajib) |

---

## 💻 Contoh Penggunaan Library (`mail.js`)

`mail.js` dapat diimpor langsung sebagai module Node.js dalam script bot atau otomatisasi Anda:

```javascript
const { TempMail } = require('./mail');

async function main() {
  const mail = new TempMail();

  // 1. Inisialisasi token & domain
  await mail.init();

  // 2. Set username & domain acak (Misal: haidarapis-742@suarj.com)
  mail.setMail();
  console.log(`Email Aktif: ${mail.getEmail()}`);

  // 3. Ambil pesan kotak masuk
  const inbox = await mail.getInbox();
  console.log(`Total Pesan: ${inbox.length}`);

  // 4. Monitoring email masuk secara otomatis setiap 5 detik
  mail.monitorInbox((messages) => {
    console.log(`Pesan Baru Diterima: ${messages.length} email`);
  }, 5000);
}

main();
```

---

## 📁 Struktur Proyek

```text
TempMail/
├── mail.js              # Core Class Scraper Mailporary API & Token Extractor
├── server.js            # Native Node.js Server HTTP & Proxy API CORS
├── example.js           # Script Contoh Penggunaan Module Node.js
├── package.json         # Konfigurasi Dependencies & Metadata Project
├── README.md            # Dokumentasi Resmi Repository
├── .gitignore           # Git Exclusion Rules
└── public/
    ├── index.html       # HTML5 Semantic Layout, OpenGraph & JSON-LD Schema
    ├── style.css        # Vanilla CSS Design System Soft Neobrutalism
    ├── app.js           # Client Single Page App Logic & Link Parser
    ├── favicon.svg      # Favicon Vektor SVG Custom
    └── logo.svg         # Logo Vektor SVG Custom
```

---

## 🛡️ Fitur SEO & Google AI Optimization

TempMail Pro teroptimasi secara penuh untuk **Google Search Engine** dan **Google AI (SGE & Gemini Search Overviews)**:

- **JSON-LD Structured Data**: Menyertakan skema `@type: WebApplication` dan `@type: FAQPage` untuk hasil pencarian Google Rich Snippets.
- **Robots.txt**: Mendukung crawling lengkap oleh `Googlebot` dan `Google-Extended` (AI Search Crawlers).
- **Sitemap.xml**: Menyediakan peta situs standar di `/sitemap.xml`.
- **Absolute Asset Paths**: Memastikan file CSS & JS selalu dapat dimuat secara sempurna dari rute URL apa pun.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

<div align="center">

  Made with ❤️ by [HaidarMahiru](https://github.com/HaidarMahiru)

  ⭐ **Jika proyek ini bermanfaat, berikan Star pada repository ini!** ⭐

</div>
