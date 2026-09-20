import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useClimaLocal } from './useClimaLocal.js'
import { isApiError, isRequestCanceled } from '../services/apiClient.js'
import { getClimaBySlug } from '../services/climaService.js'
import { makeClimate } from '../test/fixtures.js'

vi.mock('../services/apiClient.js', () => ({
  isApiError: vi.fn(),
  isRequestCanceled: vi.fn(),
}))

vi.mock('../services/climaService.js', () => ({
  getClimaBySlug: vi.fn(),
}))

describe('useClimaLocal', () => {
  beforeEach(() => {
    isApiError.mockImplementation((error) => error?.name === 'ApiError')
    isRequestCanceled.mockImplementation((error) => error?.isCanceled === true)
  })

  it('carrega clima com ciclo de vida independente', async () => {
    getClimaBySlug.mockResolvedValue(makeClimate())
    const { result } = renderHook(() => useClimaLocal('arpoador'))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.clima.local.slug).toBe('arpoador')
    expect(getClimaBySlug.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
  })

  it('normaliza HTTP 503 e recupera ao tentar novamente', async () => {
    const error = Object.assign(new Error('Clima indisponível'), {
      name: 'ApiError',
      code: 'clima_indisponivel',
      status: 503,
      requestId: 'req-clima',
    })
    getClimaBySlug
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(makeClimate())
    const { result } = renderHook(() => useClimaLocal('arpoador'))

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toEqual({
      code: 'clima_indisponivel',
      message: 'Clima indisponível',
      status: 503,
      requestId: 'req-clima',
    })

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(getClimaBySlug).toHaveBeenCalledTimes(2)
  })

  it('aborta consulta ao desmontar', async () => {
    let signal
    getClimaBySlug.mockImplementation((_slug, options) => {
      signal = options.signal
      return new Promise(() => {})
    })
    const { result, unmount } = renderHook(() => useClimaLocal('arpoador'))

    await waitFor(() => expect(result.current.status).toBe('loading'))
    unmount()
    expect(signal.aborted).toBe(true)
  })
})
