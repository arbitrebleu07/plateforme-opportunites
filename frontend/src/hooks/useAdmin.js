import { useApiResource } from './useApiResource'
import { adminService } from '../services/adminService'

export function useAdminStats() {
  return useApiResource(() => adminService.getStats(), [])
}

export function useAdminUsers() {
  return useApiResource(() => adminService.getUsers(), [])
}

export function useAdminOffres() {
  return useApiResource(() => adminService.getAdminOffres(), [])
}
