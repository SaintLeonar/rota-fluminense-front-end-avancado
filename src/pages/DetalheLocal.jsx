import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import BackButton from '../components/BackButton'
import EmptyState from '../components/EmptyState'
import FeedbackAlert from '../components/FeedbackAlert'
import LoadingState from '../components/LoadingState'
import PageContainer from '../components/PageContainer'
import ReviewCard from '../components/ReviewCard'
import { listAvaliacoesByLocal } from '../services/avaliacoesService'
import { findLocalByIdOrSlug } from '../services/locaisService'

export default function DetalheLocal() {
  // Hook registrado para apresentacao: useParams le o slug dinamico da rota.
  const { slug } = useParams()

  // Hook registrado para apresentacao: useState controla o local carregado e as avaliacoes.
  const [local, setLocal] = useState(null)
  const [avaliacoes, setAvaliacoes] = useState([])
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    // Hook registrado para apresentacao: useEffect busca local e avaliacoes ao entrar no detalhe.
    let isMounted = true

    async function loadDetalhe() {
      setStatus('loading')

      try {
        const localData = await findLocalByIdOrSlug(slug)

        if (!isMounted) {
          return
        }

        setLocal(localData)

        if (!localData) {
          setAvaliacoes([])
          setStatus('success')
          return
        }

        const avaliacoesData = await listAvaliacoesByLocal(localData.id)

        if (!isMounted) {
          return
        }

        setAvaliacoes(avaliacoesData)
        setStatus('success')
      } catch {
        if (!isMounted) {
          return
        }

        setStatus('error')
      }
    }

    loadDetalhe()

    return () => {
      isMounted = false
    }
  }, [slug])

  return (
    <PageContainer
      eyebrow="Detalhe"
      title={local ? local.nome : 'Detalhe do local'}
    >
      <BackButton />

      {status === 'loading' ? (
        <LoadingState
          title="Carregando informacoes do local"
          description="Estamos preparando os detalhes e o diario de visitas deste destino."
        />
      ) : null}

      {status === 'error' ? (
        <FeedbackAlert
          variant="error"
          title="Nao foi possivel carregar este local"
          message="Tente voltar e abrir novamente o detalhe em alguns instantes."
        />
      ) : null}

      {status === 'success' && local ? (
        <div className="stack-md">
          <p className="lead">{local.descricao}</p>
          <p className="support-copy">
            {local.categoria} • {local.bairro} • {local.regiao}
          </p>
          <p className="support-copy">
            Nota {local.nota} com {local.totalAvaliacoes} avaliacoes.
          </p>

          <section className="reviews-section" aria-labelledby="reviews-title">
            <div className="reviews-section-header">
              <p className="eyebrow">Diario de visitas</p>
              <h2 id="reviews-title">
                {avaliacoes.length} comentario(s) compartilhado(s)
              </h2>
            </div>

            {avaliacoes.length > 0 ? (
              <div className="review-list">
                {avaliacoes.map((avaliacao) => (
                  <ReviewCard key={avaliacao.id} review={avaliacao} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Ainda nao ha avaliacoes"
                description="Seja a primeira pessoa a registrar uma impressao sobre este local."
              />
            )}
          </section>
        </div>
      ) : null}

      {status === 'success' && !local ? (
        <EmptyState
          title="Local nao encontrado"
          description={
            <>
              Nenhum local foi encontrado para o slug <code>{slug}</code>.
            </>
          }
        />
      ) : null}
    </PageContainer>
  )
}
