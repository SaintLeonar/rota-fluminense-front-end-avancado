import { useNavigate } from 'react-router-dom'

export default function BackButton({
  label = 'Voltar',
  fallbackTo = '/locais',
}) {
  // Hook registrado para apresentacao: useNavigate executa o retorno de navegacao.
  const navigate = useNavigate()

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(fallbackTo)
  }

  return (
    <button type="button" className="back-button" onClick={handleBack}>
      <span className="back-button-icon" aria-hidden="true">
        ←
      </span>
      <span>{label}</span>
    </button>
  )
}
