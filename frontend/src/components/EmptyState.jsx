import { SearchX } from 'lucide-react'

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration">
        <SearchX size={50} />
        <span />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {actionLabel && <button className="button button-mint" onClick={onAction}>{actionLabel}</button>}
    </div>
  )
}
