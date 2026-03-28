import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const ADMIN_PIN = '1234'

interface AdminStore {
  isAuthenticated: boolean
  login: (pin: string) => boolean
  logout: () => void
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      login: (pin: string) => {
        if (pin === ADMIN_PIN) {
          set({ isAuthenticated: true })
          return true
        }
        return false
      },
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'admin-auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
