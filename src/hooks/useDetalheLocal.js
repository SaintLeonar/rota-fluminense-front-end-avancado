import { useCallback, useEffect, useRef, useState } from 'react'

import { createAvaliacao, listAvaliacoesBySlug } from '../services/avaliacoesService'
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
  const [detailRequestVersion, setDetailRequestVersion] = useState(0)
  const [reviewsRetryRequest, setReviewsRetryRequest] = useState(null)
  const submitLockRef = useRef(false)
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
    activeSlugRef.current = slug

    return () => {
      if (activeSlugRef.current === slug) {
        activeSlugRef.current = null
      }
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
    setSubmitFeedback(null)
    setReviewFieldErrors({})
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
      // A criação já foi persistida; uma próxima carga reconciliará os dados.
    }
  }

  async function handleReviewSubmit(event) {
    event.preventDefault()

    if (!local || submitLockRef.current) {
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

  const totalReviews = local?.totalAvaliacoes ?? 0
  const averageRating = local?.nota ?? null

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
    totalReviews,
    averageRating,
    handleReviewChange,
    handleOpenReviewForm,
    handleCancelReviewForm,
    handleReviewSubmit,
  }
}
