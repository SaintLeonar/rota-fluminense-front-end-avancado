export default function RatingBadge({ rating }) {
  return (
    <span className="rating-badge" aria-label={`Nota ${rating}`}>
      <span className="rating-badge-star" aria-hidden="true">
        ★
      </span>
      <span>{rating}</span>
    </span>
  )
}
