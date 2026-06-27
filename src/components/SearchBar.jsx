export default function SearchBar({
  label = 'Buscar locais',
  placeholder = 'Onde vamos hoje?',
  value,
  onChange,
}) {
  return (
    <label className="search-bar">
      <span className="field-label">{label}</span>
      <input
        className="search-bar-input"
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </label>
  )
}
