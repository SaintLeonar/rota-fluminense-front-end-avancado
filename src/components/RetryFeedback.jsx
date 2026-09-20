import FeedbackAlert from './FeedbackAlert.jsx'
import SecondaryButton from './SecondaryButton.jsx'
import styles from './RetryFeedback.module.css'

export default function RetryFeedback({
  title,
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
}) {
  return (
    <div className={styles.retryFeedback}>
      <FeedbackAlert variant="error" title={title} message={message} />
      <SecondaryButton className={styles.retryButton} onClick={onRetry}>
        {retryLabel}
      </SecondaryButton>
    </div>
  )
}
