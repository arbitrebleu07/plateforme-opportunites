import api from './api'

export const engagementService = {
  getFavorites: () => api.get('/favoris'),
  addFavorite: (offreId) => api.post(`/favoris/${offreId}`),
  removeFavorite: (offreId) => api.delete(`/favoris/${offreId}`),
  report: (offreId, payload) => api.post(`/offres/${offreId}/signaler`, payload),
  getAlerts: () => api.get('/alertes'),
  createAlert: (payload) => api.post('/alertes', payload),
  updateAlert: (id, payload) => api.put(`/alertes/${id}`, payload),
  deleteAlert: (id) => api.delete(`/alertes/${id}`),
}
