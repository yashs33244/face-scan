/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gray-50': '#FAFAFA',
        'gray-100': '#F5F5F5',
        'gray-200': '#E5E7EB',
        'gray-700': '#374151',
        'yellow-50': '#FFFBEB',
        'yellow-800': '#92400E',
      },
      spacing: {
        '80': '20rem',
        '96': '24rem',
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
      },
      boxShadow: {
        'lg': '0px 8px 24px rgba(0, 0, 0, 0.1)',
        'xl': '0px 16px 32px rgba(0, 0, 0, 0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
};
