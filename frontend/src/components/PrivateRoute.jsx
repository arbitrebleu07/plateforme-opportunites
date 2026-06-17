import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { FullPageLoader } from './ui/FullPageLoader'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />

  return children
}

export default PrivateRoute
