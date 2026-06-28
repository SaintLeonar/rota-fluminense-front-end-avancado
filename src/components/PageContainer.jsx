import BrandHeader from './BrandHeader'

export default function PageContainer({
  eyebrow,
  title,
  subtitle,
  children,
  rootClassName = '',
  shellClassName = '',
}) {
  const resolvedRootClassName = ['app-root', rootClassName].filter(Boolean).join(' ')
  const resolvedShellClassName = ['app-shell', shellClassName]
    .filter(Boolean)
    .join(' ')

  return (
    <main className={resolvedRootClassName}>
      <section className={resolvedShellClassName}>
        <BrandHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
        {children}
      </section>
    </main>
  )
}
