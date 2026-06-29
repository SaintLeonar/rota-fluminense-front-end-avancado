import './FeedbackAlert.css'

const variantLabels = {
  success: 'Sucesso',
  error: 'Erro',
  warning: 'Aviso',
}

export default function FeedbackAlert({
  variant = 'success',
  title,
  message,
}) {
  const badgeLabel = variantLabels[variant] ?? variantLabels.success

  return (
    <section
      className={`feedback-alert feedback-alert-${variant}`}
      role="status"
      aria-live="polite"
    >
      <p className="feedback-alert-badge">{badgeLabel}</p>
      {title ? <h2>{title}</h2> : null}
      {message ? <p className="support-copy">{message}</p> : null}
    </section>
  )
}
