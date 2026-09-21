/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ember: {
          DEFAULT: '#F06427',
          dark: '#C74E1B',
          light: '#FF8A52',
          pale: '#FDEBDF',
          muted: '#FBE3D3',
        },
        ink: {
          DEFAULT: '#101010',
          soft: '#1C1C1C',
          mute: '#2A2A2A',
          faint: '#555555',
        },
        paper: {
          DEFAULT: '#F6F3EC',
          dark: '#E9E3D4',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        display: ['"Archivo"', '"Inter"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,16,16,0.06), 0 8px 24px rgba(16,16,16,0.06)',
        pop: '0 12px 40px rgba(16,16,16,0.16)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
