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
        .catch(() => localStorage.removeItem('token'))
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
    await api.post('/logout')
    localStorage.removeItem('token')
    setUser(null)
  }

  const updateUser = async (formData) => {
    await api.post('/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    // Re-fetch user data from /me to ensure we have the latest data with correct photo URL
    const res = await api.get('/me')
    setUser(res.data)
    return res.data
  }

  const deletePhoto = async () => {
    await api.delete('/profile/photo')
    // Re-fetch user data from /me
    const res = await api.get('/me')
    setUser(res.data)
    return res.data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, deletePhoto }}>
      {children}
    </AuthContext.Provider>
  )
}