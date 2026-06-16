import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { FullPageLoader } from './ui/FullPageLoader'

function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />

  return children
}

export default AdminRoute
