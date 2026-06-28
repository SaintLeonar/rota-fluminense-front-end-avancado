import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PageContainer from '../components/PageContainer'
import PrimaryButton from '../components/PrimaryButton'

export default function Home() {
  // Hook registrado para apresentacao: useState controla o nome digitado.
  const [userName, setUserName] = useState('')

  // Hook registrado para apresentacao: useNavigate dispara a ida para /locais.
  const navigate = useNavigate()

  function handleEnter() {
    navigate('/locais', {
      state: { userName: userName.trim() },
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    handleEnter()
  }

  return (
    <PageContainer
      rootClassName="home-root"
      shellClassName="home-shell"
      title={
        <>
          <span className="home-title-line">
            <span>Bem-vindo à </span>
            <span className="home-title-accent">Rota</span>
          </span>
          <span className="home-title-line home-title-accent">
            Fluminense
          </span>
        </>
      }
      subtitle="Um diário de bolso para explorar praias, mirantes, museus e parques do Rio - com avaliações de quem vive a cidade."
    >
      <div className="home-layout">
        <form className="home-entry-card" onSubmit={handleSubmit}>
          <div className="home-card-copy">
            <h2>Como se chama?</h2>
            <p className="support-copy">
              Vamos usar seu nome para personalizar a viagem.
            </p>
          </div>

          <div className="home-form-row">
            <input
              className="field-input home-name-input"
              type="text"
              name="userName"
              placeholder="Seu nome"
              autoComplete="given-name"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
            />

            <PrimaryButton type="submit" className="home-submit-button">
              <span>Entrar</span>
              <span className="home-submit-arrow" aria-hidden="true">
                →
              </span>
            </PrimaryButton>
          </div>
        </form>

        <div className="home-direct-access">
          <span>Já conhece?</span>
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
