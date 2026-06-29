import './CategoryPills.css'

export default function CategoryPills({ categories, activeCategory, onSelect }) {
  return (
    <div className="category-pills" aria-label="Filtros por categoria">
      {categories.map((category) => {
        const isActive = category === activeCategory

        return (
          <button
            key={category}
            className={isActive ? 'category-pill is-active' : 'category-pill'}
            type="button"
            onClick={() => onSelect(category)}
            aria-pressed={isActive}
            aria-label={`Filtrar por ${category}`}
          >
            <span className="category-pill-label">{category}</span>
          </button>
        )
      })}
    </div>
  )
}
