import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useMyOffres } from '../hooks/useOffres'
import { useNotifications } from '../hooks/useNotifications'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { notificationsService } from '../services/notificationsService'
import { offresService } from '../services/offresService'

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
  
  const handleDeleteOffre = async (offreId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      try {
        await offresService.delete(offreId)
        refetchMyOffres()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bienvenue, {user?.name} 👋
          </h1>
          <p className="text-gray-600">Gérez vos opportunités et restez informé</p>
        </div>
        <Link to="/offres/new">
          <Button>+ Nouvelle offre</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1 opacity-90">Total annonces</h3>
              <div className="text-4xl font-bold">{total}</div>
            </div>
            <div className="text-5xl opacity-20">📊</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1 opacity-90">Actives</h3>
              <div className="text-4xl font-bold">{activeCount}</div>
            </div>
            <div className="text-5xl opacity-20">✅</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1 opacity-90">Expirées</h3>
              <div className="text-4xl font-bold">{expiredCount}</div>
            </div>
            <div className="text-5xl opacity-20">⏰</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1 opacity-90">Notifications</h3>
              <div className="text-4xl font-bold">
                {notifications?.filter(n => !n.lu).length || 0}
              </div>
            </div>
            <div className="text-5xl opacity-20">🔔</div>
          </div>
        </Card>
      </div>
      
      {/* Notifications Section */}
      {notifications && notifications.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>Notifications</span>
            {notifications.filter(n => !n.lu).length > 0 && (
              <Badge variant="danger" className="text-xs">{notifications.filter(n => !n.lu).length} non lues</Badge>
            )}
          </h2>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Card key={notif.id_notification} className={`flex justify-between items-start border-l-4 ${!notif.lu ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-gray-200'} shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">{notif.titre || 'Notification'}</p>
                  <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(notif.date_notification).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!notif.lu && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead(notif.id_notification)}
                    className="ml-4"
                  >
                    Marquer comme lu
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mes annonces récentes</h2>
        <Link to="/mes-annonces">
          <Button variant="outline">Voir toutes mes annonces →</Button>
        </Link>
      </div>
      
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : myOffres.length === 0 ? (
        <Card className="text-center py-16 bg-gray-50 border-0">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune offre publiée</h3>
          <p className="text-gray-500 mb-4">Commencez par créer votre première opportunité</p>
          <Link to="/offres/new">
            <Button>Créer une offre</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myOffres.map((offre) => (
            <Card key={offre.id_offre} className="flex justify-between items-start bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">{offre.titre}</h3>
                <p className="text-sm text-indigo-600 font-medium mb-2">{offre.type}</p>
                <Badge variant={offre.statut === 'active' ? 'success' : 'danger'} className="text-xs">
                  {offre.statut}
                </Badge>
              </div>
              <div className="flex gap-2 ml-4">
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