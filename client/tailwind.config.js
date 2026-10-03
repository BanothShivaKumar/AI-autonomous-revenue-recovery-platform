/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          soft: '#DBEAFE',
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        ai: {
          DEFAULT: '#7C3AED',
          soft: '#EDE9FE',
          50: '#F5F3FF',
          100: '#EDE9FE',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        success: {
          DEFAULT: '#16A34A',
          soft: '#DCFCE7',
          50: '#F0FDF4',
          500: '#22C55E',
          600: '#16A34A',
        },
        warning: {
          DEFAULT: '#D97706',
          soft: '#FEF3C7',
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706',
        },
        risk: {
          DEFAULT: '#DC2626',
          soft: '#FEE2E2',
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
        },
        // Fintech Neutral Surfaces
        fintech: {
          bg: '#0B1120',
          surface: '#111827',
          secondary: '#172033',
          border: '#273449',
          text: '#F8FAFC',
          textSecondary: '#CBD5E1',
          textMuted: '#64748B',

          darkBg: '#0B1120',
          darkSurface: '#111827',
          darkSurfaceAlt: '#172033',
          darkBorder: '#273449',
          darkText: '#F8FAFC',
          darkTextSec: '#CBD5E1',
          darkTextMuted: '#64748B',

          lightBg: '#F8FAFC',
          lightSurface: '#FFFFFF',
          lightSurfaceAlt: '#F1F5F9',
          lightBorder: '#E2E8F0',
          lightText: '#0F172A',
          lightTextSec: '#475569',
          lightTextMuted: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'card-subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'card-elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'fintech-focus': '0 0 0 3px rgba(37, 99, 235, 0.2)',
        'ai-focus': '0 0 0 3px rgba(124, 58, 237, 0.2)',
      },
    },
  },
  plugins: [],
}
