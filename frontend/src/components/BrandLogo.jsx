import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export function BrandLogo({ light = false, compact = false }) {
  return (
    <Link to="/" className={`brand-logo ${light ? 'brand-logo-light' : ''}`}>
      <span className="brand-mark"><Plus size={20} strokeWidth={3} /></span>
      {!compact && <span>OpportuniTech</span>}
    </Link>
  )
}
