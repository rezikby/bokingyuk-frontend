// Detail lapangan + slot picker + form booking
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getFieldApi } from "../../api/field";
import { getAvailableSlotsApi, createBookingApi } from "../../api/booking";
import Navbar from "../../components/layout/Navbar";
import Button from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import {
  MapPin,
  Clock,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { formatPrice } from "../../utils/format";
import toast from "react-hot-toast";

const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 8;
  return `${String(h).padStart(2, "0")}:00`;
});

const schema = z.object({
  booking_date: z.string().min(1, "Pilih tanggal"),
  notes: z.string().optional(),
});

// ─── FIX #8 — normalizeTime & hourVal sebagai pure utils di luar komponen ───
/** "08:00:00" → "08:00"  |  "08:00" → "08:00" */
const normalizeTime = (t) => (t ? t.substring(0, 5) : "");

/**
 * Konversi jam ke integer untuk perbandingan mudah.
 * "08:00" → 8, "22:00" → 22
 * FIX #8 — sebelumnya /100 yang rapuh; sekarang parseInt pada bagian jam saja.
 */
const hourToInt = (h) => parseInt(normalizeTime(h).split(":")[0], 10);

export default function FieldDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: fieldData, isLoading } = useQuery({
    queryKey: ["field", id],
    queryFn: () => getFieldApi(id).then((r) => r.data.data),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const bookingDate = watch("booking_date");

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ["slots", id, bookingDate],
    queryFn: () =>
      getAvailableSlotsApi({ field_id: id, date: bookingDate }).then(
        (r) => r.data.data
      ),
    enabled: !!bookingDate,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  // FIX FITUR — bookedSlots normalised sekali di sini, bukan di setiap render
  const bookedSlots = (slotsData?.booked_slots || []).map(normalizeTime);

  /** Apakah jam ini sudah dipesan? */
  const isBooked = useCallback(
    (hour) => bookedSlots.includes(normalizeTime(hour)),
    [bookedSlots]
  );

  /**
   * Apakah ada jam yang terpesan di dalam range [from, to)?
   * Dipakai untuk validasi multi-slot sebelum set endTime.
   */
  const hasBookedInRange = useCallback(
    (from, to) =>
      HOURS.some(
        (h) =>
          hourToInt(h) >= hourToInt(from) &&
          hourToInt(h) < hourToInt(to) &&
          isBooked(h)
      ),
    [isBooked]
  );

  /**
   * FIX #9 — dependency array lengkap; fungsi-fungsi helper di-memoize
   * dengan useCallback agar tidak menjadi dep yang selalu berubah.
   *
   * FIX FITUR — jika polling menemukan slot yang sedang dipilih user
   * sudah dipesan orang lain, pilihan di-reset otomatis.
   */
  useEffect(() => {
    if (!bookedSlots.length) return;

    if (startTime && isBooked(startTime)) {
      toast.error("Slot yang kamu pilih baru saja dipesan orang lain");
      setStartTime(null);
      setEndTime(null);
      return;
    }

    if (startTime && endTime && hasBookedInRange(startTime, endTime)) {
      toast.error("Ada slot dalam pilihanmu yang baru saja dipesan orang lain");
      setStartTime(null);
      setEndTime(null);
    }
  }, [bookedSlots, startTime, endTime, isBooked, hasBookedInRange]);

  // ─── Reset pilihan saat tanggal diganti ────────────────────────────────────
  useEffect(() => {
    setStartTime(null);
    setEndTime(null);
  }, [bookingDate]);

  // ─── Slot click handler ────────────────────────────────────────────────────
  const handleSlotClick = (hour) => {
    if (isBooked(hour)) return;

    // Belum ada start → set start
    if (!startTime) {
      setStartTime(hour);
      setEndTime(null);
      return;
    }

    // Klik ulang start → reset
    if (hour === startTime) {
      setStartTime(null);
      setEndTime(null);
      return;
    }

    // Klik jam sebelum/sama dengan start → geser start
    if (hourToInt(hour) <= hourToInt(startTime)) {
      setStartTime(hour);
      setEndTime(null);
      return;
    }

    // Ada slot booked di antara start dan pilihan → tolak
    if (hasBookedInRange(startTime, hour)) {
      toast.error("Ada slot yang sudah dipesan di rentang waktu ini");
      setStartTime(hour);
      setEndTime(null);
      return;
    }

    // ✅ Valid — set end
    setEndTime(hour);
  };

  // ─── Warna slot ────────────────────────────────────────────────────────────
  const getSlotState = (hour) => {
    if (isBooked(hour)) return "booked";
    if (!startTime) return "available";
    if (hour === startTime) return "selected-start";
    if (
      startTime &&
      endTime &&
      hourToInt(hour) > hourToInt(startTime) &&
      hourToInt(hour) <= hourToInt(endTime)
    )
      return "selected-range";
    return "available";
  };

  /**
   * FIX #8 — durasi dihitung dari selisih jam integer, bukan /100.
   * Hasilnya tetap sama untuk format HH:00, tapi logikanya benar & eksplisit.
   */
  const duration =
    startTime && endTime
      ? hourToInt(endTime) - hourToInt(startTime)
      : 0;

  const totalPrice = fieldData ? duration * fieldData.price_per_hour : 0;

  // ─── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (formData) => {
    if (!startTime || !endTime) {
      toast.error("Pilih waktu mulai dan selesai");
      return;
    }

    // Validasi ulang di frontend sebelum hit API
    if (hasBookedInRange(startTime, endTime)) {
      toast.error("Slot sudah dipesan orang lain, silakan pilih ulang");
      setStartTime(null);
      setEndTime(null);
      return;
    }

    setSubmitting(true);
    try {
      const res = await createBookingApi({
        field_id:     parseInt(id),
        booking_date: formData.booking_date,
        start_time:   startTime,
        end_time:     endTime,
        notes:        formData.notes,
      });
      toast.success("Booking berhasil!");
      navigate(`/bookings/${res.data.data.booking_code}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Booking gagal";
      toast.error(msg);
      // Jika backend menolak karena konflik (409), reset & biarkan
      // polling refresh daftar slot yang terbaru
      if (err.response?.status === 409) {
        setStartTime(null);
        setEndTime(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (isLoading)
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );

  const field = fieldData;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft size={16} /> Kembali
        </button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ── Field info ── */}
          <div>
            <div className="rounded-2xl overflow-hidden h-56 bg-gray-100 mb-4">
              {field?.image_url ? (
                <img
                  src={field.image_url}
                  alt={field.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <MapPin size={48} />
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold mb-1">{field?.name}</h1>
            <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3">
              {field?.type_label || field?.type}
            </span>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {field?.description}
            </p>
            <div className="flex items-center gap-2 text-xl font-bold text-indigo-600 mb-4">
              {field?.price_formatted || formatPrice(field?.price_per_hour)}
              <span className="text-sm font-normal text-gray-500">/ jam</span>
            </div>

            {field?.facilities?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Fasilitas:</p>
                <div className="flex flex-wrap gap-2">
                  {field.facilities.map((f, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 text-xs bg-accent-50 text-accent-700 px-2.5 py-1 rounded-full"
                    >
                      <CheckCircle size={12} /> {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(field?.address || field?.maps_url || field?.latitude) && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Navigation size={14} className="text-indigo-600" /> Lokasi
                </p>
                {field.address && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-start gap-1.5">
                    <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    {field.address}
                  </p>
                )}
                {field.latitude && field.longitude && (
                  <div className="rounded-xl overflow-hidden border h-44 mb-2">
                    <iframe
                      title="Lokasi Lapangan"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${field.latitude},${field.longitude}&z=15&output=embed`}
                    />
                  </div>
                )}
                {field.maps_url && (
                  <a
                    href={field.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-primary-800 font-medium"
                  >
                    <ExternalLink size={12} /> Buka di Google Maps
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ── Booking form ── */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="card p-5 space-y-5 h-fit"
          >
            <h2 className="font-semibold text-lg">Buat Booking</h2>

            {/* Tanggal */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tanggal
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
                {...register("booking_date")}
              />
              {errors.booking_date && (
                <p className="text-xs text-red-500">{errors.booking_date.message}</p>
              )}
            </div>

            {/* Slot picker */}
            {bookingDate && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-500" />
                  <span className="text-sm font-medium">Pilih Jam</span>
                  {slotsLoading ? (
                    <span className="text-xs text-gray-400 animate-pulse">Memuat...</span>
                  ) : (
                    <span className="text-xs text-green-500">● Live</span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {HOURS.map((hour) => {
                    const state = getSlotState(hour);
                    const styles = {
                      booked:
                        "bg-red-100 text-red-400 cursor-not-allowed border-red-200 line-through",
                      "selected-start":
                        "bg-indigo-600 text-white border-primary-600 font-semibold",
                      "selected-range":
                        "bg-primary-100 text-primary-700 border-primary-300",
                      available:
                        "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer",
                    };
                    return (
                      <button
                        key={hour}
                        type="button"
                        disabled={state === "booked"}
                        onClick={() => handleSlotClick(hour)}
                        title={state === "booked" ? "Slot ini sudah dipesan" : `Pilih jam ${hour}`}
                        aria-label={
                          state === "booked"
                            ? `Jam ${hour} sudah dipesan`
                            : `Pilih jam ${hour}`
                        }
                        className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${styles[state]}`}
                      >
                        {hour}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block" />
                    Tersedia
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" />
                    Terpesan
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                    Dipilih
                  </span>
                </div>
              </div>
            )}

            {/* Ringkasan harga */}
            {startTime && endTime && (
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Waktu</span>
                  <span className="font-medium">
                    {startTime} – {endTime}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Durasi</span>
                  <span className="font-medium">{duration} jam</span>
                </div>
                <div className="flex justify-between font-bold text-primary-700 border-t border-primary-200 pt-1.5 mt-1.5">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>
            )}

            {/* Catatan */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Catatan (opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Catatan tambahan..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 resize-none"
                {...register("notes")}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={submitting}
              disabled={!startTime || !endTime || submitting}
            >
              Booking Sekarang
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}