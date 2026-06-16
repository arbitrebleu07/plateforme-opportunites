import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { typeColors, getStatutBadgeVariant } from '../../utils/constants'
import { formatDate } from '../../utils/formatDate'

export function OfferCard({ offre }) {
  const isExpired = offre.statut === 'expiree'
  
  return (
    <Card hover className="h-full flex flex-col">
      <div className="flex justify-between items-start mb-3">
        <Badge variant={typeColors[offre.type] || 'default'}>
          {offre.type}
        </Badge>
        <Badge variant={getStatutBadgeVariant(offre.statut)}>
          {offre.statut}
        </Badge>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
        {offre.titre}
      </h3>
      
      {offre.entreprise && (
        <p className="text-sm text-gray-600 mb-2">{offre.entreprise}</p>
      )}
      
      {offre.localisation && (
        <p className="text-sm text-gray-500 mb-3">📍 {offre.localisation}</p>
      )}
      
      <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">
        {offre.description}
      </p>
      
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Publié le {formatDate(offre.date_publication)}</span>
        {offre.date_limite && (
          <span className={isExpired ? 'text-red-500' : ''}>
            Limite: {formatDate(offre.date_limite)}
          </span>
        )}
      </div>
      
      <Link
        to={`/offres/${offre.id_offre}`}
        className="mt-4 w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Voir l'offre
      </Link>
    </Card>
  )
}
