/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./*.{js,jsx}",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            blue: '#4C64DE',
            orange: '#F9AE37',
            red: '#FF4631'
          },
          blue: {
            50: '#eef0f8',
            100: '#dde1f1',
            200: '#bbc3e3',
            300: '#99a5d5',
            400: '#7787c7',
            500: '#4f61ac',
            600: '#3f4e8a',
            700: '#2f3b68',
            800: '#1f2845',
            900: '#0f1523',
          }
        }
      },
    },
    plugins: [],
  }