import api from './api'

const TYPE_LABELS = {
  emploi: 'Emploi',
  stage: 'Stage',
  formation: 'Formation',
  alternance: 'Alternance',
  volontariat: 'Volontariat',
  bourse: 'Bourse',
  concours: 'Concours',
}

function cleanText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function resolveType(offre) {
  const rawType = cleanText(offre.type).toLowerCase()
  if (TYPE_LABELS[rawType]) return TYPE_LABELS[rawType]

  const classification = [
    offre.categorie_principale,
    offre.sous_categorie,
    ...(offre.categories || []).map((category) => category.nom),
    offre.titre,
  ].filter(Boolean).join(' ').toLowerCase()

  if (classification.includes('concours')) return 'Concours'
  if (classification.includes('bourse')) return 'Bourse'
  if (classification.includes('stage')) return 'Stage'
  if (classification.includes('formation') || classification.includes('certification')) return 'Formation'
  if (classification.includes('alternance')) return 'Alternance'
  if (classification.includes('volontariat')) return 'Volontariat'
  return 'Emploi'
}

function formatDate(value, prefix = 'Publié le') {
  if (!value) return 'Date non communiquée'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
  return prefix ? `${prefix} ${formatted}` : formatted
}

function initials(value) {
  return cleanText(value, 'OP')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export function normalizeOpportunity(offre) {
  const type = resolveType(offre)
  const categoryNames = (offre.categories || [])
    .map((category) => cleanText(category.nom))
    .filter(Boolean)
  const category = cleanText(offre.sous_categorie)
    || cleanText(offre.categorie_principale)
    || categoryNames.find((name) => name.toLowerCase() !== type.toLowerCase())
    || type
  const source = cleanText(offre.source)
    || cleanText(offre.sources?.[0]?.nom_site)
    || 'Source externe'
  const publishedAt = new Date(offre.date_publication || offre.created_at)
  const deadline = offre.date_limite ? new Date(offre.date_limite) : null
  const now = new Date()
  const daysSincePublication = Number.isNaN(publishedAt.getTime()) ? null : Math.floor((now - publishedAt) / 86400000)
  const daysUntilDeadline = !deadline || Number.isNaN(deadline.getTime()) ? null : Math.ceil((deadline - now) / 86400000)
  const highlights = [
    daysSincePublication !== null && daysSincePublication <= 3 ? 'Nouveau' : null,
    daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 2 ? 'Urgent' : null,
    daysUntilDeadline !== null && daysUntilDeadline > 2 && daysUntilDeadline <= 7 ? 'Bientôt expirée' : null,
  ].filter(Boolean)

  return {
    ...offre,
    id: offre.id_offre ?? offre.id,
    titre: cleanText(offre.titre, 'Opportunité'),
    description: cleanText(
      offre.description,
      'Consultez la source officielle pour découvrir tous les détails de cette opportunité.',
    ),
    entreprise: cleanText(offre.entreprise, source),
    localisation: cleanText(offre.localisation, 'Cameroun'),
    type,
    categorie: category,
    tags: [...new Set([
      ...(Array.isArray(offre.tags) ? offre.tags : []),
      ...categoryNames.filter((name) => name.toLowerCase() !== type.toLowerCase()),
    ])],
    competences: [...new Set(
      Array.isArray(offre.competences) && offre.competences.length
        ? offre.competences
        : [
            category,
            ...categoryNames.filter((name) => name.toLowerCase() !== type.toLowerCase()),
          ],
    )].slice(0, 10),
    missions: Array.isArray(offre.missions) ? offre.missions : [],
    profil_recherche: cleanText(offre.profil_recherche),
    date_publication: formatDate(offre.date_publication),
    date_limite: offre.date_limite ? formatDate(offre.date_limite, '') : null,
    source,
    lien_source: cleanText(offre.url_source) || cleanText(offre.sources?.[0]?.url) || '#',
    logo_initiales: initials(offre.entreprise || source),
    statut: offre.statut || 'active',
    moderation_status: offre.moderation_status || 'approved',
    niveau_etudes: cleanText(offre.niveau_etudes),
    contrat: cleanText(offre.contrat),
    domaine: cleanText(offre.domaine || category),
    teletravail: Boolean(offre.teletravail),
    remuneration_min: offre.remuneration_min,
    remuneration_max: offre.remuneration_max,
    devise: offre.devise || 'XAF',
    highlights,
  }
}

function rowsFromResponse(data) {
  return Array.isArray(data) ? data : data?.data || []
}

export async function getOpportunities() {
  const response = await api.get('/offres', { params: { per_page: 1000 } })
  return rowsFromResponse(response.data).map(normalizeOpportunity)
}

export async function getLatestOpportunities(limit = 3) {
  const response = await api.get('/offres', { params: { per_page: limit } })
  return rowsFromResponse(response.data).map(normalizeOpportunity)
}

export async function getOpportunity(id) {
  const response = await api.get(`/offres/${id}`)
  return normalizeOpportunity(response.data)
}
