import './LoadingState.css'

export default function LoadingState({
  title = 'Carregando conteudo',
  description = 'Estamos preparando as informacoes para voce.',
}) {
  return (
    <section className="loading-state" aria-live="polite" aria-busy="true">
      <div className="loading-state-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="loading-state-copy">
        <p className="eyebrow">Carregando</p>
        <h2>{title}</h2>
        <p className="support-copy">{description}</p>
      </div>
    </section>
  )
}
