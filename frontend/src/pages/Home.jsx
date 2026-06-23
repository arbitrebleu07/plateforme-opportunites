import { ArrowRight, BriefcaseBusiness, GraduationCap, Search, School, Trophy, Wrench } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { OfferCard } from '../components/OfferCard'
import { getLatestOpportunities, getOpportunities } from '../services/opportunities'

const typeCards = [
  { type: 'Emploi', label: 'Emplois', icon: BriefcaseBusiness, description: 'CDI, CDD, missions et consultance' },
  { type: 'Stage', label: 'Stages', icon: Wrench, description: 'Stages académiques et professionnels' },
  { type: 'Bourse', label: 'Bourses', icon: GraduationCap, description: 'Études, recherche et mobilité' },
  { type: 'Concours', label: 'Concours', icon: Trophy, description: 'Écoles, examens et fonction publique' },
  { type: 'Formation', label: 'Formations', icon: School, description: 'Compétences et certifications' },
]

export default function Home() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [latest, setLatest] = useState([])
  const [allOffres, setAllOffres] = useState([])

  useEffect(() => {
    getLatestOpportunities(3).then(setLatest).catch(() => setLatest([]))
    getOpportunities().then(setAllOffres).catch(() => setAllOffres([]))
  }, [])

  const counts = useMemo(() => allOffres.reduce((result, offre) => {
    result[offre.type] = (result[offre.type] || 0) + 1
    return result
  }, {}), [allOffres])

  const submit = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (location) params.set('location', location)
    navigate(`/opportunites?${params}`)
  }

  return (
    <main id="main-content" tabIndex="-1">
      <section className="home-hero">
        <span className="ambient ambient-one" />
        <span className="ambient ambient-two" />
        <div className="page-shell hero-content">
          <p className="eyebrow">Opportunités au Cameroun et à l'international</p>
          <h1>Construisez la prochaine étape<br />de votre parcours.</h1>
          <p className="hero-copy">Emplois, stages, formations, bourses et concours réunis au même endroit.</p>
          <form className="hero-search" onSubmit={submit}>
            <label>
              <Search size={19} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Métier, compétence ou mot-clé" />
            </label>
            <select value={location} onChange={(event) => setLocation(event.target.value)} aria-label="Localisation">
              <option value="">Tout le Cameroun</option>
              <option>Douala</option>
              <option>Yaoundé</option>
              <option>International</option>
              <option>Remote</option>
            </select>
            <button className="button button-yellow" type="submit">Rechercher</button>
          </form>
        </div>
      </section>

      <section className="page-shell section-block">
        <div className="section-heading">
          <div>
            <h2>Explorer par type</h2>
            <p>Accédez rapidement aux opportunités qui vous concernent.</p>
          </div>
        </div>
        <div className="type-explorer">
          {typeCards.map(({ type, label, icon: Icon, description }) => (
            <Link key={type} className={`type-card card-accent-${type.toLowerCase()}`} to={`/opportunites?type=${type}`}>
              <span className="type-card-icon"><Icon size={22} /></span>
              <div><h3>{label}</h3><strong>{counts[type] || 0} opportunités</strong></div>
              <p>{description}</p>
              <span className="type-card-link">Explorer <ArrowRight size={14} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-shell section-block">
        <div className="section-heading">
          <div>
            <h2>Dernières opportunités</h2>
            <p>Les annonces récemment ajoutées apparaissent en premier.</p>
          </div>
          <Link className="text-link" to="/opportunites">Voir toutes <ArrowRight size={16} /></Link>
        </div>
        <div className="offer-grid">
          {latest.map((offre) => <OfferCard offre={offre} key={offre.id} />)}
        </div>
      </section>

      <section className="home-cta">
        <div className="page-shell">
          <div>
            <p className="eyebrow">Vous recrutez ?</p>
            <h2>Publiez une opportunité en quelques minutes.</h2>
          </div>
          <Link className="button button-yellow" to="/publier">Publier une offre <ArrowRight size={16} /></Link>
        </div>
      </section>
    </main>
  )
}
