/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          canvas: '#0d0e11',
          sidebar: '#0e1013',
          card: '#16181d',
          well: '#111215',
          header: '#121316',
          hover: '#1f2128',
        },
        light: {
          canvas: '#f8fafc',
          sidebar: '#fbfcfd',
          card: '#ffffff',
          well: '#f1f5f9',
          header: '#f8fafc',
          hover: '#f1f5f9',
        },
      },
      fontFamily: {
        sans: ['Jost', '"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Jost', 'Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        'float': '0 12px 36px -4px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
};
