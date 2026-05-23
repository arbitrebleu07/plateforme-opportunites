import { Routes, Route } from 'react-router-dom'
import { useParams } from 'react-router-dom'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Offres from './pages/Offres'
import OffreDetail from './pages/OffreDetail'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import OffreForm from './pages/OffreForm'
import MyOffres from './pages/MyOffres'
import Profile from './pages/Profile'

// Hooks
import { useOffre } from './hooks/useOffres'

// Components
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

function OffreFormWrapper() {
  const { id } = useParams()
  const { data: offre, loading } = useOffre(id)
  
  if (loading) return <LoadingSpinner size="lg" />
  if (!offre) return <div>Offre non trouvée</div>
  
  return <OffreForm isEdit={true} initialData={offre} />
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/offres" element={<Offres />} />
        <Route path="/offres/:id" element={<OffreDetail />} />

        {/* Routes protégées */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/mes-annonces" element={
          <PrivateRoute>
            <MyOffres />
          </PrivateRoute>
        } />
        
        <Route path="/offres/new" element={
          <PrivateRoute>
            <OffreForm />
          </PrivateRoute>
        } />
        
        <Route path="/offres/:id/edit" element={
          <PrivateRoute>
            <OffreFormWrapper />
          </PrivateRoute>
        } />
        
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        
        {/* Route admin */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
      </Routes>
    </div>
  )
}

export default App