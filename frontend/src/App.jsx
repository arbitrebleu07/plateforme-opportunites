import { useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import { ConfirmModal } from './components/ConfirmModal'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import { useAuth } from './context/useAuth'
import AdminDashboard from './pages/AdminDashboard'
import Alerts from './pages/Alerts'
import Favorites from './pages/Favorites'
import Home from './pages/Home'
import Login from './pages/Login'
import MyOffres from './pages/MyOffres'
import Notifications from './pages/Notifications'
import NotFound from './pages/NotFound'
import OffreDetail from './pages/OffreDetail'
import OffreForm from './pages/OffreForm'
import Offres from './pages/Offres'
import Profile from './pages/Profile'
import Register from './pages/Register'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const standalone = ['/connexion', '/inscription'].includes(location.pathname) || location.pathname.startsWith('/admin')

  const confirmLogout = async () => {
    await logout()
    setLogoutOpen(false)
    navigate('/connexion')
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Aller au contenu principal</a>
      {!standalone && <Navbar onLogout={() => setLogoutOpen(true)} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/opportunites" element={<Offres />} />
        <Route path="/opportunites/:id" element={<OffreDetail />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Register />} />
        <Route path="/publier" element={<PrivateRoute><OffreForm /></PrivateRoute>} />
        <Route path="/profil" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/mes-annonces" element={<PrivateRoute><MyOffres /></PrivateRoute>} />
        <Route path="/favoris" element={<PrivateRoute><Favorites /></PrivateRoute>} />
        <Route path="/alertes" element={<PrivateRoute><Alerts /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard onLogout={() => setLogoutOpen(true)} /></AdminRoute>} />

        <Route path="/offres" element={<Navigate to="/opportunites" replace />} />
        <Route path="/offres/:id" element={<LegacyDetailRedirect />} />
        <Route path="/login" element={<Navigate to="/connexion" replace />} />
        <Route path="/register" element={<Navigate to="/inscription" replace />} />
        <Route path="/profile" element={<Navigate to="/profil" replace />} />
        <Route path="/offres/new" element={<Navigate to="/publier" replace />} />
        <Route path="/dashboard" element={<Navigate to="/profil" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!standalone && (
        <footer className="site-dedication" aria-label="Dédicace">
          <span>Dédicace</span>
          <strong>&lt;ZZ family &gt;</strong>
        </footer>
      )}
      <ConfirmModal open={logoutOpen} title="Se déconnecter ?" description="Vous devrez saisir à nouveau vos identifiants pour accéder à votre espace." confirmLabel="Se déconnecter" tone="logout" onCancel={() => setLogoutOpen(false)} onConfirm={confirmLogout} />
    </div>
  )
}

function LegacyDetailRedirect() {
  const location = useLocation()
  return <Navigate to={location.pathname.replace('/offres/', '/opportunites/')} replace />
}
