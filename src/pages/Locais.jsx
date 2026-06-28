import { useNavigate } from 'react-router-dom'

import CategoryPills from '../components/CategoryPills'
import EmptyState from '../components/EmptyState'
import FeedbackAlert from '../components/FeedbackAlert'
import LocalCard from '../components/LocalCard'
import LoadingState from '../components/LoadingState'
import PageContainer from '../components/PageContainer'
import SearchBar from '../components/SearchBar'
import { useLocais } from '../hooks/useLocais'

export default function Locais() {
  // useNavigate abre o detalhe do local.
  const navigate = useNavigate()

  // hook customizado concentra busca, filtros e carregamento.
  const {
    status,
    errorMessage,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    categories,
    visibleLocais,
  } = useLocais()

  return (
    <PageContainer
      title="Rota Fluminense"
      subtitle="Um diario de bolso do Rio de Janeiro"
      rootClassName="locais-root"
      shellClassName="locais-shell"
    >
      {status === 'loading' ? (
        <LoadingState
          title="Carregando locais"
          description="Estamos reunindo a curadoria completa de lugares para esta tela."
        />
      ) : null}

      {status === 'error' ? (
        <FeedbackAlert
          variant="error"
          title="Nao foi possivel carregar os locais"
          message={errorMessage || 'Tente novamente em instantes.'}
        />
      ) : null}

      {status === 'success' ? (
        <section className="locais-content stack-md" aria-label="Resumo de locais">
          <SearchBar
            label="Buscar por nome, bairro ou categoria"
            placeholder="Onde vamos hoje?"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <CategoryPills
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />

          <div className="locais-section-header" aria-label="Resumo da listagem">
            <h2 className="locais-section-title">
              {visibleLocais.length} lugares para explorar
            </h2>
          </div>

          {visibleLocais.length > 0 ? (
            <div className="card-list">
              {visibleLocais.map((local) => (
                <LocalCard
                  key={local.id}
                  local={local}
                  onSelect={(selectedLocal) =>
                    navigate(`/locais/${selectedLocal.slug}`)
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum resultado para esta busca"
              description="Revise o termo digitado ou experimente explorar outra categoria."
            />
          )}

          <p className="locais-footer-note">
            Rota Fluminense - MVP Front-end Avancado
          </p>
        </section>
      ) : null}
    </PageContainer>
  )
}
