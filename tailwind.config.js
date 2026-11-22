/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Rounded-terminal font for the whole site; system fonts while it loads
      fontFamily: {
        sans: ["Nunito", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        // Handwriting (scrapbook captions on the sign-in screen)
        hand: ["Caveat", "Nunito", "cursive"],
        // Logo wordmark: Hobo Std (Adobe Fonts, family "hobo-std"; or "Hobo Std" if installed locally)
        logo: ["hobo-std", "Hobo Std", "Nunito", "sans-serif"],
      },
      colors: {
        // Palette (matches the sign-in and quiz screens): pale aqua sky #cdeae8 (page background),
        // near-white cloud #e8f6f5, slate #44605e (primary), dark teal #2b4142 (text), gold #ff9f16
        // (accent), light cream #fbedb6. The token names are kept from earlier palettes so every
        // component picks the new colors up:
        //   brand / ink / aqua / orchid / azure = the slate scale (200 is the sky, 600 the slate,
        //   800 the dark teal text), coral / mango = the gold scale, cream = light cream.
        page: "#cdeae8",
        cream: "#fbedb6",
        brand: { 50: "#f1f6f6", 100: "#e8f6f5", 200: "#cdeae8", 300: "#a9c6c4", 400: "#7e9c9a", 500: "#5d7b79", 600: "#44605e", 700: "#3a5250", 800: "#2b4142", 900: "#233637", 950: "#142223" },
        ink: { 50: "#f1f6f6", 100: "#e8f6f5", 200: "#cdeae8", 300: "#a9c6c4", 400: "#7e9c9a", 500: "#5d7b79", 600: "#44605e", 700: "#3a5250", 800: "#2b4142", 900: "#233637", 950: "#142223" },
        aqua: { 50: "#f1f6f6", 100: "#e8f6f5", 200: "#cdeae8", 300: "#a9c6c4", 400: "#7e9c9a", 500: "#5d7b79", 600: "#44605e", 700: "#3a5250", 800: "#2b4142", 900: "#233637", 950: "#142223" },
        orchid: { 50: "#f1f6f6", 100: "#e8f6f5", 200: "#cdeae8", 300: "#a9c6c4", 400: "#7e9c9a", 500: "#5d7b79", 600: "#44605e", 700: "#3a5250", 800: "#2b4142", 900: "#233637", 950: "#142223" },
        azure: { 50: "#f1f6f6", 100: "#e8f6f5", 200: "#cdeae8", 300: "#a9c6c4", 400: "#7e9c9a", 500: "#5d7b79", 600: "#44605e", 700: "#3a5250", 800: "#2b4142", 900: "#233637", 950: "#142223" },
        coral: { 50: "#fff7eb", 100: "#ffecd0", 200: "#ffd7a0", 300: "#ffc066", 400: "#ffb04a", 500: "#ff9f16", 600: "#e5870a", 700: "#bf6c08", 800: "#98560b", 900: "#7b470d", 950: "#462604" },
        mango: { 50: "#fff7eb", 100: "#ffecd0", 200: "#ffd7a0", 300: "#ffc066", 400: "#ffb04a", 500: "#ff9f16", 600: "#e5870a", 700: "#bf6c08", 800: "#98560b", 900: "#7b470d", 950: "#462604" },
      },
    },
  },
  plugins: [],
  safelist: [
    "h-72",
    "w-full",
    "rounded-2xl",
    "shadow-xl",
    "ring-1",
    "ring-black/10",
  ],
};
