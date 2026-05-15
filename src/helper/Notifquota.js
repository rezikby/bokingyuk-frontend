// src/lib/notifQuota.js
// ─────────────────────────────────────────────────────────────────────────────
// Helper: Rate limit notifikasi toast per hari
// Maksimal DAILY_MAX notifikasi (gabungan Pengaduan + Request Admin) per hari.
// Badge sidebar tidak terpengaruh — tetap akurat.
// Reset otomatis setiap ganti hari (midnight).
// ─────────────────────────────────────────────────────────────────────────────

const QUOTA_KEY = 'notif_daily_quota';
const DAILY_MAX = 15;

/** Format tanggal hari ini → "2026-05-12" */
function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Baca quota dari localStorage, reset otomatis kalau sudah ganti hari */
function readQuota() {
  try {
    const raw   = localStorage.getItem(QUOTA_KEY);
    const quota = raw ? JSON.parse(raw) : {};
    const today = getTodayKey();

    // Ganti hari → reset count ke 0
    if (quota.date !== today) {
      return { date: today, count: 0 };
    }

    return { date: today, count: quota.count ?? 0 };
  } catch {
    return { date: getTodayKey(), count: 0 };
  }
}

/** Tulis quota ke localStorage */
function writeQuota(quota) {
  try {
    localStorage.setItem(QUOTA_KEY, JSON.stringify(quota));
  } catch {
    // localStorage penuh atau private mode — abaikan
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Cek apakah masih boleh tampilkan notifikasi hari ini.
 * @returns {boolean}
 */
export function canShowNotif() {
  const { count } = readQuota();
  return count < DAILY_MAX;
}

/**
 * Kurangi sisa quota sebesar 1.
 * Panggil SETELAH notifikasi berhasil ditampilkan.
 */
export function consumeNotifQuota() {
  const quota = readQuota();
  writeQuota({ ...quota, count: quota.count + 1 });
}

/**
 * Berapa sisa notifikasi yang boleh tampil hari ini.
 * @returns {number} 0–15
 */
export function getRemainingQuota() {
  const { count } = readQuota();
  return Math.max(0, DAILY_MAX - count);
}

/**
 * Berapa notifikasi yang sudah tampil hari ini.
 * @returns {number}
 */
export function getUsedQuota() {
  const { count } = readQuota();
  return Math.min(count, DAILY_MAX);
}

/**
 * Reset manual quota (untuk kebutuhan testing / tombol debug).
 */
export function resetQuota() {
  writeQuota({ date: getTodayKey(), count: 0 });
}