import {
  ArrowLeft, BarChart3, BookOpen, Bot, CheckCircle2, Clock3, Database,
  ExternalLink, Menu, Play, RefreshCw, ShieldCheck, Trash2, TriangleAlert, Users, X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { ConfirmModal } from '../components/ConfirmModal'
import { StatusBadge, TypeBadge } from '../components/TypeBadge'
import { Toast } from '../components/Toast'
import { useAuth } from '../context/useAuth'
import { adminService } from '../services/adminService'
import { normalizeOpportunity } from '../services/opportunities'

const sourceOptions = [
  ['all', 'Toutes les sources'],
  ['infos_concours_education', 'Infos Concours Education'],
  ['kamerpower', 'Kamerpower'],
  ['emplois_cm', 'Emploi.cm'],
  ['minajobs', 'MinaJobs'],
  ['jooble', 'Jooble'],
  ['coursera', 'TrainingInformation'],
]

const sourceLabels = Object.fromEntries(sourceOptions)

export default function AdminDashboard({ onLogout }) {
  const { user } = useAuth()
  const [tab, setTab] = useState('overview')
  const [drawer, setDrawer] = useState(false)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [scraper, setScraper] = useState({ source: 'all', limit: 20 })
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [moderation, setModeration] = useState([])
  const [reports, setReports] = useState([])
  const [deletingOffer, setDeletingOffer] = useState(null)
  const initialLoad = useRef(false)

  const loadStats = useCallback(async () => {
    setError('')
    try {
      const { data } = await adminService.getStats()
      setStats(data)
      const activeRun = data.scraper_runs?.find((run) => run.status === 'running')
      setRunning(Boolean(activeRun))
      if (activeRun) {
        setLastResult(activeRun)
      } else if (data.scraper_runs?.[0]) {
        setLastResult(data.scraper_runs[0])
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de charger les données d'administration.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialLoad.current) return
    initialLoad.current = true
    loadStats()
  }, [loadStats])

  useEffect(() => {
    if (!running) return undefined
    const interval = window.setInterval(loadStats, 4000)
    return () => window.clearInterval(interval)
  }, [running, loadStats])

  useEffect(() => {
    if (running || !['overview', 'offers', 'sources'].includes(tab)) return undefined

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadStats()
    }

    const interval = window.setInterval(refreshWhenVisible, 10000)
    window.addEventListener('focus', loadStats)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', loadStats)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [running, tab, loadStats])

  const runScraper = async () => {
    setRunning(true)
    setLastResult(null)
    try {
      const { data } = await adminService.runScraper(scraper.source, Number(scraper.limit))
      setLastResult(data.run)
      setRunning(true)
      setToast(data.message || 'Collecte lancée en arrière-plan.')
      await loadStats()
    } catch (requestError) {
      const run = requestError.response?.data?.run
      if (run) setLastResult(run)
      setRunning(false)
      setToast(requestError.response?.data?.message || 'La collecte a échoué.')
      await loadStats()
    }
  }

  const loadModeration = useCallback(async () => {
    try {
      const [offersResponse, reportsResponse] = await Promise.all([
        adminService.getModerationQueue(),
        adminService.getReports(),
      ])
      setModeration(offersResponse.data)
      setReports(reportsResponse.data)
    } catch {
      // La prochaine synchronisation réessaiera automatiquement.
    }
  }, [])

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadModeration()
    }

    loadModeration()
    const interval = window.setInterval(refreshWhenVisible, 4000)
    window.addEventListener('focus', loadModeration)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', loadModeration)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [loadModeration])

  const menu = [
    ['overview', BarChart3, "Vue d'ensemble"],
    ['scraper', Bot, 'Centre de collecte'],
    ['moderation', ShieldCheck, 'Modération', moderation.length + reports.filter((report) => ['nouveau', 'en_cours'].includes(report.statut)).length],
    ['offers', BookOpen, 'Dernières offres'],
    ['sources', Database, 'Sources'],
  ]

  const changeTab = (next) => {
    setTab(next)
    setDrawer(false)
  }

  const confirmDeleteOffer = async () => {
    if (!deletingOffer) return

    try {
      await adminService.deleteOffre(deletingOffer.id)
      setDeletingOffer(null)
      setToast('Offre supprimée avec succès.')
      await loadStats()
      if (tab === 'moderation') await loadModeration()
    } catch (requestError) {
      setDeletingOffer(null)
      setToast(requestError.response?.data?.message || "La suppression de l'offre a échoué.")
    }
  }

  return (
    <main className="admin-layout">
      {drawer && <button className="admin-overlay" onClick={() => setDrawer(false)} aria-label="Fermer le menu" />}
      <aside className={`admin-sidebar ${drawer ? 'admin-sidebar-open' : ''}`}>
        <div className="admin-logo-row">
          <BrandLogo light />
          <button className="icon-button admin-drawer-close" onClick={() => setDrawer(false)}><X /></button>
        </div>
        <small>ADMINISTRATION</small>
        <nav>
          {menu.map(([id, Icon, label, count]) => (
            <button className={tab === id ? 'active' : ''} key={id} onClick={() => changeTab(id)}>
              <Icon size={18} /> {label}
              {count > 0 && <span className="admin-menu-count">{count > 99 ? '99+' : count}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link to="/"><ArrowLeft size={18} /> Retour au site</Link>
          <button onClick={onLogout}><ShieldCheck size={18} /> Déconnexion</button>
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-header">
          <button className="admin-menu-button icon-button" onClick={() => setDrawer(true)}><Menu /></button>
          <div>
            <h1>{menu.find(([id]) => id === tab)?.[2]}</h1>
            <p>Données calculées en direct depuis Laravel et le pipeline de collecte.</p>
          </div>
          <div className="admin-profile">
            <span>{initials(user?.name)}</span>
            <div><strong>{user?.name || 'Administrateur'}</strong><small>Accès sécurisé</small></div>
          </div>
        </header>

        {loading && <div className="loading-state">Chargement des indicateurs...</div>}
        {error && <div className="admin-error"><TriangleAlert /> <span>{error}</span><button className="button button-outline" onClick={loadStats}>Réessayer</button></div>}
        {!loading && !error && tab === 'overview' && <Overview stats={stats} onRefresh={loadStats} onOpenScraper={() => setTab('scraper')} onDelete={setDeletingOffer} />}
        {!loading && !error && tab === 'scraper' && (
          <ScraperCenter
            form={scraper}
            setForm={setScraper}
            running={running}
            runScraper={runScraper}
            runs={stats?.scraper_runs || []}
            lastResult={lastResult}
          />
        )}
        {!loading && !error && tab === 'moderation' && (
          <ModerationCenter
            offers={moderation}
            reports={reports}
            refresh={loadModeration}
            notify={setToast}
            onDelete={setDeletingOffer}
          />
        )}
        {!loading && !error && tab === 'offers' && <RecentOffers offers={stats?.recent_offres || []} onDelete={setDeletingOffer} />}
        {!loading && !error && tab === 'sources' && <Sources sources={stats?.sources || []} />}
      </section>

      <Toast message={toast} onClose={() => setToast('')} />
      <ConfirmModal
        open={Boolean(deletingOffer)}
        title="Supprimer cette offre ?"
        description={deletingOffer ? `« ${deletingOffer.titre} » sera définitivement supprimée.` : ''}
        confirmLabel="Supprimer l'offre"
        onCancel={() => setDeletingOffer(null)}
        onConfirm={confirmDeleteOffer}
      />
    </main>
  )
}

function ModerationCenter({ offers, reports, refresh, notify, onDelete }) {
  const [rejectingOffer, setRejectingOffer] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionError, setRejectionError] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [processingReport, setProcessingReport] = useState(null)

  const decide = async (id, decision, note = '') => {
    await adminService.moderateOffer(id, decision, note)
    notify(decision === 'approved' ? 'Annonce approuvée.' : 'Annonce refusée.')
    await refresh()
  }

  const closeRejection = () => {
    if (rejecting) return
    setRejectingOffer(null)
    setRejectionReason('')
    setRejectionError('')
  }

  const submitRejection = async (event) => {
    event.preventDefault()
    const reason = rejectionReason.trim()

    if (!reason) {
      setRejectionError('Le motif du refus est obligatoire.')
      return
    }

    setRejecting(true)
    setRejectionError('')

    try {
      await decide(rejectingOffer.id_offre, 'rejected', reason)
      setRejectingOffer(null)
      setRejectionReason('')
    } catch (error) {
      setRejectionError(error.response?.data?.errors?.note?.[0] || error.response?.data?.message || 'Le refus n’a pas pu être enregistré.')
    } finally {
      setRejecting(false)
    }
  }

  const updateReport = async (report, statut, message) => {
    setProcessingReport(report.id)
    try {
      await adminService.updateReport(report.id, statut)
      notify(message)
      await refresh()
    } catch (error) {
      notify(error.response?.data?.message || 'Le signalement n’a pas pu être mis à jour.')
    } finally {
      setProcessingReport(null)
    }
  }
  return (
    <>
      <div className="moderation-grid">
      <section className="admin-card">
        <h2>Annonces en attente</h2>
        <div className="moderation-list">
          {offers.map((offer) => (
            <article key={offer.id_offre}>
              <div><strong>{offer.titre}</strong><small>{offer.entreprise} · {offer.localisation}</small></div>
              <div className="row-actions">
                <button className="button button-primary" onClick={() => decide(offer.id_offre, 'approved')}>Approuver</button>
                <button className="button button-outline" onClick={() => {
                  setRejectingOffer(offer)
                  setRejectionReason('')
                  setRejectionError('')
                }}>Refuser</button>
                <button className="button button-danger" onClick={() => onDelete(normalizeOpportunity(offer))}><Trash2 size={15} /> Supprimer</button>
              </div>
            </article>
          ))}
          {!offers.length && <p>Aucune annonce en attente.</p>}
        </div>
      </section>
      <section className="admin-card">
        <h2>Signalements</h2>
        <p className="admin-card-help">
          « Prendre en charge » indique qu’un administrateur vérifie l’annonce.
          Résolvez un signalement fondé, ou classez-le sans suite s’il n’est pas justifié.
        </p>
        <div className="moderation-list">
          {reports.map((report) => (
            <article key={report.id}>
              <div>
                <strong>{report.offre?.titre}</strong>
                <small>{report.motif} · signalé par {report.user?.name}</small>
                <span className={`report-status report-status-${report.statut}`}>
                  {report.statut === 'nouveau' && 'À vérifier'}
                  {report.statut === 'en_cours' && 'Vérification en cours'}
                  {report.statut === 'resolu' && 'Résolu'}
                  {report.statut === 'rejete' && 'Classé sans suite'}
                </span>
                <p>{report.details || 'Aucun détail supplémentaire.'}</p>
              </div>
              <div className="row-actions report-actions">
                {report.statut === 'nouveau' && (
                  <button className="button button-outline" disabled={processingReport === report.id} onClick={() => updateReport(report, 'en_cours', 'Signalement pris en charge.')}>
                    <Clock3 size={15} /> Prendre en charge
                  </button>
                )}
                {report.statut === 'en_cours' && (
                  <>
                    <button className="button button-primary" disabled={processingReport === report.id} onClick={() => updateReport(report, 'resolu', 'Signalement marqué comme résolu.')}>
                      <CheckCircle2 size={15} /> Marquer résolu
                    </button>
                    <button className="button button-outline" disabled={processingReport === report.id} onClick={() => updateReport(report, 'rejete', 'Signalement classé sans suite.')}>
                      <X size={15} /> Classer sans suite
                    </button>
                  </>
                )}
                {['resolu', 'rejete'].includes(report.statut) && (
                  <button className="button button-outline" disabled={processingReport === report.id} onClick={() => updateReport(report, 'nouveau', 'Signalement rouvert.')}>
                    <RefreshCw size={15} /> Rouvrir
                  </button>
                )}
              </div>
            </article>
          ))}
          {!reports.length && <p>Aucun signalement.</p>}
        </div>
        </section>
      </div>

      {rejectingOffer && (
        <div className="modal-overlay" role="presentation">
          <form className="confirm-modal rejection-modal" role="dialog" aria-modal="true" aria-labelledby="rejection-title" onSubmit={submitRejection}>
            <button type="button" className="icon-button modal-close" onClick={closeRejection} aria-label="Fermer"><X /></button>
            <h2 id="rejection-title">Refuser cette annonce ?</h2>
            <p>Indiquez clairement à son propriétaire ce qui doit être corrigé dans « {rejectingOffer.titre} ».</p>
            <label htmlFor="rejection-reason">Motif du refus</label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(event) => {
                setRejectionReason(event.target.value)
                if (rejectionError) setRejectionError('')
              }}
              maxLength={500}
              rows={5}
              required
              autoFocus
            />
            {rejectionError && <p className="form-error" role="alert">{rejectionError}</p>}
            <div className="modal-actions">
              <button type="button" className="button button-outline" onClick={closeRejection} disabled={rejecting}>Annuler</button>
              <button type="submit" className="button button-danger" disabled={rejecting}>{rejecting ? 'Refus en cours…' : 'Confirmer le refus'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

function Overview({ stats, onRefresh, onOpenScraper, onDelete }) {
  const distribution = stats.type_distribution || []
  const max = Math.max(1, ...distribution.map((item) => item.total))
  const recent = (stats.recent_offres || []).map(normalizeOpportunity)

  const kpis = [
    ['Offres actives', stats.active_offres_count, `+${stats.offres_this_month} ce mois`, BookOpen],
    ['Utilisateurs', stats.users_count, `+${stats.users_this_month} ce mois`, Users],
    ['Sources actives', stats.active_sources_count, `${stats.sources_count} configurées`, Database],
    ['Doublons évités', stats.scraper_skipped_count, 'Depuis le centre de collecte', ShieldCheck],
  ]

  return (
    <>
      <div className="overview-toolbar">
        <div><strong>{stats.offres_count} offres enregistrées</strong><span>{stats.expired_offres_count} expirées · {stats.categories_count} catégories</span></div>
        <button className="button button-outline" onClick={onRefresh}><RefreshCw size={16} /> Actualiser</button>
      </div>
      <div className="kpi-grid">
        {kpis.map(([label, value, delta, Icon], index) => (
          <div className="kpi-card" key={label}>
            <small>{label}</small><strong>{value}</strong><span>{delta}</span>
            <i className={`kpi-icon kpi-${index}`}><Icon size={20} /></i>
          </div>
        ))}
      </div>
      <div className="admin-overview-grid">
        <section className="admin-card chart-card">
          <h2>Répartition réelle des opportunités</h2>
          <p>Offres actives groupées selon leur type enregistré.</p>
          <div className="bar-chart">
            {distribution.map((item) => (
              <div key={item.type}>
                <strong>{item.total}</strong>
                <span style={{ height: `${Math.max(18, (item.total / max) * 180)}px` }} />
                <small>{item.type}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="admin-card pipeline-card">
          <div className="pipeline-icon"><Bot /></div>
          <h2>Pipeline de collecte</h2>
          <strong>{stats.scraper_inserted_count}</strong>
          <p>offres insérées depuis les lancements administrateur.</p>
          <button className="button button-primary" onClick={onOpenScraper}>
            Piloter la collecte
          </button>
        </section>
      </div>
      <section className="admin-card">
        <div className="admin-card-heading"><div><h2>Dernières offres importées</h2><p>Les ajouts les plus récents de la base.</p></div></div>
        <OfferTable offers={recent} onDelete={onDelete} />
      </section>
    </>
  )
}

function ScraperCenter({ form, setForm, running, runScraper, runs, lastResult }) {
  return (
    <div className="scraper-center">
      <section className="scraper-command">
        <div className="scraper-command-copy">
          <span className="scraper-live"><i /> Collecte administrateur</span>
          <h2>Lancez une collecte ciblée.</h2>
          <p>Choisissez une source et un volume. Le pipeline nettoie, classe, déduplique puis importe automatiquement les nouvelles annonces.</p>
          <div className="scraper-steps">
            {['Collecte', 'Nettoyage UTF-8', 'Catégorisation', 'Déduplication', 'Import Laravel'].map((step, index) => (
              <span key={step}><b>{index + 1}</b>{step}</span>
            ))}
          </div>
        </div>
        <div className="scraper-controls">
          <label>Source
            <select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} disabled={running}>
              {sourceOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <label>Nombre maximum
            <input type="number" min="1" max="50" value={form.limit} onChange={(event) => setForm({ ...form, limit: event.target.value })} disabled={running} />
          </label>
          <button className="button button-yellow scraper-run-button" onClick={runScraper} disabled={running}>
            {running ? <><RefreshCw className="spin" /> Collecte en cours...</> : <><Play /> Lancer le scraper</>}
          </button>
          <small>Une seule collecte peut fonctionner à la fois. Limite de sécurité : 50 annonces par source.</small>
        </div>
      </section>

      {lastResult && <RunSummary run={lastResult} />}

      <section className="admin-card">
        <div className="admin-card-heading"><div><h2>Historique des collectes</h2><p>Rapports conservés pour suivre la qualité des imports.</p></div></div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead><tr><th>Démarrage</th><th>Source</th><th>État</th><th>Collectées</th><th>Insérées</th><th>Ignorées</th><th>Erreurs</th></tr></thead>
            <tbody>
              {runs.length ? runs.map((run) => (
                <tr key={run.id}>
                  <td><strong>{formatDate(run.started_at)}</strong><small>Limite {run.limit}</small></td>
                  <td>{sourceLabels[run.source] || run.source}</td>
                  <td><RunStatus status={run.status} /></td>
                  <td>{run.collected_count}</td><td>{run.inserted_count}</td><td>{run.skipped_count}</td><td>{run.error_count}</td>
                </tr>
              )) : <tr><td colSpan="7">Aucune collecte lancée depuis le dashboard.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function RunSummary({ run }) {
  const SummaryIcon = run.status === 'completed'
    ? CheckCircle2
    : run.status === 'running' ? Clock3 : TriangleAlert
  return (
    <section className={`run-summary run-${run.status}`}>
      <div><SummaryIcon /><span><strong>{run.message || 'Collecte en cours...'}</strong><small>{sourceLabels[run.source] || run.source}</small></span></div>
      <dl>
        <div><dt>Collectées</dt><dd>{run.collected_count}</dd></div>
        <div><dt>Insérées</dt><dd>{run.inserted_count}</dd></div>
        <div><dt>Ignorées</dt><dd>{run.skipped_count}</dd></div>
        <div><dt>Erreurs</dt><dd>{run.error_count}</dd></div>
      </dl>
    </section>
  )
}

function RecentOffers({ offers, onDelete }) {
  return <section className="admin-card"><div className="admin-card-heading"><div><h2>Dernières offres</h2><p>Données réelles, triées par date d'import décroissante.</p></div></div><OfferTable offers={offers.map(normalizeOpportunity)} onDelete={onDelete} /></section>
}

function OfferTable({ offers, onDelete }) {
  return (
    <div className="table-scroll">
      <table className="admin-table">
        <thead><tr><th>Titre</th><th>Type</th><th>Source</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.id}>
              <td><strong>{offer.titre}</strong><small>{offer.entreprise} · {offer.date_publication}</small></td>
              <td><TypeBadge type={offer.type} /></td><td>{offer.source}</td><td><StatusBadge status={offer.statut} /></td>
              <td>
                <div className="admin-offer-actions">
                  <Link className="icon-button" to={`/opportunites/${offer.id}`} target="_blank" aria-label={`Voir l'offre ${offer.titre}`}><ExternalLink /></Link>
                  <button className="icon-button admin-delete-action" onClick={() => onDelete(offer)} aria-label={`Supprimer l'offre ${offer.titre}`}><Trash2 /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Sources({ sources }) {
  return (
    <section className="admin-card">
      <div className="admin-card-heading"><div><h2>Sources enregistrées</h2><p>Volume réel d'opportunités associé à chaque source.</p></div></div>
      <div className="source-health-grid">
        {sources.map((source) => (
          <article key={source.id_source}>
            <div><span className={`source-dot source-${source.statut === 'actif' ? 'active' : 'offline'}`} /><strong>{source.nom_site}</strong></div>
            <a href={source.url} target="_blank" rel="noreferrer">{source.url}</a>
            <p><b>{source.offres_count}</b> offres liées</p>
            <small>Dernière récupération : {formatDate(source.derniere_recuperation)}</small>
          </article>
        ))}
      </div>
    </section>
  )
}

function RunStatus({ status }) {
  const content = {
    completed: [CheckCircle2, 'Terminée'],
    failed: [TriangleAlert, 'Échec'],
    running: [Clock3, 'En cours'],
  }
  const [Icon, label] = content[status] || content.running
  return <span className={`run-status run-status-${status}`}><Icon />{label}</span>
}

function initials(name = 'Admin') {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function formatDate(value) {
  if (!value) return 'Jamais'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
