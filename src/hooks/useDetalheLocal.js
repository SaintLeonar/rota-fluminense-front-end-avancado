import { useCallback, useEffect, useRef, useState } from 'react'

import {
  createAvaliacao,
  deleteAvaliacao,
  listAvaliacoesBySlug,
  updateAvaliacao,
} from '../services/avaliacoesService'
import { isApiError, isRequestCanceled } from '../services/apiClient.js'
import { findLocalBySlug } from '../services/locaisService'
import {
  calculateReviewAggregates,
  mergeReviewNewestFirst,
} from '../utils/reviewState.js'
import { readStoredTravelerName } from './useStoredTravelerName'

const REVIEW_FIELDS = new Set(['autor', 'nota', 'comentario'])

function createInitialReviewValues() {
  return {
    autor: readStoredTravelerName(),
    nota: 5,
    comentario: '',
  }
}

function createReviewValues(review) {
  return {
    autor: review.autor,
    nota: review.nota,
    comentario: review.comentario ?? '',
  }
}

function validateReviewValues(values) {
  const errors = {}
  const autor = typeof values.autor === 'string' ? values.autor.trim() : ''
  const comentario =
    typeof values.comentario === 'string' ? values.comentario.trim() : ''

  if (!autor) {
    errors.autor = 'Informe seu nome antes de postar.'
  } else if (autor.length > 120) {
    errors.autor = 'Use no máximo 120 caracteres.'
  }

  if (!Number.isInteger(values.nota) || values.nota < 1 || values.nota > 5) {
    errors.nota = 'Escolha uma nota entre 1 e 5.'
  }

  if (comentario.length > 1000) {
    errors.comentario = 'Use no máximo 1000 caracteres.'
  }

  return {
    errors,
    payload: {
      autor,
      nota: values.nota,
      comentario: comentario || null,
    },
  }
}

function getApiReviewFieldErrors(error) {
  if (!isApiError(error) || error.status !== 400) {
    return {}
  }

  return error.details.reduce((fieldErrors, detail) => {
    const field = detail?.campo

    if (!REVIEW_FIELDS.has(field) || fieldErrors[field]) {
      return fieldErrors
    }

    fieldErrors[field] =
      typeof detail.mensagem === 'string' && detail.mensagem.trim()
        ? detail.mensagem.trim()
        : 'Revise este campo.'

    return fieldErrors
  }, {})
}

function calculateUpdatedAggregates({
  local,
  reviews,
  nextReviews,
  previousReview,
  updatedReview,
  reviewsStatus,
}) {
  const hasCompleteCollection =
    reviewsStatus === 'success' &&
    reviews.length === local.totalAvaliacoes

  if (hasCompleteCollection) {
    return calculateReviewAggregates(nextReviews)
  }

  const totalReviews = local.totalAvaliacoes

  if (totalReviews === 0 || local.nota === null) {
    return { totalReviews, averageRating: null }
  }

  const estimatedSum =
    local.nota * totalReviews - previousReview.nota + updatedReview.nota

  return {
    totalReviews,
    averageRating: Number((estimatedSum / totalReviews).toFixed(1)),
  }
}

function calculateDeletedAggregates({
  local,
  reviews,
  nextReviews,
  deletedReview,
  reviewsStatus,
}) {
  const hasCompleteCollection =
    reviewsStatus === 'success' &&
    reviews.length === local.totalAvaliacoes

  if (hasCompleteCollection) {
    return calculateReviewAggregates(nextReviews)
  }

  const totalReviews = Math.max(0, local.totalAvaliacoes - 1)

  if (totalReviews === 0 || local.nota === null) {
    return { totalReviews, averageRating: null }
  }

  const estimatedSum =
    local.nota * local.totalAvaliacoes - deletedReview.nota

  return {
    totalReviews,
    averageRating: Number((estimatedSum / totalReviews).toFixed(1)),
  }
}

export function useDetalheLocal(slug) {
  const [local, setLocal] = useState(null)
  const [avaliacoes, setAvaliacoes] = useState([])
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [reviewsStatus, setReviewsStatus] = useState('idle')
  const [reviewsErrorMessage, setReviewsErrorMessage] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [reviewValues, setReviewValues] = useState(() => createInitialReviewValues())
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [submitFeedback, setSubmitFeedback] = useState(null)
  const [reviewFieldErrors, setReviewFieldErrors] = useState({})
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editReviewValues, setEditReviewValues] = useState(null)
  const [editReviewFieldErrors, setEditReviewFieldErrors] = useState({})
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null)
  const [reviewMutation, setReviewMutation] = useState(null)
  const [reviewMutationFeedback, setReviewMutationFeedback] = useState(null)
  const [detailRequestVersion, setDetailRequestVersion] = useState(0)
  const [reviewsRetryRequest, setReviewsRetryRequest] = useState(null)
  const submitLockRef = useRef(false)
  const mutationLockRef = useRef(false)
  const mutationControllersRef = useRef(new Set())
  const activeSlugRef = useRef(slug)

  const retryDetail = useCallback(() => {
    setDetailRequestVersion((currentVersion) => currentVersion + 1)
  }, [])

  const retryReviews = useCallback(() => {
    setReviewsRetryRequest((currentRequest) => ({
      slug,
      version:
        currentRequest?.slug === slug ? currentRequest.version + 1 : 1,
    }))
  }, [slug])

  useEffect(() => {
    const mutationControllers = mutationControllersRef.current
    activeSlugRef.current = slug

    return () => {
      if (activeSlugRef.current === slug) {
        activeSlugRef.current = null
      }

      mutationControllers.forEach((controller) => controller.abort())
      mutationControllers.clear()
      mutationLockRef.current = false
    }
  }, [slug])

  useEffect(() => {
    const controller = new AbortController()
    let isActive = true

    async function loadDetalhe() {
      setLocal(null)
      setAvaliacoes([])
      setStatus('loading')
      setErrorMessage('')
      setReviewsStatus('idle')
      setReviewsErrorMessage('')
      setSubmitFeedback(null)
      setReviewFieldErrors({})
      setIsFormOpen(false)
      setEditingReviewId(null)
      setEditReviewValues(null)
      setEditReviewFieldErrors({})
      setDeleteConfirmationId(null)
      setReviewMutation(null)
      setReviewMutationFeedback(null)

      try {
        const localData = await findLocalBySlug(slug, {
          signal: controller.signal,
        })

        if (!isActive) {
          return
        }

        setLocal(localData)
        setStatus('success')
        setReviewsStatus('loading')

        try {
          const avaliacoesData = await listAvaliacoesBySlug(slug, {
            signal: controller.signal,
          })

          if (!isActive) {
            return
          }

          setAvaliacoes(avaliacoesData)
          setReviewsStatus('success')
        } catch (error) {
          if (!isActive || isRequestCanceled(error)) {
            return
          }

          setReviewsErrorMessage(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar as avaliações no momento.',
          )
          setReviewsStatus('error')
        }
      } catch (error) {
        if (!isActive || isRequestCanceled(error)) {
          return
        }

        setLocal(null)
        setAvaliacoes([])

        if (isApiError(error) && error.code === 'local_nao_encontrado') {
          setStatus('not-found')
          return
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os dados no momento.',
        )
        setStatus('error')
      }
    }

    loadDetalhe()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [detailRequestVersion, slug])

  useEffect(() => {
    if (
      reviewsRetryRequest?.slug !== slug ||
      local?.slug !== slug
    ) {
      return undefined
    }

    const controller = new AbortController()
    let isActive = true

    async function reloadReviews() {
      setReviewsStatus('loading')
      setReviewsErrorMessage('')

      try {
        const reviewsData = await listAvaliacoesBySlug(slug, {
          signal: controller.signal,
        })

        if (!isActive) {
          return
        }

        setAvaliacoes(reviewsData)
        setReviewsStatus('success')
      } catch (error) {
        if (!isActive || isRequestCanceled(error)) {
          return
        }

        setReviewsErrorMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar as avaliações no momento.',
        )
        setReviewsStatus('error')
      }
    }

    reloadReviews()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [local?.slug, reviewsRetryRequest, slug])

  function handleReviewChange(fieldName, value) {
    setReviewValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }))
    setReviewFieldErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[fieldName]
      return nextErrors
    })
  }

  function handleOpenReviewForm() {
    if (mutationLockRef.current || isSubmittingReview) {
      return
    }

    setSubmitFeedback(null)
    setReviewFieldErrors({})
    setEditingReviewId(null)
    setEditReviewValues(null)
    setEditReviewFieldErrors({})
    setDeleteConfirmationId(null)
    setReviewMutationFeedback(null)
    setIsFormOpen(true)
  }

  function handleCancelReviewForm() {
    setIsFormOpen(false)
    setSubmitFeedback(null)
    setReviewFieldErrors({})
    setReviewValues(createInitialReviewValues())
  }

  async function reconcileReviewState(expectedSlug) {
    try {
      const [freshLocal, freshReviews] = await Promise.all([
        findLocalBySlug(expectedSlug),
        listAvaliacoesBySlug(expectedSlug),
      ])

      if (activeSlugRef.current !== expectedSlug) {
        return
      }

      setLocal(freshLocal)
      setAvaliacoes(freshReviews)
      setReviewsStatus('success')
      setReviewsErrorMessage('')
    } catch {
      // A mutação já foi persistida; uma próxima carga reconciliará os dados.
    }
  }

  async function handleReviewSubmit(event) {
    event.preventDefault()

    if (!local || submitLockRef.current || mutationLockRef.current) {
      return
    }

    const { errors, payload } = validateReviewValues(reviewValues)

    if (Object.keys(errors).length > 0) {
      setReviewFieldErrors(errors)
      return
    }

    submitLockRef.current = true
    setReviewFieldErrors({})
    setIsSubmittingReview(true)
    setSubmitFeedback(null)

    try {
      const createdReview = await createAvaliacao(slug, payload)

      if (activeSlugRef.current !== slug) {
        return
      }

      const nextReviews = mergeReviewNewestFirst(avaliacoes, createdReview)
      const hasCompleteCollection =
        reviewsStatus === 'success' &&
        avaliacoes.length === local.totalAvaliacoes
      const estimatedTotal = local.totalAvaliacoes + 1
      const estimatedAverage = Number(
        (
          ((local.nota ?? 0) * local.totalAvaliacoes + createdReview.nota) /
          estimatedTotal
        ).toFixed(1),
      )
      const optimisticAggregates = hasCompleteCollection
        ? calculateReviewAggregates(nextReviews)
        : {
            totalReviews: estimatedTotal,
            averageRating: estimatedAverage,
          }

      setAvaliacoes(nextReviews)
      setReviewsStatus('success')
      setReviewsErrorMessage('')
      setLocal((currentLocal) =>
        currentLocal?.slug === slug
          ? {
              ...currentLocal,
              nota: optimisticAggregates.averageRating,
              totalAvaliacoes: optimisticAggregates.totalReviews,
            }
          : currentLocal,
      )
      setReviewValues(createInitialReviewValues())
      setIsFormOpen(false)
      setSubmitFeedback({
        variant: 'success',
        message: 'Obrigado por avaliar!',
      })
      await reconcileReviewState(slug)
    } catch (error) {
      const apiFieldErrors = getApiReviewFieldErrors(error)
      const hasApiFieldErrors = Object.keys(apiFieldErrors).length > 0
      let message = 'Tente novamente em instantes.'

      if (!hasApiFieldErrors && error instanceof Error) {
        message = error.message
      } else if (hasApiFieldErrors) {
        message = 'Corrija os campos destacados e tente novamente.'
      }

      setReviewFieldErrors(apiFieldErrors)
      setSubmitFeedback({
        variant: 'error',
        title: hasApiFieldErrors
          ? 'Revise os campos da avaliação'
          : 'Não foi possível enviar a avaliação',
        message,
      })
    } finally {
      submitLockRef.current = false
      setIsSubmittingReview(false)
    }
  }

  function handleStartReviewEdit(reviewId) {
    if (mutationLockRef.current || isSubmittingReview) {
      return
    }

    const review = avaliacoes.find((item) => item.id === reviewId)

    if (!review) {
      return
    }

    setIsFormOpen(false)
    setSubmitFeedback(null)
    setReviewFieldErrors({})
    setDeleteConfirmationId(null)
    setEditingReviewId(reviewId)
    setEditReviewValues(createReviewValues(review))
    setEditReviewFieldErrors({})
    setReviewMutationFeedback(null)
  }

  function handleEditReviewChange(fieldName, value) {
    setEditReviewValues((currentValues) =>
      currentValues
        ? {
            ...currentValues,
            [fieldName]: value,
          }
        : currentValues,
    )
    setEditReviewFieldErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[fieldName]
      return nextErrors
    })
  }

  function handleCancelReviewEdit() {
    if (mutationLockRef.current) {
      return
    }

    setEditingReviewId(null)
    setEditReviewValues(null)
    setEditReviewFieldErrors({})
    setReviewMutationFeedback(null)
  }

  async function handleReviewUpdateSubmit(event) {
    event.preventDefault()

    if (
      !local ||
      !editingReviewId ||
      !editReviewValues ||
      mutationLockRef.current ||
      submitLockRef.current
    ) {
      return
    }

    const previousReview = avaliacoes.find(
      (review) => review.id === editingReviewId,
    )

    if (!previousReview) {
      return
    }

    const { errors, payload } = validateReviewValues(editReviewValues)

    if (Object.keys(errors).length > 0) {
      setEditReviewFieldErrors(errors)
      return
    }

    const controller = new AbortController()
    mutationControllersRef.current.add(controller)
    mutationLockRef.current = true
    setEditReviewFieldErrors({})
    setReviewMutation({ type: 'update', reviewId: editingReviewId })
    setReviewMutationFeedback(null)

    try {
      const updatedReview = await updateAvaliacao(
        editingReviewId,
        payload,
        { signal: controller.signal },
      )

      if (activeSlugRef.current !== slug) {
        return
      }

      const nextReviews = avaliacoes.map((review) =>
        review.id === updatedReview.id ? updatedReview : review,
      )
      const optimisticAggregates = calculateUpdatedAggregates({
        local,
        reviews: avaliacoes,
        nextReviews,
        previousReview,
        updatedReview,
        reviewsStatus,
      })

      setAvaliacoes(nextReviews)
      setLocal((currentLocal) =>
        currentLocal?.slug === slug
          ? {
              ...currentLocal,
              nota: optimisticAggregates.averageRating,
              totalAvaliacoes: optimisticAggregates.totalReviews,
            }
          : currentLocal,
      )
      setEditingReviewId(null)
      setEditReviewValues(null)
      setEditReviewFieldErrors({})
      setReviewMutationFeedback({
        variant: 'success',
        message: 'Avaliação atualizada com sucesso.',
        reviewId: updatedReview.id,
      })
      await reconcileReviewState(slug)
    } catch (error) {
      if (isRequestCanceled(error) || activeSlugRef.current !== slug) {
        return
      }

      const apiFieldErrors = getApiReviewFieldErrors(error)
      const hasApiFieldErrors = Object.keys(apiFieldErrors).length > 0

      setEditReviewFieldErrors(apiFieldErrors)
      setReviewMutationFeedback({
        variant: 'error',
        title: hasApiFieldErrors
          ? 'Revise os campos da avaliação'
          : 'Não foi possível atualizar a avaliação',
        message: hasApiFieldErrors
          ? 'Corrija os campos destacados e tente novamente.'
          : error instanceof Error
            ? error.message
            : 'Tente novamente em instantes.',
        reviewId: editingReviewId,
      })
    } finally {
      mutationControllersRef.current.delete(controller)
      mutationLockRef.current = false

      if (activeSlugRef.current === slug) {
        setReviewMutation(null)
      }
    }
  }

  function handleRequestReviewDelete(reviewId) {
    if (mutationLockRef.current || isSubmittingReview) {
      return
    }

    if (!avaliacoes.some((review) => review.id === reviewId)) {
      return
    }

    setIsFormOpen(false)
    setSubmitFeedback(null)
    setReviewFieldErrors({})
    setEditingReviewId(null)
    setEditReviewValues(null)
    setEditReviewFieldErrors({})
    setDeleteConfirmationId(reviewId)
    setReviewMutationFeedback(null)
  }

  function handleCancelReviewDelete() {
    if (mutationLockRef.current) {
      return
    }

    setDeleteConfirmationId(null)
    setReviewMutationFeedback(null)
  }

  async function handleConfirmReviewDelete(reviewId) {
    if (
      !local ||
      deleteConfirmationId !== reviewId ||
      mutationLockRef.current ||
      submitLockRef.current
    ) {
      return
    }

    const deletedReview = avaliacoes.find((review) => review.id === reviewId)

    if (!deletedReview) {
      return
    }

    const controller = new AbortController()
    mutationControllersRef.current.add(controller)
    mutationLockRef.current = true
    setReviewMutation({ type: 'delete', reviewId })
    setReviewMutationFeedback(null)

    try {
      await deleteAvaliacao(reviewId, { signal: controller.signal })

      if (activeSlugRef.current !== slug) {
        return
      }

      const nextReviews = avaliacoes.filter((review) => review.id !== reviewId)
      const optimisticAggregates = calculateDeletedAggregates({
        local,
        reviews: avaliacoes,
        nextReviews,
        deletedReview,
        reviewsStatus,
      })

      setAvaliacoes(nextReviews)
      setLocal((currentLocal) =>
        currentLocal?.slug === slug
          ? {
              ...currentLocal,
              nota: optimisticAggregates.averageRating,
              totalAvaliacoes: optimisticAggregates.totalReviews,
            }
          : currentLocal,
      )
      setDeleteConfirmationId(null)
      setReviewMutationFeedback({
        variant: 'success',
        message: 'Avaliação excluída com sucesso.',
        reviewId,
      })
      await reconcileReviewState(slug)
    } catch (error) {
      if (isRequestCanceled(error) || activeSlugRef.current !== slug) {
        return
      }

      setReviewMutationFeedback({
        variant: 'error',
        title: 'Não foi possível excluir a avaliação',
        message:
          error instanceof Error
            ? error.message
            : 'Tente novamente em instantes.',
        reviewId,
      })
    } finally {
      mutationControllersRef.current.delete(controller)
      mutationLockRef.current = false

      if (activeSlugRef.current === slug) {
        setReviewMutation(null)
      }
    }
  }

  const totalReviews = local?.totalAvaliacoes ?? 0
  const averageRating = local?.nota ?? null
  const isReviewMutationPending = reviewMutation !== null

  return {
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
  }
}
