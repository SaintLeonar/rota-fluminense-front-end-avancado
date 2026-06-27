import BrandHeader from './BrandHeader'

export default function PageContainer({ eyebrow, title, subtitle, children }) {
  return (
    <main className="app-root">
      <section className="app-shell">
        <BrandHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
        {children}
      </section>
    </main>
  )
}
