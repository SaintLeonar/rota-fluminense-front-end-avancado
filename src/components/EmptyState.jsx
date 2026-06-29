import styles from './EmptyState.module.css'

export default function EmptyState({
  title = 'Nada para mostrar por aqui',
  description,
  action = null,
}) {
  return (
    <section className={['empty-state', styles.emptyState].join(' ')} aria-live="polite">
      <h2>{title}</h2>

      {description ? <p className="support-copy">{description}</p> : null}

      {action ? (
        <div className={['empty-state-action', styles.emptyStateAction].join(' ')}>
          {action}
        </div>
      ) : null}
    </section>
  )
}
