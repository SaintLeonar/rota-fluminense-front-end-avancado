import { Link } from 'react-router-dom'

import styles from './Breadcrumb.module.css'

export default function Breadcrumb({ items, className = '' }) {
  if (!items?.length) {
    return null
  }

  const resolvedClassName = [styles.breadcrumb, className]
    .filter(Boolean)
    .join(' ')

  return (
    <nav className={resolvedClassName} aria-label="Breadcrumb">
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isCurrentPage = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`} className={styles.item}>
              {item.to && !isCurrentPage ? (
                <Link className={styles.link} to={item.to}>
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isCurrentPage ? styles.currentPage : styles.label}
                  aria-current={isCurrentPage ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
