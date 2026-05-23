import { useApiResource } from './useApiResource'
import { categoriesService } from '../services/categoriesService'

export function useCategories() {
  return useApiResource(() => categoriesService.getAll(), [])
}
