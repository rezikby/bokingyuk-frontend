/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary: Blue soft / Indigo
        primary: {
          DEFAULT: '#4F46E5',
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        accent: {
          DEFAULT: '#0EA5E9',
          50:  '#F0F9FF',
          100: '#E0F2FE',
          500: '#38BDF8',
          600: '#0EA5E9',
          700: '#0284C7',
          800: '#0369A1',
          900: '#0C4A6E',
        },
        // Slate scale (for backgrounds, borders)
        surface: {
          light: '#F8FAFC',
          card:  '#FFFFFF',
          border:'#E2E8F0',
          dark:  '#0F172A',
          'card-dark': '#111827',
          'border-dark': '#1F2937',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        xl:  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
