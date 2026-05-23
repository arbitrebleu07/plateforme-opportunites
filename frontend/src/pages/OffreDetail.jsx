import { useParams, Link } from 'react-router-dom'
import { useOffre } from '../hooks/useOffres'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { typeColors } from '../utils/constants'

export default function OffreDetail() {
  const { id } = useParams()
  const { data: offre, loading, error } = useOffre(id)
  
  if (loading) return <LoadingSpinner size="lg" />
  if (error) return <ErrorMessage message="Offre non trouvée" />
  if (!offre) return <ErrorMessage message="Offre non trouvée" />
  
  const isExpired = offre.date_limite && new Date(offre.date_limite) < new Date()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/offres" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← Retour aux offres
      </Link>
      
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant={typeColors[offre.type] || 'default'}>
            {offre.type}
          </Badge>
          {offre.categories?.map((cat) => (
            <Badge key={cat.id_categorie} variant="secondary">
              {cat.nom}
            </Badge>
          ))}
          {isExpired && <Badge variant="danger">Expirée</Badge>}
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {offre.titre}
        </h1>
        
        {offre.entreprise && (
          <h2 className="text-xl text-gray-600 mb-4">{offre.entreprise}</h2>
        )}
        
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
          {offre.localisation && (
            <span>📍 {offre.localisation}</span>
          )}
          <span>📅 Publié le {new Date(offre.date_publication).toLocaleDateString('fr-FR')}</span>
          {offre.date_limite && (
            <span className={isExpired ? 'text-red-500' : ''}>
              ⏰ Limite: {new Date(offre.date_limite).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
        
        <div className="prose max-w-none mb-8">
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-line">{offre.description}</p>
        </div>
        
        {offre.sources?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Sources</h3>
            <ul className="list-disc list-inside text-gray-600">
              {offre.sources.map((source) => (
                <li key={source.id_source}>{source.nom}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex gap-4">
          {!isExpired && (
            <Button size="lg" className="flex-1">
              Postuler maintenant
            </Button>
          )}
          <Button variant="outline" size="lg">
            Partager
          </Button>
        </div>
      </div>
    </div>
  )
}