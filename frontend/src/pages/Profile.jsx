import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'

export default function Profile() {
  const { user, updateUser, deletePhoto } = useAuth()
  const [loading, setLoading] = useState(false)
  const [deletingPhoto, setDeletingPhoto] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    photo: null,
  })

  const [previewPhoto, setPreviewPhoto] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }))
      setPreviewPhoto(URL.createObjectURL(file))
    }
  }

  const handleDeletePhoto = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) {
      setDeletingPhoto(true)
      setError(null)
      try {
        await deletePhoto()
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression de la photo')
      } finally {
        setDeletingPhoto(false)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('email', formData.email)
      if (formData.photo) {
        data.append('photo', formData.photo)
      }

      await updateUser(data)
      setSuccess(true)
      setPreviewPhoto(null)
      setFormData(prev => ({ ...prev, photo: null }))
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil')
    } finally {
      setLoading(false)
    }
  }

  // Add cache busting to photo URL
  const getPhotoUrl = (photo) => {
    if (!photo) return null
    // Temporarily disable cache busting to debug
    return photo
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Mon profil
      </h1>
      
      <Card>
        {error && <ErrorMessage message={error} />}
        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
            Profil mis à jour avec succès !
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo de profil */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-semibold overflow-hidden shadow-lg">
              {previewPhoto ? (
                <img src={previewPhoto} alt="Preview" className="w-full h-full object-cover" />
              ) : user?.photo ? (
                <img src={getPhotoUrl(user.photo)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo de profil
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formats acceptés: JPG, PNG, GIF (max 2MB)
              </p>
              {user?.photo && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleDeletePhoto}
                  disabled={deletingPhoto}
                  className="mt-2"
                >
                  {deletingPhoto ? <LoadingSpinner size="sm" /> : 'Supprimer la photo'}
                </Button>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom *
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Votre nom complet"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="votre@email.com"
            />
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500 mb-4">
              Rôle: <span className="font-semibold text-gray-700 capitalize">{user?.role || 'user'}</span>
            </p>
          </div>
          
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <LoadingSpinner size="sm" /> : 'Enregistrer les modifications'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
