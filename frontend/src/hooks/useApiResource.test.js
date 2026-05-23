import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApiResource } from './useApiResource'

describe('useApiResource', () => {
  const mockFetchFn = vi.fn()
  
  beforeEach(() => {
    mockFetchFn.mockClear()
  })
  
  it('should initialize with loading state', () => {
    mockFetchFn.mockResolvedValue({ data: { test: 'data' } })
    const { result } = renderHook(() => useApiResource(mockFetchFn, []))
    
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)
  })
  
  it('should fetch data successfully', async () => {
    const mockData = { test: 'data' }
    mockFetchFn.mockResolvedValue({ data: mockData })
    
    const { result } = renderHook(() => useApiResource(mockFetchFn, []))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBe(null)
  })
  
  it('should handle errors', async () => {
    const mockError = new Error('Network error')
    mockFetchFn.mockRejectedValue(mockError)
    
    const { result } = renderHook(() => useApiResource(mockFetchFn, []))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.data).toBe(null)
    expect(result.current.error).toEqual(mockError)
  })
  
  it('should call fetch function with dependencies', async () => {
    mockFetchFn.mockResolvedValue({ data: {} })
    
    const { rerender } = renderHook(
      ({ deps }) => useApiResource(mockFetchFn, deps),
      { initialProps: { deps: [] } }
    )
    
    await waitFor(() => {
      expect(mockFetchFn).toHaveBeenCalledTimes(1)
    })
    
    rerender({ deps: ['new'] })
    
    await waitFor(() => {
      expect(mockFetchFn).toHaveBeenCalledTimes(2)
    })
  })
  
  it('should provide refetch function', async () => {
    mockFetchFn.mockResolvedValue({ data: { count: 1 } })
    
    const { result } = renderHook(() => useApiResource(mockFetchFn, []))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    mockFetchFn.mockResolvedValue({ data: { count: 2 } })
    await result.current.refetch()
    
    expect(result.current.data).toEqual({ count: 2 })
  })
})
