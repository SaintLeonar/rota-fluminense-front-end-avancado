import styles from './LoadingState.module.css'

export default function LoadingState({
  title = 'Carregando conteudo',
  description = 'Estamos preparando as informações para você.',
}) {
  return (
    <section
      className={['loading-state', styles.loadingState].join(' ')}
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={['loading-state-dots', styles.loadingStateDots].join(' ')}
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </div>

      <div className={['loading-state-copy', styles.loadingStateCopy].join(' ')}>
        <p className={['eyebrow', styles.loadingStateEyebrow].join(' ')}>
          {title}
        </p>
        {description ? <p className="support-copy">{description}</p> : null}
      </div>
    </section>
  )
}
