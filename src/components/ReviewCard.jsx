import RatingBadge from './RatingBadge'

function formatReviewDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export default function ReviewCard({ review }) {
  return (
    <article className="review-card">
      <div className="review-card-header">
        <div className="review-card-meta">
          <h3 className="review-card-author">{review.autor}</h3>
          <p className="review-card-signature">{review.assinatura}</p>
        </div>

        <RatingBadge rating={review.nota} />
      </div>

      <p className="review-card-date">{formatReviewDate(review.data)}</p>
      <p className="review-card-comment">{review.comentario}</p>
    </article>
  )
}
