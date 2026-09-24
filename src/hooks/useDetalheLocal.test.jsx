import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDetalheLocal } from './useDetalheLocal.js'
import {
  createAvaliacao,
  deleteAvaliacao,
  listAvaliacoesBySlug,
  updateAvaliacao,
} from '../services/avaliacoesService.js'
import { isApiError, isRequestCanceled } from '../services/apiClient.js'
import { findLocalBySlug } from '../services/locaisService.js'
import { makeLocal, makeReview } from '../test/fixtures.js'

vi.mock('../services/avaliacoesService.js', () => ({
  createAvaliacao: vi.fn(),
  deleteAvaliacao: vi.fn(),
  listAvaliacoesBySlug: vi.fn(),
  updateAvaliacao: vi.fn(),
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

  it('edita avaliação, atualiza agregados e reconcilia com a API', async () => {
    const firstReview = makeReview({ id: 10, nota: 5 })
    const secondReview = makeReview({
      id: 9,
      autor: 'Bia',
      nota: 3,
      data: '2026-09-19T12:00:00Z',
    })
    const updatedReview = makeReview({
      id: 10,
      autor: 'Ana Atualizada',
      nota: 1,
      comentario: 'Revisto.',
    })
    findLocalBySlug
      .mockResolvedValueOnce(makeLocal({ nota: 4, totalAvaliacoes: 2 }))
      .mockResolvedValueOnce(makeLocal({ nota: 2, totalAvaliacoes: 2 }))
    listAvaliacoesBySlug
      .mockResolvedValueOnce([firstReview, secondReview])
      .mockResolvedValueOnce([updatedReview, secondReview])
    updateAvaliacao.mockResolvedValue(updatedReview)
    const { result } = renderHook(() => useDetalheLocal('arpoador'))
    await waitFor(() => expect(result.current.reviewsStatus).toBe('success'))

    act(() => {
      result.current.handleStartReviewEdit(10)
      result.current.handleEditReviewChange('autor', ' Ana Atualizada ')
      result.current.handleEditReviewChange('nota', 1)
      result.current.handleEditReviewChange('comentario', ' Revisto. ')
    })
    await act(async () => {
      await result.current.handleReviewUpdateSubmit({
        preventDefault: vi.fn(),
      })
    })

    expect(updateAvaliacao).toHaveBeenCalledWith(
      10,
      {
        autor: 'Ana Atualizada',
        nota: 1,
        comentario: 'Revisto.',
      },
      { signal: expect.any(AbortSignal) },
    )
    expect(result.current.editingReviewId).toBeNull()
    expect(result.current.avaliacoes[0]).toMatchObject(updatedReview)
    expect(result.current.totalReviews).toBe(2)
    expect(result.current.averageRating).toBe(2)
    expect(result.current.reviewMutationFeedback).toMatchObject({
      variant: 'success',
      message: 'Avaliação atualizada com sucesso.',
    })
  })

  it('mantém edição aberta e associa erros HTTP 400 aos campos', async () => {
    updateAvaliacao.mockRejectedValue(
      makeApiError('requisicao_invalida', {
        status: 400,
        details: [
          {
            campo: 'autor',
            mensagem: 'Nome recusado pela API.',
          },
        ],
      }),
    )
    const { result } = renderHook(() => useDetalheLocal('arpoador'))
    await waitFor(() => expect(result.current.reviewsStatus).toBe('success'))

    act(() => result.current.handleStartReviewEdit(10))
    await act(async () => {
      await result.current.handleReviewUpdateSubmit({
        preventDefault: vi.fn(),
      })
    })

    expect(result.current.editingReviewId).toBe(10)
    expect(result.current.editReviewFieldErrors).toEqual({
      autor: 'Nome recusado pela API.',
    })
    expect(result.current.reviewMutationFeedback).toMatchObject({
      variant: 'error',
    })
    expect(result.current.isReviewMutationPending).toBe(false)
  })

  it('exige confirmação e exclui a avaliação atualizando os agregados', async () => {
    const firstReview = makeReview({ id: 10, nota: 5 })
    const secondReview = makeReview({
      id: 9,
      autor: 'Bia',
      nota: 3,
      data: '2026-09-19T12:00:00Z',
    })
    findLocalBySlug
      .mockResolvedValueOnce(makeLocal({ nota: 4, totalAvaliacoes: 2 }))
      .mockResolvedValueOnce(makeLocal({ nota: 3, totalAvaliacoes: 1 }))
    listAvaliacoesBySlug
      .mockResolvedValueOnce([firstReview, secondReview])
      .mockResolvedValueOnce([secondReview])
    deleteAvaliacao.mockResolvedValue(null)
    const { result } = renderHook(() => useDetalheLocal('arpoador'))
    await waitFor(() => expect(result.current.reviewsStatus).toBe('success'))

    act(() => result.current.handleRequestReviewDelete(10))
    expect(result.current.deleteConfirmationId).toBe(10)
    expect(deleteAvaliacao).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.handleConfirmReviewDelete(10)
    })

    expect(deleteAvaliacao).toHaveBeenCalledWith(
      10,
      { signal: expect.any(AbortSignal) },
    )
    expect(result.current.deleteConfirmationId).toBeNull()
    expect(result.current.avaliacoes.map((review) => review.id)).toEqual([9])
    expect(result.current.totalReviews).toBe(1)
    expect(result.current.averageRating).toBe(3)
    expect(result.current.reviewMutationFeedback).toMatchObject({
      variant: 'success',
      message: 'Avaliação excluída com sucesso.',
    })
  })

  it('bloqueia DELETE duplicado enquanto a primeira requisição está ativa', async () => {
    let resolveDelete
    const pendingDelete = new Promise((resolve) => {
      resolveDelete = resolve
    })
    deleteAvaliacao.mockReturnValue(pendingDelete)
    const { result } = renderHook(() => useDetalheLocal('arpoador'))
    await waitFor(() => expect(result.current.reviewsStatus).toBe('success'))

    act(() => result.current.handleRequestReviewDelete(10))
    let firstRequest
    act(() => {
      firstRequest = result.current.handleConfirmReviewDelete(10)
      result.current.handleConfirmReviewDelete(10)
    })

    expect(deleteAvaliacao).toHaveBeenCalledTimes(1)
    expect(result.current.isReviewMutationPending).toBe(true)

    await act(async () => {
      resolveDelete(null)
      await firstRequest
    })
    expect(result.current.isReviewMutationPending).toBe(false)
  })

  it('cancela mutação ativa ao sair do detalhe', async () => {
    updateAvaliacao.mockReturnValue(new Promise(() => {}))
    const { result, unmount } = renderHook(() => useDetalheLocal('arpoador'))
    await waitFor(() => expect(result.current.reviewsStatus).toBe('success'))

    act(() => result.current.handleStartReviewEdit(10))
    act(() => {
      result.current.handleReviewUpdateSubmit({ preventDefault: vi.fn() })
    })
    await waitFor(() => expect(updateAvaliacao).toHaveBeenCalledOnce())
    const signal = updateAvaliacao.mock.calls[0][2].signal

    unmount()

    expect(signal.aborted).toBe(true)
  })

  it('mantém a confirmação após falha e permite repetir o DELETE', async () => {
    const review = makeReview({ id: 10, nota: 5 })
    findLocalBySlug
      .mockResolvedValueOnce(makeLocal({ nota: 5, totalAvaliacoes: 1 }))
      .mockResolvedValueOnce(makeLocal({ nota: null, totalAvaliacoes: 0 }))
    listAvaliacoesBySlug
      .mockResolvedValueOnce([review])
      .mockResolvedValueOnce([])
    deleteAvaliacao
      .mockRejectedValueOnce(new Error('Falha temporária'))
      .mockResolvedValueOnce(null)
    const { result } = renderHook(() => useDetalheLocal('arpoador'))
    await waitFor(() => expect(result.current.reviewsStatus).toBe('success'))

    act(() => result.current.handleRequestReviewDelete(10))
    await act(async () => {
      await result.current.handleConfirmReviewDelete(10)
    })

    expect(result.current.deleteConfirmationId).toBe(10)
    expect(result.current.reviewMutationFeedback).toMatchObject({
      variant: 'error',
      message: 'Falha temporária',
    })

    await act(async () => {
      await result.current.handleConfirmReviewDelete(10)
    })

    expect(deleteAvaliacao).toHaveBeenCalledTimes(2)
    expect(result.current.deleteConfirmationId).toBeNull()
    expect(result.current.avaliacoes).toEqual([])
    expect(result.current.totalReviews).toBe(0)
    expect(result.current.averageRating).toBeNull()
  })
})
