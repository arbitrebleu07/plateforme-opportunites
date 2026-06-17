import { useState } from 'react'
import { useAdminStats, useAdminUsers, useAdminOffres } from '../hooks/useAdmin'
import { adminService } from '../services/adminService'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats')
  
  const { data: stats, loading: statsLoading, error: statsError } = useAdminStats()
  const { data: users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useAdminUsers()
  const { data: adminOffres, loading: offresLoading, error: offresError, refetch: refetchOffres } = useAdminOffres()
  
  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole)
      refetchUsers()
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error)
    }
  }
  
  const handleDeleteUser = async (userId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await adminService.deleteUser(userId)
        refetchUsers()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }
  
  const handleUpdateOffreStatus = async (offreId, currentStatus, newStatus) => {
    // Empêcher de réactiver une offre expirée
    if (currentStatus === 'expiree' && newStatus === 'active') {
      alert('Cette offre a été expirée et ne peut plus être réactivée.')
      return
    }

    try {
      await adminService.updateOffreStatus(offreId, newStatus)
      refetchOffres()
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
    }
  }
  
  const handleDeleteOffre = async (offreId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      try {
        await adminService.deleteOffre(offreId)
        refetchOffres()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Dashboard Admin
      </h1>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium ${activeTab === 'stats' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Statistiques
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Utilisateurs
        </button>
        <button
          onClick={() => setActiveTab('offres')}
          className={`px-4 py-2 font-medium ${activeTab === 'offres' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Offres
        </button>
      </div>
      
      {activeTab === 'stats' && (
        <div>
          {statsError ? (
            <ErrorMessage message="Erreur de chargement des statistiques" />
          ) : statsLoading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Utilisateurs</h3>
                <div className="text-3xl font-bold text-blue-600">{stats?.users_count || 0}</div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Offres totales</h3>
                <div className="text-3xl font-bold text-green-600">{stats?.offres_count || 0}</div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Offres actives</h3>
                <div className="text-3xl font-bold text-yellow-600">{stats?.active_offres_count || 0}</div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Catégories</h3>
                <div className="text-3xl font-bold text-purple-600">{stats?.categories_count || 0}</div>
              </Card>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'users' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestion des utilisateurs</h2>
          {usersError ? (
            <ErrorMessage message="Erreur de chargement des utilisateurs" onRetry={refetchUsers} />
          ) : usersLoading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users?.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={u.role === 'admin' ? 'danger' : 'default'}>
                          {u.role || 'user'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={u.role || 'user'}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          className="text-sm border rounded px-2 py-1 mr-2"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'offres' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestion des offres</h2>
          {offresError ? (
            <ErrorMessage message="Erreur de chargement des offres" onRetry={refetchOffres} />
          ) : offresLoading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {adminOffres?.map((o) => (
                      <tr key={o.id_offre}>
                        <td className="px-6 py-4 whitespace-nowrap">{o.titre}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="primary">{o.type}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={o.statut === 'active' ? 'success' : 'danger'}>
                            {o.statut}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-nowrap gap-2 overflow-x-auto">
                            <select
                              value={o.statut}
                              onChange={(e) => handleUpdateOffreStatus(o.id_offre, o.statut, e.target.value)}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="active">Active</option>
                              <option value="expiree">Expirée</option>
                            </select>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteOffre(o.id_offre)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
