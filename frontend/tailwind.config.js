/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fuji: {
          navy: '#0F1C3F',      // Primary Japanese Deep Navy
          slate: '#1E293B',     // Dark slate
          indigo: '#1E3A8A',    // Royal Indigo
          blue: '#2563EB',      // Primary Blue
          sky: '#0284C7',       // Sky Blue
          ice: '#F0F5FA',       // Light clean background
          border: '#E2E8F0',    // Clean subtle border
          crimson: '#BE123C',   // Japanese Vermilion / Crimson alert
          emerald: '#059669',   // Success green
          amber: '#D97706',     // Warning amber
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans JP"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
