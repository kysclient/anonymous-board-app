import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Google Sans Text",
          "Google Sans",
          "Roboto Flex",
          "Roboto",
          "var(--font-app, Inter)",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "Google Sans Display",
          "Google Sans",
          "Roboto Flex",
          "Roboto",
          "var(--font-app, Inter)",
          "system-ui",
          "sans-serif",
        ],
        title: [
          "Google Sans",
          "Roboto Flex",
          "Roboto",
          "var(--font-app, Inter)",
          "system-ui",
          "sans-serif",
        ],
        body: [
          "Roboto Flex",
          "Roboto",
          "var(--font-app, Inter)",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // ── Material 3 tonal palette ────────────────────────
        md: {
          primary: "rgb(var(--md-primary) / <alpha-value>)",
          "on-primary": "rgb(var(--md-on-primary) / <alpha-value>)",
          "primary-container": "rgb(var(--md-primary-container) / <alpha-value>)",
          "on-primary-container": "rgb(var(--md-on-primary-container) / <alpha-value>)",
          secondary: "rgb(var(--md-secondary) / <alpha-value>)",
          "on-secondary": "rgb(var(--md-on-secondary) / <alpha-value>)",
          "secondary-container": "rgb(var(--md-secondary-container) / <alpha-value>)",
          "on-secondary-container": "rgb(var(--md-on-secondary-container) / <alpha-value>)",
          tertiary: "rgb(var(--md-tertiary) / <alpha-value>)",
          "on-tertiary": "rgb(var(--md-on-tertiary) / <alpha-value>)",
          "tertiary-container": "rgb(var(--md-tertiary-container) / <alpha-value>)",
          "on-tertiary-container": "rgb(var(--md-on-tertiary-container) / <alpha-value>)",
          error: "rgb(var(--md-error) / <alpha-value>)",
          "on-error": "rgb(var(--md-on-error) / <alpha-value>)",
          "error-container": "rgb(var(--md-error-container) / <alpha-value>)",
          "on-error-container": "rgb(var(--md-on-error-container) / <alpha-value>)",
          surface: "rgb(var(--md-surface) / <alpha-value>)",
          "surface-dim": "rgb(var(--md-surface-dim) / <alpha-value>)",
          "surface-bright": "rgb(var(--md-surface-bright) / <alpha-value>)",
          "surface-container-lowest":
            "rgb(var(--md-surface-container-lowest) / <alpha-value>)",
          "surface-container-low":
            "rgb(var(--md-surface-container-low) / <alpha-value>)",
          "surface-container":
            "rgb(var(--md-surface-container) / <alpha-value>)",
          "surface-container-high":
            "rgb(var(--md-surface-container-high) / <alpha-value>)",
          "surface-container-highest":
            "rgb(var(--md-surface-container-highest) / <alpha-value>)",
          "on-surface": "rgb(var(--md-on-surface) / <alpha-value>)",
          "on-surface-variant":
            "rgb(var(--md-on-surface-variant) / <alpha-value>)",
          outline: "rgb(var(--md-outline) / <alpha-value>)",
          "outline-variant": "rgb(var(--md-outline-variant) / <alpha-value>)",
          "inverse-surface":
            "rgb(var(--md-inverse-surface) / <alpha-value>)",
          "inverse-on-surface":
            "rgb(var(--md-inverse-on-surface) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        marquee2: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0%)" },
        },
        "m3-fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee 25s linear infinite",
        marquee2: "marquee2 25s linear infinite",
        "m3-fade-in": "m3-fade-in 0.4s cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
