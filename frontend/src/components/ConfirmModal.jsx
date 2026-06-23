import { LogOut, Trash2, X } from 'lucide-react'

export function ConfirmModal({ open, title, description, confirmLabel, tone = 'danger', onCancel, onConfirm }) {
  if (!open) return null
  const Icon = tone === 'logout' ? LogOut : Trash2
  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div className="confirm-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close icon-button" onClick={onCancel} aria-label="Fermer"><X size={18} /></button>
        <span className="modal-icon"><Icon size={28} /></span>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="modal-actions">
          <button className="button button-outline" onClick={onCancel}>Annuler</button>
          <button className="button button-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
