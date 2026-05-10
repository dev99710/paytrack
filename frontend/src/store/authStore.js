import { create } from 'zustand'

const useAuthStore = create((set) => ({
  token: localStorage.getItem('paytrack_token') || null,
  user: (() => {
    try {
      const u = localStorage.getItem('paytrack_user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })(),

  login: (token, user) => {
    localStorage.setItem('paytrack_token', token)
    localStorage.setItem('paytrack_user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('paytrack_token')
    localStorage.removeItem('paytrack_user')
    set({ token: null, user: null })
  },
}))

export default useAuthStore
