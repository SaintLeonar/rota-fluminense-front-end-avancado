import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLocais } from './useLocais.js'
import { isRequestCanceled } from '../services/apiClient.js'
import { listLocais } from '../services/locaisService.js'
import { makeLocal } from '../test/fixtures.js'

vi.mock('../services/apiClient.js', () => ({
  isRequestCanceled: vi.fn(),
}))

vi.mock('../services/locaisService.js', () => ({
  listLocais: vi.fn(),
}))

const pagination = {
  pagina: 1,
  porPagina: 100,
  totalItens: 2,
  totalPaginas: 1,
}

describe('useLocais', () => {
  beforeEach(() => {
    isRequestCanceled.mockImplementation((error) => error?.isCanceled === true)
  })

  it('carrega, cria categorias e filtra com busca sem acentos', async () => {
    listLocais.mockResolvedValue({
      locais: [
        makeLocal(),
        makeLocal({
          id: 2,
          slug: 'museu-do-amanha',
          nome: 'Museu do Amanhã',
          categoria: 'museus',
          categoriaLabel: 'Museus',
          bairro: 'Centro',
        }),
      ],
      paginacao: pagination,
    })
    const { result } = renderHook(() => useLocais())

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.categories).toEqual([
      { value: 'todos', label: 'Todos' },
      { value: 'praias', label: 'Praias' },
      { value: 'museus', label: 'Museus' },
    ])
    expect(result.current.resultCount).toBe(2)

    act(() => result.current.setSearchTerm('amanha'))
    expect(result.current.visibleLocais.map((local) => local.slug)).toEqual([
      'museu-do-amanha',
    ])
    expect(result.current.resultCount).toBe(1)

    act(() => {
      result.current.setSearchTerm('')
      result.current.setActiveCategory('praias')
    })
    expect(result.current.visibleLocais.map((local) => local.slug)).toEqual([
      'arpoador',
    ])
  })

  it('apresenta coleção vazia como sucesso', async () => {
    listLocais.mockResolvedValue({
      locais: [],
      paginacao: { ...pagination, totalItens: 0, totalPaginas: 0 },
    })
    const { result } = renderHook(() => useLocais())

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.hasLocais).toBe(false)
    expect(result.current.visibleLocais).toEqual([])
    expect(result.current.resultCount).toBe(0)
  })

  it('repete após erro e preserva dados já carregados', async () => {
    listLocais
      .mockResolvedValueOnce({ locais: [makeLocal()], paginacao: pagination })
      .mockRejectedValueOnce(new Error('API indisponível'))
    const { result } = renderHook(() => useLocais())

    await waitFor(() => expect(result.current.status).toBe('success'))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('error'))

    expect(result.current.errorMessage).toBe('API indisponível')
    expect(result.current.visibleLocais).toHaveLength(1)
    expect(listLocais).toHaveBeenCalledTimes(2)
  })

  it('aborta a requisição ao desmontar e ignora cancelamento esperado', async () => {
    let signal
    listLocais.mockImplementation(({ signal: requestSignal }) => {
      signal = requestSignal
      return new Promise(() => {})
    })
    const { result, unmount } = renderHook(() => useLocais())

    await waitFor(() => expect(result.current.status).toBe('loading'))
    unmount()

    expect(signal.aborted).toBe(true)
  })
})
