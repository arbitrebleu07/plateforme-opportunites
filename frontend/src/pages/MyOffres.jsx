import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyOffres } from '../hooks/useOffres'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Pagination } from '../components/ui/Pagination'
import { Select } from '../components/ui/Select'
import { offresService } from '../services/offresService'
import { getStatutBadgeVariant } from '../utils/constants'
import { confirmAndDelete } from '../utils/confirmAction'
import { formatDate } from '../utils/formatDate'

export default function MyOffres() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  
  const { data: paginatedData, loading, refetch } = useMyOffres({
    page,
    per_page: 12,
    statut: statusFilter,
  })
  
  const myOffres = paginatedData?.data || []
  
  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus)
    setPage(1)
  }
  
  const handleDeleteOffre = (offreId) =>
    confirmAndDelete(
      'Êtes-vous sûr de vouloir supprimer cette offre ?',
      () => offresService.delete(offreId),
      refetch
    )
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Mes annonces
        </h1>
        <Link to="/offres/new">
          <Button>+ Nouvelle offre</Button>
        </Link>
      </div>
      
      {/* Filtres */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filtrer par statut :</label>
          <Select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-48"
          >
            <option value="">Tous</option>
            <option value="active">Actives</option>
            <option value="expiree">Expirées</option>
          </Select>
        </div>
      </Card>
      
      {/* Liste des offres */}
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : myOffres.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {statusFilter ? 'Aucune offre ne correspond à ce filtre' : 'Vous n\'avez pas encore publié d\'offre'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myOffres.map((offre) => (
              <Card key={offre.id_offre} hover>
                <div className="flex justify-between items-start mb-3">
                  <Badge variant={getStatutBadgeVariant(offre.statut)}>
                    {offre.statut}
                  </Badge>
                  <Badge variant="primary">{offre.type}</Badge>
                </div>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">{offre.titre}</h3>
                {offre.entreprise && (
                  <p className="text-sm text-gray-600 mb-2">{offre.entreprise}</p>
                )}
                {offre.localisation && (
                  <p className="text-sm text-gray-500 mb-2">📍 {offre.localisation}</p>
                )}
                {offre.date_limite && (
                  <p className="text-sm text-gray-500 mb-4">
                    📅 Limite : {formatDate(offre.date_limite)}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <Link to={`/offres/${offre.id_offre}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Voir
                    </Button>
                  </Link>
                  <Link to={`/offres/${offre.id_offre}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Modifier
                    </Button>
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
          
          <Pagination data={paginatedData} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  )
}
