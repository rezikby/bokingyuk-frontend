# BokinYuk — Frontend

Aplikasi booking lapangan olahraga berbasis React + Vite + TailwindCSS.

## 🚀 Cara Menjalankan

### 1. Install Dependencies
```bash
npm install
```

### 2. Konfigurasi Backend URL
Buka file `.env` lalu sesuaikan URL backend Laravel kamu:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 3. Jalankan Development Server
```bash
npm run dev
```
Buka browser di: **http://localhost:3000**

### 4. Build untuk Production
```bash
npm run build
```
Hasil build ada di folder `dist/`.

---

## ⚙️ Menjalankan Backend Laravel

```bash
cd backend_new
composer install
# Edit .env: isi DB_DATABASE, DB_PASSWORD, MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

---

## 📁 Struktur Frontend

```
src/
├── api/           # Auth, Booking, Field, Report API
├── components/    # Layout + UI components
├── contexts/      # AuthContext
├── lib/           # axios, queryClient
├── pages/
│   ├── auth/      # Login, Register
│   ├── admin/     # Dashboard, Fields, Bookings, CheckIn, Reports
│   ├── customer/  # Home, FieldDetail, BookingList, BookingDetail, Payment
│   └── NotFound.jsx  ← Halaman 404
├── routes/        # App routing dengan guard
└── utils/         # Format helpers
```

---

## 🔑 Akun Default

| Role    | Email               | Password |
|---------|---------------------|----------|
| Admin   | admin@bokingyuk.com | password |
| Customer| user@bokingyuk.com  | password |

---

## 📄 Daftar Halaman

| URL                  | Keterangan                    |
|----------------------|-------------------------------|
| `/login`             | Halaman masuk                 |
| `/register`          | Halaman daftar                |
| `/`                  | Beranda (daftar lapangan)     |
| `/fields/:id`        | Detail lapangan + booking     |
| `/bookings`          | Riwayat booking               |
| `/bookings/:code`    | Detail booking + QR           |
| `/payment/:code`     | Pembayaran Midtrans           |
| `/admin`             | Dashboard admin               |
| `/admin/fields`      | CRUD lapangan                 |
| `/admin/bookings`    | Manajemen booking             |
| `/admin/check-in`    | QR scanner check-in           |
| `/admin/reports`     | Revenue & jam ramai           |
| `/*`                 | **Halaman 404**               |
# BokingYuk_Frontend
# BokingYuk_Frontend
