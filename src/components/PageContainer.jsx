import styles from './PageContainer.module.css'
import BrandHeader from './BrandHeader'

export default function PageContainer({
  eyebrow,
  title,
  subtitle,
  children,
  rootClassName = '',
  shellClassName = '',
  showUserPanel = true,
}) {
  const resolvedRootClassName = ['app-root', styles.appRoot, rootClassName]
    .filter(Boolean)
    .join(' ')
  const resolvedShellClassName = ['app-shell', styles.appShell, shellClassName]
    .filter(Boolean)
    .join(' ')

  return (
    <main className={resolvedRootClassName}>
      <section className={resolvedShellClassName}>
        <BrandHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          showUserPanel={showUserPanel}
        />
        {children}
      </section>
    </main>
  )
}
