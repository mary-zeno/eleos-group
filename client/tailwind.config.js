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
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      colors: {
        // Dark theme inspired by the images
        charcoal: {
          50: '#f6f7f8',
          100: '#e1e4e7',
          200: '#c4c9cf',
          300: '#9ea6b0',
          400: '#71808d',
          500: '#556070',
          600: '#48505e',
          700: '#3d434e',
          800: '#363a42',
          900: '#1a1a1a', // Main dark background
          950: '#0f0f0f', // Deeper black
        },
        
        // Orange accent color from the images
        accent: {
          DEFAULT: '#ff8c00', // Orange accent
          50: '#fff7ed',
          100: '#ffeed4',
          200: '#ffd9a8',
          300: '#ffbe71',
          400: '#ff9838',
          500: '#ff8c00', // Main orange
          600: '#e06100',
          700: '#ba4902',
          800: '#973808',
          900: '#7c2f0b',
        },

        // Override default colors for dark theme
        background: '#0f0f0f', // Deep black
        foreground: '#ffffff', // White text
        
        primary: {
          DEFAULT: '#ff8c00', // Orange
          foreground: '#0f0f0f', // Black text on orange
        },
        
        secondary: {
          DEFAULT: '#1a1a1a', // Dark charcoal
          foreground: '#ffffff', // White text
        },
        
        muted: {
          DEFAULT: '#2a2a2a', // Lighter dark
          foreground: '#a1a1aa', // Light gray text
        },
        
        border: '#2a2a2a', // Dark border
        input: '#1a1a1a', // Dark input background
        ring: '#ff8c00', // Orange focus ring
        
        card: {
          DEFAULT: '#1a1a1a', // Dark card background
          foreground: '#ffffff', // White text on cards
        },
        
        popover: {
          DEFAULT: '#1a1a1a', // Dark popover
          foreground: '#ffffff', // White text
        },
      },
      
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-pulse': 'glowPulse 5s ease-in-out infinite',
        // Hexagon animations
        "float": "float 6s ease-in-out infinite",
        "rotate-slow": "rotate-slow 20s linear infinite",
        // Digital rain animation
        "fall": "fall 8s linear infinite",
        "fall-slow": "fall 10s linear infinite",
        "fall-fast": "fall 6s linear infinite",
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        glow: {
          '0%': { 
            boxShadow: '0 0 5px #ff8c00, 0 0 10px #ff8c00, 0 0 15px #ff8c00'
          },
          '100%': { 
            boxShadow: '0 0 10px #ff8c00, 0 0 20px #ff8c00, 0 0 30px #ff8c00'
          },
        },
        glowPulse: {
          '0%, 100%': { 
            textShadow: '0 0 5px rgba(255,140,0,0.3), 0 0 10px rgba(255,140,0,0.2), 0 0 15px rgba(255,140,0,0.1)'
          },
          '50%': { 
            textShadow: '0 0 10px rgba(255,140,0,0.6), 0 0 20px rgba(255,140,0,0.4), 0 0 30px rgba(255,140,0,0.2)'
          },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Hexagon animations
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "rotate-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        // Digital rain keyframe (FIXED - was nested incorrectly)
        fall: {
          '0%': { 
            transform: 'translateY(-100px)', 
            opacity: '0' 
          },
          '10%': { 
            opacity: '1' 
          },
          '90%': { 
            opacity: '1' 
          },
          '100%': { 
            transform: 'translateY(100vh)', 
            opacity: '0' 
          },
        },
      },
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}