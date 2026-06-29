import { useNavigate } from 'react-router-dom'

import './Home.css'
import { useStoredTravelerName } from '../hooks/useStoredTravelerName'
import PageContainer from '../components/PageContainer'
import PrimaryButton from '../components/PrimaryButton'

export default function Home() {
  // Hook registrado para apresentacao: hook customizado reaproveita e persiste o nome do viajante.
  const { userName, setUserName, persistUserName } = useStoredTravelerName()

  // Hook registrado para apresentacao: useNavigate dispara a ida para /locais.
  const navigate = useNavigate()

  function handleEnter() {
    const normalizedUserName = persistUserName()

    navigate('/locais', {
      state: { userName: normalizedUserName },
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
              <span className="home-submit-arrow" aria-hidden="true">&rarr;</span>
            </PrimaryButton>
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
