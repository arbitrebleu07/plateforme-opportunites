import { useCallback, useEffect, useRef, useState } from 'react'

export function useApiResource(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fetchFnRef = useRef(fetchFn)
  const dependencyKey = JSON.stringify(deps)

  useEffect(() => {
    fetchFnRef.current = fetchFn
  }, [fetchFn])

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchFnRef.current()
      setData(response.data)
      return response.data
    } catch (err) {
      setError(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    const load = async () => {
      if (active) await execute()
    }
    load()
    return () => { active = false }
  }, [dependencyKey, execute])

  return { data, loading, error, refetch: execute }
}
