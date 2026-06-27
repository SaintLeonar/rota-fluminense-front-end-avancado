import { useLocation, useNavigate } from 'react-router-dom'

import PageContainer from '../components/PageContainer'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'

export default function NotFound() {
  // Hook registrado para apresentacao: useNavigate oferece retorno programatico para rotas validas.
  const navigate = useNavigate()

  // Hook registrado para apresentacao: useLocation expoe a rota invalida acessada pelo usuario.
  const location = useLocation()

  return (
    <PageContainer eyebrow="Erro de rota" title="Pagina nao encontrada">
      <p className="lead">
        A rota <code>{location.pathname}</code> nao foi localizada.
      </p>

      <div className="button-row">
        <PrimaryButton onClick={() => navigate('/')}>
          Voltar ao inicio
        </PrimaryButton>
        <SecondaryButton onClick={() => navigate('/locais')}>
          Ir para locais
        </SecondaryButton>
      </div>
    </PageContainer>
  )
}
