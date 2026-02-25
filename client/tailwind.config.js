/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        iwa: {
          bg: '#17212b',
          sidebar: '#0e1621',
          chat: '#0d1117',
          bubble: '#2b5278',
          bubble2: '#182533',
          text: '#e9e9e9',
          subtext: '#7d8e9e',
          accent: '#5288c1',
          border: '#1f2d3d',
          input: '#1f2b38',
          hover: '#1a2b3c',
        }
      }
    }
  },
  plugins: []
}
