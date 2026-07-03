import styles from './PrimaryButton.module.css'

export default function PrimaryButton({
  children,
  type = 'button',
  onClick,
  disabled = false,
  className = '',
  ...props
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
      {...props}
    >
      {children}
    </button>
  )
}
