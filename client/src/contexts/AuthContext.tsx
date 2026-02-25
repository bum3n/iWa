import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

export interface PublicUser {
  id: string
  username: string
  display_name: string
  bio: string
  avatar_url: string
  status: string
}

interface AuthContextValue {
  user: PublicUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { username: string; email: string; password: string; display_name: string }) => Promise<void>
  logout: () => void
  updateUser: (user: PublicUser) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUser(res.data.user))
        .catch(() => { localStorage.removeItem('token'); setToken(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await axios.post('/api/auth/login', { email, password })
    const { token: t, user: u } = res.data
    localStorage.setItem('token', t)
    setToken(t)
    setUser(u)
  }

  const register = async (data: { username: string; email: string; password: string; display_name: string }) => {
    const res = await axios.post('/api/auth/register', data)
    const { token: t, user: u } = res.data
    localStorage.setItem('token', t)
    setToken(t)
    setUser(u)
  }

  const logout = () => {
    axios.post('/api/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const updateUser = (u: PublicUser) => setUser(u)

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
