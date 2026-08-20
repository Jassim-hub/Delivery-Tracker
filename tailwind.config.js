/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0284C7',
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          foreground: '#FFFFFF',
        },
        text: {
          heading: '#111827',
          body: '#374151',
        },
        glass: {
          card: 'rgba(255,255,255,0.06)',
          nav: 'rgba(255,255,255,0.05)',
        },
        accent: {
          DEFAULT: '#F5A623',
          orange: '#F7941D',
          light: '#FDEFD8',
          hover: '#E09214',
          foreground: '#1A1A1A',
        },
        page: {
          bg: '#FFF7ED',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8F9FE',
          card: '#FFFFFF',
          dark: '#9A3412',
        },
        darkbg: {
          DEFAULT: '#9A3412',
          card: '#C2410C',
          border: '#EA580C',
        },
        brand: {
          success: '#1E9E64',
          danger: '#D64545',
          warning: '#F5A623',
          info: '#2D7FF9',
        },
        muted: {
          DEFAULT: '#6B6B7A',
          light: '#9E9EB0',
          foreground: '#6B6B7A',
        }
      },
      borderRadius: {
        lg: '14px',
        md: '10px',
        sm: '6px',
        xl: '18px',
        '2xl': '24px',
      },
      boxShadow: {
          card: '0 2px 12px -2px rgba(30, 64, 175, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
          'card-hover': '0 8px 24px -4px rgba(30, 64, 175, 0.12), 0 3px 8px -2px rgba(0, 0, 0, 0.04)',
        gold: '0 4px 14px 0 rgba(245, 166, 35, 0.35)',
          sky: '0 4px 16px 0 rgba(2, 132, 199, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
