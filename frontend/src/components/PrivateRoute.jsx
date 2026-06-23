import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Chargement...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/connexion" replace />
  }

  return children
}

export default PrivateRoute
