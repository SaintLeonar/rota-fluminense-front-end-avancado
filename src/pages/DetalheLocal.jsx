import { useEffect, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'

import './DetalheLocal.css'
import BackButton from '../components/BackButton'
import Breadcrumb from '../components/Breadcrumb'
import EmptyState from '../components/EmptyState'
import FeedbackAlert from '../components/FeedbackAlert'
import LoadingState from '../components/LoadingState'
import PageContainer from '../components/PageContainer'
import PrimaryButton from '../components/PrimaryButton'
import ReviewCard from '../components/ReviewCard'
import ReviewForm from '../components/ReviewForm'
import RetryFeedback from '../components/RetryFeedback'
import Tooltip from '../components/Tooltip'
import WeatherCard from '../components/WeatherCard'
import { useDetalheLocal } from '../hooks/useDetalheLocal'

function DetailStars({ rating, total }) {
  const hasRating = typeof rating === 'number' && Number.isFinite(rating)
  const roundedRating = hasRating ? Math.round(rating) : 0
  const stars = Array.from({ length: 5 }, (_, index) => index + 1)
  const reviewLabel = total === 1 ? 'avaliação' : 'avaliações'
  const accessibleLabel = hasRating
    ? `Nota ${rating.toFixed(1)} de 5, ${total} ${reviewLabel}`
    : 'Ainda sem avaliações'

  return (
    <div className="detail-rating" aria-label={accessibleLabel}>
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
        <strong>{hasRating ? rating.toFixed(1) : 'Novo'}</strong> ({total}{' '}
        {reviewLabel})
      </p>
    </div>
  )
}

function formatSlugLabel(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function buildBreadcrumbItems(pathname, localName) {
  const segments = pathname.split('/').filter(Boolean)
  const items = [{ label: 'Rota Fluminense', to: '/' }]

  if (segments[0] === 'locais') {
    items.push({ label: 'Locais', to: '/locais' })
  }

  if (segments[1]) {
    items.push({
      label: localName || formatSlugLabel(segments[1]),
    })
  }

  return items
}

export default function DetalheLocal() {
  // Hook registrado para apresentacao: useParams le o slug dinamico da rota.
  const { slug } = useParams()
  // Hook registrado para apresentacao: useLocation le a rota atual para montar o breadcrumb.
  const location = useLocation()

  // Hook registrado para apresentacao: hook customizado concentra carregamento do detalhe e envio da avaliacao.
  const {
    local,
    avaliacoes,
    status,
    errorMessage,
    retryDetail,
    reviewsStatus,
    reviewsErrorMessage,
    retryReviews,
    isFormOpen,
    reviewValues,
    isSubmittingReview,
    reviewFieldErrors,
    submitFeedback,
    editingReviewId,
    editReviewValues,
    editReviewFieldErrors,
    deleteConfirmationId,
    reviewMutation,
    reviewMutationFeedback,
    isReviewMutationPending,
    totalReviews,
    averageRating,
    handleReviewChange,
    handleOpenReviewForm,
    handleCancelReviewForm,
    handleReviewSubmit,
    handleStartReviewEdit,
    handleEditReviewChange,
    handleCancelReviewEdit,
    handleReviewUpdateSubmit,
    handleRequestReviewDelete,
    handleCancelReviewDelete,
    handleConfirmReviewDelete,
  } = useDetalheLocal(slug)

  const reviewsTitleRef = useRef(null)
  const isReviewSuccess = submitFeedback?.variant === 'success'
  const breadcrumbItems = buildBreadcrumbItems(location.pathname, local?.nome)

  useEffect(() => {
    if (reviewMutationFeedback?.variant === 'success') {
      reviewsTitleRef.current?.focus()
    }
  }, [reviewMutationFeedback])
  const reviewCtaLabel = isReviewSuccess
    ? submitFeedback.message
    : '+ Avaliar'
  const reviewCta = (
    <PrimaryButton
      className={[
        'detail-review-cta',
        isReviewSuccess ? 'is-success' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleOpenReviewForm}
      disabled={
        isReviewSuccess ||
        isSubmittingReview ||
        isReviewMutationPending ||
        editingReviewId !== null ||
        deleteConfirmationId !== null
      }
      aria-label={reviewCtaLabel}
      aria-live="polite"
    >
      <span
        className="detail-review-cta-label detail-review-cta-label-default"
        aria-hidden={isReviewSuccess}
      >
        + Avaliar
      </span>
      <span
        className="detail-review-cta-label detail-review-cta-label-success"
        aria-hidden={!isReviewSuccess}
      >
        Obrigado por avaliar!
      </span>
    </PrimaryButton>
  )

  function handleCancelEditWithFocus() {
    const reviewId = editingReviewId
    handleCancelReviewEdit()

    requestAnimationFrame(() => {
      document.getElementById('review-' + reviewId + '-edit')?.focus()
    })
  }

  return (
    <PageContainer
      title="Rota Fluminense"
      subtitle="Um diario de bolso do Rio de Janeiro"
      rootClassName="detail-root"
      shellClassName="detail-shell"
    >
      {status === 'loading' ? (
        <LoadingState
          title="Carregando informações do local"
          description="Estamos preparando os detalhes e o diario de visitas deste destino."
        />
      ) : null}

      {status === 'error' ? (
        <RetryFeedback
          title="Não foi possível carregar este local"
          message={
            errorMessage ||
            'Tente voltar e abrir novamente o detalhe em alguns instantes.'
          }
          onRetry={retryDetail}
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
            <Breadcrumb className="detail-breadcrumb" items={breadcrumbItems} />
            <p className="detail-category-pill">{local.categoriaLabel}</p>
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
                <span>
                  {local.bairro}, {local.cidade} • {local.regiao}
                </span>
              </div>

              <DetailStars rating={averageRating} total={totalReviews} />
            </div>

            <p className="detail-description">{local.descricao}</p>

            <WeatherCard slug={local.slug} />
          </section>

          <aside className="detail-reviews">
            <div className="detail-reviews-header">
              <h2
                ref={reviewsTitleRef}
                className="detail-reviews-title"
                tabIndex="-1"
              >
                Diario de visitas
              </h2>

              {isReviewSuccess ? (
                reviewCta
              ) : (
                <Tooltip
                  content="Deixe uma avaliação e comentário sobre este local"
                  align="end"
                >
                  {reviewCta}
                </Tooltip>
              )}
            </div>

            {submitFeedback?.variant === 'error' ? (
              <FeedbackAlert
                variant={submitFeedback.variant}
                title={submitFeedback.title}
                message={submitFeedback.message}
              />
            ) : null}

            {reviewMutationFeedback ? (
              <FeedbackAlert
                variant={reviewMutationFeedback.variant}
                title={reviewMutationFeedback.title}
                message={reviewMutationFeedback.message}
              />
            ) : null}

            {isFormOpen ? (
              <ReviewForm
                className="detail-review-form"
                values={reviewValues}
                onChange={handleReviewChange}
                onSubmit={handleReviewSubmit}
                onCancel={handleCancelReviewForm}
                fieldErrors={reviewFieldErrors}
                isSubmitting={isSubmittingReview}
              />
            ) : null}

            {reviewsStatus === 'loading' ? (
              <LoadingState
                title="Carregando avaliações"
                description="Buscando as experiências registradas para este destino."
              />
            ) : null}

            {reviewsStatus === 'error' ? (
              <RetryFeedback
                title="Não foi possível carregar as avaliações"
                message={
                  reviewsErrorMessage ||
                  'O destino continua disponível. Tente novamente mais tarde.'
                }
                onRetry={retryReviews}
              />
            ) : null}

            {avaliacoes.length > 0 ? (
              <div className="review-list detail-review-list">
                {avaliacoes.map((avaliacao) => {
                  const isEditing = editingReviewId === avaliacao.id
                  const isDeleteConfirmationOpen =
                    deleteConfirmationId === avaliacao.id
                  const isDeleting =
                    reviewMutation?.type === 'delete' &&
                    reviewMutation.reviewId === avaliacao.id

                  return (
                    <div
                      key={avaliacao.id}
                      className="detail-review-entry"
                    >
                      {isEditing && editReviewValues ? (
                        <ReviewForm
                          className="detail-review-form"
                          title={'Editar avaliação de ' + avaliacao.autor}
                          values={editReviewValues}
                          onChange={handleEditReviewChange}
                          onSubmit={handleReviewUpdateSubmit}
                          onCancel={handleCancelEditWithFocus}
                          fieldErrors={editReviewFieldErrors}
                          isSubmitting={
                            reviewMutation?.type === 'update' &&
                            reviewMutation.reviewId === avaliacao.id
                          }
                          submitLabel="Salvar alterações"
                          submittingLabel="Salvando..."
                          autoFocusAuthor
                        />
                      ) : (
                        <ReviewCard
                          review={avaliacao}
                          onEdit={handleStartReviewEdit}
                          onRequestDelete={handleRequestReviewDelete}
                          onCancelDelete={handleCancelReviewDelete}
                          onConfirmDelete={handleConfirmReviewDelete}
                          isDeleteConfirmationOpen={
                            isDeleteConfirmationOpen
                          }
                          isMutationPending={
                            isSubmittingReview ||
                            isReviewMutationPending ||
                            editingReviewId !== null ||
                            deleteConfirmationId !== null
                          }
                          isDeleting={isDeleting}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ) : null}

            {reviewsStatus === 'success' && avaliacoes.length === 0 ? (
              <EmptyState
                title="Ainda não há avaliações"
                description="Seja a primeira pessoa a registrar uma impressão sobre este local."
              />
            ) : null}
          </aside>
        </article>
      ) : null}

      {status === 'not-found' ? (
        <EmptyState
          title="Local não encontrado"
          description={
            <>
              Nenhum local foi encontrado para o endereço <code>{slug}</code>.
            </>
          }
        />
      ) : null}
    </PageContainer>
  )
}
