import { Check, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { useAuth } from '../context/useAuth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: 'admin@opportunitech.cm', password: '', remember: true })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await login(form.email, form.password)
      navigate(location.state?.from || (user.role === 'admin' ? '/admin' : '/'))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Identifiants incorrects.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-top"><BrandLogo /><span>Pas encore inscrit ? <Link to="/inscription">Créer un compte</Link></span></div>
      <div className="auth-grid auth-login-grid">
        <section className="auth-panel">
          <p className="eyebrow">Votre espace personnel</p>
          <h1>Retrouvez toutes vos opportunités au même endroit.</h1>
          <p>Enregistrez vos recherches, publiez vos annonces et suivez votre activité depuis un espace simple et sécurisé.</p>
          <div className="benefit"><span><Check /></span><div><strong>Accédez à vos offres publiées</strong><small>Modification, statut et statistiques</small></div></div>
          <div className="benefit"><span><Check /></span><div><strong>Recevez vos notifications</strong><small>Expiration et actions administratives</small></div></div>
        </section>
        <section className="auth-form-section">
          <form className="auth-form" onSubmit={submit}>
            <h1>Bon retour parmi nous</h1>
            <p>Connectez-vous pour accéder à votre espace OpportuniTech.</p>
            {error && <div className="form-error">{error}</div>}
            <label>Adresse e-mail<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label>Mot de passe <Link to="/connexion">Mot de passe oublié ?</Link><span className="password-field"><input type={showPassword ? 'text' : 'password'} required minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button type="button" className="icon-button" onClick={() => setShowPassword(!showPassword)} aria-label="Afficher le mot de passe">{showPassword ? <EyeOff /> : <Eye />}</button></span></label>
            <label className="checkbox-label"><input type="checkbox" checked={form.remember} onChange={(event) => setForm({ ...form, remember: event.target.checked })} /> Rester connecté sur cet appareil</label>
            <button className="button button-primary button-full" type="submit" disabled={submitting}>{submitting ? 'Connexion...' : 'Se connecter'}</button>
            <div className="auth-divider"><span>OU</span></div>
            <Link className="button button-outline button-full" to="/inscription">Créer un nouveau compte</Link>
            <small>En vous connectant, vous acceptez les conditions d'utilisation.</small>
          </form>
        </section>
      </div>
    </main>
  )
}
