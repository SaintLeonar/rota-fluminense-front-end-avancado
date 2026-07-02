import ValidationBalloon from './ValidationBalloon'
import styles from './ValidationHint.module.css'

export default function ValidationHint({
  message,
  className = '',
}) {
  return (
    <div
      className={['validation-hint', styles.validationHint, className]
        .filter(Boolean)
        .join(' ')}
    >
      <ValidationBalloon message={message} align="icon" />
      <span
        className={['validation-hint-icon', styles.validationHintIcon].join(' ')}
        aria-hidden="true"
      >
        i
      </span>
    </div>
  )
}
