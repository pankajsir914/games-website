
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      gridTemplateColumns: {
        '15': 'repeat(15, minmax(0, 1fr))',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gaming: {
          gold: "hsl(var(--gaming-gold))",
          "gold-foreground": "hsl(var(--gaming-gold-foreground))",
          success: "hsl(var(--gaming-success))",
          "success-foreground": "hsl(var(--gaming-success-foreground))",
          danger: "hsl(var(--gaming-danger))",
          "danger-foreground": "hsl(var(--gaming-danger-foreground))",
        },
        ludo: {
          red: "hsl(var(--ludo-red))",
          yellow: "hsl(var(--ludo-yellow))",
          green: "hsl(var(--ludo-green))",
          blue: "hsl(var(--ludo-blue))",
        },
        chicken: {
          road: "hsl(var(--chicken-road-bg))",
          dark: "hsl(var(--chicken-road-dark))",
          lane: "hsl(var(--chicken-road-lane))",
          gold: "hsl(var(--chicken-road-gold))",
          fire: "hsl(var(--chicken-road-fire))",
          success: "hsl(var(--chicken-road-success))",
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
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-hero": "var(--gradient-hero)",
        "gradient-card": "var(--gradient-card)",
        "gradient-ludo-board": "var(--gradient-ludo-board)",
        "gradient-ludo-red": "var(--gradient-ludo-red)",
        "gradient-ludo-yellow": "var(--gradient-ludo-yellow)",
        "gradient-ludo-green": "var(--gradient-ludo-green)",
        "gradient-ludo-blue": "var(--gradient-ludo-blue)",
      },
      boxShadow: {
        gaming: "var(--shadow-gaming)",
        "card-gaming": "var(--shadow-card)",
        glow: "var(--shadow-glow)",
        "ludo-token": "var(--shadow-ludo-token)",
        "ludo-board": "var(--shadow-ludo-board)",
        "dice": "var(--shadow-dice)",
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
        "dice-roll": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "25%": { transform: "rotate(90deg) scale(1.1)" },
          "50%": { transform: "rotate(180deg) scale(1.2)" },
          "75%": { transform: "rotate(270deg) scale(1.1)" },
          "100%": { transform: "rotate(360deg) scale(1)" },
        },
        "token-move": {
          "0%": { transform: "scale(1) rotate(0deg)" },
          "50%": { transform: "scale(1.2) rotate(180deg)" },
          "100%": { transform: "scale(1) rotate(360deg)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.4)" },
          "50%": { boxShadow: "0 0 40px hsl(var(--primary) / 0.8)" },
        },
        "celebration": {
          "0%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
          "50%": { transform: "scale(1.5) rotate(180deg)", opacity: "0.8" },
          "100%": { transform: "scale(2) rotate(360deg)", opacity: "0" },
        },
        "road-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "coin-spin": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
        "fire-flicker": {
          "0%, 100%": { 
            transform: "scale(1) rotate(0deg)",
            opacity: "1",
          },
          "25%": { 
            transform: "scale(1.1) rotate(-5deg)",
            opacity: "0.9",
          },
          "50%": { 
            transform: "scale(0.95) rotate(5deg)",
            opacity: "1",
          },
          "75%": { 
            transform: "scale(1.05) rotate(-3deg)",
            opacity: "0.95",
          },
        },
        "multiplier-pop": {
          "0%": { 
            transform: "scale(0) translateY(0)",
            opacity: "0",
          },
          "50%": { 
            transform: "scale(1.2) translateY(-10px)",
            opacity: "1",
          },
          "100%": { 
            transform: "scale(1) translateY(0)",
            opacity: "1",
          },
        },
        "chicken-run": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        "chicken-walk": {
          "0%": { transform: "translateX(0) scale(1)" },
          "25%": { transform: "translateX(10px) scale(1.05)" },
          "50%": { transform: "translateX(20px) scale(1)" },
          "75%": { transform: "translateX(10px) scale(1.05)" },
          "100%": { transform: "translateX(0) scale(1)" }
        },
        "chicken-burn": {
          "0%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
          "25%": { transform: "scale(1.2) rotate(10deg)", opacity: "0.8" },
          "50%": { transform: "scale(1.1) rotate(-10deg)", opacity: "0.6" },
          "75%": { transform: "scale(0.9) rotate(5deg)", opacity: "0.4" },
          "100%": { transform: "scale(0.8) rotate(0deg)", opacity: "0.2" }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "dice-roll": "dice-roll 1s ease-in-out",
        "token-move": "token-move 0.6s ease-in-out",
        "float": "float 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "celebration": "celebration 0.8s ease-out forwards",
        "road-scroll": "road-scroll 20s linear infinite",
        "coin-spin": "coin-spin 2s linear infinite",
        "fire-flicker": "fire-flicker 1.5s ease-in-out infinite",
        "multiplier-pop": "multiplier-pop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "chicken-run": "chicken-run 1s ease-in-out",
        "chicken-walk": "chicken-walk 0.5s ease-in-out",
        "chicken-burn": "chicken-burn 1s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
