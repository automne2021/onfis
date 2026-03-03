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
          DEFAULT: "#0014A8",
          hover: "#0175C8",
        },

        secondary: {
          DEFAULT: "#E9ECFF",
          hover: "#2189a3",
        },
        muted: "#89939E",

        neutral: {
          50: "#F8FAFC", // app background
          200: "#E2E8F0",
          400: "#90A1B9",
          500: "#62748E", // secondary text
          900: "#0F172B", // primary text
        },

        action: {
          error: "#E53835",
          warning: "#FBC02D",
          success: "#2E7D31",
        },

        status: {
          to_do: "#00A1ED",
          on_track: "#FFD230",
          off_track: "#E7000B",
          on_hold: "#99A1AF",
          done: "#00A63E",
        },

        star: "#FFD230",

        tag: {
          department: "#00B8DB",
          scope: "#8200DB",
        },

        priority: {
          urgent: "#E7000B",
          high: "#FF6900",
          medium: "#FFD230",
          low: "#99A1AF",
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
