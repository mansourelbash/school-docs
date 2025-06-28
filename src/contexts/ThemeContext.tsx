"use client"

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type ThemeColor = 'gray' | 'blue' | 'green' | 'teal'

interface ThemeContextType {
  theme: Theme
  themeColor: ThemeColor
  toggleTheme: () => void
  setThemeColor: (color: ThemeColor) => void
  getThemeClasses: () => string
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [themeColor, setThemeColor] = useState<ThemeColor>('gray')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'light'
    const savedColor = (localStorage.getItem('themeColor') as ThemeColor) || 'gray'
    
    setTheme(savedTheme)
    setThemeColor(savedColor)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', theme)
      localStorage.setItem('themeColor', themeColor)
      
      // Apply theme to document immediately
      document.documentElement.setAttribute('data-theme', theme)
      document.documentElement.setAttribute('data-color', themeColor)
      
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      
      // Force immediate style application
      document.documentElement.style.setProperty('color-scheme', theme)
    }
  }, [theme, themeColor, mounted])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleSetThemeColor = (color: ThemeColor) => {
    setThemeColor(color)
  }

  const getThemeClasses = () => {
    const colorClasses = {
      gray: 'theme-gray',
      blue: 'theme-blue',
      green: 'theme-green', 
      teal: 'theme-teal'
    }
    
    return `${theme} ${colorClasses[themeColor]}`
  }

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      themeColor, 
      toggleTheme, 
      setThemeColor: handleSetThemeColor, 
      getThemeClasses 
    }}>
      <div className={getThemeClasses()}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
