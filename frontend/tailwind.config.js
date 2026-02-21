module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0ea5a4', // teal-500 like
          dark: '#0b827f',
          light: '#5fd1cf'
        },
        accent: {
          DEFAULT: '#7c3aed', // light purple
          light: '#a78bfa'
        }
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.06)'
      },
      borderRadius: {
        xl: '14px'
      },
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
}
