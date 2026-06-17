import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { typeColors, getStatutBadgeVariant } from '../../utils/constants'

export function OfferCard({ offre }) {
  const isExpired = offre.statut === 'expiree'
  
  return (
    <Card hover className="h-full flex flex-col bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <Badge variant={typeColors[offre.type] || 'default'} className="text-xs font-semibold px-3 py-1">
          {offre.type}
        </Badge>
        <Badge variant={getStatutBadgeVariant(offre.statut)} className="text-xs font-semibold px-3 py-1">
          {offre.statut}
        </Badge>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200">
        {offre.titre}
      </h3>
      
      {offre.entreprise && (
        <p className="text-sm text-indigo-600 font-medium mb-2">{offre.entreprise}</p>
      )}
      
      {offre.localisation && (
        <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {offre.localisation}
        </p>
      )}
      
      <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow leading-relaxed">
        {offre.description}
      </p>
      
      <div className="flex justify-between items-center text-xs text-gray-500 mb-4 pt-4 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(offre.date_publication).toLocaleDateString('fr-FR')}
        </span>
        {offre.date_limite && (
          <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500 font-semibold' : ''}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {new Date(offre.date_limite).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>
      
      <Link
        to={`/offres/${offre.id_offre}`}
        className="mt-auto w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
      >
        Voir l'offre
      </Link>
    </Card>
  )
}
