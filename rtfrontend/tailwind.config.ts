import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Background and Foreground
        background: {
          DEFAULT: "#F7F7F7", // Light mode: Very light gray
          dark: "#121212", // Dark mode: Deep black with a touch of gray
        },
        foreground: {
          DEFAULT: "#333333", // Light mode: Dark gray for text
          dark: "#EDEDED", // Dark mode: Light gray for text
        },
        // Primary Colors
        primary: {
          DEFAULT: "#1A73E8", // A modern blue for light mode
          dark: "#8AB4F8", // A lighter blue for dark mode
        },
        // Secondary Colors
        secondary: {
          DEFAULT: "#34A853", // Light mode: Green for success/secondary actions
          dark: "#81C995", // Dark mode: Muted green
        },
        // Accent Colors
        accent: {
          DEFAULT: "#FBBC05", // Light mode: Yellow accent
          dark: "#FDD663", // Dark mode: Softer yellow accent
        },
        // Muted Colors
        muted: {
          DEFAULT: "#E0E0E0", // Light mode: Muted gray
          dark: "#3A3A3A", // Dark mode: Dark muted gray
        },
        // Card Backgrounds
        card: {
          DEFAULT: "#FFFFFF", // Light mode: Pure white card background
          dark: "#1E1E1E", // Dark mode: Dark gray card background
        },
        // Border Colors
        border: {
          DEFAULT: "#E0E0E0", // Light mode: Light gray border
          dark: "#333333", // Dark mode: Dark gray border
        },
        // Input Backgrounds
        input: {
          DEFAULT: "#F5F5F5", // Light mode: Very light gray input background
          dark: "#2C2C2C", // Dark mode: Dark input background
        },
        // Ring Colors (for focus states)
        ring: {
          DEFAULT: "#1A73E8", // Light mode: Blue ring color
          dark: "#8AB4F8", // Dark mode: Lighter blue ring color
        },
        // Popover Colors
        popover: {
          DEFAULT: "#FFFFFF", // Light mode: White popover background
          dark: "#1E1E1E", // Dark mode: Dark gray popover background
        },
      },
      borderRadius: {
        xl: "1rem",
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-in-out",
        "fade-out": "fade-out 0.5s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
