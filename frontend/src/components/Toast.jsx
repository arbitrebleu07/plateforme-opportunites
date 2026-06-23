import { CheckCircle2, Info, X } from 'lucide-react'

export function Toast({ message, type = 'success', onClose }) {
  if (!message) return null
  return (
    <div className={`toast toast-${type}`} role="status">
      {type === 'success' ? <CheckCircle2 size={20} /> : <Info size={20} />}
      <span>{message}</span>
      <button className="icon-button" onClick={onClose} aria-label="Fermer"><X size={17} /></button>
    </div>
  )
}
