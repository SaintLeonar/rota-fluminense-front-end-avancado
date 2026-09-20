import { describe, expect, it, vi } from 'vitest'

import {
  ApiError,
  createApiClient,
  isApiError,
  isRequestCanceled,
} from './apiClient.js'

function makeResponse({
  status = 200,
  body = '{}',
  contentType = 'application/json; charset=utf-8',
  headers = {},
  textError,
} = {}) {
  const normalizedHeaders = new Map(
    Object.entries({ 'Content-Type': contentType, ...headers }).map(
      ([key, value]) => [key.toLowerCase(), value],
    ),
  )

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) => normalizedHeaders.get(name.toLowerCase()) ?? null,
    },
    text: vi.fn(async () => {
      if (textError) throw textError
      return body
    }),
  }
}

describe('createApiClient', () => {
  it('normaliza a base e prepara GET sem credenciais', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      makeResponse({ body: JSON.stringify({ locais: [] }) }),
    )
    const client = createApiClient({
      baseUrl: ' https://api.example.test/v1 ',
      fetchImpl,
    })

    await expect(client.request('/locais?pagina=1')).resolves.toEqual({
      locais: [],
    })
    expect(client.baseUrl).toBe('https://api.example.test/v1/')
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.example.test/v1/locais?pagina=1',
      expect.objectContaining({
        method: 'GET',
        credentials: 'omit',
        headers: { Accept: 'application/json' },
      }),
    )
  })

  it('serializa corpo JSON e encaminha AbortSignal', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      makeResponse({ status: 201, body: JSON.stringify({ id: 1 }) }),
    )
    const controller = new AbortController()
    const client = createApiClient({
      baseUrl: 'http://api.test',
      fetchImpl,
    })

    await client.request('/locais/arpoador/avaliacoes', {
      method: 'post',
      body: { autor: 'Ana', nota: 5 },
      signal: controller.signal,
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://api.test/locais/arpoador/avaliacoes',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ autor: 'Ana', nota: 5 }),
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }),
    )
  })

  it('interpreta o envelope canônico de erro e request id', async () => {
    const details = [{ campo: 'nota', codigo: 'valor_invalido' }]
    const fetchImpl = vi.fn().mockResolvedValue(
      makeResponse({
        status: 400,
        body: JSON.stringify({
          erro: {
            codigo: 'dados_invalidos',
            mensagem: 'Revise os dados.',
            requisicao_id: 'req-body',
            detalhes: details,
          },
        }),
        headers: { 'X-Request-ID': 'req-header' },
      }),
    )
    const client = createApiClient({ baseUrl: 'http://api.test', fetchImpl })

    const error = await client.request('/locais').catch((caught) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      code: 'dados_invalidos',
      status: 400,
      requestId: 'req-body',
      message: 'Revise os dados.',
    })
    expect(error.details).toEqual(details)
    expect(error.details).not.toBe(details)
  })

  it.each([
    ['conteúdo não JSON', makeResponse({ contentType: 'text/html' })],
    ['JSON malformado', makeResponse({ body: '{' })],
    ['corpo vazio inesperado', makeResponse({ body: '' })],
    [
      'falha ao ler corpo',
      makeResponse({ textError: new Error('falha de stream') }),
    ],
  ])('normaliza resposta inválida: %s', async (_label, response) => {
    const client = createApiClient({
      baseUrl: 'http://api.test',
      fetchImpl: vi.fn().mockResolvedValue(response),
    })

    await expect(client.request('/locais')).rejects.toMatchObject({
      code: 'resposta_api_invalida',
      status: response.status,
    })
  })

  it('aceita resposta vazia somente em 204/205', async () => {
    const client = createApiClient({
      baseUrl: 'http://api.test',
      fetchImpl: vi.fn().mockResolvedValue(
        makeResponse({ status: 204, body: '', contentType: null }),
      ),
    })

    await expect(client.request('/health')).resolves.toBeNull()
  })

  it('distingue falha de rede de cancelamento', async () => {
    const networkClient = createApiClient({
      baseUrl: 'http://api.test',
      fetchImpl: vi.fn().mockRejectedValue(new Error('offline')),
    })
    await expect(networkClient.request('/locais')).rejects.toMatchObject({
      code: 'falha_de_rede',
      isCanceled: false,
    })

    const controller = new AbortController()
    controller.abort()
    const canceledClient = createApiClient({
      baseUrl: 'http://api.test',
      fetchImpl: vi.fn().mockRejectedValue(new DOMException('Abort', 'AbortError')),
    })
    const error = await canceledClient
      .request('/locais', { signal: controller.signal })
      .catch((caught) => caught)

    expect(isApiError(error)).toBe(true)
    expect(isRequestCanceled(error)).toBe(true)
    expect(error.code).toBe('requisicao_cancelada')
  })

  it.each([
    [undefined],
    [''],
    ['ftp://api.test'],
    ['https://user:secret@api.test'],
    ['https://api.test?token=x'],
  ])('rejeita base inválida: %s', (baseUrl) => {
    expect(() => createApiClient({ baseUrl, fetchImpl: vi.fn() })).toThrow(
      expect.objectContaining({ code: 'configuracao_api_invalida' }),
    )
  })

  it.each(['/../segredo', '//outro-host/path', 'locais', '/rota#fragmento'])(
    'rejeita caminho inseguro: %s',
    async (path) => {
      const client = createApiClient({
        baseUrl: 'http://api.test',
        fetchImpl: vi.fn(),
      })

      await expect(client.request(path)).rejects.toMatchObject({
        code: 'requisicao_cliente_invalida',
      })
    },
  )

  it('rejeita método e corpo não serializável antes da rede', async () => {
    const fetchImpl = vi.fn()
    const client = createApiClient({ baseUrl: 'http://api.test', fetchImpl })

    await expect(client.request('/locais', { method: 'GET 2' })).rejects.toMatchObject({
      code: 'requisicao_cliente_invalida',
    })

    const circular = {}
    circular.self = circular
    await expect(
      client.request('/locais', { method: 'POST', body: circular }),
    ).rejects.toMatchObject({ code: 'requisicao_cliente_invalida' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
