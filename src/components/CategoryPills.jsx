import './CategoryPills.css'

export default function CategoryPills({ categories, activeCategory, onSelect }) {
  return (
    <div
      className="category-pills"
      role="group"
      aria-label="Filtros por categoria"
    >
      {categories.map((category) => {
        const isActive = category.value === activeCategory

        return (
          <button
            key={category.value}
            className={isActive ? 'category-pill is-active' : 'category-pill'}
            type="button"
            onClick={() => onSelect(category.value)}
            aria-pressed={isActive}
            aria-label={'Filtrar por ' + category.label}
          >
            <span className="category-pill-label">{category.label}</span>
          </button>
        )
      })}
    </div>
  )
}
