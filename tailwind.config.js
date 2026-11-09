/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // User custom palette
        accent: {
          red: '#a10b2b',      // Akcent 1: Karminowa czerwień
          green: '#6ea900',    // Akcent 2: Energetyczna zieleń / limonka
          lime: '#6ea900',
          crimson: '#a10b2b',
        },
        theme: {
          bg: '#1b3644',       // Tło główne
          surface: '#152b36',  // Powierzchnia kart / kafelków
          darker: '#10222b',   // Ciemniejszy odcień (np. nagłówki, paski)
          border: '#0d2b52',   // Ramki i linie podziału
          borderLight: '#18447e', // Jaśniejszy zarys ramki
          hover: '#1d3c4c',    // Stan podświetlenia
        },
        // Backward compatibility mappings
        brand: {
          400: '#84ca00',
          500: '#6ea900',
          600: '#588800',
          DEFAULT: '#6ea900',
        },
        dark: {
          bg: '#1b3644',
          card: '#152b36',
          border: '#0d2b52',
          hover: '#1d3c4c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
