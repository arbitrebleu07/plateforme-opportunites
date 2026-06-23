import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Toast } from '../components/Toast'
import { StatusBadge } from '../components/TypeBadge'
import { useAuth } from '../context/useAuth'
import { offresService } from '../services/offresService'
import { normalizeOpportunity } from '../services/opportunities'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', localisation: user?.localisation || '', current: '', next: '', confirmation: '' })
  const [show, setShow] = useState({ current: false, next: false, confirmation: false })
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [myOffres, setMyOffres] = useState([])

  useEffect(() => {
    offresService.getMyOffres({ per_page: 3 })
      .then(({ data }) => setMyOffres((data.data || data).map(normalizeOpportunity)))
      .catch(() => setMyOffres([]))
  }, [])

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault()
    if (form.next) {
      if (form.next.length < 8) return setError('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      if (form.next === form.current) return setError("Le nouveau mot de passe doit être différent de l'actuel.")
      if (form.next !== form.confirmation) return setError('La confirmation ne correspond pas.')
    }
    setError('')
    await updateUser({ name: form.name, email: form.email, localisation: form.localisation })
    setToast('Profil mis à jour avec succès.')
  }

  return (
    <main id="main-content" className="page-shell page-content profile-page" tabIndex="-1">
      <div className="page-title"><h1>Mon profil</h1><p>Gérez vos informations et la sécurité de votre compte.</p></div>
      <form onSubmit={submit}>
        <section className="profile-card">
          <h2>Informations personnelles</h2>
          <div className="form-two"><label>Nom complet<input name="name" value={form.name} onChange={update} /></label><label>Adresse e-mail<input name="email" type="email" value={form.email} onChange={update} /></label></div>
          <label>Localisation<input name="localisation" value={form.localisation} onChange={update} /></label>
        </section>
        <section className="profile-card">
          <h2>Sécurité</h2>{error && <div className="form-error">{error}</div>}
          {['current', 'next', 'confirmation'].map((field) => <label key={field}>{field === 'current' ? 'Mot de passe actuel' : field === 'next' ? 'Nouveau mot de passe' : 'Confirmation'}<span className="password-field"><input name={field} type={show[field] ? 'text' : 'password'} value={form[field]} onChange={update} /><button type="button" className="icon-button" aria-label={show[field] ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setShow({ ...show, [field]: !show[field] })}>{show[field] ? <EyeOff /> : <Eye />}</button></span></label>)}
        </section>
        <button className="button button-primary profile-save">Enregistrer les modifications</button>
      </form>
      <section className="profile-card"><div className="section-heading"><div><h2>Mes annonces publiées</h2><p>Suivez leur statut et accédez aux détails.</p></div><Link className="button button-mint" to="/publier">Publier une offre</Link></div>{myOffres.length ? myOffres.map((offre) => <Link className="profile-offer" to={`/opportunites/${offre.id}`} key={offre.id}><div><strong>{offre.titre}</strong><small>{offre.entreprise} · {offre.localisation}</small></div><StatusBadge status={offre.statut} /></Link>) : <p className="muted-copy">Aucune annonce publiée pour le moment.</p>}</section>
      <Toast message={toast} onClose={() => setToast('')} />
    </main>
  )
}
