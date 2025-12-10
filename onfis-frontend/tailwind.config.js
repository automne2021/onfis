import { warn } from "console";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0044A6",
          hover: "#0175C8",
        },

        secondary: "#29ABCB",
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
    },
  },
  plugins: [],
};
