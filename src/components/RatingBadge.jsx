export default function RatingBadge({ rating }) {
  return (
    <span className="rating-badge" aria-label={`Nota ${rating}`}>
      <span className="rating-badge-star" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path
            d="m12 3.6l2.57 5.21l5.75.84l-4.16 4.05l.98 5.73L12 16.73l-5.14 2.7l.98-5.73L3.68 9.65l5.75-.84L12 3.6Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span>{rating}</span>
    </span>
  )
}
