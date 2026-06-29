import styles from './PrimaryButton.module.css'

export default function PrimaryButton({
  children,
  type = 'button',
  onClick,
  disabled = false,
  className = '',
}) {
  const resolvedClassName = ['primary-button', styles.primaryButton, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={resolvedClassName}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
