import styles from './FeedbackAlert.module.css'

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
  const variantClassNames = {
    success: styles.feedbackAlertSuccess,
    error: styles.feedbackAlertError,
    warning: styles.feedbackAlertWarning,
  }
  const resolvedVariantClassName =
    variantClassNames[variant] ?? variantClassNames.success

  return (
    <section
      className={[
        'feedback-alert',
        `feedback-alert-${variant}`,
        styles.feedbackAlert,
        resolvedVariantClassName,
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <p className={['feedback-alert-badge', styles.feedbackAlertBadge].join(' ')}>
        {badgeLabel}
      </p>
      {title ? <h2>{title}</h2> : null}
      {message ? <p className="support-copy">{message}</p> : null}
    </section>
  )
}
