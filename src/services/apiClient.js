const JSON_MEDIA_TYPE = 'application/json'

const ERROR_MESSAGES = {
  configuracao: 'A configuração da API está inválida.',
  requisicao: 'Não foi possível preparar a requisição para a API.',
  rede: 'Não foi possível conectar à API no momento.',
  resposta: 'A API retornou uma resposta inválida.',
  http: 'A API não conseguiu concluir a solicitação.',
  cancelada: 'A requisição foi cancelada.',
}

export class ApiError extends Error {
  constructor(
    message,
    {
      code = 'erro_desconhecido',
      status = null,
      requestId = null,
      details = [],
      isCanceled = false,
      cause,
    } = {},
  ) {
    super(message, cause === undefined ? undefined : { cause })

    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.requestId = requestId
    this.details = Array.isArray(details) ? [...details] : []
    this.isCanceled = isCanceled
  }
}

function createConfigurationError() {
  return new ApiError(ERROR_MESSAGES.configuracao, {
    code: 'configuracao_api_invalida',
  })
}

function normalizeBaseUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw createConfigurationError()
  }

  let parsedUrl

  try {
    parsedUrl = new URL(value.trim())
  } catch {
    throw createConfigurationError()
  }

  if (
    !['http:', 'https:'].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw createConfigurationError()
  }

  parsedUrl.pathname = `${parsedUrl.pathname.replace(/\/+$/, '')}/`

  return parsedUrl.toString()
}

function buildRequestUrl(baseUrl, path) {
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    path.includes('#')
  ) {
    throw new ApiError(ERROR_MESSAGES.requisicao, {
      code: 'requisicao_cliente_invalida',
    })
  }

  const pathname = path.split('?', 1)[0]
  const hasUnsafeSegment = pathname
    .split('/')
    .some((segment) => segment === '.' || segment === '..')

  if (hasUnsafeSegment) {
    throw new ApiError(ERROR_MESSAGES.requisicao, {
      code: 'requisicao_cliente_invalida',
    })
  }

  return new URL(path.slice(1), baseUrl).toString()
}

function isJsonResponse(response) {
  const contentType = response.headers.get('Content-Type')

  if (!contentType) {
    return false
  }

  const mediaType = contentType.split(';', 1)[0].trim().toLowerCase()

  return mediaType === JSON_MEDIA_TYPE || mediaType.endsWith('+json')
}

function readRequestId(response) {
  const requestId = response.headers.get('X-Request-ID')

  return requestId?.trim() || null
}

function createInvalidResponseError(response, cause) {
  return new ApiError(ERROR_MESSAGES.resposta, {
    code: 'resposta_api_invalida',
    status: response.status,
    requestId: readRequestId(response),
    cause,
  })
}

function createHttpError(response, payload) {
  const errorPayload =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload.erro
      : null
  const isCanonicalError =
    errorPayload &&
    typeof errorPayload === 'object' &&
    !Array.isArray(errorPayload)

  const code =
    isCanonicalError && typeof errorPayload.codigo === 'string'
      ? errorPayload.codigo.trim()
      : ''
  const message =
    isCanonicalError && typeof errorPayload.mensagem === 'string'
      ? errorPayload.mensagem.trim()
      : ''
  const requestId =
    isCanonicalError && typeof errorPayload.requisicao_id === 'string'
      ? errorPayload.requisicao_id.trim()
      : ''

  return new ApiError(message || ERROR_MESSAGES.http, {
    code: code || 'erro_http',
    status: response.status,
    requestId: requestId || readRequestId(response),
    details:
      isCanonicalError && Array.isArray(errorPayload.detalhes)
        ? errorPayload.detalhes
        : [],
  })
}

function createCanceledError(cause) {
  return new ApiError(ERROR_MESSAGES.cancelada, {
    code: 'requisicao_cancelada',
    isCanceled: true,
    cause,
  })
}

function isAbortError(error, signal) {
  return signal?.aborted || error?.name === 'AbortError'
}

function serializeBody(body) {
  try {
    return JSON.stringify(body)
  } catch (cause) {
    throw new ApiError(ERROR_MESSAGES.requisicao, {
      code: 'requisicao_cliente_invalida',
      cause,
    })
  }
}

export function createApiClient({ baseUrl, fetchImpl = globalThis.fetch } = {}) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)

  if (typeof fetchImpl !== 'function') {
    throw createConfigurationError()
  }

  async function request(path, { method = 'GET', body, signal } = {}) {
    const normalizedMethod =
      typeof method === 'string' ? method.trim().toUpperCase() : ''

    if (!/^[A-Z]+$/.test(normalizedMethod)) {
      throw new ApiError(ERROR_MESSAGES.requisicao, {
        code: 'requisicao_cliente_invalida',
      })
    }

    const url = buildRequestUrl(normalizedBaseUrl, path)
    const headers = {
      Accept: JSON_MEDIA_TYPE,
    }
    const requestOptions = {
      method: normalizedMethod,
      headers,
      signal,
      credentials: 'omit',
    }

    if (body !== undefined) {
      headers['Content-Type'] = JSON_MEDIA_TYPE
      requestOptions.body = serializeBody(body)
    }

    let response

    try {
      response = await fetchImpl(url, requestOptions)
    } catch (cause) {
      if (isAbortError(cause, signal)) {
        throw createCanceledError(cause)
      }

      throw new ApiError(ERROR_MESSAGES.rede, {
        code: 'falha_de_rede',
        cause,
      })
    }

    let responseText

    try {
      responseText = await response.text()
    } catch (cause) {
      if (isAbortError(cause, signal)) {
        throw createCanceledError(cause)
      }

      throw createInvalidResponseError(response, cause)
    }

    if (!responseText) {
      if (response.ok && [204, 205].includes(response.status)) {
        return null
      }

      if (!response.ok) {
        throw createHttpError(response, null)
      }

      throw createInvalidResponseError(response)
    }

    if (!isJsonResponse(response)) {
      throw createInvalidResponseError(response)
    }

    let payload

    try {
      payload = JSON.parse(responseText)
    } catch (cause) {
      throw createInvalidResponseError(response, cause)
    }

    if (!response.ok) {
      throw createHttpError(response, payload)
    }

    return payload
  }

  return Object.freeze({
    baseUrl: normalizedBaseUrl,
    request,
  })
}

let defaultClient

function getDefaultClient() {
  if (!defaultClient) {
    defaultClient = createApiClient({
      baseUrl: import.meta.env?.VITE_API_URL,
    })
  }

  return defaultClient
}

export function apiRequest(path, options) {
  return getDefaultClient().request(path, options)
}

export function isApiError(error) {
  return error instanceof ApiError
}

export function isRequestCanceled(error) {
  return isApiError(error) && error.isCanceled
}
