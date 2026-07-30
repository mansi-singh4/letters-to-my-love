import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blush: "var(--blush)",
        cream: "var(--cream)",
        lavender: "var(--lavender)",
        "warm-white": "var(--warm-white)",
        "rose-gold": "var(--rose-gold)",
        "rose-gold-deep": "var(--rose-gold-deep)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-faint": "var(--ink-faint)",
        "gold-line": "var(--gold-line)",
        paper: "var(--paper)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        serif: ["var(--font-serif)"],
        ui: ["var(--font-ui)"],
      },
      borderRadius: {
        lg2: "26px",
      },
    },
  },
  plugins: [],
};
export default config;
