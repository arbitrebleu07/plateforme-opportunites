export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
      <p className="text-red-800">{message || 'Une erreur est survenue'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Réessayer
        </button>
      )}
    </div>
  )
}
