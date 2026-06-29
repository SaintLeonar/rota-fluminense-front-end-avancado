import { useNavigate } from 'react-router-dom'

import './NotFound.css'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'

export default function NotFound() {
  // useNavigate oferece retorno programatico para rotas validas.
  const navigate = useNavigate()

  return (
    <main className="notfound-root">
      <section className="notfound-stage">
        <article className="notfound-card">
          <p className="notfound-badge">ERRO 404</p>
          <h1 className="notfound-title">Ops</h1>
          <h2 className="notfound-subtitle">Esse caminho não está no mapa</h2>
          <p className="notfound-copy">
            A página que você procura pode ter mudado de lugar ou nunca existiu.
            Volte para a Rota Fluminense e continue explorando o Rio.
          </p>

          <div className="notfound-actions">
            <PrimaryButton
              className="notfound-primary-button"
              onClick={() => navigate('/locais')}
            >
              Voltar ao início
            </PrimaryButton>

            <SecondaryButton
              className="notfound-secondary-button"
              onClick={() => navigate('/')}
            >
              Tela de boas-vindas
            </SecondaryButton>
          </div>
        </article>
      </section>
    </main>
  )
}
