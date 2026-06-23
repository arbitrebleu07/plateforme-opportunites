import axios from 'axios'

// Instance axios configurée pour l'API Laravel
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

// Ajoute automatiquement le token dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Gère les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide → déconnexion
      localStorage.removeItem('token')
      localStorage.removeItem('opportunitech_user')
      if (!window.location.pathname.startsWith('/connexion')) {
        window.location.href = '/connexion'
      }
    }
    return Promise.reject(error)
  }
)

export default api
