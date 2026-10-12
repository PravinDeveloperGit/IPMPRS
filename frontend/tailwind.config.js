/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        police: {
          900: '#0b192c', // Deepest midnight navy
          800: '#1e3e62', // Deep police navy
          700: '#1e3a8a', // Official police blue
          600: '#2563eb', // Royal blue
          500: '#3b82f6', // Bright blue
          100: '#e0e7ff', // Soft tint
          50: '#f0f4ff',  // Light background tint
        },
        slate: {
          850: '#172033',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
