export async function confirmAndDelete(message, deleteFn, refetchFn) {
  if (!confirm(message)) return false
  try {
    await deleteFn()
    await refetchFn()
    return true
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    return false
  }
}
