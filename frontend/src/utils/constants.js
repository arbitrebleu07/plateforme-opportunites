export const typeColors = {
  emploi: 'primary',
  stage: 'success',
  'bourses/concours': 'warning',
  formation: 'danger',
}

export const getStatutBadgeVariant = (statut) => {
  switch (statut) {
    case 'active': return 'success'
    case 'expiree': return 'danger'
    default: return 'default'
  }
}
