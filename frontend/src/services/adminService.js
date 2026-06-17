import api from './api'

export const adminService = {
  // Statistiques admin
  getStats: () => api.get('/admin/stats'),
  
  // Gestion utilisateurs
  getUsers: () => api.get('/admin/utilisateurs'),
  updateUserRole: (userId, role) => api.put(`/admin/utilisateurs/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/utilisateurs/${userId}`),
  
  // Gestion offres admin
  getAdminOffres: (params = {}) => api.get('/admin/offres', { params }),
  updateOffreStatus: (offreId, statut) => api.put(`/admin/offres/${offreId}/statut`, { statut }),
  deleteOffre: (offreId) => api.delete(`/admin/offres/${offreId}`),
}
