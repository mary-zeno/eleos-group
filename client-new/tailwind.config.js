import tailwindcssAnimate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
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
      fontWeight: {
        'DEFAULT': '300',
      },
      colors: {
        // Your custom palette
        charcoal: '#2E4057',
        timberwolf: '#C4C9CA',
        platinum: '#D8DDDE',
        
        // Override default grays with your palette
        gray: {
          50: '#FFFFFF',   // white
          100: '#D8DDDE',  // platinum
          200: '#C4C9CA',  // timberwolf  
          500: '#6B6560',  // medium
          600: '#4B453F',  // darker
          700: '#3A3530',  // darker
          800: '#2A2520',  // darker
          900: '#2E4057',  // charcoal - darkest
          950: '#1F2A38',  // extra dark charcoal
        },
         
        // shadcn/ui colors using your palette
        border: '#C4C9CA',           // timberwolf
        input: '#D8DDDE',            // platinum
        ring: '#2E4057',             // charcoal
        background: '#FFFFFF',       // white
        foreground: '#2E4057',       // charcoal (dark text)
        
        primary: {
          DEFAULT: '#2E4057',        // charcoal
          foreground: '#FFFFFF',     // white
        },
        secondary: {
          DEFAULT: '#ABA194',        // khaki
          foreground: '#2E4057',     // charcoal
        },
        destructive: {
          DEFAULT: '#8B4B47',        // reddish tone
          foreground: '#FFFFFF',     // white
        },
        muted: {
          DEFAULT: '#C4C9CA',        // timberwolf
          foreground: '#2E4057',     // charcoal
        },
        accent: {
          DEFAULT: '#D8DDDE',        // platinum
          foreground: '#2E4057',     // charcoal
        },
        popover: {
          DEFAULT: '#FFFFFF',        // white
          foreground: '#2E4057',     // charcoal
        },
        card: {
          DEFAULT: '#FFFFFF',        //white
          foreground: '#2E4057',     // charcoal
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
          to: { height: "var(--radix-accordion-content-height)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}