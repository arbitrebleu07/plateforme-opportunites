import { useState } from 'react'

export function useFormSubmit(onSubmit) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Une erreur est survenue.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, setError, handleSubmit }
}
