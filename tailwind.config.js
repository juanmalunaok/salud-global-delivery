/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B5E4B',
          light: '#2A7A62',
          dark: '#134539',
        },
        accent: '#4CAF50',
        background: {
          DEFAULT: '#FFFFFF',
          secondary: '#F5F7F5',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#6B7280',
        },
        status: {
          error: '#DC2626',
          warning: '#F59E0B',
          success: '#16A34A',
          info: '#2563EB',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
