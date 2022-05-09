import defaultTheme from 'tailwindcss/defaultTheme.js';
import flowbite from 'flowbite/plugin.js';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        glitch: ["Rubik Glitch", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [ flowbite ],
}
