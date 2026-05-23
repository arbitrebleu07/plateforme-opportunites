import { useApiResource } from './useApiResource'
import { offresService } from '../services/offresService'

export function useOffres(params = {}) {
  return useApiResource(() => offresService.getAll(params), [JSON.stringify(params)])
}

export function useOffre(id) {
  return useApiResource(() => offresService.getById(id), [id])
}

export function usePaginatedOffres(params = {}) {
  return useApiResource(() => offresService.getAll(params), [JSON.stringify(params)])
}

export function useMyOffres(params = {}) {
  return useApiResource(() => offresService.getMyOffres(params), [JSON.stringify(params)])
}
