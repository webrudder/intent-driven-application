/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#165DFF',
        secondary: '#7B61FF',
        success: '#00B96B',
        warning: '#FF7D00',
        danger: '#F53F3F',
        info: '#86909C',
        bg: {
          body: '#F7F8FA',
          card: '#FFFFFF',
          code: '#1E1E2F',
        },
        border: '#E5E6EB',
        text: {
          primary: '#1D2129',
          secondary: '#4E5969',
          tertiary: '#86909C',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        btn: '8px',
        code: '10px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
};