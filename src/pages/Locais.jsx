import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import CategoryPills from '../components/CategoryPills'
import EmptyState from '../components/EmptyState'
import FeedbackAlert from '../components/FeedbackAlert'
import LocalCard from '../components/LocalCard'
import LoadingState from '../components/LoadingState'
import PageContainer from '../components/PageContainer'
import SearchBar from '../components/SearchBar'
import { listLocais } from '../services/locaisService'

export default function Locais() {
  // Hook registrado para apresentacao: useState controla loading, erro e dados carregados.
  const [locais, setLocais] = useState([])
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')

  // Hook registrado para apresentacao: useNavigate abre o detalhe do local.
  const navigate = useNavigate()

  useEffect(() => {
    // Hook registrado para apresentacao: useEffect dispara a leitura inicial dos locais.
    let isMounted = true

    async function loadLocais() {
      setStatus('loading')
      setErrorMessage('')

      try {
        const data = await listLocais()

        if (!isMounted) {
          return
        }

        setLocais(data)
        setStatus('success')
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(error.message)
        setStatus('error')
      }
    }

    loadLocais()

    return () => {
      isMounted = false
    }
  }, [])

  const featuredLocais = locais.filter((local) => local.destaque)
  const categories = ['Todos', ...new Set(locais.map((local) => local.categoria))]
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const visibleLocais = featuredLocais.filter((local) => {
    const matchesCategory =
      activeCategory === 'Todos' || local.categoria === activeCategory

    if (!matchesCategory) {
      return false
    }

    if (!normalizedSearch) {
      return true
    }

    return [local.nome, local.bairro, local.categoria, local.regiao].some((value) =>
      value.toLowerCase().includes(normalizedSearch),
    )
  })

  return (
    <PageContainer
      title="Rota Fluminense"
      subtitle="Um diario de bolso do Rio de Janeiro"
      rootClassName="locais-root"
      shellClassName="locais-shell"
    >
      {status === 'loading' ? (
        <LoadingState
          title="Carregando locais em destaque"
          description="Estamos reunindo a selecao inicial da curadoria para esta tela."
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

          {visibleLocais.length === 0 && searchTerm ? (
            <FeedbackAlert
              variant="warning"
              title="Nenhum resultado para esta busca"
              message="Revise o termo digitado ou experimente explorar outra categoria."
            />
          ) : null}

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
              title="Nenhum destaque encontrado"
              description="Tente ajustar a busca ou trocar a categoria para reencontrar locais da curadoria."
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
