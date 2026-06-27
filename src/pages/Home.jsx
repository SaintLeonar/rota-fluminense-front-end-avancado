import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PageContainer from '../components/PageContainer'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'

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

  return (
    <PageContainer
      eyebrow="Boas-vindas"
      title="Rota Fluminense"
      subtitle="Um diario de bolso para descobrir praias, mirantes, museus e parques com olhar local."
    >
      <p className="lead">
        Estrutura principal de rotas configurada. Esta tela ja usa estado para
        capturar o nome do visitante e navegacao programatica para seguir ao
        fluxo de exploracao.
      </p>

      <div className="stack-md">
        <label className="field">
          <span className="field-label">Como voce quer ser chamado?</span>
          <input
            className="field-input"
            type="text"
            placeholder="Digite seu nome"
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
          />
        </label>

        <div className="button-row">
          <PrimaryButton onClick={handleEnter}>
            Entrar
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/locais')}>
            Ir direto para explorar
          </SecondaryButton>
        </div>
      </div>
    </PageContainer>
  )
}
