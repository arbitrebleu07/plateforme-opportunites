import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

export function OfferFilters({ filters, onFilterChange, categories }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Rechercher..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        />
        
        <Select
          value={filters.type}
          onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
        >
          <option value="">Tous les types</option>
          <option value="emploi">Emploi</option>
          <option value="stage">Stage</option>
          <option value="bourse">Bourse</option>
          <option value="formation">Formation</option>
        </Select>
        
        <Select
          value={filters.category}
          onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
        >
          <option value="">Toutes les catégories</option>
          {categories?.map((cat) => (
            <option key={cat.id_categorie} value={cat.id_categorie}>
              {cat.nom}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
