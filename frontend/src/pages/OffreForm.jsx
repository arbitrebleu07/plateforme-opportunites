import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { offresService } from '../services/offresService'
import { useCategories } from '../hooks/useCategories'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'

export default function OffreForm({ isEdit = false, initialData = null }) {
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    titre: initialData?.titre || '',
    description: initialData?.description || '',
    type: initialData?.type || 'emploi',
    entreprise: initialData?.entreprise || '',
    localisation: initialData?.localisation || '',
    date_limite: initialData?.date_limite || '',
    categories: initialData?.categories?.map(c => c.id_categorie) || [],
  })
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleCategoryChange = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const data = {
        ...formData,
        categories: formData.categories // Laravel attendra un array d'IDs
      }
      
      if (isEdit && initialData) {
        await offresService.update(initialData.id_offre, data)
      } else {
        await offresService.create(data)
      }
      
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Modifier l\'offre' : 'Créer une nouvelle offre'}
      </h1>
      
      <Card>
        {error && <ErrorMessage message={error} />}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <Input
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              required
              placeholder="Titre de l'offre"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <Select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="emploi">Emploi</option>
              <option value="stage">Stage</option>
              <option value="bourses/concours">Bourses/Concours</option>
              <option value="formation">Formation</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entreprise
            </label>
            <Input
              name="entreprise"
              value={formData.entreprise}
              onChange={handleChange}
              placeholder="Nom de l'entreprise"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localisation
            </label>
            <Input
              name="localisation"
              value={formData.localisation}
              onChange={handleChange}
              placeholder="Ville, Pays ou Remote"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date limite
            </label>
            <Input
              name="date_limite"
              type="date"
              value={formData.date_limite}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégories
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {categories?.map((cat) => (
                <label key={cat.id_categorie} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(cat.id_categorie)}
                    onChange={() => handleCategoryChange(cat.id_categorie)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{cat.nom}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Description détaillée de l'offre..."
            />
          </div>
          
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <LoadingSpinner size="sm" /> : (isEdit ? 'Mettre à jour' : 'Créer l\'offre')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
