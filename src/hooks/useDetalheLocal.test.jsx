import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDetalheLocal } from './useDetalheLocal.js'
import {
  createAvaliacao,
  listAvaliacoesBySlug,
} from '../services/avaliacoesService.js'
import { isApiError, isRequestCanceled } from '../services/apiClient.js'
import { findLocalBySlug } from '../services/locaisService.js'
import { makeLocal, makeReview } from '../test/fixtures.js'

vi.mock('../services/avaliacoesService.js', () => ({
  createAvaliacao: vi.fn(),
  listAvaliacoesBySlug: vi.fn(),
}))

vi.mock('../services/apiClient.js', () => ({
  isApiError: vi.fn(),
  isRequestCanceled: vi.fn(),
}))

vi.mock('../services/locaisService.js', () => ({
  findLocalBySlug: vi.fn(),
}))

vi.mock('./useStoredTravelerName.js', () => ({
  readStoredTravelerName: vi.fn(() => 'Viajante'),
}))

function makeApiError(code, options = {}) {
  return Object.assign(new Error(options.message ?? code), {
    name: 'ApiError',
    code,
    status: options.status ?? null,
    details: options.details ?? [],
  })
}

describe('useDetalheLocal', () => {
  beforeEach(() => {
    isApiError.mockImplementation((error) => error?.name === 'ApiError')
    isRequestCanceled.mockImplementation((error) => error?.isCanceled === true)
    findLocalBySlug.mockResolvedValue(makeLocal())
    listAvaliacoesBySlug.mockResolvedValue([makeReview()])
  })

  it('carrega detalhe e avaliações em ciclos identificáveis', async () => {
    const { result } = renderHook(() => useDetalheLocal('arpoador'))

    await waitFor(() => expect(result.current.status).toBe('success'))
    await waitFor(() => expect(result.current.reviewsStatus).toBe('success'))

    expect(result.current.local.slug).toBe('arpoador')
    expect(result.current.avaliacoes).toHaveLength(1)
    expect(findLocalBySlug.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
    expect(listAvaliacoesBySlug.mock.calls[0][1].signal)
      .toBeInstanceOf(AbortSignal)
  })

  it('distingue local inexistente de falha recuperável', async () => {
    findLocalBySlug.mockRejectedValue(makeApiError('local_nao_encontrado'))
    const { result } = renderHook(() => useDetalheLocal('inexistente'))

    await waitFor(() => expect(result.current.status).toBe('not-found'))
    expect(result.current.local).toBeNull()
    expect(listAvaliacoesBySlug).not.toHaveBeenCalled()
  })

  it('mantém detalhe quando avaliações falham e recupera separadamente', async () => {
    listAvaliacoesBySlug
      .mockRejectedValueOnce(new Error('Avaliações indisponíveis'))
      .mockResolvedValueOnce([makeReview()])
    const { result } = renderHook(() => useDetalheLocal('arpoador'))

    await waitFor(() => expect(result.current.reviewsStatus).toBe('error'))
    expect(result.current.status).toBe('success')
    expect(result.current.local).not.toBeNull()

    act(() => result.current.retryReviews())
    await waitFor(() => expect(result.current.reviewsStatus).toBe('success'))
    expect(result.current.avaliacoes).toHaveLength(1)
    expect(listAvaliacoesBySlug).toHaveBeenCalledTimes(2)
  })

  it('valida campos no cliente e não envia payload inválido', async () => {
    const { result } = renderHook(() => useDetalheLocal('arpoador'))
    await waitFor(() => expect(result.current.reviewsStatus).toBe('success'))

    act(() => {
      result.current.handleOpenReviewForm()
      result.current.handleReviewChange('autor', ' ')
      result.current.handleReviewChange('nota', 0)
    })
    await act(async () => {
      await result.current.handleReviewSubmit({ preventDefault: vi.fn() })
    })

    expect(result.current.reviewFieldErrors).toEqual({
      autor: 'Informe seu nome antes de postar.',
      nota: 'Escolha uma nota entre 1 e 5.',
    })
    expect(createAvaliacao).not.toHaveBeenCalled()
    expect(result.current.isFormOpen).toBe(true)
  })

  it('incorpora HTTP 201, atualiza agregados e reconcilia com a API', async () => {
    const initialLocal = makeLocal({ nota: 4, totalAvaliacoes: 1 })
    const initialReview = makeReview({
      id: 10,
      nota: 4,
      data: '2026-09-19T12:00:00Z',
    })
    const createdReview = makeReview({
      id: 11,
      nota: 5,
      data: '2026-09-20T12:00:00Z',
    })
    const reconciledLocal = makeLocal({ nota: 4.5, totalAvaliacoes: 2 })
    findLocalBySlug
      .mockResolvedValueOnce(initialLocal)
      .mockResolvedValueOnce(reconciledLocal)
    listAvaliacoesBySlug
      .mockResolvedValueOnce([initialReview])
      .mockResolvedValueOnce([createdReview, initialReview])
    createAvaliacao.mockResolvedValue(createdReview)
    const { result } = renderHook(() => useDetalheLocal('arpoador'))
    await waitFor(() => expect(result.current.reviewsStatus).toBe('success'))

    act(() => {
      result.current.handleOpenReviewForm()
      result.current.handleReviewChange('comentario', ' Excelente passeio ')
    })
    await act(async () => {
      await result.current.handleReviewSubmit({ preventDefault: vi.fn() })
    })

    expect(createAvaliacao).toHaveBeenCalledWith('arpoador', {
      autor: 'Viajante',
      nota: 5,
      comentario: 'Excelente passeio',
    })
    expect(result.current.avaliacoes.map((review) => review.id)).toEqual([11, 10])
    expect(result.current.totalReviews).toBe(2)
    expect(result.current.averageRating).toBe(4.5)
    expect(result.current.isFormOpen).toBe(false)
    expect(result.current.submitFeedback).toMatchObject({
      variant: 'success',
      message: 'Obrigado por avaliar!',
    })
    expect(findLocalBySlug).toHaveBeenCalledTimes(2)
    expect(listAvaliacoesBySlug).toHaveBeenCalledTimes(2)
  })

  it('associa validação HTTP 400 aos campos e preserva o formulário', async () => {
    createAvaliacao.mockRejectedValue(
      makeApiError('dados_invalidos', {
        status: 400,
        details: [
          {
            campo: 'comentario',
            mensagem: 'Comentário recusado pela API.',
          },
        ],
      }),
    )
    const { result } = renderHook(() => useDetalheLocal('arpoador'))
    await waitFor(() => expect(result.current.reviewsStatus).toBe('success'))

    act(() => {
      result.current.handleOpenReviewForm()
      result.current.handleReviewChange('comentario', 'Texto mantido')
    })
    await act(async () => {
      await result.current.handleReviewSubmit({ preventDefault: vi.fn() })
    })

    expect(result.current.reviewFieldErrors).toEqual({
      comentario: 'Comentário recusado pela API.',
    })
    expect(result.current.reviewValues.comentario).toBe('Texto mantido')
    expect(result.current.isFormOpen).toBe(true)
    expect(result.current.isSubmittingReview).toBe(false)
    expect(result.current.submitFeedback).toMatchObject({ variant: 'error' })
  })
})
