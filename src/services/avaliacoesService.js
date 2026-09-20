import { adaptAvaliacao, adaptAvaliacoesResponse } from './apiAdapters.js'
import { ApiError, apiRequest } from './apiClient.js'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const REVIEW_FIELDS = new Set(['autor', 'nota', 'comentario'])
const REQUEST_ERROR_MESSAGE =
  'Não foi possível preparar a consulta de avaliações.'

function createRequestError(field) {
  return new ApiError(REQUEST_ERROR_MESSAGE, {
    code: 'requisicao_cliente_invalida',
    details: [
      {
        campo: field,
        codigo: 'valor_invalido',
        mensagem: 'O valor informado para a consulta é inválido.',
      },
    ],
  })
}

function requireOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw createRequestError('opcoes')
  }

  return options
}

function requireSlug(slug) {
  if (
    typeof slug !== 'string' ||
    slug.length > 120 ||
    !SLUG_PATTERN.test(slug)
  ) {
    throw createRequestError('slug')
  }

  return slug
}

function normalizeReviewPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createRequestError('avaliacao')
  }

  const unexpectedField = Object.keys(payload).find(
    (field) => !REVIEW_FIELDS.has(field),
  )

  if (unexpectedField) {
    throw createRequestError(unexpectedField)
  }

  const autor = typeof payload.autor === 'string' ? payload.autor.trim() : ''

  if (!autor || autor.length > 120) {
    throw createRequestError('autor')
  }

  if (!Number.isInteger(payload.nota) || payload.nota < 1 || payload.nota > 5) {
    throw createRequestError('nota')
  }

  let comentario = null

  if (payload.comentario !== undefined && payload.comentario !== null) {
    if (typeof payload.comentario !== 'string') {
      throw createRequestError('comentario')
    }

    comentario = payload.comentario.trim()

    if (!comentario || comentario.length > 1000) {
      throw createRequestError('comentario')
    }
  }

  return { autor, nota: payload.nota, comentario }
}

export function createAvaliacoesService({ request = apiRequest } = {}) {
  if (typeof request !== 'function') {
    throw createRequestError('request')
  }

  async function listAvaliacoesBySlug(slug, options = {}) {
    const resolvedOptions = requireOptions(options)
    const normalizedSlug = requireSlug(slug)
    const payload = await request(
      '/locais/' + encodeURIComponent(normalizedSlug) + '/avaliacoes',
      { signal: resolvedOptions.signal },
    )

    return adaptAvaliacoesResponse(payload).avaliacoes
  }

  async function createAvaliacao(slug, payload, options = {}) {
    const resolvedOptions = requireOptions(options)
    const normalizedSlug = requireSlug(slug)
    const normalizedPayload = normalizeReviewPayload(payload)
    const response = await request(
      '/locais/' + encodeURIComponent(normalizedSlug) + '/avaliacoes',
      {
        method: 'POST',
        body: normalizedPayload,
        signal: resolvedOptions.signal,
      },
    )

    return adaptAvaliacao(response)
  }

  return Object.freeze({ listAvaliacoesBySlug, createAvaliacao })
}

const avaliacoesService = createAvaliacoesService()

export const { listAvaliacoesBySlug, createAvaliacao } = avaliacoesService
