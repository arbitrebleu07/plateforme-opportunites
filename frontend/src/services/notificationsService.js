import api from './api'

export const notificationsService = {
  // Récupérer les notifications de l'utilisateur
  getAll: () => api.get('/notifications'),

  // Récupérer uniquement le compteur, sans charger toute la liste
  getUnreadCount: () => api.get('/notifications/non-lues/count'),
  
  // Marquer une notification comme lue
  markAsRead: (id) => api.put(`/notifications/${id}/lire`),
}
