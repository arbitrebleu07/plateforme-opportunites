import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { OfferCard } from '../components/OfferCard'
import { TYPES } from '../data/mockOffres'
import { getOpportunities } from '../services/opportunities'

const PAGE_SIZE = 6

function paginationItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((page) => page > 0 && page <= total).sort((a, b) => a - b)
  const result = []

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push('ellipsis')
    result.push(page)
  })
  return result
}

export default function Offres() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [type, setType] = useState(searchParams.get('type') || '')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('recent')
  const [studyLevel, setStudyLevel] = useState('')
  const [contract, setContract] = useState('')
  const [domain, setDomain] = useState('')
  const [remote, setRemote] = useState(false)
  const [minimumSalary, setMinimumSalary] = useState('')
  const [page, setPage] = useState(1)
  const [offres, setOffres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getOpportunities()
      .then((rows) => {
        if (active) setOffres(rows)
      })
      .catch(() => {
        if (active) setError("Impossible de charger les opportunités pour le moment.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const categories = useMemo(
    () => [...new Set(offres.map((offre) => offre.categorie).filter(Boolean))].sort(),
    [offres],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const rows = offres.filter((offre) => {
      const matchesText = !needle || [
        offre.titre,
        offre.entreprise,
        offre.categorie,
        offre.description,
      ].join(' ').toLowerCase().includes(needle)
      const matchesType = !type || offre.type === type
      const matchesCategory = !category || offre.categorie === category
      const matchesLocation = !location
        || offre.localisation.toLowerCase().includes(location.toLowerCase())
      const matchesStudy = !studyLevel || offre.niveau_etudes === studyLevel
      const matchesContract = !contract || offre.contrat === contract
      const matchesDomain = !domain || offre.domaine.toLowerCase().includes(domain.toLowerCase())
      const matchesRemote = !remote || offre.teletravail
      const matchesSalary = !minimumSalary || !offre.remuneration_max
        || Number(offre.remuneration_max) >= Number(minimumSalary)
      return matchesText && matchesType && matchesCategory && matchesLocation
        && matchesStudy && matchesContract && matchesDomain && matchesRemote && matchesSalary
    })
    return sort === 'oldest' ? [...rows].reverse() : rows
  }, [offres, query, type, category, location, studyLevel, contract, domain, remote, minimumSalary, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => setPage(1), [query, type, category, location, studyLevel, contract, domain, remote, minimumSalary, sort])

  const changePage = (next) => {
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const reset = () => {
    setQuery('')
    setType('')
    setCategory('')
    setLocation('')
    setSort('recent')
    setStudyLevel('')
    setContract('')
    setDomain('')
    setRemote(false)
    setMinimumSalary('')
    setPage(1)
  }

  return (
    <main id="main-content" className="page-shell page-content" tabIndex="-1">
      <div className="page-title">
        <h1>Toutes les opportunités</h1>
        <p>{filtered.length} opportunités correspondent à votre sélection.</p>
      </div>

      <section className="filter-panel filter-panel-advanced" aria-labelledby="filters-title">
        <h2 id="filters-title" className="sr-only">Filtres des opportunités</h2>
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par titre, entreprise ou catégorie"
          />
        </label>
        <select aria-label="Type d’opportunité" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">Tous les types</option>
          {TYPES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select aria-label="Catégorie" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">Toutes les catégories</option>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select aria-label="Niveau d’études" value={studyLevel} onChange={(event) => setStudyLevel(event.target.value)}><option value="">Tous les niveaux</option><option>Sans diplôme</option><option>Baccalauréat</option><option>Bac+2</option><option>Licence</option><option>Master</option><option>Doctorat</option></select>
        <select aria-label="Type de contrat" value={contract} onChange={(event) => setContract(event.target.value)}><option value="">Tous les contrats</option><option>CDI</option><option>CDD</option><option>Stage</option><option>Freelance</option><option>Alternance</option></select>
        <input aria-label="Domaine" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="Domaine" />
        <input aria-label="Rémunération minimale" type="number" min="0" value={minimumSalary} onChange={(event) => setMinimumSalary(event.target.value)} placeholder="Salaire minimum" />
        <label className="checkbox-label remote-filter"><input type="checkbox" checked={remote} onChange={(event) => setRemote(event.target.checked)} /> Télétravail</label>
        <button className="button button-primary" onClick={() => setPage(1)}>Filtrer</button>
        <button className="button button-mint" onClick={reset}>Réinitialiser</button>
      </section>

      <div className="list-toolbar">
        <label>
          <span>TRIER PAR</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="recent">Plus récentes</option>
            <option value="oldest">Plus anciennes</option>
          </select>
        </label>
        <span>Page {page} sur {totalPages}</span>
      </div>

      {loading ? (
        <div className="loading-state">Chargement des opportunités...</div>
      ) : error ? (
        <EmptyState
          title={error}
          description="Vérifiez que le serveur Laravel fonctionne sur le port 8000."
          actionLabel="Réessayer"
          onAction={() => window.location.reload()}
        />
      ) : visible.length ? (
        <>
          <div className="offer-list">
            {visible.map((offre) => <OfferCard key={offre.id} offre={offre} horizontal />)}
          </div>
          <nav className="pagination" aria-label="Pagination">
            <button disabled={page === 1} onClick={() => changePage(page - 1)}>
              <ChevronLeft size={16} /> Précédente
            </button>
            {paginationItems(page, totalPages).map((item, index) => (
              item === 'ellipsis'
                ? <span className="pagination-ellipsis" key={`ellipsis-${index}`}>…</span>
                : (
                  <button
                    key={item}
                    className={item === page ? 'active' : ''}
                    onClick={() => changePage(item)}
                  >
                    {item}
                  </button>
                )
            ))}
            <button disabled={page === totalPages} onClick={() => changePage(page + 1)}>
              Suivante <ChevronRight size={16} />
            </button>
          </nav>
        </>
      ) : (
        <EmptyState
          title="Aucune opportunité ne correspond à vos critères."
          description="Essayez une recherche plus large ou supprimez certains filtres."
          actionLabel="Réinitialiser les filtres"
          onAction={reset}
        />
      )}
    </main>
  )
}
