import { useEffect, useState } from 'react'
import api from '../services/api'
import { AuthContext } from './AuthContext'

const USER_KEY = 'opportunitech_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')))

  useEffect(() => {
    if (!localStorage.getItem('token')) return

    api.get('/me')
      .then(({ data }) => {
        localStorage.setItem(USER_KEY, JSON.stringify(data))
        setUser(data)
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const startSession = ({ user: nextUser, token }) => {
    localStorage.setItem('token', token)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    return nextUser
  }

  const login = async (email, password) => {
    const { data } = await api.post('/login', { email, password })
    return startSession(data)
  }

  const register = async ({ name, email, password, confirmation }) => {
    const { data } = await api.post('/register', {
      name,
      email,
      password,
      password_confirmation: confirmation,
    })
    return startSession(data)
  }

  const logout = async () => {
    try {
      if (localStorage.getItem('token')) await api.post('/logout')
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem(USER_KEY)
      setUser(null)
    }
  }

  const updateUser = async (values) => {
    const payload = values instanceof FormData ? values : {
      name: values.name,
      email: values.email,
    }
    const { data } = await api.post('/profile', payload)
    const nextUser = {
      ...user,
      ...data.user,
      localisation: values.localisation ?? user?.localisation,
    }
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    return nextUser
  }

  const deletePhoto = async () => {
    await api.delete('/profile/photo')
    const nextUser = { ...user, photo: null }
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    return nextUser
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateUser,
      deletePhoto,
      isAuthenticated: Boolean(user),
    }}>
      {children}
    </AuthContext.Provider>
  )
}
