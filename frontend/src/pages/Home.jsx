import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOffres } from '../hooks/useOffres'
import { useCategories } from '../hooks/useCategories'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { OfferCard } from '../components/offres/OfferCard'

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: offres, loading, error } = useOffres()
  const { data: categories } = useCategories()
  
  const latestOffers = offres?.data?.slice(0, 6) || []
  
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      window.location.href = `/offres?search=${encodeURIComponent(searchTerm)}`
    }
  }
  
  if (error) return <ErrorMessage message="Erreur de chargement" />
  
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Trouvez votre prochaine opportunité
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Centralisation des offres d'emploi, stages, bourses et formations
          </p>
          
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
            <input
              type="text"
              placeholder="Rechercher une opportunité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <Button type="submit" size="lg">Rechercher</Button>
          </form>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">{offres?.total || 0}</div>
              <div className="text-gray-600">Offres actives</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{categories?.length || 0}</div>
              <div className="text-gray-600">Catégories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">100%</div>
              <div className="text-gray-600">Gratuit</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">24/7</div>
              <div className="text-gray-600">Mise à jour</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Parcourir par catégorie
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories?.map((cat) => (
              <Link
                key={cat.id_categorie}
                to={`/offres?category=${cat.id_categorie}`}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center"
              >
                <div className="text-2xl mb-2">📂</div>
                <div className="font-medium text-gray-800">{cat.nom}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Latest Offers Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Dernières opportunités
            </h2>
            <Link to="/offres" className="text-blue-600 hover:text-blue-800">
              Voir tout →
            </Link>
          </div>
          
          {loading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestOffers.map((offre) => (
                <OfferCard key={offre.id_offre} offre={offre} />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Vous recrutez ? Publiez votre offre gratuitement
          </h2>
          <p className="mb-6 text-blue-100">
            Atteignez des milliers de candidats qualifiés
          </p>
          <Link to="/register">
            <Button variant="secondary" size="lg">
              Créer un compte
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}