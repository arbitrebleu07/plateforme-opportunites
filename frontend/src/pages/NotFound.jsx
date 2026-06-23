import { ArrowLeft, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="not-found-art"><Compass size={72} /><span>404</span></div>
      <h1>Page introuvable</h1>
      <p>Cette page n'existe pas ou a été déplacée.</p>
      <Link className="button button-primary" to="/"><ArrowLeft size={16} /> Retour à l'accueil</Link>
    </main>
  )
}
