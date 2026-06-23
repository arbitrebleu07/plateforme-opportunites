import { useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { OfferCard } from '../components/OfferCard'
import { engagementService } from '../services/engagementService'
import { normalizeOpportunity } from '../services/opportunities'

export default function Favorites() {
  const [offres, setOffres] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    engagementService.getFavorites()
      .then(({ data }) => setOffres(data.map(normalizeOpportunity)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main id="main-content" className="page-shell page-content" tabIndex="-1">
      <div className="page-title">
        <h1>Mes favoris</h1>
        <p>Retrouvez les opportunités que vous souhaitez suivre.</p>
      </div>
      {loading ? <div className="loading-state">Chargement des favoris…</div> : offres.length ? (
        <div className="offer-list">
          {offres.map((offre) => <OfferCard key={offre.id} offre={offre} horizontal />)}
        </div>
      ) : (
        <EmptyState
          title="Aucun favori pour le moment."
          description="Ajoutez des annonces depuis leur page de détail."
        />
      )}
    </main>
  )
}
