import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Toast } from '../components/Toast'
import { CATEGORIES, SOUS_TYPES_BOURSE, TAG_OPTIONS, TYPES } from '../data/mockOffres'
import { offresService } from '../services/offresService'

const initialForm = {
  titre: '', type: 'Emploi', categorie: 'Informatique', sous_type: '',
  entreprise: '', localisation: '', description: '', profil_recherche: '',
  date_limite: '', noDeadline: false, lien_source: '', tags: [],
  niveau_etudes: '', contrat: '', domaine: '', teletravail: false,
  remuneration_min: '', remuneration_max: '', devise: 'XAF',
}

const apiTypes = {
  Emploi: 'emploi',
  Stage: 'stage',
  Bourse: 'bourses/concours',
  Concours: 'bourses/concours',
  Formation: 'formation',
  Alternance: 'emploi',
  Volontariat: 'emploi',
}

function localToday() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

export default function OffreForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [missions, setMissions] = useState([''])
  const [competences, setCompetences] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (event) => setForm({
    ...form,
    [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
  })
  const updateMission = (index, value) => setMissions(
    missions.map((mission, current) => current === index ? value : mission),
  )
  const addSkill = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const next = skillInput.trim()
      if (next && competences.length < 10 && !competences.includes(next)) {
        setCompetences([...competences, next])
      }
      setSkillInput('')
    }
  }
  const toggleTag = (tag) => setForm({
    ...form,
    tags: form.tags.includes(tag)
      ? form.tags.filter((item) => item !== tag)
      : [...form.tags, tag],
  })

  const submit = async (event) => {
    event.preventDefault()
    if (form.description.trim().length < 100) {
      return setError('La description doit contenir au moins 100 caractères.')
    }

    if (!form.noDeadline && form.date_limite && form.date_limite < localToday()) {
      return setError('La date limite doit être aujourd’hui ou une date future.')
    }

    setError('')
    setSubmitting(true)
    try {
      await offresService.create({
        titre: form.titre,
        description: form.description,
        type: apiTypes[form.type],
        entreprise: form.entreprise,
        localisation: form.localisation,
        date_limite: form.noDeadline || !form.date_limite ? null : form.date_limite,
        url_source: form.lien_source || null,
        profil_recherche: form.profil_recherche || null,
        missions: missions.map((mission) => mission.trim()).filter(Boolean),
        competences,
        tags: [
          ...form.tags,
          form.categorie,
          ...(form.sous_type ? [form.sous_type] : []),
        ],
        niveau_etudes: form.niveau_etudes || null,
        contrat: form.contrat || null,
        domaine: form.domaine || form.categorie,
        teletravail: form.teletravail,
        remuneration_min: form.remuneration_min ? Number(form.remuneration_min) : null,
        remuneration_max: form.remuneration_max ? Number(form.remuneration_max) : null,
        devise: form.devise,
      })
      setToast('Votre annonce a été envoyée en modération.')
      window.setTimeout(() => navigate('/mes-annonces'), 2000)
    } catch (requestError) {
      const errors = requestError.response?.data?.errors
      setError(
        errors ? Object.values(errors).flat().join(' ') :
          requestError.response?.data?.message || "La publication de l'annonce a échoué.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main id="main-content" className="page-shell page-content" tabIndex="-1">
      <div className="page-title"><h1>Publier une opportunité</h1><p>Présentez une annonce claire pour toucher les bons profils.</p></div>
      <form className="publish-form" onSubmit={submit}>
        {error && <div className="form-error form-wide">{error}</div>}
        <label className="form-wide">Titre de l'offre<input name="titre" required value={form.titre} onChange={update} placeholder="Ex. Développeur frontend React" /></label>
        <label>Type<select name="type" value={form.type} onChange={update}>{TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Catégorie<select name="categorie" value={form.categorie} onChange={update}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        {form.type === 'Bourse' && <label>Sous-type<select name="sous_type" value={form.sous_type} onChange={update} required><option value="">Choisir</option>{SOUS_TYPES_BOURSE.map((item) => <option key={item}>{item}</option>)}</select></label>}
        <label>Entreprise / Organisme<input name="entreprise" required value={form.entreprise} onChange={update} /></label>
        <label>Localisation<input name="localisation" required value={form.localisation} onChange={update} placeholder="Douala, Yaoundé, International…" /></label>
        <label>Niveau d’études<select name="niveau_etudes" value={form.niveau_etudes} onChange={update}><option value="">Non précisé</option><option>Sans diplôme</option><option>Baccalauréat</option><option>Bac+2</option><option>Licence</option><option>Master</option><option>Doctorat</option></select></label>
        <label>Type de contrat<select name="contrat" value={form.contrat} onChange={update}><option value="">Non précisé</option><option>CDI</option><option>CDD</option><option>Stage</option><option>Freelance</option><option>Alternance</option></select></label>
        <label>Domaine<input name="domaine" value={form.domaine} onChange={update} placeholder="Informatique, finance…" /></label>
        <label className="checkbox-label form-checkbox"><input name="teletravail" type="checkbox" checked={form.teletravail} onChange={update} /> Télétravail possible</label>
        <label>Rémunération minimale<input name="remuneration_min" type="number" min="0" value={form.remuneration_min} onChange={update} placeholder="150000" /></label>
        <label>Rémunération maximale<input name="remuneration_max" type="number" min="0" value={form.remuneration_max} onChange={update} placeholder="300000" /></label>
        <label>Devise<select name="devise" value={form.devise} onChange={update}><option>XAF</option><option>EUR</option><option>USD</option></select></label>
        <label className="form-wide">Description <small>{form.description.length}/100 minimum</small><textarea name="description" rows="6" required value={form.description} onChange={update} /></label>
        <fieldset className="form-wide dynamic-field"><legend>Missions principales</legend>{missions.map((mission, index) => <div key={index}><input aria-label={`Mission ${index + 1}`} value={mission} onChange={(event) => updateMission(index, event.target.value)} placeholder={`Mission ${index + 1}`} /><button type="button" className="icon-button" aria-label={`Supprimer la mission ${index + 1}`} onClick={() => setMissions(missions.filter((_, current) => current !== index))}><X size={17} /></button></div>)}<button type="button" className="button button-mint" onClick={() => setMissions([...missions, ''])}><Plus size={16} /> Ajouter une mission</button></fieldset>
        <label className="form-wide">Profil recherché<textarea name="profil_recherche" rows="4" value={form.profil_recherche} onChange={update} /></label>
        <label className="form-wide">Compétences <small>Entrée pour ajouter, maximum 10</small><input value={skillInput} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={addSkill} placeholder="Ex. React" /><span className="chip-row">{competences.map((skill) => <button type="button" className="chip" key={skill} onClick={() => setCompetences(competences.filter((item) => item !== skill))}>{skill} <X size={13} /></button>)}</span></label>
        <label>Date limite<input name="date_limite" type="date" min={localToday()} disabled={form.noDeadline} value={form.date_limite} onChange={update} /><span className="checkbox-label"><input name="noDeadline" type="checkbox" checked={form.noDeadline} onChange={update} /> Pas de date limite</span></label>
        <label>Lien externe facultatif<input name="lien_source" type="url" value={form.lien_source} onChange={update} placeholder="https://…" /></label>
        <fieldset className="form-wide tag-selector"><legend>Tags libres</legend>{TAG_OPTIONS.map((tag) => <button type="button" className={form.tags.includes(tag) ? 'selected' : ''} key={tag} onClick={() => toggleTag(tag)}>{tag}</button>)}</fieldset>
        <div className="form-actions form-wide"><button type="button" className="button button-outline" onClick={() => setToast('Brouillon enregistré localement.')}>Enregistrer en brouillon</button><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? 'Publication...' : "Publier l'annonce"}</button></div>
      </form>
      <Toast message={toast} onClose={() => setToast('')} />
    </main>
  )
}
