import { useNavigate } from 'react-router-dom'

export default function BackButton({
  label = 'Voltar',
  fallbackTo = '/locais',
  className = '',
  iconOnly = false,
}) {
  // Hook registrado para apresentacao: useNavigate executa o retorno de navegacao.
  const navigate = useNavigate()

  const resolvedClassName = ['back-button', className].filter(Boolean).join(' ')

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(fallbackTo)
  }

  return (
    <button type="button" className={resolvedClassName} onClick={handleBack}>
      <span className="back-button-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path
            d="M14.75 5.75L8.5 12l6.25 6.25"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </span>
      {iconOnly ? null : <span>{label}</span>}
    </button>
  )
}
