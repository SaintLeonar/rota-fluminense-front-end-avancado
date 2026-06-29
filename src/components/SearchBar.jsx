import './SearchBar.css'

export default function SearchBar({
  label = 'Buscar locais',
  placeholder = 'Onde vamos hoje?',
  value,
  onChange,
}) {
  return (
    <label className="search-bar">
      <span className="field-label sr-only">{label}</span>

      <span className="search-bar-control">
        <span className="search-bar-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <circle
              cx="10.5"
              cy="10.5"
              r="5.75"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M15 15l4.25 4.25"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
        </span>

        <input
          className="search-bar-input"
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </span>
    </label>
  )
}
