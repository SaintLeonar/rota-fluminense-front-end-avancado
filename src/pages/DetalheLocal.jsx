import { useParams } from 'react-router-dom'

import BackButton from '../components/BackButton'
import EmptyState from '../components/EmptyState'
import FeedbackAlert from '../components/FeedbackAlert'
import LoadingState from '../components/LoadingState'
import PageContainer from '../components/PageContainer'
import PrimaryButton from '../components/PrimaryButton'
import ReviewCard from '../components/ReviewCard'
import ReviewForm from '../components/ReviewForm'
import { useDetalheLocal } from '../hooks/useDetalheLocal'

function DetailStars({ rating, total }) {
  const roundedRating = Math.round(Number(rating))
  const stars = Array.from({ length: 5 }, (_, index) => index + 1)
  const reviewLabel = total === 1 ? 'avaliacao' : 'avaliacoes'

  return (
    <div className="detail-rating" aria-label={`Nota ${rating}`}>
      <div className="detail-rating-stars" aria-hidden="true">
        {stars.map((star) => (
          <span
            key={star}
            className={
              star <= roundedRating
                ? 'detail-rating-star is-active'
                : 'detail-rating-star'
            }
          >
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="m12 3.6l2.57 5.21l5.75.84l-4.16 4.05l.98 5.73L12 16.73l-5.14 2.7l.98-5.73L3.68 9.65l5.75-.84L12 3.6Z"
                fill="currentColor"
              />
            </svg>
          </span>
        ))}
      </div>

      <p className="detail-rating-copy">
        <strong>{Number(rating).toFixed(1)}</strong> ({total} {reviewLabel})
      </p>
    </div>
  )
}

export default function DetalheLocal() {
  // Hook registrado para apresentacao: useParams le o slug dinamico da rota.
  const { slug } = useParams()

  // Hook registrado para apresentacao: hook customizado concentra carregamento do detalhe e envio da avaliacao.
  const {
    local,
    avaliacoes,
    status,
    errorMessage,
    isFormOpen,
    reviewValues,
    isSubmittingReview,
    submitFeedback,
    totalReviews,
    averageRating,
    handleReviewChange,
    handleOpenReviewForm,
    handleCancelReviewForm,
    handleReviewSubmit,
  } = useDetalheLocal(slug)

  return (
    <PageContainer
      title="Rota Fluminense"
      subtitle="Um diario de bolso do Rio de Janeiro"
      rootClassName="detail-root"
      shellClassName="detail-shell"
    >
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
          message={
            errorMessage ||
            'Tente voltar e abrir novamente o detalhe em alguns instantes.'
          }
        />
      ) : null}

      {status === 'success' && local ? (
        <article className="detail-page">
          <div className="detail-hero">
            <BackButton className="detail-back-button" iconOnly />

            <img
              className="detail-hero-image"
              src={local.imagem}
              alt={`Vista de ${local.nome}`}
            />
          </div>

          <section className="detail-main">
            <p className="detail-category-pill">{local.categoria.toUpperCase()}</p>
            <h1 className="detail-title">{local.nome}</h1>

            <div className="detail-meta">
              <div className="detail-location">
                <span className="detail-location-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path
                      d="M12 20s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Zm0-7.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Z"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </span>
                <span>{local.bairro}, Rio de Janeiro</span>
              </div>

              <DetailStars rating={averageRating} total={totalReviews} />
            </div>

            <p className="detail-description">{local.descricao}</p>
          </section>

          <aside className="detail-reviews">
            <div className="detail-reviews-header">
              <h2 className="detail-reviews-title">Diario de visitas</h2>

              <PrimaryButton className="detail-review-cta" onClick={handleOpenReviewForm}>
                + Avaliar
              </PrimaryButton>
            </div>

            {submitFeedback?.variant === 'error' ? (
              <FeedbackAlert
                variant={submitFeedback.variant}
                title={submitFeedback.title}
                message={submitFeedback.message}
              />
            ) : null}

            {isFormOpen ? (
              <ReviewForm
                className="detail-review-form"
                values={reviewValues}
                onChange={handleReviewChange}
                onSubmit={handleReviewSubmit}
                onCancel={handleCancelReviewForm}
                isSubmitting={isSubmittingReview}
              />
            ) : null}

            {avaliacoes.length > 0 ? (
              <div className="review-list detail-review-list">
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
          </aside>
        </article>
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
