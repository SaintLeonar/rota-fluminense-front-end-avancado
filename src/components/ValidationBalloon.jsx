import styles from './ValidationBalloon.module.css'

export default function ValidationBalloon({
  message,
  align = 'center',
  className = '',
}) {
  const alignmentClassName =
    align === 'end' ? styles.validationBalloonEnd : styles.validationBalloonCenter

  return (
    <div
      className={[
        'validation-balloon',
        styles.validationBalloon,
        alignmentClassName,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="alert"
      aria-live="assertive"
    >
      <p>{message}</p>
    </div>
  )
}
