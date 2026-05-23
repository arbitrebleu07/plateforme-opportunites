export function Pagination({ data, onPageChange }) {
  if (!data || !data.data) return null
  
  const { current_page, last_page, from, to, total } = data
  
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (last_page <= maxVisible) {
      for (let i = 1; i <= last_page; i++) {
        pages.push(i)
      }
    } else {
      if (current_page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(last_page)
      } else if (current_page >= last_page - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = last_page - 3; i <= last_page; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = current_page - 1; i <= current_page + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(last_page)
      }
    }
    
    return pages
  }
  
  return (
    <div className="flex flex-col items-center mt-8">
      <div className="text-sm text-gray-600 mb-4">
        Affichage de {from} à {to} sur {total} résultats
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page === 1}
          className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Précédent
        </button>
        
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 rounded-lg border ${
                page === current_page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page === last_page}
          className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
