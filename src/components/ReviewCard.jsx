import { useEffect, useId, useRef } from 'react'

import styles from './ReviewCard.module.css'

function formatReviewDate(dateString) {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
    .format(date)
    .toUpperCase()
}

export default function ReviewCard({
  review,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  isDeleteConfirmationOpen = false,
  isMutationPending = false,
  isDeleting = false,
}) {
  const stars = Array.from({ length: 5 }, (_, index) => index + 1)
  const deleteButtonRef = useRef(null)
  const confirmButtonRef = useRef(null)
  const confirmationTitleId = useId()
  const confirmationDescriptionId = useId()
  const hasActions =
    typeof onEdit === 'function' && typeof onRequestDelete === 'function'

  useEffect(() => {
    if (isDeleteConfirmationOpen) {
      confirmButtonRef.current?.focus()
    }
  }, [isDeleteConfirmationOpen])

  function handleCancelDelete() {
    onCancelDelete?.()
    queueMicrotask(() => deleteButtonRef.current?.focus())
  }

  return (
    <article
      className={['review-card', styles.reviewCard].join(' ')}
      aria-busy={isDeleting}
    >
      <div className={['review-card-top', styles.reviewCardTop].join(' ')}>
        <div className={['review-card-meta', styles.reviewCardMeta].join(' ')}>
          <h3 className={['review-card-author', styles.reviewCardAuthor].join(' ')}>
            {review.autor}
          </h3>
          <p className={['review-card-date', styles.reviewCardDate].join(' ')}>
            {formatReviewDate(review.data)}
          </p>
        </div>

        {hasActions ? (
          <div
            className={['review-card-actions', styles.reviewCardActions].join(' ')}
            aria-label={'Ações da avaliação de ' + review.autor}
          >
            <button
              id={'review-' + review.id + '-edit'}
              type="button"
              className={['review-card-action', styles.reviewCardAction].join(' ')}
              onClick={() => onEdit(review.id)}
              disabled={isMutationPending}
              aria-label={'Editar avaliação de ' + review.autor}
            >
              Editar
            </button>
            <button
              ref={deleteButtonRef}
              type="button"
              className={[
                'review-card-action',
                'review-card-action-danger',
                styles.reviewCardAction,
                styles.reviewCardActionDanger,
              ].join(' ')}
              onClick={() => onRequestDelete(review.id)}
              disabled={isMutationPending}
              aria-label={'Excluir avaliação de ' + review.autor}
              aria-expanded={isDeleteConfirmationOpen}
              aria-controls={'review-' + review.id + '-delete-confirmation'}
            >
              Excluir
            </button>
          </div>
        ) : null}
      </div>

      <div
        className={['review-card-stars', styles.reviewCardStars].join(' ')}
        aria-label={'Nota ' + review.nota}
      >
        {stars.map((star) => (
          <span
            key={star}
            className={[
              'review-card-star',
              styles.reviewCardStar,
              star <= Number(review.nota) ? 'is-active' : '',
              star <= Number(review.nota) ? styles.isActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden="true"
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

      {review.comentario ? (
        <p className={['review-card-comment', styles.reviewCardComment].join(' ')}>
          {review.comentario}
        </p>
      ) : null}

      {isDeleteConfirmationOpen ? (
        <section
          id={'review-' + review.id + '-delete-confirmation'}
          className={[
            'review-card-confirmation',
            styles.reviewCardConfirmation,
          ].join(' ')}
          role="alertdialog"
          aria-labelledby={confirmationTitleId}
          aria-describedby={confirmationDescriptionId}
        >
          <h4 id={confirmationTitleId}>Excluir esta avaliação?</h4>
          <p id={confirmationDescriptionId}>
            Esta ação não pode ser desfeita.
          </p>
          <div
            className={[
              'review-card-confirmation-actions',
              styles.reviewCardConfirmationActions,
            ].join(' ')}
          >
            <button
              type="button"
              className={[
                'review-card-confirmation-cancel',
                styles.reviewCardConfirmationButton,
              ].join(' ')}
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              className={[
                'review-card-confirmation-delete',
                styles.reviewCardConfirmationButton,
                styles.reviewCardConfirmationDelete,
              ].join(' ')}
              onClick={() => onConfirmDelete?.(review.id)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir avaliação'}
            </button>
          </div>
        </section>
      ) : null}
    </article>
  )
}
