import { create } from 'zustand'

const ADMIN_PIN = '1234'
const STORAGE_KEY = 'admin-auth'

interface AdminStore {
  isAuthenticated: boolean
  login: (pin: string) => boolean
  logout: () => void
}

const stored = sessionStorage.getItem(STORAGE_KEY)
const initialAuth = stored ? JSON.parse(stored).isAuthenticated === true : false

export const useAdminStore = create<AdminStore>((set) => ({
  isAuthenticated: initialAuth,
  login: (pin: string) => {
    if (pin === ADMIN_PIN) {
      set({ isAuthenticated: true })
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ isAuthenticated: true }))
      return true
    }
    return false
  },
  logout: () => {
    set({ isAuthenticated: false })
    sessionStorage.removeItem(STORAGE_KEY)
  },
}))
