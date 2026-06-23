import { Bell, Check } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { notificationsService } from '../services/notificationsService'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => notificationsService.getAll()
    .then(({ data }) => {
      setNotifications(data)
      window.dispatchEvent(new CustomEvent('opportunitech:notifications-updated', {
        detail: { unreadCount: data.filter((notification) => !notification.lu).length },
      }))
    })
    .finally(() => setLoading(false)), [])

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') load()
    }

    load()
    const interval = window.setInterval(refreshWhenVisible, 5000)
    window.addEventListener('focus', load)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', load)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [load])

  const markRead = async (id) => {
    await notificationsService.markAsRead(id)
    await load()
  }

  return (
    <main id="main-content" className="page-shell page-content" tabIndex="-1">
      <div className="page-title">
        <h1>Notifications</h1>
        <p>Suivez vos alertes, validations et dates limites.</p>
      </div>
      {loading ? <div className="loading-state">Chargement des notifications…</div> : notifications.length ? (
        <div className="notification-list">
          {notifications.map((notification) => (
            <article className={notification.lu ? 'read' : ''} key={notification.id_notification}>
              <Bell aria-hidden="true" />
              <div><strong>{notification.titre || 'Notification'}</strong><p>{notification.message}</p></div>
              {!notification.lu && <button className="button button-mint" onClick={() => markRead(notification.id_notification)}><Check size={15} /> Marquer comme lue</button>}
            </article>
          ))}
        </div>
      ) : <EmptyState title="Aucune notification." />}
    </main>
  )
}
