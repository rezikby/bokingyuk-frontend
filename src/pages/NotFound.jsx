import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Home } from "lucide-react";

function SportsBall() {
  return (
    <svg
      width="100%"
      viewBox="0 0 220 220"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        <clipPath id="ballClip">
          <circle cx="110" cy="110" r="100" />
        </clipPath>
      </defs>

      {/* Base oranye basket */}
      <circle cx="110" cy="110" r="100" fill="#E8621A" />

      {/* Segmen sepak bola kiri bawah */}
      <g clipPath="url(#ballClip)">
        <polygon
          points="42,148 68,133 92,148 92,178 68,193 42,178"
          fill="#1D1D1B"
        />
        <polygon points="14,182 36,169 48,194 32,214 10,207" fill="#1D1D1B" />
        <polygon
          points="52,212 76,198 100,212 95,238 70,246 48,231"
          fill="#1D1D1B"
        />
      </g>

      {/* Segmen tenis kanan atas */}
      <g clipPath="url(#ballClip)">
        <path
          d="M122,18 Q198,28 198,88 Q198,125 166,138 Q138,124 120,94 Q106,64 122,18 Z"
          fill="#C8D400"
        />
        <path
          d="M125,22 Q148,60 146,105"
          fill="none"
          stroke="#FBF7F2"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M146,68 Q174,82 192,102"
          fill="none"
          stroke="#FBF7F2"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Garis basket */}
      <g clipPath="url(#ballClip)">
        <path
          d="M110,10 L110,210"
          fill="none"
          stroke="#C04E10"
          strokeWidth="4.5"
        />
        <path
          d="M10,110 L210,110"
          fill="none"
          stroke="#C04E10"
          strokeWidth="4.5"
        />
        <path
          d="M110,10 Q68,52 66,110 Q68,168 110,210"
          fill="none"
          stroke="#C04E10"
          strokeWidth="4"
        />
        <path
          d="M110,10 Q152,52 154,110 Q152,168 110,210"
          fill="none"
          stroke="#C04E10"
          strokeWidth="4"
        />
      </g>

      {/* Border bola */}
      <circle
        cx="110"
        cy="110"
        r="100"
        fill="none"
        stroke="#1D1D1B"
        strokeWidth="4"
      />
    </svg>
  );
}

export default function NotFound() {
  const navigate = useNavigate();
  const { token, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-white dark:bg-gray-950">
      <div className="text-center w-full max-w-lg">
        {/* 404 dengan bola */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {/* 4 kiri */}
          <span
            className="font-black leading-none text-blue-500 select-none"
            style={{ fontSize: "clamp(100px, 18vw, 160px)", lineHeight: 1 }}
          >
            4
          </span>

          {/* Bola sebagai 0 */}
          <div style={{ width: "clamp(90px, 16vw, 144px)", flexShrink: 0 }}>
            <SportsBall />
          </div>

          {/* 4 kanan */}
          <span
            className="font-black leading-none text-blue-500 select-none"
            style={{ fontSize: "clamp(100px, 18vw, 160px)", lineHeight: 1 }}
          >
            4
          </span>
        </div>

        {/* Teks */}
        <p className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          Halaman tidak ditemukan
        </p>
        <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-10 max-w-xs mx-auto">
          URL yang kamu tuju tidak ada atau sudah dipindah ke tempat lain.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <ArrowLeft size={15} />
            Kembali
          </button>

          {token ? (
            <Link
              to={isAdmin ? "/admin" : "/"}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            >
              <Home size={15} />
              {isAdmin ? "Dashboard" : "Ke Beranda"}
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            >
              <Home size={15} />
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
