export default function SecondaryButton({
  children,
  type = 'button',
  onClick,
  disabled = false,
  className = '',
}) {
  const resolvedClassName = ['secondary-button', className]
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
