import api from './api'

export const categoriesService = {
  // Récupérer toutes les catégories (publique)
  getAll: () => api.get('/categories'),
  
  // Créer une catégorie (protégé)
  create: (data) => api.post('/categories', data),
  
  // Mettre à jour une catégorie (protégé)
  update: (id, data) => api.put(`/categories/${id}`, data),
  
  // Supprimer une catégorie (protégé)
  delete: (id) => api.delete(`/categories/${id}`),
}
