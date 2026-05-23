import api from './api'

export const notificationsService = {
  // Récupérer les notifications de l'utilisateur
  getAll: () => api.get('/notifications'),
  
  // Marquer une notification comme lue
  markAsRead: (id) => api.put(`/notifications/${id}/lire`),
}
