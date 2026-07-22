import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import api from '../utils/api'

export type ThemeMode = 'aurora' | 'cyberpunk' | 'midnight' | 'light' | 'sunset'

export interface ThemeOption {
  id: ThemeMode
  name: string
  description: string
  previewColors: {
    bg: string
    card: string
    primary: string
    accent: string
  }
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'aurora',
    name: 'Aurora Glass',
    description: 'Deep indigo space with glowing violet aura & cyan accents',
    previewColors: { bg: '#080a12', card: '#111420', primary: '#6366f1', accent: '#22d3ee' }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'High-contrast dark grid with electric neon pink & cyan glow',
    previewColors: { bg: '#05050b', card: '#0d0d18', primary: '#f43f5e', accent: '#00f0ff' }
  },
  {
    id: 'midnight',
    name: 'Midnight Gold',
    description: 'Luxury obsidian dark theme with bronze & warm amber accents',
    previewColors: { bg: '#090a0f', card: '#12141d', primary: '#e5c158', accent: '#f59e0b' }
  },
  {
    id: 'light',
    name: 'Minimalist Light',
    description: 'Clean porcelain slate layout with royal indigo & emerald badges',
    previewColors: { bg: '#f8fafc', card: '#ffffff', primary: '#4f46e5', accent: '#10b981' }
  },
  {
    id: 'sunset',
    name: 'Sunset Synthwave',
    description: 'Dark purple twilight with vibrant sunset orange & coral hues',
    previewColors: { bg: '#0d0814', card: '#160f24', primary: '#ff6b4a', accent: '#ec4899' }
  }
]

interface ThemeContextType {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user, updateUser } = useAuth()
  
  const getInitialTheme = (): ThemeMode => {
    const saved = localStorage.getItem('theme') as ThemeMode
    if (saved && THEME_OPTIONS.some(t => t.id === saved)) return saved
    if (user?.settings?.theme && THEME_OPTIONS.some(t => t.id === user.settings.theme)) {
      return user.settings.theme as ThemeMode
    }
    return 'aurora'
  }

  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme)

  useEffect(() => {
    if (user?.settings?.theme && THEME_OPTIONS.some(t => t.id === user.settings.theme)) {
      setThemeState(user.settings.theme as ThemeMode)
    }
  }, [user?.settings?.theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)

    if (user) {
      updateUser({ settings: { ...user.settings, theme: newTheme } })
      api.put('/settings', { theme: newTheme }).catch(() => {})
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
