export default function EmptyState({
  title = 'Nada para mostrar por aqui',
  description,
  action = null,
}) {
  return (
    <section className="empty-state" aria-live="polite">
      <p className="eyebrow">Estado vazio</p>
      <h2>{title}</h2>

      {description ? <p className="support-copy">{description}</p> : null}

      {action ? <div className="empty-state-action">{action}</div> : null}
    </section>
  )
}
