import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'el-messiri': ['var(--font-el-messiri)', 'El Messiri', 'Almarai', 'sans-serif'],
        'almarai': ['var(--font-almarai)', 'Almarai', 'El Messiri', 'sans-serif'],
        'arabic': ['El Messiri', 'Almarai', 'Noto Sans Arabic', 'sans-serif'],
        'gulf': ['El Messiri', 'Almarai', 'sans-serif'],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2563eb",
          dark: "#1d4ed8",
          light: "#3b82f6",
        },
        secondary: {
          DEFAULT: "#64748b",
          light: "#94a3b8",
        },
        accent: "#f59e0b",
        success: "#059669",
        warning: "#d97706",
        error: "#dc2626",
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'modern': '0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -6px rgba(0, 0, 0, 0.1)',
        'modern-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
