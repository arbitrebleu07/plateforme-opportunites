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
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Trouvez votre prochaine opportunité 🚀
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-2xl mx-auto">
            Centralisation des offres d'emploi, stages, bourses/concours et formations
          </p>
          
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex gap-3 flex-col sm:flex-row">
            <input
              type="text"
              placeholder="Rechercher une opportunité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-6 py-4 rounded-xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg text-lg"
            />
            <Button type="submit" size="lg" className="px-8 py-4">Rechercher</Button>
          </form>
          
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">🎓 Stages</span>
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">💼 Emplois</span>
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">🎓 Bourses/Concours</span>
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">📚 Formations</span>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-16 bg-white -mt-8 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl font-bold text-indigo-600 mb-2">{offres?.total || 0}</div>
              <div className="text-gray-600 font-medium">Offres actives</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl font-bold text-purple-600 mb-2">{categories?.length || 0}</div>
              <div className="text-gray-600 font-medium">Catégories</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-gray-600 font-medium">Gratuit</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600 font-medium">Mise à jour</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Parcourir par catégorie
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories?.map((cat) => (
              <Link
                key={cat.id_categorie}
                to={`/offres?category=${cat.id_categorie}`}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 text-center group hover:-translate-y-1 border border-gray-100"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📂</div>
                <div className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{cat.nom}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Latest Offers Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Dernières opportunités
            </h2>
            <Link to="/offres" className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 group">
              Voir tout 
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
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
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Vous recrutez ? Publiez votre offre gratuitement
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Atteignez des milliers de candidats qualifiés en quelques clics
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/register">
              <Button variant="secondary" size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
                Créer un compte
              </Button>
            </Link>
            <Link to="/offres">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Explorer les offres
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}