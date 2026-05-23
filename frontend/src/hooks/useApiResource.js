import { useState, useEffect, useRef } from 'react'

export function useApiResource(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fetchFnRef = useRef(fetchFn)

  // Update ref when fetchFn changes
  fetchFnRef.current = fetchFn

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetchFnRef.current()
        if (isMounted) {
          setData(response.data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, deps)

  const refetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchFnRef.current()
      setData(response.data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}
