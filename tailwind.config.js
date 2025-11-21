/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f5f7ff",
          100: "#ebf0ff",
          200: "#d6e1ff",
          300: "#b8c9ff",
          400: "#94a8ff",
          500: "#667eea",
          600: "#5568d3",
          700: "#4451b3",
          800: "#333b8f",
          900: "#252a6b",
        },
        purple: {
          500: "#764ba2",
          600: "#6b4392",
          700: "#5e3a7f",
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "gradient-pink": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      },
    },
  },
  plugins: [],
};
