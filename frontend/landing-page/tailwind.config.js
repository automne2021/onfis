import { warn } from "console";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      'sx': '320px',
      'sm': '640px', 
      'md': '768px',
      'lg': '1152px',
      'xl': '1440px',
      '2xl': '1920px',
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0044A6",
          hover: "#0175C8",
        },

        secondary: {
          DEFAULT: "#29ABCB",
          hover: "#2189a3",
        },
        muted: "#89939E",

        neutral: {
          50: "#F9FAFB", // app background
          100: "#F5F7FA", // background secondary, border
          200: "#E4EEF4",
          300: "#ABBED1",
          500: "#89939E", // secondary text
          900: "#263238", // primary text
        },

        danger: "#E53835",
        warning: "#FBC02D",
        success: "#2E7D31",

        status: {
          pending: "#29ABCB",
          in_progress: "#FBC02D",
          blocked: "#E53835",
          done: "#2E7D31",
        },

        chart: {
          1: "#1E447B",
          2: "#3B5FA1",
          3: "#5679C1",
          4: "#7A96D7",
          5: "#A5BAE5",
          6: "#D6E0F3",
        },
      },

      fontFamily: {
        sans: ['"Roboto"', "sans-serif"],
      },

      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
      },
      
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
      },

    },
  },
  plugins: [],
};
