import { ArrowUpRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TypeBadge } from './TypeBadge'

export function OfferCard({ offre, horizontal = false }) {
  return (
    <article className={`offer-card ${horizontal ? 'offer-card-horizontal' : ''}`}>
      <div className={`offer-avatar ${`avatar-${offre.type.toLowerCase()}`}`}>{offre.logo_initiales}</div>
      <div className="offer-main">
        <div className="offer-badge-row">
          <TypeBadge type={offre.type} />
          {offre.highlights.map((label) => <span className={`highlight-badge highlight-${label.toLowerCase().replaceAll(' ', '-')}`} key={label}>{label}</span>)}
        </div>
        <h3>{offre.titre}</h3>
        <p className="offer-company">{offre.entreprise} · {offre.localisation}</p>
        <div className="offer-meta">
          <span>{offre.categorie}</span>
          {offre.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
          <span>{offre.date_publication}</span>
          {offre.teletravail && <span>Télétravail</span>}
          {offre.contrat && <span>{offre.contrat}</span>}
        </div>
      </div>
      <Link className={horizontal ? 'button button-primary' : 'offer-link'} to={`/opportunites/${offre.id}`}>
        {horizontal ? 'Consulter' : "Voir l'offre"} <ArrowUpRight size={15} />
      </Link>
      {horizontal && <span className="offer-location"><MapPin size={14} /> {offre.localisation}</span>}
    </article>
  )
}
