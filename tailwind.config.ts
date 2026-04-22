import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Utiliser les variables CSS pour que le thème change dynamiquement
        primary: {
          50: '#eef8ff',
          100: '#d8eeff',
          200: '#b8e0ff',
          300: '#8bcbf4',
          400: 'var(--accent-color-400)',
          500: 'var(--accent-color-500)',
          600: 'var(--accent-color-600)',
          700: 'var(--accent-color-700)',
          800: '#0a4b74',
          900: '#083d5f',
        },
        dark: {
          100: '#1e1e1e',
          200: '#181818',
          300: '#121212',
          400: '#0a0a0a',
        },
        accent: {
          gold: '#d4af37',
          orange: '#f97316',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
