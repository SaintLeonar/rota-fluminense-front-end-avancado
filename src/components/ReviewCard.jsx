import './ReviewCard.css'

function formatReviewDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .toUpperCase()
}

export default function ReviewCard({ review }) {
  const stars = Array.from({ length: 5 }, (_, index) => index + 1)

  return (
    <article className="review-card">
      <div className="review-card-top">
        <div className="review-card-meta">
          <h3 className="review-card-author">{review.autor}</h3>
          <p className="review-card-date">{formatReviewDate(review.data)}</p>
        </div>

        {/*
          Icone de lixeira desativado no MVP:
          ainda nao existe regra de permissao para permitir que usuarios removam comentarios.
        */}
        {/*
        <span className="review-card-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path
              d="M9 4.75h6m-7 3.5h8m-7 0v8m6-8v8m2.75-10H6.25m1.5 0l.75 12h7l.75-12"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
            />
          </svg>
        </span>
        */}
      </div>

      {review.assinatura ? (
        <p className="review-card-signature">{review.assinatura}</p>
      ) : null}

      <div className="review-card-stars" aria-label={`Nota ${review.nota}`}>
        {stars.map((star) => (
          <span
            key={star}
            className={
              star <= Number(review.nota)
                ? 'review-card-star is-active'
                : 'review-card-star'
            }
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

      <p className="review-card-comment">{review.comentario}</p>
    </article>
  )
}
