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
          }
        }
      },
    },
    plugins: [],
  }