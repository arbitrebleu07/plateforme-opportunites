import { Bell, Menu, UserRound, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { notificationsService } from '../services/notificationsService'
import { BrandLogo } from './BrandLogo'

export default function Navbar({ onLogout }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const close = () => setOpen(false)

  const loadUnreadCount = useCallback(() => {
    if (!user) return

    notificationsService.getUnreadCount()
      .then(({ data }) => setUnreadCount(Number(data.count) || 0))
      .catch(() => {})
  }, [user])

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return undefined
    }

    const handleNotificationsUpdated = (event) => {
      if (Number.isInteger(event.detail?.unreadCount)) {
        setUnreadCount(event.detail.unreadCount)
      } else {
        loadUnreadCount()
      }
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadUnreadCount()
    }

    loadUnreadCount()
    const interval = window.setInterval(refreshWhenVisible, 5000)
    window.addEventListener('opportunitech:notifications-updated', handleNotificationsUpdated)
    window.addEventListener('focus', loadUnreadCount)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('opportunitech:notifications-updated', handleNotificationsUpdated)
      window.removeEventListener('focus', loadUnreadCount)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [user, loadUnreadCount])

  return (
    <header className="site-header">
      <div className="nav-shell">
        <BrandLogo />
        <nav id="main-navigation" className={`main-nav ${open ? 'main-nav-open' : ''}`}>
          <NavLink to="/" onClick={close}>Accueil</NavLink>
          <NavLink to="/opportunites" onClick={close}>Opportunités</NavLink>
          <NavLink to="/publier" onClick={close}>Publier</NavLink>
          {user ? (
            <>
              <NavLink to="/mes-annonces" onClick={close}>Mes offres</NavLink>
              <NavLink to="/favoris" onClick={close}>Favoris</NavLink>
              <NavLink to="/alertes" onClick={close}>Alertes</NavLink>
              <NavLink to="/notifications" onClick={close} className="notification-nav-link">
                <Bell size={16} aria-hidden="true" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="notification-count-badge" aria-label={`${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </NavLink>
              {user.role === 'admin' && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
              <NavLink to="/profil" onClick={close} className="nav-profile">
                <UserRound size={16} /> {user.name.split(' ')[0]}
              </NavLink>
              <button className="nav-link-button" onClick={() => { close(); onLogout?.() }}>Déconnexion</button>
            </>
          ) : (
            <div className="nav-actions">
              <Link className="button button-mint" to="/connexion" onClick={close}>Connexion</Link>
              <Link className="button button-primary" to="/inscription" onClick={close}>Créer un compte</Link>
            </div>
          )}
        </nav>
        <button className="menu-toggle icon-button" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open} aria-controls="main-navigation">
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  )
}
