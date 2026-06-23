import { Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmModal } from '../components/ConfirmModal'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge, TypeBadge } from '../components/TypeBadge'
import { Toast } from '../components/Toast'
import { offresService } from '../services/offresService'
import { normalizeOpportunity } from '../services/opportunities'

export default function MyOffres() {
  const [status, setStatus] = useState('')
  const [offres, setOffres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await offresService.getMyOffres({
        statut: status || undefined,
        per_page: 100,
      })
      setOffres((data.data || data).map(normalizeOpportunity))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Impossible de charger vos annonces.')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { load() }, [load])

  const confirmDelete = async () => {
    try {
      await offresService.delete(deleting.id)
      setDeleting(null)
      setToast('Annonce supprimée avec succès.')
      await load()
    } catch (requestError) {
      setDeleting(null)
      setToast(requestError.response?.data?.message || 'La suppression a échoué.')
    }
  }

  return (
    <main id="main-content" className="page-shell page-content" tabIndex="-1">
      <div className="section-heading"><div className="page-title"><h1>Mes annonces</h1><p>Gérez les opportunités que vous avez publiées.</p></div><Link className="button button-primary" to="/publier"><Plus size={16} /> Nouvelle offre</Link></div>
      <div className="simple-filter"><label>Filtrer par statut<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tous</option><option value="active">Actives</option><option value="expiree">Expirées</option></select></label></div>
      {loading ? <div className="loading-state">Chargement de vos annonces...</div> : error ? (
        <EmptyState title={error} actionLabel="Réessayer" onAction={load} />
      ) : offres.length ? (
        <div className="my-offers">
          {offres.map((offre) => (
            <article key={offre.id}>
              <div><TypeBadge type={offre.type} /><h3>{offre.titre}</h3><p>{offre.entreprise} · {offre.localisation}</p></div>
              <div className="status-stack">
                <StatusBadge status={offre.statut} />
                <StatusBadge status={offre.moderation_status} />
              </div>
              <div className="row-actions">
                <Link className="button button-outline" to={`/opportunites/${offre.id}`}>Voir</Link>
                <button className="button button-danger" onClick={() => setDeleting(offre)}><Trash2 size={15} /> Supprimer</button>
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyState title="Vous n'avez pas encore publié d'annonce." actionLabel="Publier ma première offre" onAction={() => window.location.assign('/publier')} />}
      <ConfirmModal open={Boolean(deleting)} title="Supprimer cette annonce ?" description={deleting?.titre} confirmLabel="Supprimer" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
      <Toast message={toast} onClose={() => setToast('')} />
    </main>
  )
}
