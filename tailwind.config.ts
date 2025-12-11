import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-noto-kufi-arabic)', 'sans-serif'],
        arabic: ['var(--font-noto-kufi-arabic)', 'sans-serif'],
      },
      colors: {
        // Brand Colors
        primary: {
          DEFAULT: 'rgb(30, 86, 49)',
          foreground: 'rgb(255, 255, 255)',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#1E5631',
          600: '#1a4a2b',
          700: '#153e24',
          800: '#11321d',
          900: '#0d2617',
        },
        accent: {
          DEFAULT: 'rgb(212, 175, 55)',
          foreground: 'rgb(0, 0, 0)',
        },
        background: 'rgb(249, 250, 251)',
        foreground: 'rgb(17, 24, 39)',
        muted: {
          DEFAULT: 'rgb(243, 244, 246)',
          foreground: 'rgb(107, 114, 128)',
        },
        destructive: {
          DEFAULT: 'rgb(239, 68, 68)',
          foreground: 'rgb(255, 255, 255)',
        },
        border: 'rgb(229, 231, 235)',
        input: 'rgb(229, 231, 235)',
        ring: 'rgb(30, 86, 49)',
        // Score Colors
        score: {
          gold: 'rgb(212, 175, 55)',
          green: 'rgb(34, 197, 94)',
          grey: 'rgb(156, 163, 175)',
          warm: 'rgb(251, 146, 60)',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      lineHeight: {
        'arabic': '2',
        'relaxed-arabic': '2.25',
      },
    },
  },
  plugins: [],
}

export default config
