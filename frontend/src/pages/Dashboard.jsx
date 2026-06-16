import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useMyOffres } from '../hooks/useOffres'
import { useNotifications } from '../hooks/useNotifications'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { StatCard } from '../components/ui/StatCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { notificationsService } from '../services/notificationsService'
import { offresService } from '../services/offresService'
import { confirmAndDelete } from '../utils/confirmAction'
import { formatDate } from '../utils/formatDate'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: myOffresData, loading, refetch: refetchMyOffres } = useMyOffres()
  const { data: notifications, refetch: refetchNotifications } = useNotifications()
  
  const myOffres = myOffresData?.data || []
  const total = myOffresData?.total || 0
  const activeCount = myOffres.filter(o => o.statut === 'active').length
  const expiredCount = myOffres.filter(o => o.statut === 'expiree').length
  
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsService.markAsRead(notificationId)
      refetchNotifications()
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
    }
  }
  
  const handleDeleteOffre = (offreId) =>
    confirmAndDelete(
      'Êtes-vous sûr de vouloir supprimer cette offre ?',
      () => offresService.delete(offreId),
      refetchMyOffres
    )
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Bienvenue, {user?.name}
        </h1>
        <Link to="/offres/new">
          <Button>+ Nouvelle offre</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total annonces" value={total} color="blue" />
        <StatCard label="Actives" value={activeCount} color="green" />
        <StatCard label="Expirées" value={expiredCount} color="red" />
        <StatCard label="Notifications" value={notifications?.filter(n => !n.lu).length || 0} color="purple" />
      </div>
      
      {/* Notifications Section */}
      {notifications && notifications.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Notifications</h2>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Card key={notif.id_notification} className={`flex justify-between items-center ${!notif.lu ? 'bg-blue-50' : ''}`}>
                <div>
                  <p className="font-medium text-gray-800">{notif.titre || 'Notification'}</p>
                  <p className="text-sm text-gray-600">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(notif.date_notification)}
                  </p>
                </div>
                {!notif.lu && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead(notif.id_notification)}
                  >
                    Marquer comme lu
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Mes annonces</h2>
        <Link to="/mes-annonces">
          <Button variant="outline">Voir toutes mes annonces →</Button>
        </Link>
      </div>
      
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : myOffres.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Vous n'avez pas encore publié d'offre
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myOffres.map((offre) => (
            <Card key={offre.id_offre} className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{offre.titre}</h3>
                <p className="text-sm text-gray-600">{offre.type}</p>
                <Badge variant={offre.statut === 'active' ? 'success' : 'danger'}>
                  {offre.statut}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Link to={`/offres/${offre.id_offre}/edit`}>
                  <Button variant="outline" size="sm">Modifier</Button>
                </Link>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => handleDeleteOffre(offre.id_offre)}
                >
                  Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}