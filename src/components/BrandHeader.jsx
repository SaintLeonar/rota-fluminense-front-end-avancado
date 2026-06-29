import { useNavigate } from 'react-router-dom'

import styles from './BrandHeader.module.css'
import { useStoredTravelerName } from '../hooks/useStoredTravelerName'

export default function BrandHeader({
  eyebrow,
  title,
  subtitle,
  showUserPanel = true,
}) {
  const navigate = useNavigate()
  const { userName, clearUserName } = useStoredTravelerName()
  const shouldShowUserPanel = showUserPanel
  const hasMainContent = Boolean(eyebrow || title || subtitle)
  const greetingName = userName || 'visitante'

  if (!hasMainContent && !shouldShowUserPanel) {
    return null
  }

  function handleSignOut() {
    clearUserName()
    navigate('/')
  }

  return (
    <header className={['brand-header', styles.brandHeader].join(' ')}>
      {hasMainContent ? (
        <div className={['brand-header-main', styles.brandHeaderMain].join(' ')}>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          {title ? <h1 className={['brand-title', styles.brandTitle].join(' ')}>{title}</h1> : null}
          {subtitle ? (
            <p className={['brand-subtitle', styles.brandSubtitle].join(' ')}>
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}

      {shouldShowUserPanel ? (
        <div className={['brand-user-panel', styles.brandUserPanel].join(' ')}>
          <p className={['brand-user-greeting', styles.brandUserGreeting].join(' ')}>
            {`Ol\u00e1, ${greetingName}`}
          </p>
          <button
            type="button"
            className={['brand-user-signout', styles.brandUserSignout].join(' ')}
            onClick={handleSignOut}
          >
            Sair
          </button>
        </div>
      ) : null}
    </header>
  )
}
