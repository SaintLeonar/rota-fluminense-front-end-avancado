import { useNavigate } from 'react-router-dom'

import './BrandHeader.css'
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
    <header className="brand-header">
      {hasMainContent ? (
        <div className="brand-header-main">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          {title ? <h1 className="brand-title">{title}</h1> : null}
          {subtitle ? <p className="brand-subtitle">{subtitle}</p> : null}
        </div>
      ) : null}

      {shouldShowUserPanel ? (
        <div className="brand-user-panel">
          <p className="brand-user-greeting">{`Ol\u00e1, ${greetingName}`}</p>
          <button type="button" className="brand-user-signout" onClick={handleSignOut}>
            Sair
          </button>
        </div>
      ) : null}
    </header>
  )
}
