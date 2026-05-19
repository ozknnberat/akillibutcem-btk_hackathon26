import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  toggleTheme: () => void
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        document.documentElement.classList.toggle('dark', next === 'dark')
      },
    }),
    { name: 'theme-storage' }
  )
)

// Apply theme on initial load
export function applyStoredTheme() {
  const stored = localStorage.getItem('theme-storage')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      const theme: Theme = parsed?.state?.theme ?? 'dark'
      document.documentElement.classList.toggle('dark', theme === 'dark')
    } catch {
      document.documentElement.classList.add('dark')
    }
  } else {
    document.documentElement.classList.add('dark')
  }
}
