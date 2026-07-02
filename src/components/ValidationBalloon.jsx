import styles from './ValidationBalloon.module.css'

export default function ValidationBalloon({
  message,
  align = 'center',
  className = '',
}) {
  const alignmentClassNameMap = {
    center: styles.validationBalloonCenter,
    end: styles.validationBalloonEnd,
    icon: styles.validationBalloonIcon,
  }
  const alignmentClassName =
    alignmentClassNameMap[align] ?? alignmentClassNameMap.center

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
