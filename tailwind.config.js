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
        // Palette: sage emerald #3b615e, dark emerald #1a4343, butter #f6dc93, peach #f4ba80,
        // orange #ee8d3b, light cream #fbedb6, periwinkle #7198f8. The token names are kept from
        // the earlier palette so every component picks the new colors up:
        //   brand = emerald (primary), coral = orange, mango = peach, aqua = butter,
        //   orchid / azure = periwinkle, cream = light cream, page = the dark emerald background.
        page: "#1a4343",
        cream: "#fbedb6",
        brand: { 50: "#f1f4f4", 100: "#e3e9e8", 200: "#c8d3d2", 300: "#a6b7b6", 400: "#7c9694", 500: "#537472", 600: "#3b615e", 700: "#31514f", 800: "#244f4d", 900: "#1a4343", 950: "#0f2b2b" },
        orchid: { 50: "#f4f7fe", 100: "#e8effe", 200: "#d2defd", 300: "#b5c9fb", 400: "#93b1fa", 500: "#7198f8", 600: "#6385da", 700: "#5370b7", 800: "#445c96", 900: "#384a7a", 950: "#273355" },
        coral: { 50: "#fef6ef", 100: "#fcede0", 200: "#fadbc0", 300: "#f6c499", 400: "#f2a86a", 500: "#ee8d3b", 600: "#d17c34", 700: "#af682b", 800: "#905524", 900: "#75451d", 950: "#513014" },
        mango: { 50: "#fef8f2", 100: "#fdf0e4", 200: "#fae2ca", 300: "#f7d0a8", 400: "#f4ba80", 500: "#ca9a6a", 600: "#b2885e", 700: "#97734f", 800: "#7d5f42", 900: "#664e36", 950: "#493726" },
        aqua: { 50: "#fefaee", 100: "#fcf4de", 200: "#f9e9bd", 300: "#f6dc93", 400: "#d3bd7e", 500: "#b09d69", 600: "#9b8b5d", 700: "#84764f", 800: "#6e6241", 900: "#5b5136", 950: "#423b27" },
        azure: { 50: "#f4f7fe", 100: "#e8effe", 200: "#d2defd", 300: "#b5c9fb", 400: "#93b1fa", 500: "#7198f8", 600: "#6385da", 700: "#5370b7", 800: "#445c96", 900: "#384a7a", 950: "#273355" },
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
