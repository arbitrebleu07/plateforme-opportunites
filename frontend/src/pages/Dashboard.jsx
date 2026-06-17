import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useMyOffres } from '../hooks/useOffres'
import { useNotifications } from '../hooks/useNotifications'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { notificationsService } from '../services/notificationsService'
import { offresService } from '../services/offresService'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: myOffresData, loading, error: offresError, refetch: refetchMyOffres } = useMyOffres()
  const { data: notifications, error: notifError, refetch: refetchNotifications } = useNotifications()
  const [actionError, setActionError] = useState(null)
  
  const myOffres = myOffresData?.data || []
  const total = myOffresData?.total || 0
  const activeCount = myOffres.filter(o => o.statut === 'active').length
  const expiredCount = myOffres.filter(o => o.statut === 'expiree').length
  
  const handleMarkAsRead = async (notificationId) => {
    setActionError(null)
    try {
      await notificationsService.markAsRead(notificationId)
      refetchNotifications()
    } catch (error) {
      const msg = error.response?.data?.message || 'Erreur lors du marquage comme lu'
      setActionError(msg)
    }
  }
  
  const handleDeleteOffre = async (offreId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      setActionError(null)
      try {
        await offresService.delete(offreId)
        refetchMyOffres()
      } catch (error) {
        const msg = error.response?.data?.message || 'Erreur lors de la suppression de l\'offre'
        setActionError(msg)
      }
    }
  }
  
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
      
      {(actionError || offresError || notifError) && (
        <ErrorMessage message={actionError || 'Erreur de chargement des données'} />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total annonces</h3>
          <div className="text-3xl font-bold text-blue-600">{total}</div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Actives</h3>
          <div className="text-3xl font-bold text-green-600">{activeCount}</div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Expirées</h3>
          <div className="text-3xl font-bold text-red-600">{expiredCount}</div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Notifications</h3>
          <div className="text-3xl font-bold text-purple-600">
            {notifications?.filter(n => !n.lu).length || 0}
          </div>
        </Card>
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
                    {new Date(notif.date_notification).toLocaleDateString('fr-FR')}
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