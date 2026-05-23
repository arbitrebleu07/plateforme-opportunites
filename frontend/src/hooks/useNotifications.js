import { useApiResource } from './useApiResource'
import { notificationsService } from '../services/notificationsService'

export function useNotifications() {
  return useApiResource(() => notificationsService.getAll(), [])
}
