import { ArrowLeft, ArrowUpRight, Bookmark, Building2, CalendarDays, Flag, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Toast } from '../components/Toast'
import { TypeBadge } from '../components/TypeBadge'
import { useAuth } from '../context/useAuth'
import { engagementService } from '../services/engagementService'
import { getOpportunity } from '../services/opportunities'
import NotFound from './NotFound'

export default function OffreDetail() {
  const { id } = useParams()
  const [offre, setOffre] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [favorite, setFavorite] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [report, setReport] = useState({ motif: 'information_incorrecte', details: '' })
  const [toast, setToast] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    let active = true
    setLoading(true)
    getOpportunity(id)
      .then((row) => {
        if (active) setOffre(row)
      })
      .catch((error) => {
        if (active) setNotFound(error.response?.status === 404)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!user) return
    engagementService.getFavorites()
      .then(({ data }) => setFavorite(data.some((item) => String(item.id_offre) === String(id))))
      .catch(() => {})
  }, [id, user])

  if (loading) {
    return <main className="page-shell page-content"><div className="loading-state">Chargement de l'opportunité...</div></main>
  }
  if (notFound || !offre) return <NotFound />

  const sourceLinkProps = offre.lien_source === '#'
    ? { 'aria-disabled': true, onClick: (event) => event.preventDefault() }
    : { href: offre.lien_source, target: '_blank', rel: 'noreferrer' }

  return (
    <main id="main-content" tabIndex="-1">
      <section className="detail-hero">
        <div className="page-shell">
          <Link className="detail-back" to="/opportunites">
            <ArrowLeft size={17} /> Retour aux offres
          </Link>
          <div className="detail-heading">
            <div className={`detail-avatar avatar-${offre.type.toLowerCase()}`}>
              {offre.logo_initiales}
            </div>
            <div className="detail-title">
              <TypeBadge type={offre.type} />
              <h1>{offre.titre}</h1>
              <p>{offre.entreprise} · {offre.localisation} · {offre.categorie}</p>
            </div>
            <div className="detail-cta">
              <a className="button button-yellow" {...sourceLinkProps}>
                Voir la source <ArrowUpRight size={17} />
              </a>
              <small>{offre.date_publication}</small>
              {user && (
                <button
                  className="button button-mint"
                  aria-pressed={favorite}
                  onClick={async () => {
                    if (favorite) await engagementService.removeFavorite(offre.id)
                    else await engagementService.addFavorite(offre.id)
                    setFavorite(!favorite)
                    setToast(favorite ? 'Retirée des favoris.' : 'Ajoutée aux favoris.')
                  }}
                >
                  <Bookmark size={16} fill={favorite ? 'currentColor' : 'none'} />
                  {favorite ? 'Dans mes favoris' : 'Ajouter aux favoris'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell detail-layout">
        <article className="content-card">
          <h2>À propos de l'opportunité</h2>
          <p>{offre.description}</p>

          {offre.competences.length > 0 && (
            <>
              <h3>Catégories associées</h3>
              <div className="chip-row">
                {offre.competences.map((skill) => <span className="chip" key={skill}>{skill}</span>)}
              </div>
            </>
          )}

          <div className="source-block">
            <h3>Source de l'annonce</h3>
            <p>
              Cette opportunité a été collectée sur {offre.source} et classée automatiquement.
              Vérifiez toujours les informations officielles avant de postuler.
            </p>
            <a className="button button-mint" {...sourceLinkProps}>
              Consulter l'annonce <ArrowUpRight size={16} />
            </a>
          </div>
        </article>

        <aside className="detail-sidebar">
          <div className="info-card">
            <h3>Informations clés</h3>
            <div><MapPin /><span><small>Localisation</small>{offre.localisation}</span></div>
            <div><TypeBadge type={offre.type} /><span><small>Type</small>{offre.categorie}</span></div>
            <div><Building2 /><span><small>Entreprise</small>{offre.entreprise}</span></div>
            <div><CalendarDays /><span><small>Date limite</small>{offre.date_limite || 'Non communiquée'}</span></div>
          </div>
          <div className="interest-card">
            <h3>Cette offre vous intéresse ?</h3>
            <p>Consultez la source officielle pour vérifier les conditions et postuler.</p>
            <a className="button button-yellow" {...sourceLinkProps}>
              Accéder à la source <ArrowUpRight size={16} />
            </a>
            {user && <button className="button button-outline" onClick={() => setReportOpen(!reportOpen)}><Flag size={16} /> Signaler l’annonce</button>}
            {reportOpen && (
              <form className="report-form" onSubmit={async (event) => {
                event.preventDefault()
                await engagementService.report(offre.id, report)
                setReportOpen(false)
                setToast('Merci, votre signalement a été transmis.')
              }}>
                <label>Motif<select value={report.motif} onChange={(event) => setReport({ ...report, motif: event.target.value })}><option value="information_incorrecte">Information incorrecte</option><option value="lien_invalide">Lien invalide</option><option value="annonce_expiree">Annonce expirée</option><option value="fraude">Fraude suspectée</option><option value="autre">Autre</option></select></label>
                <label>Détails<textarea rows="3" value={report.details} onChange={(event) => setReport({ ...report, details: event.target.value })} /></label>
                <button className="button button-danger" type="submit">Envoyer le signalement</button>
              </form>
            )}
          </div>
        </aside>
      </section>
      <Toast message={toast} onClose={() => setToast('')} />
    </main>
  )
}
