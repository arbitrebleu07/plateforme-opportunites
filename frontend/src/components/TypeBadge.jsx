import { typeMeta } from '../data/mockOffres'

export function TypeBadge({ type, className = '' }) {
  const meta = typeMeta[type] || typeMeta.Emploi
  return <span className={`type-badge ${meta.className} ${className}`}>{type}</span>
}

export function StatusBadge({ status }) {
  const labels = {
    active: 'Active',
    expiree: 'Expirée',
    en_attente: 'En attente',
    pending: 'À modérer',
    approved: 'Approuvée',
    rejected: 'Refusée',
  }
  return <span className={`status-badge status-${status}`}>{labels[status] || status}</span>
}
