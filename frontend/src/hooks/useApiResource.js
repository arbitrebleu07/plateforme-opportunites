import { useState, useEffect, useCallback, useRef } from 'react'
import { flushSync } from 'react-dom'

export function useApiResource(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fetchFnRef = useRef(fetchFn)

  useEffect(() => {
    fetchFnRef.current = fetchFn
  })

  const depsKey = JSON.stringify(deps)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFnRef.current()
      flushSync(() => {
        setData(result.data)
      })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    execute()
  }, [execute, depsKey])

  return { data, loading, error, refetch: execute }
}
