import api from './api'

export const offresService = {
  // Récupérer toutes les offres (publique)
  getAll: (params = {}) => api.get('/offres', { params }),
  
  // Récupérer une offre par ID (publique)
  getById: (id) => api.get(`/offres/${id}`),
  
  // Récupérer les offres de l'utilisateur connecté (protégé)
  getMyOffres: (params = {}) => api.get('/mes-offres', { params }),
  
  // Créer une offre (protégé)
  create: (data) => api.post('/offres', data),
  
  // Mettre à jour une offre (protégé)
  update: (id, data) => api.put(`/offres/${id}`, data),
  
  // Supprimer une offre (protégé)
  delete: (id) => api.delete(`/offres/${id}`),
}
