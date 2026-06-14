'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
})

/**
 * ThemeProvider — manages dark/light mode.
 *
 * Light mode is the default. Dark mode is applied by setting
 * data-theme="dark" on <html>; the :root variables cover light mode
 * so no attribute is needed for it.
 *
 * Persists preference in localStorage under 'synczen-theme'.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  // Load stored preference on mount (client only)
  useEffect(() => {
    const stored = localStorage.getItem('synczen-theme') as Theme | null
    // If user has no stored preference, default to light
    const initial: Theme = stored ?? 'light'
    apply(initial)
    setTheme(initial)
  }, [])

  function apply(t: Theme) {
    if (t === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    apply(next)
    localStorage.setItem('synczen-theme', next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
