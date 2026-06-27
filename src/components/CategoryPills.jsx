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
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}
