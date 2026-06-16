import { useState, useEffect } from 'react'
import { AuthContext } from './AuthContext'
import api from '../services/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/me')
        .then(res => setUser(res.data))
        .catch((err) => {
          if (err.response?.status !== 401) {
            console.error('Erreur lors de la récupération du profil:', err)
          }
          localStorage.removeItem('token')
        })
        .finally(() => setLoading(false))
    } else {
      setTimeout(() => setLoading(false), 0)
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  const register = async (data) => {
    const res = await api.post('/register', data)
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  const updateUser = async (formData) => {
    const res = await api.post('/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    setUser(res.data.user)
    return res.data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}