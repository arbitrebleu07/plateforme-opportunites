import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePaginatedOffres } from '../hooks/useOffres'
import { useCategories } from '../hooks/useCategories'
import { OfferCard } from '../components/offres/OfferCard'
import { OfferFilters } from '../components/offres/OfferFilters'
import { Pagination } from '../components/ui/Pagination'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'

export default function Offres() {
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || '',
    category: searchParams.get('category') || '',
  })
  
  const { data: paginatedData, loading, error, refetch } = usePaginatedOffres({
    ...filters,
    page,
    per_page: 12,
  })
  const { data: categories } = useCategories()
  
  const offres = paginatedData?.data || []
  
  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page on filter change
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Toutes les opportunités
      </h1>
      
      <OfferFilters 
        filters={filters} 
        onFilterChange={handleFilterChange}
        categories={categories}
      />
      
      {error ? (
        <ErrorMessage message="Erreur de chargement des offres" onRetry={refetch} />
      ) : loading ? (
        <LoadingSpinner size="lg" />
      ) : offres.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Aucune offre ne correspond à votre recherche
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offres.map((offre) => (
              <OfferCard key={offre.id_offre} offre={offre} />
            ))}
          </div>
          
          <Pagination data={paginatedData} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  )
}