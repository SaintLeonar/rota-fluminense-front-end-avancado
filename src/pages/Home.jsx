import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import './Home.css'
import {
  MAX_TRAVELER_NAME_LENGTH,
  useStoredTravelerName,
} from '../hooks/useStoredTravelerName'
import PageContainer from '../components/PageContainer'
import PrimaryButton from '../components/PrimaryButton'
import ValidationHint from '../components/ValidationHint'

function hasTravelerName(value) {
  return value.replace(/[^\p{L}\s]/gu, '').trim().length > 0
}

export default function Home() {
  // Hook registrado para apresentacao: hook customizado reaproveita e persiste o nome do viajante.
  const { userName, setUserName, persistUserName } = useStoredTravelerName()
  const [isNameMissing, setIsNameMissing] = useState(false)

  // Hook registrado para apresentacao: useNavigate dispara a ida para /locais.
  const navigate = useNavigate()

  function handleEnter() {
    const normalizedUserName = persistUserName()

    if (!normalizedUserName) {
      setIsNameMissing(true)
      return
    }

    setIsNameMissing(false)
    navigate('/locais', {
      state: { userName: normalizedUserName },
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    handleEnter()
  }

  function handleUserNameChange(event) {
    const nextValue = event.target.value

    setUserName(nextValue)

    if (isNameMissing) {
      setIsNameMissing(!hasTravelerName(nextValue))
    }
  }

  return (
    <PageContainer
      rootClassName="home-root"
      shellClassName="home-shell"
      showUserPanel={false}
    >
      <div className="home-layout">
        <div className="home-hero-copy">
          <h1>
            <span className="home-title-line">
              <span>{'Bem-vindo \u00e0 '}</span>
              <span className="home-title-accent">Rota</span>
            </span>
            <span className="home-title-line home-title-accent">Fluminense</span>
          </h1>

          <p className="brand-subtitle">
            {
              'Um di\u00e1rio de bolso para explorar praias, mirantes, museus e parques do Rio - com avalia\u00e7\u00f5es de quem vive a cidade.'
            }
          </p>
        </div>

        <form className="home-entry-card" onSubmit={handleSubmit} noValidate>
          <div className="home-card-copy">
            <h2>Como se chama?</h2>
            <p className="support-copy">
              Vamos usar seu nome para personalizar a viagem.
            </p>
          </div>

          <div className="home-form-row">
            <div className="home-name-field">
              <input
                className={[
                  'field-input',
                  'home-name-input',
                  isNameMissing ? 'is-invalid' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                type="text"
                name="userName"
                placeholder="Seu nome"
                autoComplete="given-name"
                autoCapitalize="words"
                spellCheck={false}
                maxLength={MAX_TRAVELER_NAME_LENGTH}
                value={userName}
                onChange={handleUserNameChange}
                aria-invalid={isNameMissing}
              />

              {isNameMissing ? (
                <ValidationHint
                  className="home-name-hint"
                  message="Escreva seu nome para entrar."
                />
              ) : null}
            </div>

            <div className="home-submit-stack">
              <PrimaryButton type="submit" className="home-submit-button">
                <span>Entrar</span>
                <span className="home-submit-arrow" aria-hidden="true">&rarr;</span>
              </PrimaryButton>
            </div>
          </div>
        </form>

        <div className="home-direct-access">
          <span>{'J\u00e1 conhece?'}</span>
          <button
            type="button"
            className="home-direct-link"
            onClick={() => navigate('/locais')}
          >
            Ir direto ao mapa
          </button>
        </div>
      </div>
    </PageContainer>
  )
}
