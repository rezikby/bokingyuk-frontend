// Halaman utama customer: daftar lapangan + filter + search + cover + lokasi

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { getFieldsApi } from '../../api/field';

import Navbar from '../../components/layout/Navbar';
import { CardSkeleton } from '../../components/ui/Skeleton';

import {
  MapPin,
  Search,
  SlidersHorizontal,
  ExternalLink,
  Image,
  Navigation,
  Loader2,
} from 'lucide-react';

import { formatPrice } from '../../utils/format';

const TYPES = [
  { value: '', label: 'Semua' },
  { value: 'futsal', label: 'Futsal' },
  { value: 'badminton', label: 'Badminton' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'tennis', label: 'Tennis' },
];

const TYPE_GRADIENT = {
  futsal: 'from-green-400 to-emerald-600',
  badminton: 'from-blue-400 to-cyan-600',
  basketball: 'from-orange-400 to-amber-600',
  tennis: 'from-yellow-400 to-lime-600',
};

// jarak antar dua titik koordinat (latitude, longitude) dalam km
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────
// FORMAT JARAK
// ─────────────────────────────────────────────
function formatKm(km) {
  if (
    km === null ||
    km === undefined ||
    Number.isNaN(km)
  ) {
    return '-';
  }

  return km < 1
    ? `${Math.round(km * 1000)} m`
    : `${km.toFixed(1)} km`;
}

export default function Home() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [distanceSort, setDistanceSort] =
    useState('nearest');

  // ─────────────────────────────────────────────
  // GEOLOCATION
  // ─────────────────────────────────────────────
  const [userCoords, setUserCoords] =
    useState(null);

  const [geoLoading, setGeoLoading] =
    useState(false);

  const [geoError, setGeoError] =
    useState(null);

  // ─────────────────────────────────────────────
  // REQUEST LOKASI
  // ─────────────────────────────────────────────
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(
        'Browser tidak mendukung geolocation.'
      );
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });

        setGeoLoading(false);
      },

      () => {
        setGeoError(
          'Izin lokasi ditolak. Aktifkan lokasi browser.'
        );

        setGeoLoading(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  // AUTO DETECT LOKASI
  useEffect(() => {
    requestLocation();
  }, []);

  // ─────────────────────────────────────────────
  // API
  // ─────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['fields', { type }],

    queryFn: () =>
      getFieldsApi(type ? { type } : {}).then(
        (r) => r.data.data
      ),

    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  // ─────────────────────────────────────────────
  // DATA LAPANGAN AKTIF
  // ─────────────────────────────────────────────
  const allFields = useMemo(() => {
    return (data?.data || data || []).filter(
      (f) => f.is_active
    );
  }, [data]);

  // ─────────────────────────────────────────────
  // FILTER + SEARCH + SORT
  // ─────────────────────────────────────────────
  const fields = useMemo(() => {
    let result = allFields.filter((f) => {
      return (
        !search ||
        f.name
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    });

    // inject distance
    result = result.map((f) => {
      let distance = null;

      if (
        userCoords &&
        f.latitude &&
        f.longitude &&
        !isNaN(parseFloat(f.latitude)) &&
        !isNaN(parseFloat(f.longitude))
      ) {
        distance = haversineKm(
          userCoords.lat,
          userCoords.lon,
          parseFloat(f.latitude),
          parseFloat(f.longitude)
        );
      }

      return {
        ...f,
        _distanceKm: distance,
      };
    });

    // sorting
    result.sort((a, b) => {
      if (
        a._distanceKm == null &&
        b._distanceKm == null
      ) {
        return 0;
      }

      if (a._distanceKm == null) return 1;
      if (b._distanceKm == null) return -1;

      return distanceSort === 'nearest'
        ? a._distanceKm - b._distanceKm
        : b._distanceKm - a._distanceKm;
    });

    return result;
  }, [
    allFields,
    search,
    userCoords,
    distanceSort,
  ]);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />

      {/* HERO */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Booking Lapangan Mudah
          </h1>

          <p className="text-primary-100 mb-6">
            Futsal, Badminton, Basketball &
            Tennis tersedia
          </p>

          {/* SEARCH */}
          <div className="flex gap-3 max-w-xl">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Cari lapangan..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* FILTER + SORT */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">

          {/* LEFT */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <SlidersHorizontal
              size={16}
              className="text-gray-500 shrink-0"
            />

            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${
                    type === t.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-600 border hover:border-primary-300 dark:bg-[#111827] dark:text-gray-300'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2 ml-auto">

            <button
              onClick={() =>
                setDistanceSort('nearest')
              }
              className={`px-4 py-2 rounded-xl text-sm font-medium transition
                ${
                  distanceSort === 'nearest'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border text-gray-600 dark:bg-[#111827] dark:text-gray-300'
                }`}
            >
              Terdekat
            </button>

            <button
              onClick={() =>
                setDistanceSort('farthest')
              }
              className={`px-4 py-2 rounded-xl text-sm font-medium transition
                ${
                  distanceSort === 'farthest'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border text-gray-600 dark:bg-[#111827] dark:text-gray-300'
                }`}
            >
              Terjauh
            </button>

          </div>
        </div>

        {/* INFO BAR */}
        <div className="mb-5">

          {geoLoading && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 bg-primary-50 rounded-xl px-4 py-2.5">
              <Loader2
                size={15}
                className="animate-spin"
              />

              Mendeteksi lokasi kamu...
            </div>
          )}

          {geoError && (
            <div className="flex items-center justify-between text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
              <span>{geoError}</span>

              <button
                onClick={requestLocation}
                className="underline font-medium ml-3"
              >
                Coba lagi
              </button>
            </div>
          )}

          {userCoords && !geoLoading && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2.5">
              <Navigation
                size={14}
                className="text-green-600"
              />

              {distanceSort === 'nearest'
                ? 'Menampilkan lapangan terdekat dari lokasi kamu'
                : 'Menampilkan lapangan terjauh dari lokasi kamu'}
            </div>
          )}
        </div>

        {/* LOADING */}
        {isLoading || geoLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map(
              (_, i) => (
                <CardSkeleton key={i} />
              )
            )}
          </div>
        ) : fields.length === 0 ? (

          <div className="text-center py-16 text-gray-400">
            <MapPin
              size={40}
              className="mx-auto mb-3 opacity-40"
            />

            <p>
              Tidak ada lapangan ditemukan
            </p>
          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

            {fields.map((field, idx) => (

              <Link
                key={field.id}
                to={`/fields/${field.id}`}
                className="card overflow-hidden hover:shadow-lg transition-shadow group"
              >

                {/* IMAGE */}
                <div className="relative h-44 bg-gray-100 dark:bg-gray-800 overflow-hidden">

                  {field.image_url ? (
                    <img
                      src={field.image_url}
                      alt={field.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : null}

                  {/* FALLBACK */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      TYPE_GRADIENT[field.type] ||
                      'from-gray-400 to-gray-600'
                    } flex items-center justify-center`}
                    style={{
                      display: field.image_url
                        ? 'none'
                        : 'flex',
                    }}
                  >
                    <Image
                      size={40}
                      className="text-white/50"
                    />
                  </div>

                  {/* TYPE */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-white/90 text-primary-700 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
                      {field.type_label ||
                        field.type}
                    </span>
                  </div>

                  {/* DISTANCE */}
                  {field._distanceKm != null && (
                    <div className="absolute top-2 right-2">

                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1
                          ${
                            idx === 0
                              ? 'bg-green-500 text-white'
                              : 'bg-white/90 text-gray-700'
                          }`}
                      >
                        <Navigation size={10} />

                        {formatKm(
                          field._distanceKm
                        )}
                      </span>

                    </div>
                  )}
                </div>

                {/* BODY */}
                <div className="p-4">

                  <h3 className="font-semibold text-base mb-1 truncate">
                    {field.name}
                  </h3>

                  {/* ADDRESS */}
                  {field.address && (
                    <div className="flex items-start gap-1.5 mb-2">

                      <MapPin
                        size={12}
                        className="text-gray-400 mt-0.5 shrink-0"
                      />

                      <p className="text-xs text-gray-500 line-clamp-1">
                        {field.address}
                      </p>

                      {field.maps_url && (
                        <a
                          href={field.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                          className="ml-auto shrink-0 text-primary-500 hover:text-primary-700"
                        >
                          <ExternalLink
                            size={12}
                          />
                        </a>
                      )}
                    </div>
                  )}

                  {/* DESCRIPTION */}
                  {!field.address && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                      {field.description}
                    </p>
                  )}

                  {/* FACILITIES */}
                  {field.facilities?.length >
                    0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {field.facilities
                        .slice(0, 3)
                        .map((f, i) => (
                          <span
                            key={i}
                            className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400"
                          >
                            {f}
                          </span>
                        ))}
                    </div>
                  )}

                  {/* PRICE */}
                  <div className="flex items-center justify-between mt-2">

                    <div>
                      <p className="text-indigo-600 font-bold">
                        {field.price_formatted ||
                          formatPrice(
                            field.price_per_hour
                          )}
                      </p>

                      <p className="text-xs text-gray-400">
                        / jam
                      </p>
                    </div>

                    <span className="text-xs font-medium text-accent-600 bg-accent-50 px-2 py-1 rounded-lg">
                      Booking →
                    </span>

                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}