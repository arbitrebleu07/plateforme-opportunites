import { useState, useEffect, useRef, useCallback } from 'react'

export function useApiResource(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fetchFnRef = useRef(fetchFn)
  const isMountedRef = useRef(true)

  useEffect(() => {
    fetchFnRef.current = fetchFn
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchFnRef.current()
      if (isMountedRef.current) {
        setData(response.data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    fetchData()
    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, refetch: fetchData }
}
