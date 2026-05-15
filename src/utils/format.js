// Utility: format harga, tanggal, status badge
/**
 * FIX — handle semua format tanggal dari backend:
 *   "2026-05-12"              → "12 Mei 2026"
 *   "2026-05-12 00:00:00"     → "12 Mei 2026"
 *   "2026-05-12T08:00:00.000000Z" → "12 Mei 2026"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  // Ambil 10 karakter pertama yang selalu berformat YYYY-MM-DD
  const datePart = dateStr.substring(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
};

/**
 * FIX — handle semua format waktu dari backend:
 *   "2026-05-12T08:00:00.000000Z" → "08:00"  (ISO 8601 UTC)
 *   "2026-05-12 14:00:00"         → "14:00"  (DATETIME)
 *   "14:00:00"                    → "14:00"  (TIME)
 *   "14:00"                       → "14:00"  (sudah bersih)
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  // ISO 8601: "2026-05-12T08:00:00.000000Z" → ambil jam dari UTC
  if (timeStr.includes('T')) {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
    });
  }
  // DATETIME: "2026-05-12 14:00:00" → ambil bagian waktu
  if (timeStr.includes(' ')) {
    return timeStr.split(' ')[1].slice(0, 5);
  }
  // TIME biasa: "14:00:00" atau "14:00"
  return timeStr.slice(0, 5);
};

export const formatPrice = (price) => {
  if (price === undefined || price === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
};

export const statusBadgeClass = (status) => {
  const map = {
    pending: 'badge-pending', confirmed: 'badge-confirmed',
    checked_in: 'badge-checked_in', completed: 'badge-completed', cancelled: 'badge-cancelled',
    paid: 'badge-paid', unpaid: 'badge-unpaid', expired: 'badge-expired', refunded: 'badge-refunded',
  };
  return map[status] || 'badge-refunded';
};

export const statusLabel = (status) => {
  const map = {
    pending: 'Menunggu', confirmed: 'Dikonfirmasi', checked_in: 'Check-In',
    completed: 'Selesai', cancelled: 'Dibatalkan',
    paid: 'Lunas', unpaid: 'Belum Bayar', expired: 'Kadaluarsa', refunded: 'Refund',
  };
  return map[status] || status;
};

export const fieldTypeLabel = (type) => {
  const map = { futsal: 'Futsal', badminton: 'Badminton', basketball: 'Basketball', tennis: 'Tennis' };
  return map[type] || type;
};