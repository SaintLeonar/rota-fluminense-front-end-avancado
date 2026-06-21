export default function PageContainer({ eyebrow, title, children }) {
  return (
    <main className="app-root">
      <section className="app-shell">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {title ? <h1>{title}</h1> : null}
        {children}
      </section>
    </main>
  )
}
