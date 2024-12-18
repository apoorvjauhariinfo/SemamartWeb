/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"],
  mode: "jit",
  theme: {
    fontFamily: {
      Roboto: ["Roboto", "sans-serif"],
      Poppins: ["Poppins", "sans-serif"],
    },
    extend: {
      colors: {
        customBlue: "#6EC1E5",
        customGreen: "#61ceb6",
        accentYellow: "#fcb700",
        accentBlue: "#3692b4",
        darkBlue: "#1D647E",
        lightBlue: "#E7F9FE",
        bgGray: "#f5f5f5",
        darkGray: "#666666",
      },

      screens: {
        "1000px": "1050px",
        "1100px": "1110px",
        "800px": "800px",
        "1300px": "1300px",
        "400px": "400px",
      },
    },
  },
  plugins: [],
};
