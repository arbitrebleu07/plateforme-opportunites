import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Toast } from '../components/Toast'
import { engagementService } from '../services/engagementService'

const emptyForm = { nom: '', type: '', ville: '', domaine: '' }

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [toast, setToast] = useState('')

  const load = () => engagementService.getAlerts().then(({ data }) => setAlerts(data))
  useEffect(() => { load() }, [])

  const submit = async (event) => {
    event.preventDefault()
    await engagementService.createAlert(form)
    setForm(emptyForm)
    setToast('Alerte créée.')
    await load()
  }

  const remove = async (id) => {
    await engagementService.deleteAlert(id)
    await load()
  }

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  return (
    <main id="main-content" className="page-shell page-content" tabIndex="-1">
      <div className="page-title">
        <h1>Mes alertes</h1>
        <p>Recevez une notification lorsqu’une nouvelle offre correspond à vos critères.</p>
      </div>
      <form className="alert-form profile-card" onSubmit={submit}>
        <label>Nom de l’alerte<input name="nom" required value={form.nom} onChange={update} placeholder="Ex. Stages web à Douala" /></label>
        <label>Type<select name="type" value={form.type} onChange={update}><option value="">Tous</option><option value="emploi">Emploi</option><option value="stage">Stage</option><option value="bourses/concours">Bourse / Concours</option><option value="formation">Formation</option></select></label>
        <label>Ville<input name="ville" value={form.ville} onChange={update} placeholder="Douala" /></label>
        <label>Domaine<input name="domaine" value={form.domaine} onChange={update} placeholder="Informatique" /></label>
        <button className="button button-primary" type="submit">Créer l’alerte</button>
      </form>
      <section className="profile-card">
        <h2>Alertes actives</h2>
        <div className="alert-list">
          {alerts.map((alert) => (
            <article key={alert.id}>
              <div><strong>{alert.nom}</strong><small>{[alert.type, alert.ville, alert.domaine].filter(Boolean).join(' · ') || 'Tous les critères'}</small></div>
              <button className="icon-button" onClick={() => remove(alert.id)} aria-label={`Supprimer l’alerte ${alert.nom}`}><Trash2 /></button>
            </article>
          ))}
          {!alerts.length && <p>Aucune alerte configurée.</p>}
        </div>
      </section>
      <Toast message={toast} onClose={() => setToast('')} />
    </main>
  )
}
