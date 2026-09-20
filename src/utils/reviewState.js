function compareNewestFirst(first, second) {
  const timestampDifference = Date.parse(second.data) - Date.parse(first.data)

  if (timestampDifference !== 0) {
    return timestampDifference
  }

  return second.id - first.id
}

function roundRatioToOneDecimal(numerator, denominator) {
  const scaledNumerator = numerator * 10
  const integerPart = Math.floor(scaledNumerator / denominator)
  const remainder = scaledNumerator % denominator
  const isAboveHalf = remainder * 2 > denominator
  const isHalf = remainder * 2 === denominator
  const roundedInteger =
    isAboveHalf || (isHalf && integerPart % 2 !== 0)
      ? integerPart + 1
      : integerPart

  return roundedInteger / 10
}

export function mergeReviewNewestFirst(reviews, createdReview) {
  return [
    createdReview,
    ...reviews.filter((review) => review.id !== createdReview.id),
  ].sort(compareNewestFirst)
}

export function calculateReviewAggregates(reviews) {
  if (reviews.length === 0) {
    return { totalReviews: 0, averageRating: null }
  }

  const ratingSum = reviews.reduce((sum, review) => sum + review.nota, 0)

  return {
    totalReviews: reviews.length,
    averageRating: roundRatioToOneDecimal(ratingSum, reviews.length),
  }
}
