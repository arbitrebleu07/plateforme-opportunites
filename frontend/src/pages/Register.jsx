import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { useAuth } from '../context/useAuth'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmation: '', accepted: false })

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value })
  const submit = async (event) => {
    event.preventDefault()
    if (form.password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.')
    if (form.password !== form.confirmation) return setError('Les mots de passe ne correspondent pas.')
    if (!form.accepted) return setError("Vous devez accepter les conditions d'utilisation.")
    try {
      await register(form)
      navigate('/')
    } catch (requestError) {
      setError(requestError.response?.data?.message || "L'inscription a échoué.")
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-top"><BrandLogo /><span>Déjà inscrit ? <Link to="/connexion">Se connecter</Link></span></div>
      <div className="auth-grid">
        <section className="auth-form-section">
          <form className="auth-form" onSubmit={submit}>
            <h1>Créez votre compte</h1><p>Quelques informations suffisent pour rejoindre OpportuniTech.</p>
            {error && <div className="form-error">{error}</div>}
            <label>Nom complet<input name="name" required value={form.name} onChange={update} placeholder="Votre nom et prénom" /></label>
            <label>Adresse e-mail<input name="email" type="email" required value={form.email} onChange={update} placeholder="vous@exemple.com" /></label>
            <div className="form-two">
              <label>Mot de passe<input name="password" type="password" required value={form.password} onChange={update} placeholder="8 caractères minimum" /></label>
              <label>Confirmation<input name="confirmation" type="password" required value={form.confirmation} onChange={update} placeholder="Répéter le mot de passe" /></label>
            </div>
            <label className="checkbox-label"><input name="accepted" type="checkbox" checked={form.accepted} onChange={update} /> J'accepte les conditions d'utilisation et la politique de confidentialité.</label>
            <button className="button button-primary button-full" type="submit">Créer mon compte</button>
            <p className="auth-switch">Déjà membre ? <Link to="/connexion">Se connecter à mon espace</Link></p>
          </form>
        </section>
        <section className="auth-panel">
          <p className="eyebrow">Rejoignez OpportuniTech</p>
          <h1>Un seul compte pour avancer dans votre parcours.</h1>
          <p>Cherchez des opportunités et publiez vos propres annonces depuis une interface conçue pour le marché camerounais.</p>
          <div className="auth-feature-box"><h3>Ce que vous obtenez</h3><ul><li>Accès gratuit aux offres et aux détails</li><li>Publication et gestion de vos annonces</li><li>Notifications et suivi des expirations</li></ul></div>
          <small>Sources publiques vérifiées</small><strong className="auth-stat">6 sources · 344 opportunités</strong>
        </section>
      </div>
    </main>
  )
}
