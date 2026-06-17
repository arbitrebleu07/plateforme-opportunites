import { useApiResource } from './useApiResource'
import { adminService } from '../services/adminService'

export function useAdminStats() {
  return useApiResource(() => adminService.getStats(), [])
}

export function useAdminUsers() {
  return useApiResource(() => adminService.getUsers(), [])
}

export function useAdminOffres(params = {}) {
  return useApiResource(() => adminService.getAdminOffres(params), [JSON.stringify(params)])
}
