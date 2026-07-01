import { useEffect, useState } from 'react'

import { createAvaliacao, listAvaliacoesByLocal } from '../services/avaliacoesService'
import { findLocalByIdOrSlug } from '../services/locaisService'
import { readStoredTravelerName } from './useStoredTravelerName'

function createInitialReviewValues() {
  return {
    autor: readStoredTravelerName(),
    nota: 5,
    comentario: '',
  }
}

function hasReviewAuthor(value) {
  return value.trim().length > 0
}

export function useDetalheLocal(slug) {
  const [local, setLocal] = useState(null)
  const [avaliacoes, setAvaliacoes] = useState([])
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [reviewValues, setReviewValues] = useState(() => createInitialReviewValues())
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [submitFeedback, setSubmitFeedback] = useState(null)
  const [isReviewAuthorMissing, setIsReviewAuthorMissing] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadDetalhe() {
      setStatus('loading')
      setErrorMessage('')

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
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(error.message)
        setStatus('error')
      }
    }

    loadDetalhe()

    return () => {
      isMounted = false
    }
  }, [slug])

  function handleReviewChange(fieldName, value) {
    setReviewValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }))

    if (fieldName === 'autor' && isReviewAuthorMissing) {
      setIsReviewAuthorMissing(!hasReviewAuthor(value))
    }
  }

  function handleOpenReviewForm() {
    setSubmitFeedback(null)
    setIsReviewAuthorMissing(false)
    setIsFormOpen(true)
  }

  function handleCancelReviewForm() {
    setIsFormOpen(false)
    setSubmitFeedback(null)
    setIsReviewAuthorMissing(false)
    setReviewValues(createInitialReviewValues())
  }

  async function handleReviewSubmit(event) {
    event.preventDefault()

    if (!local) {
      return
    }

    const normalizedAuthor = reviewValues.autor.trim()

    if (!normalizedAuthor) {
      setIsReviewAuthorMissing(true)
      return
    }

    setIsReviewAuthorMissing(false)
    setIsSubmittingReview(true)
    setSubmitFeedback(null)

    try {
      const novaAvaliacao = await createAvaliacao({
        localId: local.id,
        ...reviewValues,
        autor: normalizedAuthor,
        assinatura: '',
      })

      setAvaliacoes((currentReviews) => [novaAvaliacao, ...currentReviews])
      setReviewValues(createInitialReviewValues())
      setIsFormOpen(false)
      setSubmitFeedback(null)
    } catch (error) {
      setSubmitFeedback({
        variant: 'error',
        title: 'Nao foi possivel enviar a avaliacao',
        message: error.message || 'Tente novamente em instantes.',
      })
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const totalReviews =
    avaliacoes.length > 0 ? avaliacoes.length : local?.totalAvaliacoes ?? 0
  const averageRating =
    avaliacoes.length > 0
      ? avaliacoes.reduce((total, review) => total + Number(review.nota), 0) /
        avaliacoes.length
      : local?.nota ?? 0

  return {
    local,
    avaliacoes,
    status,
    errorMessage,
    isFormOpen,
    reviewValues,
    isSubmittingReview,
    isReviewAuthorMissing,
    submitFeedback,
    totalReviews,
    averageRating,
    handleReviewChange,
    handleOpenReviewForm,
    handleCancelReviewForm,
    handleReviewSubmit,
  }
}
